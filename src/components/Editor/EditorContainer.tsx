import { useRef } from 'react'
import { useEditorStore } from '@/stores/editorStore'
import { WysiwygEditor } from './WysiwygEditor'
import { SourceEditor } from './SourceEditor'
import { SearchBar } from './SearchBar'
import { InsertDialog } from './InsertDialog'
import { WelcomeView } from './WelcomeView'

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
    const zoom = useEditorStore(s => s.zoom)
    const watermark = useEditorStore(s => s.watermark)
    const commandRef = useRef<((cmd: string, payload?: unknown) => void) | null>(null)

    const splitContainerRef = useRef<HTMLDivElement>(null)

    // Shortcuts and file operations
    const { handleNewFile, handleOpenFile, handleOpenRecentFile } = useEditorShortcuts()

    // Split View logic
    const { splitRatio, isDraggingRef, startDragging } = useSplitPanes(viewMode, splitContainerRef)

    // Sync scroll
    useSyncScroll(viewMode, activeTabId, splitContainerRef, isDraggingRef)

    // 无标签时显示欢迎页；但在启动参数解析阶段先抑制欢迎页，避免“先首页后打开文件”的闪跳
    if (!activeTab) {
        if (suppressWelcome) {
            return <div className={`editor-container ${watermark ? 'has-watermark' : ''}`} />
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
                                content={activeTab.content}
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
