import { useEffect, useMemo, useState } from 'react'
import { Bot, Sparkles, Wand2, Network, LoaderCircle, X, Copy, Check, RotateCcw } from 'lucide-react'
import { useEditorStore } from '@/stores/editorStore'
import { getKnowledgeGraph } from '@/knowledge/service'
import {
    getAiTaskPresets,
    requestAiSuggestion,
    type AiPromptPreset,
    type AiTaskMode,
    type RequestAiSuggestionResult,
} from '@/utils/ai'
import { applyAiDiffBlock, buildAiDiffPreview } from '@/utils/aiDiff'
import {
    clearAiHistory,
    deleteAiHistoryEntry,
    filterAiHistoryEntries,
    loadAiHistory,
    persistAiHistory,
    pushAiHistoryEntry,
    renameAiHistoryEntry,
    sortAiHistoryEntries,
    toggleAiHistoryFavorite,
    type AiHistoryEntry,
} from '@/utils/aiHistory'
import './AiPanel.css'

const TASK_OPTIONS: Array<{
    id: AiTaskMode
    label: string
    description: string
    icon: typeof Wand2
}> = [
    {
        id: 'layout',
        label: 'Layout Polish',
        description: 'Improve heading hierarchy, spacing, lists, and print readiness.',
        icon: Wand2
    },
    {
        id: 'content',
        label: 'Content Rewrite',
        description: 'Tighten language, improve flow, and reduce redundancy.',
        icon: Sparkles
    },
    {
        id: 'graph',
        label: 'Graph Enrichment',
        description: 'Suggest links, topic clusters, and related note structure.',
        icon: Network
    }
]

export function AiPanel() {
    const aiPanelVisible = useEditorStore(s => s.aiPanelVisible)
    const setAiPanelVisible = useEditorStore(s => s.setAiPanelVisible)
    const aiConfig = useEditorStore(s => s.aiConfig)
    const aiPanelDraft = useEditorStore(s => s.aiPanelDraft)
    const updateContent = useEditorStore(s => s.updateContent)
    const activeWorkspace = useEditorStore(s => s.activeWorkspace)
    const activeTab = useEditorStore(s => {
        const id = s.activeTabId
        return s.tabs.find(tab => tab.id === id) ?? null
    })

    const [taskMode, setTaskMode] = useState<AiTaskMode>('layout')
    const [instruction, setInstruction] = useState('')
    const [includeGraphContext, setIncludeGraphContext] = useState(true)
    const [isRunning, setIsRunning] = useState(false)
    const [error, setError] = useState('')
    const [result, setResult] = useState('')
    const [copied, setCopied] = useState(false)
    const [activePresetId, setActivePresetId] = useState<string | null>(null)
    const [statusText, setStatusText] = useState('')
    const [requestMeta, setRequestMeta] = useState<RequestAiSuggestionResult | null>(null)
    const [originalSnapshot, setOriginalSnapshot] = useState<string | null>(null)
    const [history, setHistory] = useState<AiHistoryEntry[]>(() => loadAiHistory())
    const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null)
    const [editingHistoryLabel, setEditingHistoryLabel] = useState('')
    const [historyQuery, setHistoryQuery] = useState('')

    const placeholder = useMemo(() => {
        if (taskMode === 'layout') return 'Example: make this document fit an A4 proposal or resume layout.'
        if (taskMode === 'graph') return 'Example: add wiki links, topic hubs, and note split suggestions.'
        return 'Example: rewrite this into a sharper product proposal while keeping the facts.'
    }, [taskMode])
    const presets = useMemo(() => getAiTaskPresets(taskMode), [taskMode])
    const diffPreview = useMemo(() => {
        if (!activeTab || !result.trim() || taskMode === 'graph') return null
        return buildAiDiffPreview(activeTab.content, result)
    }, [activeTab?.content, result, taskMode])
    const visibleHistory = useMemo(
        () => filterAiHistoryEntries(sortAiHistoryEntries(history), historyQuery),
        [history, historyQuery]
    )
    const replaceDisabled = !result.trim() || !activeTab || (diffPreview ? !diffPreview.hasChanges : false)

    useEffect(() => {
        setActivePresetId(null)
    }, [taskMode])

    useEffect(() => {
        setOriginalSnapshot(null)
    }, [activeTab?.id, aiPanelDraft.version])

    useEffect(() => {
        if (!aiPanelVisible) return
        setTaskMode(aiPanelDraft.taskMode)
        setInstruction(aiPanelDraft.instruction)
        setIncludeGraphContext(aiPanelDraft.includeGraphContext)
        setActivePresetId(null)
    }, [
        aiPanelDraft.includeGraphContext,
        aiPanelDraft.instruction,
        aiPanelDraft.taskMode,
        aiPanelDraft.version,
        aiPanelVisible,
    ])

    useEffect(() => {
        persistAiHistory(history)
    }, [history])

    if (!aiPanelVisible) return null

    const applyPreset = (preset: AiPromptPreset) => {
        setInstruction(preset.instruction)
        setActivePresetId(preset.id)
    }

    const handleRun = async () => {
        if (!activeTab) {
            setError('No active document.')
            return
        }
        if (!aiConfig.endpoint.trim() || !aiConfig.model.trim() || !aiConfig.apiKey.trim()) {
            setError('Configure endpoint, model, and API key in Settings first.')
            return
        }

        setIsRunning(true)
        setError('')
        setCopied(false)
        setResult('')
        setStatusText('Preparing request...')
        setRequestMeta(null)
        setOriginalSnapshot(null)

        try {
            let graphContext = ''
            if (includeGraphContext && activeWorkspace) {
                const graph = await getKnowledgeGraph('', 24)
                const nodes = graph.nodes.slice(0, 8).map(node => node.title || node.file_path).join(', ')
                const edges = graph.edges.slice(0, 12).map(edge => `${edge.from} -> ${edge.to}`).join('\n')
                graphContext = [
                    `Nodes: ${nodes || 'none'}`,
                    'Edges:',
                    edges || 'none'
                ].join('\n')
            }

            const nextResult = await requestAiSuggestion({
                config: aiConfig,
                taskMode,
                instruction,
                title: activeTab.title,
                content: activeTab.content,
                graphContext,
                timeoutMs: 45_000,
                maxRetries: 1,
                preferStreaming: true,
                onStatus: (message) => setStatusText(message),
                onChunk: (_chunk, accumulated) => setResult(accumulated),
            })

            setResult(nextResult.text)
            setHistory((current) => pushAiHistoryEntry(current, {
                taskMode,
                instruction,
                result: nextResult.text,
                source: 'generated',
                documentTitle: activeTab.title || 'Untitled document',
            }))
            setRequestMeta(nextResult)
            setStatusText(
                nextResult.attempts > 1
                    ? `Completed after ${nextResult.attempts} attempts.`
                    : nextResult.streamed
                        ? 'Streaming complete.'
                        : 'Generation complete.'
            )
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : 'AI request failed')
        } finally {
            setIsRunning(false)
        }
    }

    const handleApplyReplace = () => {
        if (!activeTab || !result.trim()) return
        setOriginalSnapshot((current) => current ?? activeTab.content)
        updateContent(activeTab.id, result)
    }

    const handleApplyAppend = () => {
        if (!activeTab || !result.trim()) return
        setOriginalSnapshot((current) => current ?? activeTab.content)
        updateContent(activeTab.id, `${activeTab.content.trim()}\n\n---\n\n${result.trim()}\n`)
    }

    const handleApplyBlock = (blockIndex: number) => {
        if (!activeTab || !result.trim()) return
        const nextContent = applyAiDiffBlock(activeTab.content, result, blockIndex)
        if (nextContent === activeTab.content) return
        setOriginalSnapshot((current) => current ?? activeTab.content)
        updateContent(activeTab.id, nextContent)
    }

    const handleRestoreOriginal = () => {
        if (!activeTab || originalSnapshot === null) return
        updateContent(activeTab.id, originalSnapshot)
        setOriginalSnapshot(null)
    }

    const handleCopy = async () => {
        if (!result.trim()) return
        await navigator.clipboard.writeText(result)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1200)
    }

    const handleSaveSnapshot = () => {
        setHistory((current) => pushAiHistoryEntry(current, {
            taskMode,
            instruction,
            result,
            source: 'saved',
            documentTitle: activeTab?.title ?? 'Untitled document',
        }))
    }

    const handleLoadHistory = (entry: AiHistoryEntry) => {
        setTaskMode(entry.taskMode)
        setInstruction(entry.instruction)
        setResult(entry.result)
        setActivePresetId(null)
    }

    const handleDeleteHistory = (id: string) => {
        if (editingHistoryId === id) {
            setEditingHistoryId(null)
            setEditingHistoryLabel('')
        }
        setHistory((current) => deleteAiHistoryEntry(current, id))
    }

    const handleClearHistory = () => {
        clearAiHistory()
        setEditingHistoryId(null)
        setEditingHistoryLabel('')
        setHistory([])
    }

    const handleToggleFavorite = (id: string) => {
        setHistory((current) => toggleAiHistoryFavorite(current, id))
    }

    const handleStartRename = (id: string, initialLabel: string) => {
        setEditingHistoryId(id)
        setEditingHistoryLabel(initialLabel)
    }

    const handleSaveRename = (id: string) => {
        setHistory((current) => renameAiHistoryEntry(current, id, editingHistoryLabel))
        setEditingHistoryId(null)
        setEditingHistoryLabel('')
    }

    const handleCancelRename = () => {
        setEditingHistoryId(null)
        setEditingHistoryLabel('')
    }

    const restoreDisabled = !activeTab || originalSnapshot === null || activeTab.content === originalSnapshot

    return (
        <div className="ai-panel">
            <div className="ai-panel__header">
                <div className="ai-panel__title">
                    <Bot size={16} />
                    <span>AI Assistant</span>
                </div>
                <button className="ai-panel__close" onClick={() => setAiPanelVisible(false)}>
                    <X size={16} />
                </button>
            </div>

            <div className="ai-panel__content">
                <div className="ai-panel__intro">
                    Run human-in-the-loop suggestions for layout, content, or graph structure.
                </div>

                <div className="ai-panel__task-grid">
                    {TASK_OPTIONS.map(option => {
                        const Icon = option.icon
                        return (
                            <button
                                key={option.id}
                                className={`ai-panel__task-card ${taskMode === option.id ? 'active' : ''}`}
                                onClick={() => setTaskMode(option.id)}
                            >
                                <Icon size={16} />
                                <div className="ai-panel__task-copy">
                                    <div className="ai-panel__task-label">{option.label}</div>
                                    <div className="ai-panel__task-desc">{option.description}</div>
                                </div>
                            </button>
                        )
                    })}
                </div>

                <div className="ai-panel__field">
                    <label className="ai-panel__label">Instruction</label>
                    <div className="ai-panel__preset-row">
                        {presets.map(preset => (
                            <button
                                key={preset.id}
                                className={`ai-panel__preset ${activePresetId === preset.id ? 'active' : ''}`}
                                onClick={() => applyPreset(preset)}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                    <textarea
                        className="ai-panel__textarea"
                        value={instruction}
                        onChange={e => setInstruction(e.target.value)}
                        placeholder={placeholder}
                    />
                </div>

                <label className="ai-panel__checkbox">
                    <input
                        type="checkbox"
                        checked={includeGraphContext}
                        onChange={e => setIncludeGraphContext(e.target.checked)}
                    />
                    <span>Include graph context</span>
                </label>

                <div className="ai-panel__hint">
                    Streams when supported, times out after 45s, and retries once on transient failures.
                </div>

                <button className="ai-panel__run" onClick={() => void handleRun()} disabled={isRunning || !activeTab}>
                    {isRunning ? <LoaderCircle size={15} className="ai-panel__spin" /> : <Bot size={15} />}
                    <span>{isRunning ? (statusText || 'Generating...') : 'Generate Suggestion'}</span>
                </button>

                {error && <div className="ai-panel__error">{error}</div>}
                {(statusText || requestMeta) && (
                    <div className="ai-panel__status-row">
                        {statusText && <span className="ai-panel__status-pill">{statusText}</span>}
                        {requestMeta && (
                            <span className="ai-panel__meta-pill">
                                {requestMeta.streamed ? 'streamed' : 'single response'}
                            </span>
                        )}
                        {requestMeta && requestMeta.attempts > 1 && (
                            <span className="ai-panel__meta-pill">{requestMeta.attempts} attempts</span>
                        )}
                    </div>
                )}

                <div className="ai-panel__result-header">
                    <span>Result</span>
                    <div className="ai-panel__result-actions">
                        <button className="ai-panel__ghost" onClick={() => void handleCopy()} disabled={!result.trim()}>
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            <span>{copied ? 'Copied' : 'Copy'}</span>
                        </button>
                        <button className="ai-panel__ghost" onClick={() => void handleRun()} disabled={isRunning || !activeTab}>
                            <RotateCcw size={14} />
                            <span>Retry</span>
                        </button>
                        <button className="ai-panel__ghost" onClick={handleApplyAppend} disabled={!result.trim() || !activeTab}>
                            Append
                        </button>
                        <button
                            className="ai-panel__ghost ai-panel__ghost--snapshot"
                            onClick={handleSaveSnapshot}
                            disabled={!result.trim()}
                        >
                            Save Snapshot
                        </button>
                        <button
                            className="ai-panel__ghost ai-panel__ghost--restore"
                            onClick={handleRestoreOriginal}
                            disabled={restoreDisabled}
                        >
                            Restore
                        </button>
                        <button className="ai-panel__primary" onClick={handleApplyReplace} disabled={replaceDisabled}>
                            Replace
                        </button>
                    </div>
                </div>

                {diffPreview && (
                    <div className="ai-panel__diff-card">
                        <div className="ai-panel__diff-header">
                            <span className="ai-panel__diff-title">Change Preview</span>
                            <div className="ai-panel__diff-pills">
                                <span className="ai-panel__diff-pill">{diffPreview.changedLines} changed</span>
                                <span className="ai-panel__diff-pill">{diffPreview.addedLines} added</span>
                                <span className="ai-panel__diff-pill">{diffPreview.removedLines} removed</span>
                            </div>
                        </div>
                        {!diffPreview.hasChanges && (
                            <div className="ai-panel__diff-empty">No document changes detected.</div>
                        )}
                        {diffPreview.previewBlocks.length > 0 && (
                            <div className="ai-panel__diff-blocks">
                                {diffPreview.previewBlocks.map((block, index) => (
                                    <div
                                        key={`${block.beforeStartLine}-${block.afterStartLine}-${index}`}
                                        className="ai-panel__diff-block"
                                    >
                                        <div className="ai-panel__diff-range">
                                            Before L{block.beforeStartLine} -&gt; After L{block.afterStartLine}
                                        </div>
                                        <div className="ai-panel__diff-actions">
                                            <button
                                                className="ai-panel__ghost ai-panel__diff-apply"
                                                onClick={() => handleApplyBlock(index)}
                                                disabled={!activeTab}
                                            >
                                                Apply Block
                                            </button>
                                        </div>
                                        {block.removed.map((line, lineIndex) => (
                                            <div
                                                key={`removed-${lineIndex}`}
                                                className="ai-panel__diff-line ai-panel__diff-line--removed"
                                            >
                                                - {line || '(blank line)'}
                                            </div>
                                        ))}
                                        {block.added.map((line, lineIndex) => (
                                            <div
                                                key={`added-${lineIndex}`}
                                                className="ai-panel__diff-line ai-panel__diff-line--added"
                                            >
                                                + {line || '(blank line)'}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                                {diffPreview.truncated && (
                                    <div className="ai-panel__diff-more">
                                        Showing the first {diffPreview.previewBlocks.length} change block(s).
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {taskMode === 'graph' && result.trim() && (
                    <div className="ai-panel__diff-note">
                        Graph suggestions are guidance-first. Review links and clusters before applying them to the document.
                    </div>
                )}

                <textarea
                    className="ai-panel__result"
                    value={result}
                    onChange={e => setResult(e.target.value)}
                    placeholder="Generated Markdown will appear here. You can edit it before applying."
                />

                {history.length > 0 && (
                    <div className="ai-panel__history">
                        <div className="ai-panel__history-header">
                            <div className="ai-panel__history-header-copy">
                                <span className="ai-panel__history-title">Session History</span>
                                <span className="ai-panel__history-count">
                                    {visibleHistory.length === history.length
                                        ? `${history.length} items`
                                        : `${visibleHistory.length} of ${history.length} items`}
                                </span>
                            </div>
                            <div className="ai-panel__history-header-actions">
                                <input
                                    className="ai-panel__history-search"
                                    value={historyQuery}
                                    onChange={(event) => setHistoryQuery(event.target.value)}
                                    placeholder="Search history"
                                />
                                <button
                                    className="ai-panel__ghost ai-panel__history-clear"
                                    onClick={handleClearHistory}
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                        <div className="ai-panel__history-list">
                            {visibleHistory.map((entry) => (
                                <div key={entry.id} className="ai-panel__history-item">
                                    <div className="ai-panel__history-meta">
                                        <span className="ai-panel__history-badge">{entry.taskMode}</span>
                                        <span className="ai-panel__history-badge">{entry.source}</span>
                                        <span className="ai-panel__history-time">{entry.createdAt}</span>
                                    </div>
                                    <div className="ai-panel__history-heading">
                                        <div className="ai-panel__history-copy">
                                            <div className="ai-panel__history-name">
                                                {entry.label || entry.documentTitle}
                                            </div>
                                            {entry.label && (
                                                <div className="ai-panel__history-document-title">
                                                    {entry.documentTitle}
                                                </div>
                                            )}
                                        </div>
                                        <div className="ai-panel__history-item-actions">
                                            <button
                                                className="ai-panel__ghost ai-panel__history-favorite"
                                                onClick={() => handleToggleFavorite(entry.id)}
                                            >
                                                {entry.favorite ? 'Unfavorite' : 'Favorite'}
                                            </button>
                                            <button
                                                className="ai-panel__ghost ai-panel__history-rename"
                                                onClick={() => handleStartRename(entry.id, entry.label)}
                                            >
                                                Rename
                                            </button>
                                        </div>
                                    </div>
                                    {editingHistoryId === entry.id && (
                                        <div className="ai-panel__history-label-row">
                                            <input
                                                className="ai-panel__history-label-input"
                                                value={editingHistoryLabel}
                                                onChange={(event) => setEditingHistoryLabel(event.target.value)}
                                                placeholder="Add a custom label"
                                            />
                                            <button
                                                className="ai-panel__ghost ai-panel__history-save-label"
                                                onClick={() => handleSaveRename(entry.id)}
                                            >
                                                Save
                                            </button>
                                            <button
                                                className="ai-panel__ghost ai-panel__history-cancel-label"
                                                onClick={handleCancelRename}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                    <div className="ai-panel__history-preview">{entry.result}</div>
                                    <div className="ai-panel__history-actions">
                                        <button
                                            className="ai-panel__ghost ai-panel__history-load"
                                            onClick={() => handleLoadHistory(entry)}
                                        >
                                            Load
                                        </button>
                                        <button
                                            className="ai-panel__ghost ai-panel__history-delete"
                                            onClick={() => handleDeleteHistory(entry.id)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {visibleHistory.length === 0 && (
                                <div className="ai-panel__history-empty">
                                    No history matches the current search.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
