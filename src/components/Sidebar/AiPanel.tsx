import { useEffect, useMemo, useState } from 'react'
import { Bot, Sparkles, Wand2, Network, LoaderCircle, X, Copy, Check, RotateCcw } from 'lucide-react'
import { useEditorStore } from '@/stores/editorStore'
import { useI18n } from '@/i18n'
import { getKnowledgeGraph } from '@/knowledge/service'
import {
    getAiTaskPresets,
    requestAiSuggestion,
    verifyAiConnection,
    type AiOutputShape,
    type AiPromptPreset,
    type AiTaskMode,
    type RequestAiSuggestionResult,
} from '@/utils/ai'
import { applyAiDiffBlock, buildAiDiffPreview } from '@/utils/aiDiff'
import { buildScenarioAiDraft, getAiScenarioCards } from '@/utils/aiDrafts'
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

export function AiPanel() {
    const { t } = useI18n()
    const aiPanelVisible = useEditorStore(s => s.aiPanelVisible)
    const setAiPanelVisible = useEditorStore(s => s.setAiPanelVisible)
    const aiConfig = useEditorStore(s => s.aiConfig)
    const aiPanelDraft = useEditorStore(s => s.aiPanelDraft)
    const tabs = useEditorStore(s => s.tabs)
    const updateContent = useEditorStore(s => s.updateContent)
    const addTab = useEditorStore(s => s.addTab)
    const activeWorkspace = useEditorStore(s => s.activeWorkspace)
    const activeTab = useEditorStore(s => {
        const id = s.activeTabId
        return s.tabs.find(tab => tab.id === id) ?? null
    })
    const paperPreset = useEditorStore(s => s.paperPreset)
    const paperOrientation = useEditorStore(s => s.paperOrientation)
    const customPaperSize = useEditorStore(s => s.customPaperSize)
    const pageMarginMm = useEditorStore(s => s.pageMarginMm)
    const documentProfile = useEditorStore(s => s.documentProfile)
    const exportProfile = useEditorStore(s => s.exportProfile)

    const [taskMode, setTaskMode] = useState<AiTaskMode>('writing')
    const [instruction, setInstruction] = useState('')
    const [outputShape, setOutputShape] = useState<AiOutputShape>('full')
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
    const [resultTargetTabId, setResultTargetTabId] = useState<string | null>(null)

    const resultTargetTab = useMemo(() => {
        if (!resultTargetTabId) return activeTab
        return tabs.find(tab => tab.id === resultTargetTabId) ?? null
    }, [activeTab, resultTargetTabId, tabs])

    const taskOptions: Array<{
        id: AiTaskMode
        label: string
        description: string
        icon: typeof Wand2
    }> = useMemo(() => ([
        { id: 'writing', label: t('ai.taskWriting'), description: t('ai.taskWritingDesc'), icon: Sparkles },
        { id: 'polish', label: t('ai.taskPolish'), description: t('ai.taskPolishDesc'), icon: Wand2 },
        { id: 'modify', label: t('ai.taskModify'), description: t('ai.taskModifyDesc'), icon: RotateCcw },
        { id: 'layout', label: t('ai.taskLayout'), description: t('ai.taskLayoutDesc'), icon: Wand2 },
        { id: 'graph', label: t('ai.taskGraph'), description: t('ai.taskGraphDesc'), icon: Network },
    ]), [t])
    const placeholder = useMemo(() => {
        if (taskMode === 'writing') return t('ai.placeholderWriting')
        if (taskMode === 'polish') return t('ai.placeholderPolish')
        if (taskMode === 'modify') return t('ai.placeholderModify')
        if (taskMode === 'layout') return t('ai.placeholderLayout')
        if (taskMode === 'graph') return t('ai.placeholderGraph')
        return t('ai.placeholderWriting')
    }, [taskMode, t])
    const presets = useMemo(() => getAiTaskPresets(taskMode), [taskMode])
    const scenarioCards = useMemo(() => getAiScenarioCards(), [])
    const diffPreview = useMemo(() => {
        if (!resultTargetTab || !result.trim() || taskMode === 'graph') return null
        return buildAiDiffPreview(resultTargetTab.content, result)
    }, [result, resultTargetTab, taskMode])
    const visibleHistory = useMemo(
        () => filterAiHistoryEntries(sortAiHistoryEntries(history), historyQuery),
        [history, historyQuery]
    )
    const replaceDisabled = !result.trim() || !resultTargetTab || (diffPreview ? !diffPreview.hasChanges : false)

    useEffect(() => {
        setActivePresetId(null)
    }, [taskMode])

    useEffect(() => {
        setOriginalSnapshot(null)
    }, [activeTab?.id, aiPanelDraft.version])

    useEffect(() => {
        if (!aiPanelVisible) return
        setTaskMode(aiPanelDraft.taskMode === 'content' ? 'writing' : aiPanelDraft.taskMode)
        setInstruction(aiPanelDraft.instruction)
        setOutputShape('full')
        setIncludeGraphContext(aiPanelDraft.includeGraphContext)
        setActivePresetId(null)
        setResultTargetTabId(activeTab?.id ?? null)
    }, [
        activeTab?.id,
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

    const translateRuntimeStatus = (message: string) => {
        if (message === 'Sending request...') {
            return t('ai.statusSending')
        }
        if (message === 'Streaming complete.') {
            return t('ai.statusStreamingComplete')
        }
        if (message === 'Generation complete.') {
            return t('ai.statusGenerationComplete')
        }
        if (message === 'Streaming yielded empty content. Retrying without stream...') {
            return t('ai.statusFallbackEmpty')
        }
        if (message.startsWith('Retrying request (')) {
            const matched = message.match(/\((\d+)\/(\d+)\)/)
            if (matched) {
                return t('ai.statusRetrying', { attempt: matched[1], total: matched[2] })
            }
        }
        if (message.endsWith('. Retrying...')) {
            return t('ai.statusRetryingSimple', {
                message: message.slice(0, -'. Retrying...'.length),
            })
        }
        if (message.endsWith('. Falling back to non-stream mode...')) {
            return t('ai.statusFallbackNoStream', {
                message: message.slice(0, -'. Falling back to non-stream mode...'.length),
            })
        }
        return message
    }

    const getPresetLabel = (preset: AiPromptPreset) => t(`ai.preset.${preset.id}`)
    const getPresetInstruction = (preset: AiPromptPreset) => t(`ai.presetInstruction.${preset.id}`)
    const getHistoryModeLabel = (mode: AiHistoryEntry['taskMode']) => t(`ai.taskMode.${mode}`)
    const getHistorySourceLabel = (source: AiHistoryEntry['source']) => t(`ai.source.${source}`)

    const applyPreset = (preset: AiPromptPreset) => {
        setInstruction(getPresetInstruction(preset))
        setActivePresetId(preset.id)
    }

    const handleRun = async () => {
        if (!activeTab) {
            setError(t('ai.noActiveDocument'))
            return
        }
        if (!aiConfig.endpoint.trim() || !aiConfig.model.trim() || !aiConfig.apiKey.trim()) {
            setError(t('ai.configureFirst'))
            return
        }

        setIsRunning(true)
        setError('')
        setCopied(false)
        setResult('')
        setStatusText(t('ai.statusPreparing'))
        setRequestMeta(null)
        setOriginalSnapshot(null)
        setResultTargetTabId(activeTab.id)

        try {
            if (!aiConfig.endpoint.trim() || !aiConfig.model.trim() || !aiConfig.apiKey.trim()) {
                throw new Error(t('ai.configureFirst'))
            }

            if (aiConfig.model.includes('DeepSeek-R1-Distill-Qwen-7B')) {
                setStatusText(t('ai.statusTestingProvider'))
                await verifyAiConnection({
                    config: aiConfig,
                    timeoutMs: 20_000,
                })
            }

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
                outputShape,
                instruction,
                title: activeTab.title,
                content: activeTab.content,
                graphContext,
                timeoutMs: 45_000,
                maxRetries: 1,
                preferStreaming: true,
                onStatus: (message) => setStatusText(translateRuntimeStatus(message)),
                onChunk: (_chunk, accumulated) => setResult(accumulated),
            })

            setResult(nextResult.text)
            setHistory((current) => pushAiHistoryEntry(current, {
                taskMode,
                instruction,
                result: nextResult.text,
                source: 'generated',
                documentTitle: activeTab.title || t('ai.untitledDocument'),
            }))
            setRequestMeta(nextResult)
            setStatusText(
                nextResult.attempts > 1
                    ? t('ai.statusCompletedAttempts', { count: nextResult.attempts })
                    : nextResult.streamed
                        ? t('ai.statusStreamingComplete')
                        : t('ai.statusGenerationComplete')
            )
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : t('settings.connectionFailed'))
        } finally {
            setIsRunning(false)
        }
    }

    const resolveApplyTab = () => {
        if (resultTargetTab) return resultTargetTab
        if (activeTab) return activeTab
        setError(t('ai.targetMissing'))
        return null
    }

    const handleApplyReplace = () => {
        if (!result.trim()) return
        const applyTab = resolveApplyTab()
        if (!applyTab) return
        setOriginalSnapshot((current) => current ?? applyTab.content)
        updateContent(applyTab.id, result)
    }

    const handleApplyAppend = () => {
        if (!result.trim()) return
        const applyTab = resolveApplyTab()
        if (!applyTab) return
        setOriginalSnapshot((current) => current ?? applyTab.content)
        updateContent(applyTab.id, `${applyTab.content.trim()}\n\n---\n\n${result.trim()}\n`)
    }

    const handleApplyBlock = (blockIndex: number) => {
        if (!result.trim()) return
        const applyTab = resolveApplyTab()
        if (!applyTab) return
        const nextContent = applyAiDiffBlock(applyTab.content, result, blockIndex)
        if (nextContent === applyTab.content) return
        setOriginalSnapshot((current) => current ?? applyTab.content)
        updateContent(applyTab.id, nextContent)
    }

    const handleRestoreOriginal = () => {
        if (!resultTargetTab || originalSnapshot === null) return
        updateContent(resultTargetTab.id, originalSnapshot)
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
            documentTitle: activeTab?.title ?? t('ai.untitledDocument'),
        }))
    }

    const handleApplyScenario = (scenarioId: ReturnType<typeof getAiScenarioCards>[number]['id']) => {
        const draft = buildScenarioAiDraft(scenarioId, {
            title: activeTab?.title ?? t('ai.untitledDocument'),
            paperPreset,
            paperOrientation,
            customPaperSize,
            pageMarginMm,
            documentProfile,
            exportProfile,
            hasWorkspace: Boolean(activeWorkspace),
        })
        setTaskMode(draft.taskMode === 'content' ? 'writing' : draft.taskMode)
        setInstruction(draft.instruction)
        setIncludeGraphContext(draft.includeGraphContext)
        setActivePresetId(null)
    }

    const handleOpenInNewTab = () => {
        if (!result.trim()) return
        const nextTabId = addTab(null, result)
        useEditorStore.setState((state) => ({
            tabs: state.tabs.map((tab) => (
                tab.id === nextTabId
                    ? {
                        ...tab,
                        title: t('ai.draftTabTitle'),
                        isDirty: true,
                    }
                    : tab
            )),
            activeTabId: nextTabId,
        }))
        setOriginalSnapshot(null)
        setResultTargetTabId(nextTabId)
    }

    const handleLoadHistory = (entry: AiHistoryEntry) => {
        setTaskMode(entry.taskMode === 'content' ? 'writing' : entry.taskMode)
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

    const restoreDisabled = !resultTargetTab || originalSnapshot === null || resultTargetTab.content === originalSnapshot
    const getScenarioLabel = (id: string) => {
        if (id === 'resume-project') return t('ai.scenarioResumeProject')
        if (id === 'weekly-brief') return t('ai.scenarioWeeklyBrief')
        if (id === 'readme-refresh') return t('ai.scenarioReadmeRefresh')
        if (id === 'publish-article') return t('ai.scenarioPublishArticle')
        return t('ai.scenarioKnowledgeCards')
    }
    const getScenarioDesc = (id: string) => {
        if (id === 'resume-project') return t('ai.scenarioResumeProjectDesc')
        if (id === 'weekly-brief') return t('ai.scenarioWeeklyBriefDesc')
        if (id === 'readme-refresh') return t('ai.scenarioReadmeRefreshDesc')
        if (id === 'publish-article') return t('ai.scenarioPublishArticleDesc')
        return t('ai.scenarioKnowledgeCardsDesc')
    }

    return (
        <div className="ai-panel">
            <div className="ai-panel__header">
                <div className="ai-panel__title">
                    <Bot size={16} />
                    <span>{t('ai.title')}</span>
                </div>
                <button className="ai-panel__close" onClick={() => setAiPanelVisible(false)}>
                    <X size={16} />
                </button>
            </div>

            <div className="ai-panel__content">
                <div className="ai-panel__intro">
                    {t('ai.intro')}
                </div>

                <div className="ai-panel__field">
                    <label className="ai-panel__label">{t('ai.quickScenarios')}</label>
                    <div className="ai-panel__scenario-grid">
                        {scenarioCards.map((card) => (
                            <button
                                key={card.id}
                                className="ai-panel__scenario-card"
                                onClick={() => handleApplyScenario(card.id)}
                            >
                                <div className="ai-panel__scenario-label">{getScenarioLabel(card.id)}</div>
                                <div className="ai-panel__scenario-desc">{getScenarioDesc(card.id)}</div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="ai-panel__task-grid">
                    {taskOptions.map(option => {
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
                    <label className="ai-panel__label">{t('ai.instruction')}</label>
                    <div className="ai-panel__preset-row">
                        {presets.map(preset => (
                            <button
                                key={preset.id}
                                className={`ai-panel__preset ${activePresetId === preset.id ? 'active' : ''}`}
                                onClick={() => applyPreset(preset)}
                            >
                                {getPresetLabel(preset)}
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

                <div className="ai-panel__field">
                    <label className="ai-panel__label">{t('ai.outputShape')}</label>
                    <div className="ai-panel__preset-row">
                        <button
                            className={`ai-panel__preset ${outputShape === 'full' ? 'active' : ''}`}
                            onClick={() => setOutputShape('full')}
                        >
                            {t('ai.outputFull')}
                        </button>
                        <button
                            className={`ai-panel__preset ${outputShape === 'outline' ? 'active' : ''}`}
                            onClick={() => setOutputShape('outline')}
                        >
                            {t('ai.outputOutline')}
                        </button>
                    </div>
                </div>

                <label className="ai-panel__checkbox">
                    <input
                        type="checkbox"
                        checked={includeGraphContext}
                        onChange={e => setIncludeGraphContext(e.target.checked)}
                    />
                    <span>{t('ai.includeGraph')}</span>
                </label>

                <div className="ai-panel__hint">
                    {t('ai.hint')}
                </div>

                <button className="ai-panel__run" onClick={() => void handleRun()} disabled={isRunning || !activeTab}>
                    {isRunning ? <LoaderCircle size={15} className="ai-panel__spin" /> : <Bot size={15} />}
                    <span>{isRunning ? (statusText || t('ai.generating')) : t('ai.generate')}</span>
                </button>

                {error && <div className="ai-panel__error">{error}</div>}
                {(statusText || requestMeta) && (
                    <div className="ai-panel__status-row">
                        {statusText && <span className="ai-panel__status-pill">{statusText}</span>}
                        {requestMeta && (
                            <span className="ai-panel__meta-pill">
                                {requestMeta.streamed ? t('ai.statusStreamed') : t('ai.statusSingleResponse')}
                            </span>
                        )}
                        {requestMeta && requestMeta.attempts > 1 && (
                            <span className="ai-panel__meta-pill">{t('ai.metaAttempts', { count: requestMeta.attempts })}</span>
                        )}
                    </div>
                )}

                <div className="ai-panel__result-header">
                    <span>{t('ai.result')}</span>
                    <div className="ai-panel__result-actions">
                        <button className="ai-panel__ghost" onClick={() => void handleCopy()} disabled={!result.trim()}>
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            <span>{copied ? t('ai.copied') : t('ai.copy')}</span>
                        </button>
                        <button className="ai-panel__ghost" onClick={() => void handleRun()} disabled={isRunning || !activeTab}>
                            <RotateCcw size={14} />
                            <span>{t('ai.retry')}</span>
                        </button>
                        <button className="ai-panel__ghost" onClick={handleApplyAppend} disabled={!result.trim() || !resultTargetTab}>
                            {t('ai.append')}
                        </button>
                        <button
                            className="ai-panel__ghost ai-panel__ghost--new-tab"
                            onClick={handleOpenInNewTab}
                            disabled={!result.trim()}
                        >
                            {t('ai.newDraft')}
                        </button>
                        <button
                            className="ai-panel__ghost ai-panel__ghost--snapshot"
                            onClick={handleSaveSnapshot}
                            disabled={!result.trim()}
                        >
                            {t('ai.saveSnapshot')}
                        </button>
                        <button
                            className="ai-panel__ghost ai-panel__ghost--restore"
                            onClick={handleRestoreOriginal}
                            disabled={restoreDisabled}
                        >
                            {t('ai.restore')}
                        </button>
                        <button className="ai-panel__primary" onClick={handleApplyReplace} disabled={replaceDisabled}>
                            {t('ai.replace')}
                        </button>
                    </div>
                </div>

                {diffPreview && (
                    <div className="ai-panel__diff-card">
                        <div className="ai-panel__diff-header">
                            <span className="ai-panel__diff-title">{t('ai.changePreview')}</span>
                            <div className="ai-panel__diff-pills">
                                <span className="ai-panel__diff-pill">{t('ai.diffChanged', { count: diffPreview.changedLines })}</span>
                                <span className="ai-panel__diff-pill">{t('ai.diffAdded', { count: diffPreview.addedLines })}</span>
                                <span className="ai-panel__diff-pill">{t('ai.diffRemoved', { count: diffPreview.removedLines })}</span>
                            </div>
                        </div>
                        {!diffPreview.hasChanges && (
                            <div className="ai-panel__diff-empty">{t('ai.noChanges')}</div>
                        )}
                        {diffPreview.previewBlocks.length > 0 && (
                            <div className="ai-panel__diff-blocks">
                                {diffPreview.previewBlocks.map((block, index) => (
                                    <div
                                        key={`${block.beforeStartLine}-${block.afterStartLine}-${index}`}
                                        className="ai-panel__diff-block"
                                    >
                                        <div className="ai-panel__diff-range">
                                            {t('ai.diffRange', { before: block.beforeStartLine, after: block.afterStartLine })}
                                        </div>
                                        <div className="ai-panel__diff-actions">
                                            <button
                                                className="ai-panel__ghost ai-panel__diff-apply"
                                                onClick={() => handleApplyBlock(index)}
                                                disabled={!resultTargetTab}
                                            >
                                                {t('ai.applyBlock')}
                                            </button>
                                        </div>
                                        {block.removed.map((line, lineIndex) => (
                                            <div
                                                key={`removed-${lineIndex}`}
                                                className="ai-panel__diff-line ai-panel__diff-line--removed"
                                            >
                                                - {line || t('ai.blankLine')}
                                            </div>
                                        ))}
                                        {block.added.map((line, lineIndex) => (
                                            <div
                                                key={`added-${lineIndex}`}
                                                className="ai-panel__diff-line ai-panel__diff-line--added"
                                            >
                                                + {line || t('ai.blankLine')}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                                {diffPreview.truncated && (
                                    <div className="ai-panel__diff-more">
                                        {t('ai.diffMore', { count: diffPreview.previewBlocks.length })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {taskMode === 'graph' && result.trim() && (
                    <div className="ai-panel__diff-note">
                        {t('ai.graphNote')}
                    </div>
                )}

                <textarea
                    className="ai-panel__result"
                    value={result}
                    onChange={e => setResult(e.target.value)}
                    placeholder={t('ai.resultPlaceholder')}
                />

                {history.length > 0 && (
                    <div className="ai-panel__history">
                        <div className="ai-panel__history-header">
                            <div className="ai-panel__history-header-copy">
                                <span className="ai-panel__history-title">{t('ai.history')}</span>
                                <span className="ai-panel__history-count">
                                    {visibleHistory.length === history.length
                                        ? t('ai.historyItems', { count: history.length })
                                        : t('ai.historyItemsFiltered', { shown: visibleHistory.length, total: history.length })}
                                </span>
                            </div>
                            <div className="ai-panel__history-header-actions">
                                <input
                                    className="ai-panel__history-search"
                                    value={historyQuery}
                                    onChange={(event) => setHistoryQuery(event.target.value)}
                                    placeholder={t('ai.historySearch')}
                                />
                                <button
                                    className="ai-panel__ghost ai-panel__history-clear"
                                    onClick={handleClearHistory}
                                >
                                    {t('ai.clear')}
                                </button>
                            </div>
                        </div>
                        <div className="ai-panel__history-list">
                            {visibleHistory.map((entry) => (
                                <div key={entry.id} className="ai-panel__history-item">
                                    <div className="ai-panel__history-meta">
                                        <span className="ai-panel__history-badge">{getHistoryModeLabel(entry.taskMode)}</span>
                                        <span className="ai-panel__history-badge">{getHistorySourceLabel(entry.source)}</span>
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
                                                {entry.favorite ? t('ai.unfavorite') : t('ai.favorite')}
                                            </button>
                                            <button
                                                className="ai-panel__ghost ai-panel__history-rename"
                                                onClick={() => handleStartRename(entry.id, entry.label)}
                                            >
                                                {t('ai.rename')}
                                            </button>
                                        </div>
                                    </div>
                                    {editingHistoryId === entry.id && (
                                        <div className="ai-panel__history-label-row">
                                            <input
                                                className="ai-panel__history-label-input"
                                                value={editingHistoryLabel}
                                                onChange={(event) => setEditingHistoryLabel(event.target.value)}
                                                placeholder={t('ai.addLabel')}
                                            />
                                            <button
                                                className="ai-panel__ghost ai-panel__history-save-label"
                                                onClick={() => handleSaveRename(entry.id)}
                                            >
                                                {t('common.save')}
                                            </button>
                                            <button
                                                className="ai-panel__ghost ai-panel__history-cancel-label"
                                                onClick={handleCancelRename}
                                            >
                                                {t('common.cancel')}
                                            </button>
                                        </div>
                                    )}
                                    <div className="ai-panel__history-preview">{entry.result}</div>
                                    <div className="ai-panel__history-actions">
                                        <button
                                            className="ai-panel__ghost ai-panel__history-load"
                                            onClick={() => handleLoadHistory(entry)}
                                        >
                                            {t('ai.load')}
                                        </button>
                                        <button
                                            className="ai-panel__ghost ai-panel__history-delete"
                                            onClick={() => handleDeleteHistory(entry.id)}
                                        >
                                            {t('ai.delete')}
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {visibleHistory.length === 0 && (
                                <div className="ai-panel__history-empty">
                                    {t('ai.noHistoryMatches')}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
