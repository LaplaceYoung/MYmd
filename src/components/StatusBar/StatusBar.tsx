import { BookOpen, AlignLeft, ZoomIn, ZoomOut, FileText, List, Link2, Network, Search, RefreshCw, Bot, FileSpreadsheet } from 'lucide-react'
import { useEditorStore } from '@/stores/editorStore'
import { useI18n } from '@/i18n'
import {
    getPaperPresetMeta,
} from '@/utils/paper'
import './StatusBar.css'

export function StatusBar() {
    const { t } = useI18n()
    const activeTab = useEditorStore(s => {
        const id = s.activeTabId
        return s.tabs.find(tab => tab.id === id)
    })

    const zoom = useEditorStore(s => s.zoom)
    const setZoom = useEditorStore(s => s.setZoom)
    const viewMode = useEditorStore(s => s.viewMode)
    const setViewMode = useEditorStore(s => s.setViewMode)
    const tocVisible = useEditorStore(s => s.tocVisible)
    const setTocVisible = useEditorStore(s => s.setTocVisible)
    const backlinksVisible = useEditorStore(s => s.backlinksVisible)
    const setBacklinksVisible = useEditorStore(s => s.setBacklinksVisible)
    const knowledgeGraphVisible = useEditorStore(s => s.knowledgeGraphVisible)
    const setKnowledgeGraphVisible = useEditorStore(s => s.setKnowledgeGraphVisible)
    const aiPanelVisible = useEditorStore(s => s.aiPanelVisible)
    const setAiPanelVisible = useEditorStore(s => s.setAiPanelVisible)
    const activeWorkspace = useEditorStore(s => s.activeWorkspace)
    const paperPreset = useEditorStore(s => s.paperPreset)
    const paperOrientation = useEditorStore(s => s.paperOrientation)
    const customPaperSize = useEditorStore(s => s.customPaperSize)
    const pageMarginMm = useEditorStore(s => s.pageMarginMm)
    const documentProfile = useEditorStore(s => s.documentProfile)
    const exportProfile = useEditorStore(s => s.exportProfile)
    const knowledgeIndexStatus = useEditorStore(s => s.knowledgeIndexStatus)
    const knowledgeIndexProcessed = useEditorStore(s => s.knowledgeIndexProcessed)
    const knowledgeIndexTotal = useEditorStore(s => s.knowledgeIndexTotal)
    const knowledgeIndexError = useEditorStore(s => s.knowledgeIndexError)
    const rebuildKnowledgeIndex = useEditorStore(s => s.rebuildKnowledgeIndex)
    const openGlobalSearch = useEditorStore(s => s.openGlobalSearch)

    if (!activeTab) return <div className="statusbar statusbar--fluent" />

    const getLocalizedPaperLabel = () => {
        if (paperPreset === 'screen') return t('settings.paperScreen')
        if (paperPreset === 'custom') return t('settings.paperCustom')
        return paperPreset.toUpperCase()
    }

    const getLocalizedOrientationLabel = () => (
        paperOrientation === 'landscape'
            ? t('settings.orientationLandscape')
            : t('settings.orientationPortrait')
    )

    const getLocalizedProfileLabel = () => {
        if (documentProfile === 'resume') return t('settings.profileResume')
        if (documentProfile === 'manuscript') return t('settings.profileManuscript')
        return t('settings.profileStandard')
    }

    const getLocalizedExportLabel = () => {
        if (exportProfile === 'share') return t('settings.exportShare')
        if (exportProfile === 'web') return t('settings.exportWeb')
        return t('settings.exportPrint')
    }

    const charCount = activeTab.content.length
    const nonWhitespace = activeTab.content.replace(/\s/g, '').length
    const wordCount = activeTab.content.trim().split(/\s+/).filter(Boolean).length
    const readingTime = Math.max(1, Math.ceil(charCount / 400))

    let indexLabel = t('status.noWorkspace')
    if (knowledgeIndexStatus === 'indexing') {
        indexLabel = t('status.indexing', { processed: knowledgeIndexProcessed, total: knowledgeIndexTotal || '?' })
    } else if (knowledgeIndexStatus === 'error') {
        indexLabel = t('status.indexFailed')
    } else if (activeWorkspace) {
        indexLabel = t('status.indexed', { count: knowledgeIndexTotal || knowledgeIndexProcessed || 0 })
    }

    const tocButtonClass = 'statusbar__icon-btn' + (tocVisible ? ' active' : '')
    const backlinksButtonClass = 'statusbar__icon-btn' + (backlinksVisible ? ' active' : '')
    const graphButtonClass = 'statusbar__text-btn' + (knowledgeGraphVisible ? ' active' : '')
    const aiButtonClass = 'statusbar__text-btn' + (aiPanelVisible ? ' active' : '')
    const wysiwygButtonClass = 'statusbar__icon-btn' + (viewMode === 'wysiwyg' ? ' active' : '')
    const splitButtonClass = 'statusbar__icon-btn' + (viewMode === 'split' ? ' active' : '')
    const indexButtonClass = 'statusbar__btn statusbar__btn--action' + (knowledgeIndexStatus === 'error' ? ' statusbar__btn--danger' : '')
    const statsTitle = [
        t('status.characters', { count: charCount }),
        t('status.nonWhitespace', { count: nonWhitespace }),
        t('status.wordCount', { count: wordCount }),
        t('status.readingTime', { count: readingTime }),
    ].join('\n')

    const paperMeta = getPaperPresetMeta(paperPreset, customPaperSize, paperOrientation, pageMarginMm)
    const orientationLabel = getLocalizedOrientationLabel()
    const paperStatusLabel = paperPreset === 'custom'
        ? `${getLocalizedPaperLabel()} ${paperMeta.detail}`
        : getLocalizedPaperLabel()
    const paperLabel = paperMeta.id === 'screen'
        ? t('status.paperScreen', { label: paperStatusLabel, margin: pageMarginMm })
        : t('status.paperPreset', { label: paperStatusLabel, orientation: orientationLabel, margin: pageMarginMm })
    const profileLabel = getLocalizedProfileLabel()
    const exportLabel = getLocalizedExportLabel()

    return (
        <div className="statusbar statusbar--fluent">
            <div className="statusbar__left">
                <div className="statusbar__btn tooltip" title={statsTitle}>
                    {t('status.wordsRead', { words: wordCount, minutes: readingTime })}
                </div>
                <div className="statusbar__btn">
                    <FileText size={12} strokeWidth={1.5} style={{ marginRight: 4 }} />
                    {activeTab.filePath ? t('status.saved') : t('status.unsaved')}
                </div>
                <button className="statusbar__btn statusbar__btn--action" onClick={() => openGlobalSearch()} title="Ctrl+P">
                    <Search size={12} strokeWidth={1.5} style={{ marginRight: 4 }} />
                    {t('status.search')}
                </button>
                <div className="statusbar__btn" title={t('status.currentPaperPreset')}>
                    <FileSpreadsheet size={12} strokeWidth={1.5} style={{ marginRight: 4 }} />
                    {paperLabel}
                </div>
                <div className="statusbar__btn" title={t('status.currentLayoutProfile')}>
                    {profileLabel}
                </div>
                <div className="statusbar__btn" title={t('status.currentExportProfile')}>
                    {exportLabel}
                </div>
                {activeWorkspace && (
                    <button
                        className={indexButtonClass}
                        onClick={() => void rebuildKnowledgeIndex()}
                        title={knowledgeIndexError ?? t('status.rebuildIndex')}
                    >
                        <RefreshCw size={12} strokeWidth={1.5} style={{ marginRight: 4 }} />
                        {indexLabel}
                    </button>
                )}
            </div>

            <div className="statusbar__spacer" />

            <div className="statusbar__right">
                <button className={tocButtonClass} title={t('status.toc')} onClick={() => setTocVisible(!tocVisible)}>
                    <List size={14} />
                </button>
                <button
                    className={backlinksButtonClass}
                    title={t('status.backlinks')}
                    onClick={() => setBacklinksVisible(!backlinksVisible)}
                    disabled={!activeTab.filePath}
                >
                    <Link2 size={14} />
                </button>
                {activeWorkspace && (
                    <button className={graphButtonClass} title={t('status.graph')} onClick={() => setKnowledgeGraphVisible(!knowledgeGraphVisible)}>
                        <Network size={14} />
                        {t('status.graphLabel')}
                    </button>
                )}
                <button className={aiButtonClass} title={t('status.ai')} onClick={() => setAiPanelVisible(!aiPanelVisible)}>
                    <Bot size={14} />
                    {t('status.aiLabel')}
                </button>
                <div className="statusbar__divider" style={{ width: 1, height: 14, backgroundColor: 'var(--border)', margin: '0 4px' }} />
                <button className={wysiwygButtonClass} title={t('status.wysiwyg')} onClick={() => setViewMode('wysiwyg')}>
                    <BookOpen size={14} />
                </button>
                <button className={splitButtonClass} title={t('status.split')} onClick={() => setViewMode('split')}>
                    <AlignLeft size={14} />
                </button>

                <div className="statusbar__zoom-controls">
                    <span className="statusbar__zoom-label">{zoom}%</span>
                    <button className="statusbar__zoom-btn" title={t('status.zoomOut')} onClick={() => setZoom(zoom - 10)}>
                        <ZoomOut size={14} />
                    </button>
                    <div className="statusbar__slider-container">
                        <input
                            type="range"
                            min="10"
                            max="500"
                            value={zoom}
                            onChange={event => setZoom(Number(event.target.value))}
                            className="statusbar__slider"
                            title={t('status.zoom')}
                        />
                    </div>
                    <button className="statusbar__zoom-btn" title={t('status.zoomIn')} onClick={() => setZoom(zoom + 10)}>
                        <ZoomIn size={14} />
                    </button>
                </div>
            </div>
        </div>
    )
}
