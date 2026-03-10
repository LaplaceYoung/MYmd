import { useEffect, useMemo, useRef, useState } from 'react'
import { useEditorStore } from '@/stores/editorStore'
import { WysiwygEditor } from './WysiwygEditor'
import { SourceEditor } from './SourceEditor'
import { SearchBar } from './SearchBar'
import { InsertDialog } from './InsertDialog'
import { WelcomeView } from './WelcomeView'
import {
    analyzeDocumentPerformance,
    LARGE_DOC_PREVIEW_DELAY_MS
} from '@/utils/performance'

// Custom Hooks
import { useEditorShortcuts } from './hooks/useEditorShortcuts'
import { useSplitPanes } from './hooks/useSplitPanes'
import { useSyncScroll } from './hooks/useSyncScroll'

interface EditorContainerProps {
    suppressWelcome?: boolean
}

/** 编辑器容器：根据当前标签和视图模式渲染编辑器 */
export function EditorContainer({ suppressWelcome = false }: EditorContainerProps) {
    const tabs = useEditorStore(s => s.tabs)
    const activeTabId = useEditorStore(s => s.activeTabId)
    const activeTab = tabs.find(t => t.id === activeTabId)
    const viewMode = useEditorStore(s => s.viewMode)
    const setViewMode = useEditorStore(s => s.setViewMode)
    const zoom = useEditorStore(s => s.zoom)
    const watermark = useEditorStore(s => s.watermark)
    const commandRef = useRef<((cmd: string, payload?: unknown) => void) | null>(null)
    const [previewContent, setPreviewContent] = useState(activeTab?.content ?? '')
    const [showModeGuide, setShowModeGuide] = useState(() => {
        if (typeof window === 'undefined') return false
        return window.localStorage.getItem('mymd:view-mode-guide:v1') !== 'dismissed'
    })

    const splitContainerRef = useRef<HTMLDivElement>(null)
    const perfInfo = useMemo(
        () => analyzeDocumentPerformance(activeTab?.content ?? ''),
        [activeTab?.content]
    )

    // Shortcuts and file operations
    const { handleNewFile, handleOpenFile, handleOpenRecentFile } = useEditorShortcuts()

    // Split View logic
    const { splitRatio, isDraggingRef, startDragging } = useSplitPanes(viewMode, splitContainerRef)

    // Sync scroll
    useSyncScroll(viewMode, activeTabId, splitContainerRef, isDraggingRef)

    useEffect(() => {
        if (!activeTab) {
            setPreviewContent('')
            return
        }

        if (!perfInfo.isLarge) {
            setPreviewContent(activeTab.content)
            return
        }

        const timer = window.setTimeout(() => {
            setPreviewContent(activeTab.content)
        }, LARGE_DOC_PREVIEW_DELAY_MS)

        return () => window.clearTimeout(timer)
    }, [activeTab, perfInfo.isLarge, activeTab?.content])

    useEffect(() => {
        if (viewMode === 'split' && showModeGuide) {
            window.localStorage.setItem('mymd:view-mode-guide:v1', 'dismissed')
            setShowModeGuide(false)
        }
    }, [showModeGuide, viewMode])

    const dismissModeGuide = () => {
        window.localStorage.setItem('mymd:view-mode-guide:v1', 'dismissed')
        setShowModeGuide(false)
    }

    // 无标签时显示欢迎页；但在启动参数解析阶段先抑制欢迎页，避免“先首页后打开文件”的闪跳
    if (!activeTab) {
        if (suppressWelcome) {
            return (
                <div className={`editor-container ${watermark ? 'has-watermark' : ''}`}>
                    <div
                        style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-muted)',
                            fontSize: 13
                        }}
                    >
                        Initializing workspace...
                    </div>
                </div>
            )
        }

        return (
            <WelcomeView
                handleNewFile={handleNewFile}
                handleOpenFile={handleOpenFile}
                handleOpenRecentFile={handleOpenRecentFile}
            />
        )
    }

    const zoomStyle = { zoom: zoom / 100 } as React.CSSProperties

    return (
        <div className={`editor-container ${watermark ? 'has-watermark' : ''}`}>
            <SearchBar />
            <InsertDialog />
            {showModeGuide && (
                <div className="editor-mode-guide" role="status" aria-live="polite">
                    <span className="editor-mode-guide__text">
                        Tip: Try split mode for source + preview review.
                    </span>
                    <div className="editor-mode-guide__actions">
                        <button
                            type="button"
                            className="editor-mode-guide__btn editor-mode-guide__btn--primary"
                            onClick={() => {
                                setViewMode('split')
                                dismissModeGuide()
                            }}
                        >
                            Try Split View
                        </button>
                        <button
                            type="button"
                            className="editor-mode-guide__btn"
                            onClick={dismissModeGuide}
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}
            {viewMode === 'wysiwyg' ? (
                <div className="editor-workspace">
                    <div className="editor-zoom-container" style={zoomStyle}>
                        <WysiwygEditor
                            key={activeTab.id}
                            tabId={activeTab.id}
                            content={activeTab.content}
                            onCommandRef={commandRef}
                        />
                    </div>
                </div>
            ) : (
                <div className="editor-split" ref={splitContainerRef}>
                    {perfInfo.isLarge && (
                        <div className="editor-performance-hint">
                            Large document mode enabled ({perfInfo.lineCount.toLocaleString()} lines): preview refreshes every {LARGE_DOC_PREVIEW_DELAY_MS}ms.
                        </div>
                    )}
                    <div
                        className="editor-split__source"
                        style={{
                            flex: splitRatio,
                            transition: isDraggingRef.current ? 'none' : undefined
                        }}
                    >
                        <SourceEditor
                            key={`source-${activeTab.id}`}
                            tabId={activeTab.id}
                            content={activeTab.content}
                        />
                    </div>
                    <div
                        className="editor-split__divider"
                        onMouseDown={startDragging}
                    />
                    <div
                        className="editor-split__preview editor-workspace"
                        style={{
                            flex: 100 - splitRatio,
                            transition: isDraggingRef.current ? 'none' : undefined
                        }}
                    >
                        <div className="editor-zoom-container" style={zoomStyle}>
                            <WysiwygEditor
                                key={`preview-${activeTab.id}`}
                                tabId={activeTab.id}
                                content={previewContent}
                                readOnly
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export { EditorContainer as default }
