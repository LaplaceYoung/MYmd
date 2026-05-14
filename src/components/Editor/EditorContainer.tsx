import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useEditorStore } from '@/stores/editorStore'
import { SearchBar } from './SearchBar'
import { InsertDialog } from './InsertDialog'
import { WelcomeView } from './WelcomeView'
import { getDocumentProfileCssVariables, getPaperCssVariables, shouldShowPageGuides } from '@/utils/paper'
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

const WysiwygEditor = lazy(() => import('./WysiwygEditor').then(module => ({ default: module.WysiwygEditor })))
const SourceEditor = lazy(() => import('./SourceEditor').then(module => ({ default: module.SourceEditor })))

function EditorSurfaceLoading() {
    return <div className="editor-surface-loading">Loading editor...</div>
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
    const paperPreset = useEditorStore(s => s.paperPreset)
    const paperOrientation = useEditorStore(s => s.paperOrientation)
    const customPaperSize = useEditorStore(s => s.customPaperSize)
    const pageMarginMm = useEditorStore(s => s.pageMarginMm)
    const autoExpandPaperForWideTables = useEditorStore(s => s.autoExpandPaperForWideTables)
    const maxAutoPaperWidthPx = useEditorStore(s => s.maxAutoPaperWidthPx)
    const documentProfile = useEditorStore(s => s.documentProfile)
    const exportProfile = useEditorStore(s => s.exportProfile)
    const commandRef = useRef<((cmd: string, payload?: unknown) => void) | null>(null)
    const workspaceRootRef = useRef<HTMLDivElement>(null)
    const [previewContent, setPreviewContent] = useState(activeTab?.content ?? '')
    const [showModeGuide, setShowModeGuide] = useState(() => {
        if (typeof window === 'undefined') return false
        return window.localStorage.getItem('mymd:view-mode-guide:v1') !== 'dismissed'
    })
    const [wideTableWidthPx, setWideTableWidthPx] = useState<number | null>(null)
    const lastWideTableWidthRef = useRef<number | null>(null)

    const splitContainerRef = useRef<HTMLDivElement>(null)
    const perfInfo = useMemo(
        () => analyzeDocumentPerformance(activeTab?.content ?? ''),
        [activeTab?.content]
    )
    const basePaperStyle = useMemo(
        () => ({
            ...getPaperCssVariables(paperPreset, customPaperSize, paperOrientation, pageMarginMm),
            ...getDocumentProfileCssVariables(documentProfile)
        }) as React.CSSProperties,
        [customPaperSize, documentProfile, pageMarginMm, paperOrientation, paperPreset]
    )
    const paperStyle = useMemo(() => {
        const style = { ...basePaperStyle } as React.CSSProperties & Record<string, string>
        if (!autoExpandPaperForWideTables || !wideTableWidthPx) {
            return style
        }

        const baseWidthValue = Number.parseInt(String(style['--paper-width'] ?? '').replace('px', ''), 10)
        const baseWidth = Number.isFinite(baseWidthValue) ? baseWidthValue : 800
        const nextWidth = Math.max(baseWidth, Math.min(maxAutoPaperWidthPx, Math.round(wideTableWidthPx + 24)))
        style['--paper-width'] = `${nextWidth}px`
        return style
    }, [autoExpandPaperForWideTables, basePaperStyle, maxAutoPaperWidthPx, wideTableWidthPx])
    const pageGuides = shouldShowPageGuides(paperPreset, exportProfile) ? 'on' : 'off'

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

    useEffect(() => {
        if (!autoExpandPaperForWideTables) {
            lastWideTableWidthRef.current = null
            setWideTableWidthPx(null)
            return
        }

        const root = workspaceRootRef.current
        if (!root) return

        let rafId = 0
        let measureTimer = 0
        let observedTables: HTMLTableElement[] = []
        const selector = '.editor-wysiwyg .milkdown table'

        const measureNow = () => {
            window.cancelAnimationFrame(rafId)
            rafId = window.requestAnimationFrame(() => {
                const tables = Array.from(root.querySelectorAll<HTMLTableElement>(selector))
                if (tables.length === 0) {
                    if (lastWideTableWidthRef.current !== null) {
                        lastWideTableWidthRef.current = null
                        setWideTableWidthPx(null)
                    }
                    return
                }
                const widest = tables.reduce((max, table) => Math.max(max, Math.ceil(table.scrollWidth)), 0)
                const nextWidth = widest > 0 ? widest : null
                if (lastWideTableWidthRef.current !== nextWidth) {
                    lastWideTableWidthRef.current = nextWidth
                    setWideTableWidthPx(nextWidth)
                }
            })
        }

        const measure = () => {
            window.clearTimeout(measureTimer)
            measureTimer = window.setTimeout(measureNow, 120)
        }

        const resizeObserver = new ResizeObserver(() => measure())
        const observeCurrentTables = () => {
            resizeObserver.disconnect()
            observedTables = Array.from(root.querySelectorAll<HTMLTableElement>(selector))
            observedTables.forEach(table => resizeObserver.observe(table))
        }

        const mutationObserver = new MutationObserver(() => {
            observeCurrentTables()
            measure()
        })

        observeCurrentTables()
        measure()
        mutationObserver.observe(root, { childList: true, subtree: true })

        return () => {
            window.clearTimeout(measureTimer)
            window.cancelAnimationFrame(rafId)
            resizeObserver.disconnect()
            mutationObserver.disconnect()
            observedTables = []
        }
    }, [activeTabId, autoExpandPaperForWideTables, viewMode])

    const dismissModeGuide = () => {
        window.localStorage.setItem('mymd:view-mode-guide:v1', 'dismissed')
        setShowModeGuide(false)
    }

    // 无标签时显示欢迎页；但在启动参数解析阶段先抑制欢迎页，避免“先首页后打开文件”的闪跳
    if (!activeTab) {
        if (suppressWelcome) {
            return (
                <div ref={workspaceRootRef} className={`editor-container ${watermark ? 'has-watermark' : ''}`}>
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

    const zoomStyle = {
        zoom: zoom / 100,
        ...paperStyle
    } as React.CSSProperties

    return (
        <div ref={workspaceRootRef} className={`editor-container ${watermark ? 'has-watermark' : ''}`}>
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
                <div
                    className="editor-workspace"
                    data-paper-preset={paperPreset}
                    data-paper-orientation={paperOrientation}
                    data-document-profile={documentProfile}
                    data-export-profile={exportProfile}
                    data-page-guides={pageGuides}
                >
                    <div className="editor-zoom-container" style={zoomStyle}>
                        <Suspense fallback={<EditorSurfaceLoading />}>
                            <WysiwygEditor
                                key={activeTab.id}
                                tabId={activeTab.id}
                                content={activeTab.content}
                                onCommandRef={commandRef}
                            />
                        </Suspense>
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
                        <Suspense fallback={<EditorSurfaceLoading />}>
                            <SourceEditor
                                key={`source-${activeTab.id}`}
                                tabId={activeTab.id}
                                content={activeTab.content}
                            />
                        </Suspense>
                    </div>
                    <div
                        className="editor-split__divider"
                        onMouseDown={startDragging}
                    />
                    <div
                        className="editor-split__preview editor-workspace"
                        data-paper-preset={paperPreset}
                        data-paper-orientation={paperOrientation}
                        data-document-profile={documentProfile}
                        data-export-profile={exportProfile}
                        data-page-guides={pageGuides}
                        style={{
                            flex: 100 - splitRatio,
                            transition: isDraggingRef.current ? 'none' : undefined
                        }}
                    >
                        <div className="editor-zoom-container" style={zoomStyle}>
                            <Suspense fallback={<EditorSurfaceLoading />}>
                                <WysiwygEditor
                                    key={`preview-${activeTab.id}`}
                                    tabId={activeTab.id}
                                    content={previewContent}
                                    readOnly
                                />
                            </Suspense>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export { EditorContainer as default }
