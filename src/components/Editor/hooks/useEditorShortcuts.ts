import { useEffect, useCallback } from 'react'
import { useEditorStore } from '@/stores/editorStore'
import { open as openDialog, save as saveDialog } from '@tauri-apps/plugin-dialog'
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs'

// 检测是否在 Tauri 环境中
const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

export function useEditorShortcuts() {
    const addTab = useEditorStore(s => s.addTab)

    // 处理文件打开
    const handleOpenFile = useCallback(async () => {
        if (!isTauri) {
            addTab(null, '# 浏览器模式\n\n在 Tauri 环境中可以打开本地文件。\n')
            return
        }

        const selected = await openDialog({
            multiple: true,
            filters: [{ name: 'Markdown', extensions: ['md', 'txt'] }]
        })
        if (selected) {
            const filePaths = Array.isArray(selected) ? selected : [selected]
            for (const filePath of filePaths) {
                try {
                    const content = await readTextFile(filePath)
                    const tabId = addTab(filePath, content)
                    useEditorStore.getState().markSaved(tabId, filePath)
                } catch (e) {
                    console.error('Failed to read file:', e)
                }
            }
        }
    }, [addTab])

    // 处理新建文件
    const handleNewFile = useCallback(() => {
        addTab(null, '# 新文档\n\n开始编写...\n')
    }, [addTab])

    // 打开最近文件
    const handleOpenRecentFile = useCallback(async (filePath: string) => {
        if (!isTauri) return

        try {
            const content = await readTextFile(filePath)
            const tabId = addTab(filePath, content)
            useEditorStore.getState().markSaved(tabId, filePath)
        } catch (e) {
            console.error('Failed to read recent file:', e)
        }
    }, [addTab])

    // 快捷键处理
    useEffect(() => {
        const handleKeyDown = async (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'n':
                        e.preventDefault()
                        handleNewFile()
                        break
                    case 'o':
                        e.preventDefault()
                        handleOpenFile()
                        break
                    case 's': {
                        e.preventDefault()
                        if (!isTauri) break

                        const tab = useEditorStore.getState().getActiveTab()
                        if (!tab) break

                        if (e.shiftKey || !tab.filePath) {
                            try {
                                const filePath = await saveDialog({
                                    filters: [{ name: 'Markdown', extensions: ['md', 'txt'] }],
                                    defaultPath: tab.filePath ?? undefined
                                })
                                if (filePath) {
                                    await writeTextFile(filePath, tab.content)
                                    useEditorStore.getState().markSaved(tab.id, filePath)
                                }
                            } catch (error) {
                                console.error('Save failed:', error)
                            }
                        } else {
                            try {
                                await writeTextFile(tab.filePath, tab.content)
                                useEditorStore.getState().markSaved(tab.id)
                            } catch (error) {
                                console.error('Save failed:', error)
                            }
                        }
                        break
                    }
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleNewFile, handleOpenFile])

    return { handleNewFile, handleOpenFile, handleOpenRecentFile }
}
