import { useEffect, useRef, useState } from 'react'
import { X, Plus } from 'lucide-react'
import { useEditorStore } from '@/stores/editorStore'
import { useI18n } from '@/i18n'
import { ensureMarkdownFileName } from '@/utils/workspacePaths'
import { renameMarkdownPath } from '@/utils/workspaceRename'
import './TabBar.css'

export function TabBar() {
    const { t } = useI18n()
    const renameLabel = typeof document !== 'undefined' && document.documentElement.lang.startsWith('zh')
        ? '重命名标签页'
        : 'Rename tab'
    const renameFailedLabel = typeof document !== 'undefined' && document.documentElement.lang.startsWith('zh')
        ? '重命名失败，请检查目标文件是否已存在或正被占用。'
        : 'Rename failed. Check whether the target file already exists or is in use.'
    const tabs = useEditorStore(s => s.tabs)
    const activeTabId = useEditorStore(s => s.activeTabId)
    const setActiveTab = useEditorStore(s => s.setActiveTab)
    const requestCloseTab = useEditorStore(s => s.requestCloseTab)
    const addTab = useEditorStore(s => s.addTab)
    const activeWorkspace = useEditorStore(s => s.activeWorkspace)
    const rebuildKnowledgeIndex = useEditorStore(s => s.rebuildKnowledgeIndex)

    const [editingTabId, setEditingTabId] = useState<string | null>(null)
    const [editingValue, setEditingValue] = useState('')
    const [renameError, setRenameError] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement | null>(null)

    useEffect(() => {
        if (!editingTabId) return
        inputRef.current?.focus()
        inputRef.current?.select()
    }, [editingTabId])

    const startRename = (tabId: string, currentTitle: string) => {
        setEditingTabId(tabId)
        setEditingValue(currentTitle)
        setRenameError(null)
    }

    const cancelRename = () => {
        setEditingTabId(null)
        setEditingValue('')
        setRenameError(null)
    }

    const submitRename = async (tabId: string) => {
        const tab = tabs.find(item => item.id === tabId)
        const nextName = editingValue.trim()
        if (!tab || !nextName) {
            cancelRename()
            return
        }

        try {
            if (tab.filePath) {
                await renameMarkdownPath(tab.filePath, nextName, {
                    workspacePath: activeWorkspace,
                })
                void rebuildKnowledgeIndex()
            } else {
                useEditorStore.setState((state) => ({
                    tabs: state.tabs.map((item) =>
                        item.id === tabId
                            ? { ...item, title: ensureMarkdownFileName(nextName, false) }
                            : item
                    )
                }))
            }
            cancelRename()
        } catch (error) {
            console.error('tab rename failed:', error)
            setRenameError(renameFailedLabel)
        }
    }

    return (
        <div className="tabbar">
            {tabs.map(tab => (
                <div
                    key={tab.id}
                    className={`tabbar__tab ${tab.id === activeTabId ? 'tabbar__tab--active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                    onDoubleClick={() => startRename(tab.id, tab.title)}
                >
                    {tab.isDirty && <span className="tabbar__tab-dirty" />}
                    {editingTabId === tab.id ? (
                        <input
                            ref={inputRef}
                            className="tabbar__tab-input"
                            value={editingValue}
                            onChange={(e) => {
                                setEditingValue(e.target.value)
                                if (renameError) setRenameError(null)
                            }}
                            onClick={(e) => e.stopPropagation()}
                            onDoubleClick={(e) => e.stopPropagation()}
                            onBlur={() => void submitRename(tab.id)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault()
                                    void submitRename(tab.id)
                                }
                                if (e.key === 'Escape') {
                                    e.preventDefault()
                                    cancelRename()
                                }
                            }}
                            aria-label={renameLabel}
                        />
                    ) : (
                        <span className="tabbar__tab-title">{tab.title}</span>
                    )}
                    <button
                        className="tabbar__tab-close"
                        onClick={(e) => {
                            e.stopPropagation()
                            if (editingTabId === tab.id) {
                                cancelRename()
                            }
                            requestCloseTab(tab.id)
                        }}
                        title={t('tab.close')}
                    >
                        <X size={12} />
                    </button>
                </div>
            ))}
            <button
                className="tabbar__add"
                onClick={() => addTab(null)}
                title={t('tab.new')}
            >
                <Plus size={16} />
            </button>
            {renameError && <div className="tabbar__rename-error">{renameError}</div>}
        </div>
    )
}
