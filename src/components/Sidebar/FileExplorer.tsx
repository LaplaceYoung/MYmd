import { useState, useEffect, useCallback } from 'react'
import { FolderOpen, FileText, ChevronRight, ChevronDown, X, RefreshCw } from 'lucide-react'
import { useEditorStore } from '@/stores/editorStore'
import { readDir, readTextFile } from '@tauri-apps/plugin-fs'
import { open as openDialog } from '@tauri-apps/plugin-dialog'
import './FileExplorer.css'

interface FileNode {
    name: string
    path: string
    isDirectory: boolean
    children?: FileNode[]
    isOpen?: boolean
}

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

export function FileExplorer() {
    const fileExplorerVisible = useEditorStore((s) => s.fileExplorerVisible)
    const setFileExplorerVisible = useEditorStore((s) => s.setFileExplorerVisible)
    const activeWorkspace = useEditorStore((s) => s.activeWorkspace)
    const setActiveWorkspace = useEditorStore((s) => s.setActiveWorkspace)
    const addTab = useEditorStore((s) => s.addTab)
    const markSaved = useEditorStore((s) => s.markSaved)

    const [fileTree, setFileTree] = useState<FileNode[]>([])
    const [loading, setLoading] = useState(false)

    const loadDirectory = useCallback(async (dirPath: string): Promise<FileNode[]> => {
        if (!isTauri) return []

        try {
            const entries = await readDir(dirPath)

            const filtered = entries.filter((entry) => {
                if (entry.isDirectory) return true
                return Boolean(entry.name && entry.name.toLowerCase().endsWith('.md'))
            })

            const nodes: FileNode[] = filtered.map((entry) => ({
                name: entry.name || 'Unknown',
                path: `${dirPath}/${entry.name}`,
                isDirectory: entry.isDirectory,
                children: undefined,
                isOpen: false,
            }))

            nodes.sort((a, b) => {
                if (a.isDirectory && !b.isDirectory) return -1
                if (!a.isDirectory && b.isDirectory) return 1
                return a.name.localeCompare(b.name)
            })

            return nodes
        } catch (error) {
            console.error('Failed to read directory:', error)
            return []
        }
    }, [])

    const refreshWorkspace = useCallback(async () => {
        if (!activeWorkspace) return

        setLoading(true)
        const nodes = await loadDirectory(activeWorkspace)
        setFileTree(nodes)
        setLoading(false)
    }, [activeWorkspace, loadDirectory])

    useEffect(() => {
        if (fileExplorerVisible && activeWorkspace) {
            void refreshWorkspace()
        }
    }, [fileExplorerVisible, activeWorkspace, refreshWorkspace])

    const handleSelectWorkspace = async () => {
        if (!isTauri) return

        try {
            const selectedPath = await openDialog({
                directory: true,
                multiple: false,
                title: 'Open workspace folder',
            })

            if (selectedPath && typeof selectedPath === 'string') {
                setActiveWorkspace(selectedPath)
            }
        } catch (error) {
            console.error('Failed to select workspace:', error)
        }
    }

    const toggleNode = async (node: FileNode, pathSegments: number[]) => {
        if (!node.isDirectory) {
            try {
                const content = await readTextFile(node.path)
                const tabId = addTab(node.path, content)
                markSaved(tabId, node.path)
            } catch (error) {
                console.error('Failed to open file from workspace tree:', error)
            }
            return
        }

        const newTree = [...fileTree]
        let currentNode: FileNode | undefined
        let currentArray = newTree

        for (const idx of pathSegments) {
            currentNode = currentArray[idx]
            if (currentNode.children) {
                currentArray = currentNode.children
            }
        }

        if (!currentNode) return

        currentNode.isOpen = !currentNode.isOpen

        if (currentNode.isOpen && !currentNode.children) {
            currentNode.children = await loadDirectory(currentNode.path)
        }

        setFileTree([...newTree])
    }

    const renderTree = (nodes: FileNode[], pathPrefix: number[] = []) => {
        return nodes.map((node, i) => {
            const currentPath = [...pathPrefix, i]
            return (
                <div key={node.path} className="file-node-container">
                    <div
                        className={`file-node file-node--level-${pathPrefix.length}`}
                        onClick={() => void toggleNode(node, currentPath)}
                        title={node.path}
                    >
                        <span className="file-node__icon">
                            {node.isDirectory ? (
                                node.isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                            ) : (
                                <FileText size={14} />
                            )}
                        </span>
                        <span className="file-node__name">{node.name}</span>
                    </div>
                    {node.isDirectory && node.isOpen && node.children && (
                        <div className="file-node__children">
                            {renderTree(node.children, currentPath)}
                        </div>
                    )}
                </div>
            )
        })
    }

    if (!fileExplorerVisible) return null

    return (
        <div className="file-explorer">
            <div className="file-explorer__header">
                <div className="file-explorer__title">
                    <FolderOpen size={16} />
                    <span>工作区</span>
                </div>
                <div className="file-explorer__actions">
                    {activeWorkspace && (
                        <button
                            className="file-explorer__btn"
                            onClick={() => void refreshWorkspace()}
                            title="刷新"
                            disabled={loading}
                        >
                            <RefreshCw size={14} className={loading ? 'spinning' : ''} />
                        </button>
                    )}
                    <button
                        className="file-explorer__btn"
                        onClick={() => setFileExplorerVisible(false)}
                        title="关闭视图"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
            <div className="file-explorer__content">
                {!activeWorkspace ? (
                    <div className="file-explorer__empty">
                        <p>未打开任何文件夹</p>
                        <button className="btn-primary" onClick={() => void handleSelectWorkspace()}>
                            打开工作区
                        </button>
                    </div>
                ) : (
                    <div className="file-explorer__tree">
                        <div className="file-explorer__workspace-name" title={activeWorkspace}>
                            {activeWorkspace.split(/[/\\]/).pop()}
                        </div>
                        {renderTree(fileTree)}
                    </div>
                )}
            </div>
            {activeWorkspace && (
                <div className="file-explorer__footer">
                    <button className="btn-secondary btn-small" onClick={() => void handleSelectWorkspace()}>
                        切换文件夹
                    </button>
                </div>
            )}
        </div>
    )
}
