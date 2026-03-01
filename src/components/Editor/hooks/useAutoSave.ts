import { useEffect, useRef } from 'react'
import { useEditorStore } from '@/stores/editorStore'

export function useAutoSave(intervalMs = 15000) {
    const tabs = useEditorStore(s => s.tabs)
    const saveTab = useEditorStore(s => s.saveTab)
    const tabsRef = useRef(tabs)

    useEffect(() => {
        tabsRef.current = tabs
    }, [tabs])

    useEffect(() => {
        const timer = setInterval(() => {
            const currentTabs = tabsRef.current
            currentTabs.forEach(tab => {
                // Only auto-save if it has a filePath (already saved once) and is dirty
                if (tab.isDirty && tab.filePath) {
                    saveTab(tab.id).catch(err => {
                        console.error('Auto-save failed for', tab.filePath, err)
                    })
                }
            })
        }, intervalMs)

        return () => clearInterval(timer)
    }, [intervalMs, saveTab])
}
