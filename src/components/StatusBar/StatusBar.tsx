import { BookOpen, AlignLeft, Globe, ZoomIn, ZoomOut, FileText } from 'lucide-react'
import { useEditorStore } from '@/stores/editorStore'
import './StatusBar.css'

/** 底部状态栏：显示文件路径、字数等信息 */
export function StatusBar() {
    const activeTab = useEditorStore(s => {
        const id = s.activeTabId
        return s.tabs.find(t => t.id === id)
    })

    const zoom = useEditorStore(s => s.zoom)
    const setZoom = useEditorStore(s => s.setZoom)
    const viewMode = useEditorStore(s => s.viewMode)
    const setViewMode = useEditorStore(s => s.setViewMode)

    if (!activeTab) return <div className="statusbar statusbar--fluent" />

    // 简单统计
    const charCount = activeTab.content.length
    const wordCount = activeTab.content.trim().split(/\s+/).filter(Boolean).length

    return (
        <div className="statusbar statusbar--fluent">
            {/* 左侧信息区 */}
            <div className="statusbar__left">
                <div className="statusbar__btn tooltip" title={`字符数: ${charCount}\n非空白字符: ${activeTab.content.replace(/\s/g, '').length}`}>
                    {wordCount} 个字
                </div>
                <div className="statusbar__btn">
                    <FileText size={12} strokeWidth={1.5} style={{ marginRight: 4 }} />
                    {activeTab.filePath ? '已保存至此电脑' : '尚未保存'}
                </div>
                <div className="statusbar__btn">
                    中文(中国)
                </div>
            </div>

            <div className="statusbar__spacer" />

            {/* 右侧控制区 (视图与缩放) */}
            <div className="statusbar__right">
                <button
                    className={`statusbar__icon-btn ${viewMode === 'wysiwyg' ? 'active' : ''}`}
                    title="所见即所得模式"
                    onClick={() => setViewMode('wysiwyg')}
                >
                    <BookOpen size={14} />
                </button>
                <button
                    className={`statusbar__icon-btn ${viewMode === 'split' ? 'active' : ''}`}
                    title="分屏模式"
                    onClick={() => setViewMode('split')}
                >
                    <AlignLeft size={14} />
                </button>

                <div className="statusbar__zoom-controls">
                    <span className="statusbar__zoom-label">{zoom}%</span>
                    <button
                        className="statusbar__zoom-btn"
                        title="缩小"
                        onClick={() => setZoom(zoom - 10)}
                    >
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
                            title="缩放比例"
                        />
                    </div>
                    <button
                        className="statusbar__zoom-btn"
                        title="放大"
                        onClick={() => setZoom(zoom + 10)}
                    >
                        <ZoomIn size={14} />
                    </button>
                </div>
            </div>
        </div>
    )
}
