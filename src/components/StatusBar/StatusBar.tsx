import { BookOpen, AlignLeft, ZoomIn, ZoomOut, FileText, List, Link2 } from 'lucide-react'
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

    if (!activeTab) return <div className="statusbar statusbar--fluent" />

    const charCount = activeTab.content.length
    const wordCount = activeTab.content.trim().split(/\s+/).filter(Boolean).length
    const readingTime = Math.max(1, Math.ceil(charCount / 400))

    return (
        <div className="statusbar statusbar--fluent">
            <div className="statusbar__left">
                <div className="statusbar__btn tooltip" title={`Characters: ${charCount}\nNon-whitespace: ${activeTab.content.replace(/\s/g, '').length}\nWords: ${wordCount}\nReading time: ${readingTime} min`}>
                    {wordCount} words | ~{readingTime} min read
                </div>
                <div className="statusbar__btn">
                    <FileText size={12} strokeWidth={1.5} style={{ marginRight: 4 }} />
                    {activeTab.filePath ? 'Saved to disk' : 'Unsaved'}
                </div>
                <div className="statusbar__btn">UTF-8</div>
            </div>

            <div className="statusbar__spacer" />

            <div className="statusbar__right">
                <button
                    className={`statusbar__icon-btn ${tocVisible ? 'active' : ''}`}
                    title="Table of contents"
                    onClick={() => setTocVisible(!tocVisible)}
                >
                    <List size={14} />
                </button>
                <button
                    className={`statusbar__icon-btn ${backlinksVisible ? 'active' : ''}`}
                    title="Backlinks"
                    onClick={() => setBacklinksVisible(!backlinksVisible)}
                >
                    <Link2 size={14} />
                </button>
                <div className="statusbar__divider" style={{ width: 1, height: 14, backgroundColor: 'var(--border)', margin: '0 4px' }} />
                <button
                    className={`statusbar__icon-btn ${viewMode === 'wysiwyg' ? 'active' : ''}`}
                    title="WYSIWYG mode"
                    onClick={() => setViewMode('wysiwyg')}
                >
                    <BookOpen size={14} />
                </button>
                <button
                    className={`statusbar__icon-btn ${viewMode === 'split' ? 'active' : ''}`}
                    title="Split mode"
                    onClick={() => setViewMode('split')}
                >
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
                            onChange={(e) => setZoom(Number(e.target.value))}
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
