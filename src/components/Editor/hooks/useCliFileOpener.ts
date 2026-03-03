import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { useEditorStore } from '@/stores/editorStore'

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

function trimQuotes(input: string): string {
    return input.replace(/^"|"$/g, '')
}

function looksLikeExecutablePath(input: string): boolean {
    const value = trimQuotes(input).toLowerCase()
    return value.endsWith('.exe')
}

function normalizeFileArg(input: string): string {
    const trimmed = trimQuotes(input)

    if (!trimmed.toLowerCase().startsWith('file://')) {
        return trimmed
    }

    try {
        const url = new URL(trimmed)
        let path = decodeURIComponent(url.pathname)

        // file:///C:/path -> C:/path (Windows)
        if (/^\/[a-zA-Z]:\//.test(path)) {
            path = path.slice(1)
        }

        return path.replace(/\//g, '\\')
    } catch {
        return trimmed
    }
}

function collectCliFilePaths(args: string[]): string[] {
    const files: string[] = []
    const seen = new Set<string>()

    const normalizedArgs = args
        .map(arg => arg?.trim())
        .filter((arg): arg is string => Boolean(arg))

    const startIndex =
        normalizedArgs.length > 0 && looksLikeExecutablePath(normalizedArgs[0]) ? 1 : 0

    for (let i = startIndex; i < normalizedArgs.length; i++) {
        const arg = normalizedArgs[i]
        if (arg === '--') continue
        if (arg.startsWith('-')) continue

        const filePath = normalizeFileArg(arg)
        if (!filePath || seen.has(filePath)) continue

        seen.add(filePath)
        files.push(filePath)
    }

    return files
}

async function readTextFromPath(path: string): Promise<string> {
    return invoke<string>('read_text_file_from_path', { path })
}

async function openFilesFromArgs(
    args: string[],
    addTab: (filePath: string | null, content?: string) => string,
    isMounted?: () => boolean
) {
    const filePaths = collectCliFilePaths(args)

    for (const filePath of filePaths) {
        try {
            const content = await readTextFromPath(filePath)
            if (!isMounted || isMounted()) {
                addTab(filePath, content)
            }
        } catch (err) {
            console.error(`Failed to read file from cli arg: ${filePath}`, err)
        }
    }
}

/**
 * Open files passed to the desktop app on startup (file association / Open With).
 * Also listens for open-file requests forwarded from second-instance launches.
 * Returns true when initial CLI parsing has completed.
 */
export function useCliFileOpener() {
    const addTab = useEditorStore(s => s.addTab)
    const [isCliInitDone, setIsCliInitDone] = useState(!isTauri)

    useEffect(() => {
        if (!isTauri) {
            setIsCliInitDone(true)
            return
        }

        let mounted = true
        let unlisten: (() => void) | null = null

        async function initCliOpen() {
            try {
                unlisten = await listen<string[]>('mymd://open-files', async (event) => {
                    await openFilesFromArgs(event.payload, addTab)
                })

                const args = await invoke<string[]>('get_cli_args')
                await openFilesFromArgs(args, addTab, () => mounted)
            } catch (e) {
                console.error('Failed to get cli args from backend', e)
            } finally {
                if (mounted) {
                    setIsCliInitDone(true)
                }
            }
        }

        initCliOpen()

        return () => {
            mounted = false
            if (unlisten) {
                unlisten()
            }
        }
    }, [addTab])

    return isCliInitDone
}
