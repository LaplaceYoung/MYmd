import { useEffect, useRef, useState } from 'react'
import { readTextFile } from '@tauri-apps/plugin-fs'
import type { Tab, ViewMode } from '@/stores/editorStore'
import { useEditorStore } from '@/stores/editorStore'

const STORAGE_KEY = 'mymd:session:v1'
const MAX_SNAPSHOT_TABS = 12
const MAX_TAB_CONTENT_CHARS = 300_000
const MAX_TOTAL_CONTENT_CHARS = 1_500_000
const SNAPSHOT_DEBOUNCE_MS = 500

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

interface SessionSnapshotTab {
    filePath: string | null
    title: string
    content: string
    isDirty: boolean
}

interface SessionSnapshot {
    version: 1
    timestamp: number
    activeTabIndex: number
    viewMode: ViewMode
    activeWorkspace: string | null
    tabs: SessionSnapshotTab[]
}

function parseSnapshot(raw: string | null): SessionSnapshot | null {
    if (!raw) return null

    try {
        const parsed = JSON.parse(raw) as SessionSnapshot
        if (parsed?.version !== 1) return null
        if (!Array.isArray(parsed.tabs)) return null
        if (parsed.tabs.length === 0) return null
        return parsed
    } catch {
        return null
    }
}

function buildSnapshotTabs(tabs: Tab[]): SessionSnapshotTab[] {
    let remainingChars = MAX_TOTAL_CONTENT_CHARS

    return tabs.slice(0, MAX_SNAPSHOT_TABS).map((tab) => {
        const shouldPersistContent = tab.isDirty || !tab.filePath
        if (!shouldPersistContent || remainingChars <= 0) {
            return {
                filePath: tab.filePath,
                title: tab.title,
                content: '',
                isDirty: tab.isDirty
            }
        }

        const contentBudget = Math.min(MAX_TAB_CONTENT_CHARS, remainingChars)
        const content = tab.content.slice(0, contentBudget)
        remainingChars -= content.length

        return {
            filePath: tab.filePath,
            title: tab.title,
            content,
            isDirty: tab.isDirty
        }
    })
}

async function resolveTabContent(tab: SessionSnapshotTab): Promise<string> {
    if (!tab.filePath) return tab.content
    if (tab.isDirty) return tab.content
    if (!isTauri) return tab.content

    try {
        return await readTextFile(tab.filePath)
    } catch {
        return tab.content
    }
}

/**
 * Recover unsaved and open tabs after app restart, and keep a lightweight
 * session snapshot on every state change.
 */
export function useSessionRecovery(isReadyToRestore: boolean) {
    const tabs = useEditorStore((s) => s.tabs)
    const activeTabId = useEditorStore((s) => s.activeTabId)
    const viewMode = useEditorStore((s) => s.viewMode)
    const activeWorkspace = useEditorStore((s) => s.activeWorkspace)
    const addTab = useEditorStore((s) => s.addTab)
    const markSaved = useEditorStore((s) => s.markSaved)
    const updateContent = useEditorStore((s) => s.updateContent)
    const setActiveTab = useEditorStore((s) => s.setActiveTab)
    const setViewMode = useEditorStore((s) => s.setViewMode)
    const setActiveWorkspace = useEditorStore((s) => s.setActiveWorkspace)

    const [isSessionReady, setIsSessionReady] = useState(!isTauri)
    const hasTriedRestoreRef = useRef(false)
    const isRestoringRef = useRef(false)

    useEffect(() => {
        if (!isReadyToRestore || hasTriedRestoreRef.current) {
            return
        }

        let cancelled = false
        hasTriedRestoreRef.current = true

        const restore = async () => {
            if (tabs.length > 0) {
                if (!cancelled) setIsSessionReady(true)
                return
            }

            const snapshot = parseSnapshot(window.localStorage.getItem(STORAGE_KEY))
            if (!snapshot) {
                if (!cancelled) setIsSessionReady(true)
                return
            }

            isRestoringRef.current = true
            try {
                const restoredTabIds: string[] = []

                for (const snapshotTab of snapshot.tabs.slice(0, MAX_SNAPSHOT_TABS)) {
                    const content = await resolveTabContent(snapshotTab)
                    if (cancelled) return

                    const restoredTabId = addTab(snapshotTab.filePath, content)
                    restoredTabIds.push(restoredTabId)

                    if (snapshotTab.filePath && !snapshotTab.isDirty) {
                        markSaved(restoredTabId, snapshotTab.filePath)
                    }

                    if (snapshotTab.isDirty) {
                        updateContent(restoredTabId, content)
                    }
                }

                if (snapshot.viewMode === 'split' || snapshot.viewMode === 'wysiwyg') {
                    setViewMode(snapshot.viewMode)
                }
                setActiveWorkspace(snapshot.activeWorkspace ?? null)

                const activeId =
                    restoredTabIds[snapshot.activeTabIndex] ?? restoredTabIds[0] ?? null
                if (activeId) {
                    setActiveTab(activeId)
                }
            } catch (error) {
                console.warn('Session recovery failed:', error)
            } finally {
                isRestoringRef.current = false
                if (!cancelled) setIsSessionReady(true)
            }
        }

        void restore()

        return () => {
            cancelled = true
        }
    }, [
        addTab,
        isReadyToRestore,
        markSaved,
        setActiveTab,
        setActiveWorkspace,
        setViewMode,
        tabs.length,
        updateContent
    ])

    useEffect(() => {
        if (!isReadyToRestore || !isSessionReady || isRestoringRef.current) {
            return
        }

        const timer = window.setTimeout(() => {
            try {
                if (tabs.length === 0) {
                    window.localStorage.removeItem(STORAGE_KEY)
                    return
                }

                const activeTabIndex = Math.max(
                    0,
                    tabs.findIndex((tab) => tab.id === activeTabId)
                )

                const snapshot: SessionSnapshot = {
                    version: 1,
                    timestamp: Date.now(),
                    activeTabIndex,
                    viewMode,
                    activeWorkspace,
                    tabs: buildSnapshotTabs(tabs)
                }

                window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
            } catch (error) {
                console.warn('Failed to persist session snapshot:', error)
            }
        }, SNAPSHOT_DEBOUNCE_MS)

        return () => {
            window.clearTimeout(timer)
        }
    }, [activeTabId, activeWorkspace, isReadyToRestore, isSessionReady, tabs, viewMode])

    return isSessionReady
}
