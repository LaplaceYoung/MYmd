import { useState, useEffect, useCallback } from 'react'
import { FolderOpen, FileText, ChevronRight, ChevronDown, X, RefreshCw } from 'lucide-react'
import { useEditorStore } from '@/stores/editorStore'
import { readDir } from '@tauri-apps/plugin-fs'
import { open as openDialog } from '@tauri-apps/plugin-dialog'
import './FileExplorer.css'

// 简单的文件树节点类型定义
interface FileNode {
    name: string
    path: string
    isDirectory: boolean
    children?: FileNode[]
    isOpen?: boolean // 用于目录的展开/折叠状态
}

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

export function FileExplorer() {
    const fileExplorerVisible = useEditorStore(s => s.fileExplorerVisible)
    const setFileExplorerVisible = useEditorStore(s => s.setFileExplorerVisible)
    const activeWorkspace = useEditorStore(s => s.activeWorkspace)
    const setActiveWorkspace = useEditorStore(s => s.setActiveWorkspace)
    const addTab = useEditorStore(s => s.addTab)

    const [fileTree, setFileTree] = useState<FileNode[]>([])
    const [loading, setLoading] = useState(false)

    // 递归读取目录内容
    const loadDirectory = useCallback(async (dirPath: string): Promise<FileNode[]> => {
        if (!isTauri) return []
        try {
            const entries = await readDir(dirPath)

            // 过滤并排序：文件夹在前，文件在后，只保留 md 文件
            const filtered = entries.filter(e => {
                if (e.isDirectory) return true
                if (e.name && e.name.toLowerCase().endsWith('.md')) return true
                return false
            })

            const nodes: FileNode[] = filtered.map(e => ({
                name: e.name || 'Unknown',
                path: `${dirPath}/${e.name}`,
                isDirectory: e.isDirectory,
                children: undefined,
                isOpen: false
            }))

            // 排序: 文件夹先
            nodes.sort((a, b) => {
                if (a.isDirectory && !b.isDirectory) return -1
                if (!a.isDirectory && b.isDirectory) return 1
                return a.name.localeCompare(b.name)
            })

            return nodes
        } catch (err) {
            console.error('Failed to read directory:', err)
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
            refreshWorkspace()
        }
    }, [fileExplorerVisible, activeWorkspace, refreshWorkspace])

    const handleSelectWorkspace = async () => {
        if (!isTauri) return
        try {
            const selectedPath = await openDialog({
                directory: true,
                multiple: false,
                title: '打开文件夹 (工作区)'
            })
            if (selectedPath && typeof selectedPath === 'string') {
                setActiveWorkspace(selectedPath)
            }
        } catch (e) {
            console.error('Failed to select workspace:', e)
        }
    }

    const toggleNode = async (node: FileNode, pathSegments: number[]) => {
        if (!node.isDirectory) {
            // 打开文件
            addTab(node.path)
            return
        }

        // 浅拷贝树以进行状态更新
        const newTree = [...fileTree]

        // 查找引用的节点
        let currentNode: FileNode | undefined = undefined
        let currentArray = newTree

        for (const idx of pathSegments) {
            currentNode = currentArray[idx]
            if (currentNode.children) {
                currentArray = currentNode.children
            }
        }

        if (currentNode) {
            currentNode.isOpen = !currentNode.isOpen

            // 如果是展开且还没加载过子节点，则去加载
            if (currentNode.isOpen && !currentNode.children) {
                currentNode.children = await loadDirectory(currentNode.path)
                // 再次触发渲染
                setFileTree([...newTree])
            } else {
                setFileTree(newTree)
            }
        }
    }

    const renderTree = (nodes: FileNode[], pathPrefix: number[] = []) => {
        return nodes.map((node, i) => {
            const currentPath = [...pathPrefix, i]
            return (
                <div key={node.path} className="file-node-container">
                    <div
                        className={`file-node file-node--level-${pathPrefix.length}`}
                        onClick={() => toggleNode(node, currentPath)}
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
                        <button className="file-explorer__btn" onClick={refreshWorkspace} title="刷新" disabled={loading}>
                            <RefreshCw size={14} className={loading ? 'spinning' : ''} />
                        </button>
                    )}
                    <button className="file-explorer__btn" onClick={() => setFileExplorerVisible(false)} title="关闭视图">
                        <X size={16} />
                    </button>
                </div>
            </div>
            <div className="file-explorer__content">
                {!activeWorkspace ? (
                    <div className="file-explorer__empty">
                        <p>未打开任何文件夹</p>
                        <button className="btn-primary" onClick={handleSelectWorkspace}>
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
                    <button className="btn-secondary btn-small" onClick={handleSelectWorkspace}>
                        切换文件夹
                    </button>
                </div>
            )}
        </div>
    )
}
