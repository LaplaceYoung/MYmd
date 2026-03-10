import { BookOpen, AlignLeft, ZoomIn, ZoomOut, FileText, List, Link2, Network, Search, RefreshCw } from 'lucide-react'
import { useEditorStore } from '@/stores/editorStore'
import './StatusBar.css'

export function StatusBar() {
    const activeTab = useEditorStore(s => {
        const id = s.activeTabId
        return s.tabs.find(t => t.id === id)
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
    const activeWorkspace = useEditorStore(s => s.activeWorkspace)
    const knowledgeIndexStatus = useEditorStore(s => s.knowledgeIndexStatus)
    const knowledgeIndexProcessed = useEditorStore(s => s.knowledgeIndexProcessed)
    const knowledgeIndexTotal = useEditorStore(s => s.knowledgeIndexTotal)
    const knowledgeIndexError = useEditorStore(s => s.knowledgeIndexError)
    const rebuildKnowledgeIndex = useEditorStore(s => s.rebuildKnowledgeIndex)
    const openGlobalSearch = useEditorStore(s => s.openGlobalSearch)

    if (!activeTab) return <div className="statusbar statusbar--fluent" />

    const charCount = activeTab.content.length
    const nonWhitespace = activeTab.content.replace(/\s/g, '').length
    const wordCount = activeTab.content.trim().split(/\s+/).filter(Boolean).length
    const readingTime = Math.max(1, Math.ceil(charCount / 400))

    let indexLabel = 'No workspace'
    if (knowledgeIndexStatus === 'indexing') {
        indexLabel = 'Indexing ' + knowledgeIndexProcessed + '/' + (knowledgeIndexTotal || '?')
    } else if (knowledgeIndexStatus === 'error') {
        indexLabel = 'Index failed, click to retry'
    } else if (activeWorkspace) {
        indexLabel = 'Indexed ' + (knowledgeIndexTotal || knowledgeIndexProcessed || 0) + ' files'
    }

    const tocButtonClass = 'statusbar__icon-btn' + (tocVisible ? ' active' : '')
    const backlinksButtonClass = 'statusbar__icon-btn' + (backlinksVisible ? ' active' : '')
    const graphButtonClass = 'statusbar__text-btn' + (knowledgeGraphVisible ? ' active' : '')
    const wysiwygButtonClass = 'statusbar__icon-btn' + (viewMode === 'wysiwyg' ? ' active' : '')
    const splitButtonClass = 'statusbar__icon-btn' + (viewMode === 'split' ? ' active' : '')
    const indexButtonClass = 'statusbar__btn statusbar__btn--action' + (knowledgeIndexStatus === 'error' ? ' statusbar__btn--danger' : '')
    const statsTitle = 'Characters: ' + charCount + '\nNon-whitespace: ' + nonWhitespace + '\nWords: ' + wordCount + '\nReading time: ' + readingTime + ' min'

    return (
        <div className="statusbar statusbar--fluent">
            <div className="statusbar__left">
                <div className="statusbar__btn tooltip" title={statsTitle}>
                    {wordCount} words | ~{readingTime} min read
                </div>
                <div className="statusbar__btn">
                    <FileText size={12} strokeWidth={1.5} style={{ marginRight: 4 }} />
                    {activeTab.filePath ? 'Saved to disk' : 'Unsaved'}
                </div>
                <button className="statusbar__btn statusbar__btn--action" onClick={() => openGlobalSearch()} title="Ctrl+P">
                    <Search size={12} strokeWidth={1.5} style={{ marginRight: 4 }} />
                    Ctrl+P Search
                </button>
                {activeWorkspace && (
                    <button
                        className={indexButtonClass}
                        onClick={() => void rebuildKnowledgeIndex()}
                        title={knowledgeIndexError ?? 'Rebuild workspace knowledge index'}
                    >
                        <RefreshCw size={12} strokeWidth={1.5} style={{ marginRight: 4 }} />
                        {indexLabel}
                    </button>
                )}
            </div>

            <div className="statusbar__spacer" />

            <div className="statusbar__right">
                <button className={tocButtonClass} title="Table of contents" onClick={() => setTocVisible(!tocVisible)}>
                    <List size={14} />
                </button>
                <button
                    className={backlinksButtonClass}
                    title="Backlinks"
                    onClick={() => setBacklinksVisible(!backlinksVisible)}
                    disabled={!activeTab.filePath}
                >
                    <Link2 size={14} />
                </button>
                {activeWorkspace && (
                    <button className={graphButtonClass} title="Advanced knowledge graph" onClick={() => setKnowledgeGraphVisible(!knowledgeGraphVisible)}>
                        <Network size={14} />
                        Graph
                    </button>
                )}
                <div className="statusbar__divider" style={{ width: 1, height: 14, backgroundColor: 'var(--border)', margin: '0 4px' }} />
                <button className={wysiwygButtonClass} title="WYSIWYG mode" onClick={() => setViewMode('wysiwyg')}>
                    <BookOpen size={14} />
                </button>
                <button className={splitButtonClass} title="Split mode" onClick={() => setViewMode('split')}>
                    <AlignLeft size={14} />
                </button>

                <div className="statusbar__zoom-controls">
                    <span className="statusbar__zoom-label">{zoom}%</span>
                    <button className="statusbar__zoom-btn" title="Zoom out" onClick={() => setZoom(zoom - 10)}>
                        <ZoomOut size={14} />
                    </button>
                    <div className="statusbar__slider-container">
                        <input
                            type="range"
                            min="10"
                            max="500"
                            value={zoom}
                            onChange={e => setZoom(Number(e.target.value))}
                            className="statusbar__slider"
                            title="Zoom"
                        />
                    </div>
                    <button className="statusbar__zoom-btn" title="Zoom in" onClick={() => setZoom(zoom + 10)}>
                        <ZoomIn size={14} />
                    </button>
                </div>
            </div>
        </div>
    )
}