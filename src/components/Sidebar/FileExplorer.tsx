import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
    AlertCircle,
    ChevronDown,
    ChevronRight,
    FilePlus2,
    FileText,
    FolderOpen,
    FolderPlus,
    Pencil,
    RefreshCw,
    Trash2,
    X,
} from 'lucide-react'
import { open as openDialog } from '@tauri-apps/plugin-dialog'
import { mkdir, readDir, remove, writeTextFile } from '@tauri-apps/plugin-fs'
import { useEditorStore } from '@/stores/editorStore'
import {
    basenameFromPath,
    ensureMarkdownFileName,
    joinPath,
    matchesPathPrefix,
    normalizePath,
    readWorkspaceFile,
} from '@/utils/workspacePaths'
import { renameMarkdownPath } from '@/utils/workspaceRename'
import './FileExplorer.css'

interface FileNode {
    name: string
    path: string
    isDirectory: boolean
    children?: FileNode[]
    isOpen?: boolean
}

type ExplorerActionMode = 'create-file' | 'create-folder' | 'rename' | 'delete' | null

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

function cloneFileNodes(nodes: FileNode[]): FileNode[] {
    return nodes.map((node) => ({
        ...node,
        children: node.children ? cloneFileNodes(node.children) : undefined,
    }))
}

export function FileExplorer() {
    const fileExplorerVisible = useEditorStore((s) => s.fileExplorerVisible)
    const setFileExplorerVisible = useEditorStore((s) => s.setFileExplorerVisible)
    const activeWorkspace = useEditorStore((s) => s.activeWorkspace)
    const setActiveWorkspace = useEditorStore((s) => s.setActiveWorkspace)
    const addTab = useEditorStore((s) => s.addTab)
    const markSaved = useEditorStore((s) => s.markSaved)
    const removeTab = useEditorStore((s) => s.removeTab)
    const tabs = useEditorStore((s) => s.tabs)
    const knowledgeIndexStatus = useEditorStore((s) => s.knowledgeIndexStatus)
    const knowledgeIndexProcessed = useEditorStore((s) => s.knowledgeIndexProcessed)
    const knowledgeIndexTotal = useEditorStore((s) => s.knowledgeIndexTotal)
    const knowledgeIndexError = useEditorStore((s) => s.knowledgeIndexError)
    const knowledgeIndexSkipped = useEditorStore((s) => s.knowledgeIndexSkipped)
    const knowledgeIndexFailedFiles = useEditorStore((s) => s.knowledgeIndexFailedFiles)
    const rebuildKnowledgeIndex = useEditorStore((s) => s.rebuildKnowledgeIndex)

    const [fileTree, setFileTree] = useState<FileNode[]>([])
    const [loading, setLoading] = useState(false)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [actionMode, setActionMode] = useState<ExplorerActionMode>(null)
    const [actionTarget, setActionTarget] = useState<FileNode | null>(null)
    const [actionInput, setActionInput] = useState('')
    const [actionBusy, setActionBusy] = useState(false)
    const directoryCacheRef = useRef<Map<string, FileNode[]>>(new Map())
    const fileTreeRef = useRef<FileNode[]>([])

    useEffect(() => {
        fileTreeRef.current = fileTree
    }, [fileTree])

    const collectOpenPaths = useCallback((nodes: FileNode[]): Set<string> => {
        const openPaths = new Set<string>()

        const walk = (items: FileNode[]) => {
            items.forEach((node) => {
                if (!node.isDirectory) return
                if (!node.isOpen) return
                openPaths.add(normalizePath(node.path))
                if (node.children?.length) {
                    walk(node.children)
                }
            })
        }

        walk(nodes)
        return openPaths
    }, [])

    const loadDirectory = useCallback(async (dirPath: string): Promise<FileNode[]> => {
        if (!isTauri) return []

        const cacheKey = normalizePath(dirPath)
        const cached = directoryCacheRef.current.get(cacheKey)
        if (cached) {
            return cloneFileNodes(cached)
        }

        const entries = await readDir(dirPath)
        const filtered = entries.filter((entry) => {
            if (entry.isDirectory) return true
            const itemPath = joinPath(dirPath, entry.name || '')
            return itemPath.toLowerCase().endsWith('.md')
        })

        const nodes: FileNode[] = filtered.map((entry) => {
            const resolvedPath = joinPath(dirPath, entry.name || 'Unknown')
            return {
                name: entry.name || basenameFromPath(resolvedPath),
                path: resolvedPath,
                isDirectory: entry.isDirectory,
                children: undefined,
                isOpen: false,
            }
        })

        nodes.sort((a, b) => {
            if (a.isDirectory && !b.isDirectory) return -1
            if (!a.isDirectory && b.isDirectory) return 1
            return a.name.localeCompare(b.name)
        })

        directoryCacheRef.current.set(cacheKey, cloneFileNodes(nodes))
        return nodes
    }, [])

    const hydrateOpenNodes = useCallback(async (nodes: FileNode[], openPaths: Set<string>): Promise<FileNode[]> => {
        await Promise.all(nodes.map(async (node) => {
            if (!node.isDirectory) return
            if (!openPaths.has(normalizePath(node.path))) return

            node.isOpen = true
            node.children = await loadDirectory(node.path)
            if (node.children.length > 0) {
                await hydrateOpenNodes(node.children, openPaths)
            }
        }))

        return nodes
    }, [loadDirectory])

    const refreshWorkspace = useCallback(async (preserveOpenState = true, forceRefresh = false) => {
        if (!activeWorkspace) return

        setLoading(true)
        setLoadError(null)

        try {
            if (forceRefresh || !preserveOpenState) {
                directoryCacheRef.current.clear()
            }

            const openPaths = preserveOpenState ? collectOpenPaths(fileTreeRef.current) : new Set<string>()
            const nodes = await loadDirectory(activeWorkspace)
            const hydrated = preserveOpenState ? await hydrateOpenNodes(nodes, openPaths) : nodes
            setFileTree(hydrated)
        } catch (error) {
            console.error('Failed to refresh workspace:', error)
            setLoadError('工作区读取失败，请确认目录权限后重试。')
            setFileTree([])
        } finally {
            setLoading(false)
        }
    }, [activeWorkspace, collectOpenPaths, hydrateOpenNodes, loadDirectory])

    useEffect(() => {
        if (fileExplorerVisible && activeWorkspace) {
            void refreshWorkspace(false)
        }
    }, [activeWorkspace, fileExplorerVisible, refreshWorkspace])

    const handleSelectWorkspace = async () => {
        if (!isTauri) return

        try {
            const selectedPath = await openDialog({
                directory: true,
                multiple: false,
                title: 'Open workspace folder',
            })

            if (selectedPath && typeof selectedPath === 'string') {
                setLoadError(null)
                setActiveWorkspace(selectedPath)
            }
        } catch (error) {
            console.error('Failed to select workspace:', error)
            setLoadError('选择工作区失败，请稍后重试。')
        }
    }

    const openFileNode = useCallback(async (node: FileNode) => {
        try {
            const content = await readWorkspaceFile(node.path)
            const tabId = addTab(node.path, content)
            markSaved(tabId, node.path)
        } catch (error) {
            console.error('Failed to open file from workspace tree:', error)
            setLoadError(`文件打开失败：${node.name}`)
        }
    }, [addTab, markSaved])

    const toggleNode = async (node: FileNode, pathSegments: number[]) => {
        setLoadError(null)

        if (!node.isDirectory) {
            await openFileNode(node)
            return
        }

        const newTree = cloneFileNodes(fileTreeRef.current)
        let currentNode: FileNode | undefined
        let currentArray = newTree

        for (const index of pathSegments) {
            currentNode = currentArray[index]
            if (currentNode.children) {
                currentArray = currentNode.children
            }
        }

        if (!currentNode) return

        currentNode.isOpen = !currentNode.isOpen
        if (currentNode.isOpen && !currentNode.children) {
            try {
                currentNode.children = await loadDirectory(currentNode.path)
            } catch (error) {
                console.error('Failed to load folder children:', error)
                setLoadError(`目录加载失败：${currentNode.name}`)
                currentNode.isOpen = false
            }
        }

        setFileTree(newTree)
    }

    const closeActionDialog = useCallback(() => {
        setActionMode(null)
        setActionTarget(null)
        setActionInput('')
        setActionBusy(false)
    }, [])

    const beginCreateAction = useCallback((mode: 'create-file' | 'create-folder', parent?: FileNode | null) => {
        setLoadError(null)
        setActionMode(mode)
        setActionTarget(parent ?? null)
        setActionInput(mode === 'create-file' ? 'untitled.md' : 'new-folder')
    }, [])

    const beginRenameAction = useCallback((node: FileNode) => {
        setLoadError(null)
        setActionMode('rename')
        setActionTarget(node)
        setActionInput(node.name)
    }, [])

    const beginDeleteAction = useCallback((node: FileNode) => {
        setLoadError(null)
        setActionMode('delete')
        setActionTarget(node)
        setActionInput(node.name)
    }, [])

    const activeTabsInTarget = useMemo(() => {
        if (!actionTarget) return []
        return tabs.filter((tab) => {
            if (!tab.filePath) return false
            return actionTarget.isDirectory
                ? matchesPathPrefix(actionTarget.path, tab.filePath)
                : normalizePath(tab.filePath) === normalizePath(actionTarget.path)
        })
    }, [actionTarget, tabs])

    const removeTabsForPath = useCallback((targetPath: string, isDirectory: boolean) => {
        tabs.forEach((tab) => {
            if (!tab.filePath) return
            const matches = isDirectory
                ? matchesPathPrefix(targetPath, tab.filePath)
                : normalizePath(tab.filePath) === normalizePath(targetPath)
            if (matches) {
                removeTab(tab.id)
            }
        })
    }, [removeTab, tabs])

    const applyAction = useCallback(async () => {
        if (!activeWorkspace || !actionMode) return

        const trimmedInput = actionInput.trim()
        if (actionMode !== 'delete' && !trimmedInput) {
            setLoadError('名称不能为空。')
            return
        }

        if (trimmedInput.includes('/') || trimmedInput.includes('\\')) {
            setLoadError('名称中不能包含路径分隔符。')
            return
        }

        try {
            setActionBusy(true)
            setLoadError(null)

            if (actionMode === 'create-file' || actionMode === 'create-folder') {
                const parentPath = actionTarget?.isDirectory ? actionTarget.path : activeWorkspace
                const targetPath = joinPath(parentPath, ensureMarkdownFileName(trimmedInput, actionMode === 'create-folder'))

                if (actionMode === 'create-file') {
                    await writeTextFile(targetPath, '')
                    const tabId = addTab(targetPath, '')
                    markSaved(tabId, targetPath)
                } else {
                    await mkdir(targetPath, { recursive: false })
                }
            }

            if (actionMode === 'rename' && actionTarget) {
                await renameMarkdownPath(actionTarget.path, trimmedInput, {
                    isDirectory: actionTarget.isDirectory,
                    workspacePath: activeWorkspace,
                })
            }

            if (actionMode === 'delete' && actionTarget) {
                const dirtyTabs = activeTabsInTarget.filter((tab) => tab.isDirty)
                if (dirtyTabs.length > 0) {
                    setLoadError('目标包含未保存的已打开文档，请先保存或关闭后再删除。')
                    setActionBusy(false)
                    return
                }

                await remove(actionTarget.path, { recursive: actionTarget.isDirectory })
                removeTabsForPath(actionTarget.path, actionTarget.isDirectory)
            }

            closeActionDialog()
            await refreshWorkspace(true, true)
            void rebuildKnowledgeIndex()
        } catch (error) {
            console.error('Workspace action failed:', error)
            setLoadError('操作失败，请检查名称、权限或文件占用情况后重试。')
            setActionBusy(false)
        }
    }, [
        actionInput,
        actionMode,
        actionTarget,
        activeTabsInTarget,
        activeWorkspace,
        addTab,
        closeActionDialog,
        markSaved,
        rebuildKnowledgeIndex,
        refreshWorkspace,
        removeTabsForPath,
    ])

    const renderTree = (nodes: FileNode[], pathPrefix: number[] = []) => {
        return nodes.map((node, index) => {
            const currentPath = [...pathPrefix, index]
            return (
                <div key={node.path} className="file-node-container">
                    <div
                        className={`file-node file-node--level-${pathPrefix.length}`}
                        onClick={() => void toggleNode(node, currentPath)}
                        title={node.path}
                    >
                        <span className="file-node__icon">
                            {node.isDirectory
                                ? node.isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                                : <FileText size={14} />}
                        </span>
                        <span className="file-node__name">{node.name}</span>
                        <span className="file-node__actions" onClick={(event) => event.stopPropagation()}>
                            {node.isDirectory && (
                                <>
                                    <button className="file-node__action-btn" title="新建文档" onClick={() => beginCreateAction('create-file', node)}>
                                        <FilePlus2 size={13} />
                                    </button>
                                    <button className="file-node__action-btn" title="新建文件夹" onClick={() => beginCreateAction('create-folder', node)}>
                                        <FolderPlus size={13} />
                                    </button>
                                </>
                            )}
                            <button className="file-node__action-btn" title="重命名" onClick={() => beginRenameAction(node)}>
                                <Pencil size={13} />
                            </button>
                            <button className="file-node__action-btn file-node__action-btn--danger" title="删除" onClick={() => beginDeleteAction(node)}>
                                <Trash2 size={13} />
                            </button>
                        </span>
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

    const indexedCount = Math.max(0, (knowledgeIndexTotal || knowledgeIndexProcessed || 0) - knowledgeIndexSkipped)
    const hasIndexWarnings = knowledgeIndexStatus === 'idle' && knowledgeIndexSkipped > 0

    const actionTitle = actionMode === 'create-file'
        ? '新建文档'
        : actionMode === 'create-folder'
            ? '新建文件夹'
            : actionMode === 'rename'
                ? '重命名'
                : '删除确认'

    const actionDescription = actionMode === 'delete'
        ? `将删除${actionTarget?.isDirectory ? '文件夹' : '文件'}“${actionTarget?.name || ''}”。`
        : actionMode === 'rename'
            ? `为“${actionTarget?.name || ''}”输入新的名称。`
            : `将在 ${(actionTarget?.isDirectory ? actionTarget.name : basenameFromPath(activeWorkspace || '')) || '工作区'} 中创建内容。`

    return (
        <>
            <div className="file-explorer">
                <div className="file-explorer__header">
                    <div className="file-explorer__title">
                        <FolderOpen size={16} />
                        <span>工作区</span>
                    </div>
                    <div className="file-explorer__actions">
                        {activeWorkspace && (
                            <>
                                <button
                                    className="file-explorer__btn"
                                    onClick={() => beginCreateAction('create-file')}
                                    title="在工作区根目录新建文档"
                                >
                                    <FilePlus2 size={14} />
                                </button>
                                <button
                                    className="file-explorer__btn"
                                    onClick={() => beginCreateAction('create-folder')}
                                    title="在工作区根目录新建文件夹"
                                >
                                    <FolderPlus size={14} />
                                </button>
                                <button
                                    className="file-explorer__btn"
                                    onClick={() => void refreshWorkspace(true, true)}
                                    title="刷新工作区"
                                    disabled={loading || knowledgeIndexStatus === 'indexing'}
                                >
                                    <RefreshCw size={14} className={loading ? 'spinning' : ''} />
                                </button>
                            </>
                        )}
                        <button
                            className="file-explorer__btn"
                            onClick={() => setFileExplorerVisible(false)}
                            title="关闭侧栏"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                <div className="file-explorer__content">
                    {!activeWorkspace ? (
                        <div className="file-explorer__empty">
                            <p>尚未打开工作区目录</p>
                            <button className="btn-primary" onClick={() => void handleSelectWorkspace()}>
                                选择工作区
                            </button>
                        </div>
                    ) : (
                        <div className="file-explorer__tree">
                            <div className="file-explorer__workspace-name" title={activeWorkspace}>
                                {basenameFromPath(activeWorkspace)}
                            </div>

                            {loadError && (
                                <div className="file-explorer__error" role="status" aria-live="polite">
                                    <AlertCircle size={14} />
                                    <span>{loadError}</span>
                                </div>
                            )}

                            {knowledgeIndexStatus === 'indexing' && (
                                <div className="file-explorer__index-status file-explorer__index-status--indexing" role="status" aria-live="polite">
                                    <RefreshCw size={14} className="spinning" />
                                    <div className="file-explorer__index-copy">
                                        <span>正在建立索引 {knowledgeIndexProcessed}/{knowledgeIndexTotal || '?'}</span>
                                        <small>搜索结果会随索引进度更新。</small>
                                    </div>
                                </div>
                            )}

                            {knowledgeIndexStatus === 'error' && knowledgeIndexError && (
                                <div className="file-explorer__index-status file-explorer__index-status--error" role="status" aria-live="polite">
                                    <AlertCircle size={14} />
                                    <div className="file-explorer__index-copy">
                                        <span>{knowledgeIndexError}</span>
                                        <small>搜索会使用上一次可用索引。</small>
                                        {knowledgeIndexFailedFiles.length > 0 && (
                                            <details className="file-explorer__index-details">
                                                <summary>查看 {knowledgeIndexFailedFiles.length} 个文件</summary>
                                                {knowledgeIndexFailedFiles.slice(0, 5).map((item) => (
                                                    <div key={item.filePath} className="file-explorer__index-file" title={`${item.filePath}\n${item.message}`}>
                                                        {basenameFromPath(item.filePath)}
                                                    </div>
                                                ))}
                                            </details>
                                        )}
                                    </div>
                                    <button
                                        className="btn-secondary btn-small"
                                        onClick={() => void rebuildKnowledgeIndex()}
                                    >
                                        重试索引
                                    </button>
                                </div>
                            )}

                            {hasIndexWarnings && (
                                <div className="file-explorer__index-status file-explorer__index-status--warning" role="status" aria-live="polite">
                                    <AlertCircle size={14} />
                                    <div className="file-explorer__index-copy">
                                        <span>已索引 {indexedCount} 个文件，{knowledgeIndexSkipped} 个需重试</span>
                                        <small>搜索可继续使用已索引内容。</small>
                                        {knowledgeIndexFailedFiles.length > 0 && (
                                            <details className="file-explorer__index-details">
                                                <summary>查看跳过文件</summary>
                                                {knowledgeIndexFailedFiles.slice(0, 5).map((item) => (
                                                    <div key={item.filePath} className="file-explorer__index-file" title={`${item.filePath}\n${item.message}`}>
                                                        {basenameFromPath(item.filePath)}
                                                    </div>
                                                ))}
                                            </details>
                                        )}
                                    </div>
                                    <button
                                        className="btn-secondary btn-small"
                                        onClick={() => void rebuildKnowledgeIndex()}
                                    >
                                        重试索引
                                    </button>
                                </div>
                            )}

                            {renderTree(fileTree)}
                        </div>
                    )}
                </div>

                {activeWorkspace && (
                    <div className="file-explorer__footer">
                        <button className="btn-secondary btn-small" onClick={() => void handleSelectWorkspace()}>
                            切换工作区
                        </button>
                        <button
                            className="btn-secondary btn-small"
                            onClick={() => void rebuildKnowledgeIndex()}
                            disabled={knowledgeIndexStatus === 'indexing'}
                        >
                            {knowledgeIndexStatus === 'indexing' ? '索引中…' : '重建索引'}
                        </button>
                    </div>
                )}
            </div>

            {actionMode && (
                <div className="file-explorer-dialog__overlay" onClick={(event) => event.target === event.currentTarget && closeActionDialog()}>
                    <div className="file-explorer-dialog" role="dialog" aria-modal="true">
                        <div className="file-explorer-dialog__header">
                            <h3>{actionTitle}</h3>
                            <button className="file-explorer__btn" onClick={closeActionDialog} title="关闭">
                                <X size={14} />
                            </button>
                        </div>
                        <div className="file-explorer-dialog__body">
                            <p className="file-explorer-dialog__desc">{actionDescription}</p>
                            {actionMode === 'delete' ? (
                                activeTabsInTarget.length > 0 && (
                                    <div className="file-explorer-dialog__hint">
                                        已关联 {activeTabsInTarget.length} 个打开标签页，删除后会同步关闭未修改标签页。
                                    </div>
                                )
                            ) : (
                                <input
                                    className="file-explorer-dialog__input"
                                    value={actionInput}
                                    onChange={(event) => setActionInput(event.target.value)}
                                    placeholder={actionMode === 'create-file' ? 'example.md' : '请输入名称'}
                                    autoFocus
                                />
                            )}
                        </div>
                        <div className="file-explorer-dialog__footer">
                            <button className="btn-secondary btn-small" onClick={closeActionDialog} disabled={actionBusy}>
                                取消
                            </button>
                            <button
                                className={`btn-small ${actionMode === 'delete' ? 'btn-danger' : 'btn-primary'}`}
                                onClick={() => void applyAction()}
                                disabled={actionBusy}
                            >
                                {actionBusy ? '处理中…' : actionMode === 'delete' ? '确认删除' : '确认'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
