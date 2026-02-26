import { useRef, useEffect, useCallback, useState } from 'react'
import { useEditorStore } from '@/stores/editorStore'
import { WysiwygEditor } from './WysiwygEditor'
import { SourceEditor } from './SourceEditor'
import { SearchBar } from './SearchBar'
import { InsertDialog } from './InsertDialog'
import { TemplateGallery } from './TemplateGallery'
import { SettingsPanel } from '../Settings/SettingsPanel'
import { AccountPanel } from '../Account/AccountPanel'
import { FilePlus, FolderOpen, Home, Clock, FileText, UserCircle, Settings } from 'lucide-react'
import logoSrc from '@/assets/logo.svg'

// 检测是否在 Electron 环境中
const isElectron = typeof window !== 'undefined' && window.api !== undefined

// 欢迎页侧栏页面类型
type WelcomeView = 'home' | 'account' | 'settings'

/** 编辑器容器：根据当前标签和视图模式渲染编辑器 */
export function EditorContainer() {
    const tabs = useEditorStore(s => s.tabs)
    const activeTabId = useEditorStore(s => s.activeTabId)
    const addTab = useEditorStore(s => s.addTab)
    const activeTab = tabs.find(t => t.id === activeTabId)
    const viewMode = useEditorStore(s => s.viewMode)
    const zoom = useEditorStore(s => s.zoom)
    const recentFiles = useEditorStore(s => s.recentFiles)
    const watermark = useEditorStore(s => s.watermark)
    const commandRef = useRef<((cmd: string, payload?: unknown) => void) | null>(null)

    // 欢迎页侧栏状态
    const [welcomeView, setWelcomeView] = useState<WelcomeView>('home')

    // 分屏拖拽与同步相关
    const [splitRatio, setSplitRatio] = useState(50) // 左右比例 (0-100)
    const isDraggingRef = useRef(false)
    const splitContainerRef = useRef<HTMLDivElement>(null)
    const isSyncingLeftRef = useRef(false)
    const isSyncingRightRef = useRef(false)

    // 处理文件打开
    const handleOpenFile = useCallback(async () => {
        if (!isElectron) {
            addTab(null, '# 浏览器模式\n\n在 Electron 环境中可以打开本地文件。\n')
            return
        }

        const result = await window.api.file.openDialog()
        if (result.success && result.filePaths) {
            for (const filePath of result.filePaths) {
                const readResult = await window.api.file.read(filePath)
                if (readResult.success && readResult.content !== undefined) {
                    const tabId = addTab(filePath, readResult.content)
                    useEditorStore.getState().markSaved(tabId, filePath)
                }
            }
        }
    }, [addTab])

    // 处理新建文件
    const handleNewFile = useCallback(() => {
        addTab(null, '# 新文档\n\n开始编写...\n')
    }, [addTab])

    // 打开最近文件
    const handleOpenRecentFile = useCallback(async (filePath: string) => {
        if (!isElectron) return

        const readResult = await window.api.file.read(filePath)
        if (readResult.success && readResult.content !== undefined) {
            const tabId = addTab(filePath, readResult.content)
            useEditorStore.getState().markSaved(tabId, filePath)
        }
    }, [addTab])

    // 监听外部打开文件
    useEffect(() => {
        if (!isElectron) return

        const unsubscribe = window.api.file.onOpenedExternal(async (filePath: string) => {
            const readResult = await window.api.file.read(filePath)
            if (readResult.success && readResult.content !== undefined) {
                const tabId = addTab(filePath, readResult.content)
                useEditorStore.getState().markSaved(tabId, filePath)
            }
        })
        return () => { unsubscribe() }
    }, [addTab])

    // 处理分屏拖拽
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDraggingRef.current || !splitContainerRef.current) return
            const containerRect = splitContainerRef.current.getBoundingClientRect()
            const newRatio = ((e.clientX - containerRect.left) / containerRect.width) * 100
            // 限制比例在 20% 到 80% 之间
            setSplitRatio(Math.min(Math.max(newRatio, 20), 80))
        }

        const handleMouseUp = () => {
            isDraggingRef.current = false
            document.body.style.cursor = 'default'
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [])

    // 处理双边同步滚动与点击点击同步
    useEffect(() => {
        if (viewMode !== 'split' || !splitContainerRef.current) return

        let animFrameId: number

        const syncScroll = () => {
            const sourceEl = splitContainerRef.current?.querySelector('.cm-scroller') as HTMLElement
            const previewEl = splitContainerRef.current?.querySelector('.editor-split__preview') as HTMLElement
            if (!sourceEl || !previewEl) return

            const onSourceScroll = () => {
                if (isSyncingRightRef.current) return
                isSyncingLeftRef.current = true

                // 采用等比例滚动
                const percentage = sourceEl.scrollTop / (sourceEl.scrollHeight - sourceEl.clientHeight)
                if (!isNaN(percentage)) {
                    previewEl.scrollTop = percentage * (previewEl.scrollHeight - previewEl.clientHeight)
                }

                cancelAnimationFrame(animFrameId)
                animFrameId = requestAnimationFrame(() => {
                    isSyncingLeftRef.current = false
                })
            }

            const onPreviewScroll = () => {
                if (isSyncingLeftRef.current) return
                isSyncingRightRef.current = true

                const percentage = previewEl.scrollTop / (previewEl.scrollHeight - previewEl.clientHeight)
                if (!isNaN(percentage)) {
                    sourceEl.scrollTop = percentage * (sourceEl.scrollHeight - sourceEl.clientHeight)
                }

                cancelAnimationFrame(animFrameId)
                animFrameId = requestAnimationFrame(() => {
                    isSyncingRightRef.current = false
                })
            }

            const onContainerClick = () => {
                // 点击后立刻触发一次全同步
                if (document.activeElement?.closest('.cm-scroller')) {
                    onSourceScroll()
                } else if (document.activeElement?.closest('.editor-split__preview')) {
                    onPreviewScroll()
                }
            }

            sourceEl.addEventListener('scroll', onSourceScroll, { passive: true })
            previewEl.addEventListener('scroll', onPreviewScroll, { passive: true })
            splitContainerRef.current?.addEventListener('click', onContainerClick, { passive: true })

            return () => {
                sourceEl.removeEventListener('scroll', onSourceScroll)
                previewEl.removeEventListener('scroll', onPreviewScroll)
                splitContainerRef.current?.removeEventListener('click', onContainerClick)
                cancelAnimationFrame(animFrameId)
            }
        }

        // 短暂延迟确保子组件 (CodeMirror) 已经挂载 DOM
        const timer = setTimeout(syncScroll, 100)
        return () => clearTimeout(timer)
    }, [viewMode, activeTabId])

    // 快捷键处理
    useEffect(() => {
        const handleKeyDown = async (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'n':
                        e.preventDefault()
                        handleNewFile()
                        break
                    case 'o':
                        e.preventDefault()
                        handleOpenFile()
                        break
                    case 's': {
                        e.preventDefault()
                        if (!isElectron) break

                        const tab = useEditorStore.getState().getActiveTab()
                        if (!tab) break

                        if (e.shiftKey || !tab.filePath) {
                            const result = await window.api.file.saveAs(tab.content, tab.filePath ?? undefined)
                            if (result.success && result.filePath) {
                                useEditorStore.getState().markSaved(tab.id, result.filePath)
                            }
                        } else {
                            const result = await window.api.file.save(tab.filePath, tab.content)
                            if (result.success) {
                                useEditorStore.getState().markSaved(tab.id)
                            }
                        }
                        break
                    }
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleNewFile, handleOpenFile])

    // 动态获取时间以显示相应的问候语
    const hour = new Date().getHours()
    const greeting = hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好'

    // 格式化相对时间
    const formatRelativeTime = (timestamp: number) => {
        const diff = Date.now() - timestamp
        const minutes = Math.floor(diff / 60000)
        if (minutes < 1) return '刚刚'
        if (minutes < 60) return `${minutes} 分钟前`
        const hours = Math.floor(minutes / 60)
        if (hours < 24) return `${hours} 小时前`
        const days = Math.floor(hours / 24)
        return `${days} 天前`
    }

    // 缩放样式
    const zoomStyle = {
        transform: `scale(${zoom / 100})`,
        transformOrigin: 'top center',
        width: zoom !== 100 ? `${10000 / zoom}% ` : '100%',
    }

    // 无标签时显示欢迎页
    if (!activeTab) {
        return (
            <div className="welcome-word">
                <div className="welcome-word__sidebar">
                    <div className="welcome-word__sidebar-brand">
                        <img src={logoSrc} alt="logo" className="welcome-word__sidebar-logo" />
                        <span className="welcome-word__sidebar-brand-name">MYmd</span>
                    </div>

                    <div className="welcome-word__sidebar-top">
                        <button
                            className={`welcome-word__sidebar-btn ${welcomeView === 'home' ? 'active' : ''}`}
                            onClick={() => setWelcomeView('home')}
                        >
                            <Home size={28} strokeWidth={1} />
                            <span>开始</span>
                        </button>
                        <button className="welcome-word__sidebar-btn" onClick={handleNewFile}>
                            <FilePlus size={28} strokeWidth={1} />
                            <span>新建</span>
                        </button>
                        <button className="welcome-word__sidebar-btn" onClick={handleOpenFile}>
                            <FolderOpen size={28} strokeWidth={1} />
                            <span>打开</span>
                        </button>
                    </div>
                    <div className="welcome-word__sidebar-bottom">
                        <div className="welcome-word__sidebar-divider"></div>
                        <button
                            className={`welcome-word__sidebar-btn text-only ${welcomeView === 'account' ? 'active' : ''}`}
                            onClick={() => setWelcomeView('account')}
                        >
                            账户
                        </button>
                        <button
                            className={`welcome-word__sidebar-btn text-only ${welcomeView === 'settings' ? 'active' : ''}`}
                            onClick={() => setWelcomeView('settings')}
                        >
                            选项
                        </button>
                    </div>
                </div>

                {/* 欢迎页主内容区根据侧栏选择切换 */}
                {welcomeView === 'account' ? (
                    <AccountPanel />
                ) : welcomeView === 'settings' ? (
                    <SettingsPanel />
                ) : (
                    <div className="welcome-word__main">
                        <div className="welcome-word__header">
                            <img src={logoSrc} alt="logo" className="welcome-word__logo" />
                            <h1 className="welcome-word__title">{greeting}</h1>
                        </div>

                        <div className="welcome-word__section">
                            <TemplateGallery />
                        </div>

                        <div className="welcome-word__section">
                            <div className="welcome-word__recent-header">
                                <h2 className="welcome-word__section-title active">最近</h2>
                                <h2 className="welcome-word__section-title">已固定</h2>
                                <h2 className="welcome-word__section-title">与我共享</h2>
                            </div>
                            <div className="welcome-word__recent-list">
                                <table className="welcome-word__recent-table">
                                    <thead>
                                        <tr>
                                            <th>名称</th>
                                            <th>修改时间</th>
                                            <th>位置</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentFiles.length > 0 ? (
                                            recentFiles.map((file, idx) => (
                                                <tr
                                                    key={idx}
                                                    className="welcome-word__recent-row"
                                                    onClick={() => handleOpenRecentFile(file.path)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <FileText size={16} color="var(--accent)" strokeWidth={1.5} />
                                                            {file.title}
                                                        </div>
                                                    </td>
                                                    <td>{formatRelativeTime(file.time)}</td>
                                                    <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                                                        {file.path.split(/[\\/]/).slice(0, -1).join('\\')}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr className="welcome-word__recent-empty-row">
                                                <td colSpan={3}>
                                                    <div className="welcome-word__recent-empty">
                                                        <Clock size={36} color="var(--text-muted)" strokeWidth={1.5} style={{ marginBottom: '8px' }} />
                                                        没有最近打开的文档。
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className={`editor-container ${watermark ? 'has-watermark' : ''}`}>
            <SearchBar />
            <InsertDialog />
            {viewMode === 'wysiwyg' ? (
                <div className="editor-workspace" style={zoomStyle}>
                    <WysiwygEditor
                        key={activeTab.id}
                        tabId={activeTab.id}
                        content={activeTab.content}
                        onCommandRef={commandRef}
                    />
                </div>
            ) : (
                <div className="editor-split" ref={splitContainerRef}>
                    <div className="editor-split__source" style={{ flex: splitRatio }}>
                        <SourceEditor
                            key={`source-${activeTab.id}`}
                            tabId={activeTab.id}
                            content={activeTab.content}
                        />
                    </div>
                    <div
                        className="editor-split__divider"
                        onMouseDown={(e) => {
                            e.preventDefault()
                            isDraggingRef.current = true
                            document.body.style.cursor = 'col-resize'
                        }}
                    />
                    <div className="editor-split__preview editor-workspace" style={{ ...zoomStyle, flex: 100 - splitRatio }}>
                        <WysiwygEditor
                            key={`preview-${activeTab.id}`}
                            tabId={activeTab.id}
                            content={activeTab.content}
                            onCommandRef={commandRef}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

export { EditorContainer as default }
