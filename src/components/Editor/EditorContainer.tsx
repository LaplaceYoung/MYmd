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

    // 缩放样式 - 应用于内容容器而非滚动容器
    const zoomStyle = {
        zoom: zoom / 100,
    } as React.CSSProperties

    // 处理拖拽分割线调整比例
    useEffect(() => {
        if (viewMode !== 'split') return

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDraggingRef.current) return
            const container = splitContainerRef.current
            if (!container) return

            const rect = container.getBoundingClientRect()
            const x = e.clientX - rect.left
            const newRatio = (x / rect.width) * 100

            if (newRatio > 20 && newRatio < 80) {
                setSplitRatio(newRatio)
            }
        }

        const handleMouseUp = () => {
            if (isDraggingRef.current) {
                isDraggingRef.current = false
                document.body.style.cursor = 'default'
                // 强制重新渲染以移除 transition: none
                setSplitRatio(r => r)
            }
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [viewMode])

    // 处理双边同步滚动与点击同步
    useEffect(() => {
        if (viewMode !== 'split' || !splitContainerRef.current) return

        let animFrameId: number

        const syncScroll = () => {
            const sourceEl = splitContainerRef.current?.querySelector('.cm-scroller') as HTMLElement
            const previewEl = splitContainerRef.current?.querySelector('.editor-split__preview') as HTMLElement
            if (!sourceEl || !previewEl) return

            const onSourceScroll = () => {
                if (isSyncingRightRef.current || isDraggingRef.current) return
                isSyncingLeftRef.current = true

                // 获取预览侧真实排版的高度信息
                const editorNode = previewEl.querySelector('.editor') as HTMLElement

                // 纸张顶边到预览视口顶边的距离（包含了 margin 和 padding 甚至 zoom 后的物理偏差）
                let offsetTop = 0
                if (editorNode) {
                    const previewRect = previewEl.getBoundingClientRect()
                    const editorRect = editorNode.getBoundingClientRect()
                    // 因为使用了 CSS zoom，布局尺寸就是真实尺寸，直接计算物理偏移即可
                    offsetTop = editorRect.top - previewRect.top + previewEl.scrollTop
                }

                const sourceScrollable = sourceEl.scrollHeight - sourceEl.clientHeight
                const targetScrollable = previewEl.scrollHeight - previewEl.clientHeight

                if (sourceScrollable > 0) {
                    const percentage = sourceEl.scrollTop / sourceScrollable
                    const availableScroll = targetScrollable - offsetTop
                    previewEl.scrollTop = offsetTop + percentage * availableScroll
                }

                cancelAnimationFrame(animFrameId)
                animFrameId = requestAnimationFrame(() => {
                    isSyncingLeftRef.current = false
                })
            }

            const onPreviewScroll = () => {
                if (isSyncingLeftRef.current) return
                isSyncingRightRef.current = true

                const editorNode = previewEl.querySelector('.editor') as HTMLElement
                let offsetTop = 0
                if (editorNode) {
                    const previewRect = previewEl.getBoundingClientRect()
                    const editorRect = editorNode.getBoundingClientRect()
                    offsetTop = editorRect.top - previewRect.top + previewEl.scrollTop
                }

                const sourceScrollable = sourceEl.scrollHeight - sourceEl.clientHeight
                const targetScrollable = previewEl.scrollHeight - previewEl.clientHeight

                if (sourceScrollable > 0 && targetScrollable > 0) {
                    const availableScroll = targetScrollable - offsetTop

                    if (availableScroll > 0) {
                        // 小于 offsetTop 说明在顶部 padding 内，视同 0%
                        const calcScrollTop = Math.max(0, previewEl.scrollTop - offsetTop)
                        const percentage = Math.min(1, Math.max(0, calcScrollTop / availableScroll))
                        sourceEl.scrollTop = percentage * sourceScrollable
                    }
                }

                cancelAnimationFrame(animFrameId)
                animFrameId = requestAnimationFrame(() => {
                    isSyncingRightRef.current = false
                })
            }

            const onContainerClick = (e: MouseEvent) => {
                // 点击后立刻触发一次全同步
                if (document.activeElement?.closest('.cm-scroller')) {
                    onSourceScroll()

                    // 同步亮闪逻辑：计算源码侧点击比例
                    const sourceRect = sourceEl.getBoundingClientRect()
                    const clickY = e.clientY - sourceRect.top + sourceEl.scrollTop
                    const ratio = clickY / sourceEl.scrollHeight

                    // 预览侧目标位置直接使用比例
                    const targetY = ratio * previewEl.scrollHeight

                    const editorContainer = previewEl.querySelector('.editor') as HTMLElement
                    if (editorContainer) {
                        const children = Array.from(editorContainer.children) as HTMLElement[]
                        let targetBlock = children[0]
                        let minDiff = Infinity

                        for (const child of children) {
                            // 计算子节点的中点与 targetY 的差距
                            const childCenter = child.offsetTop + child.offsetHeight / 2
                            const diff = Math.abs(childCenter - targetY)
                            if (diff < minDiff) {
                                minDiff = diff
                                targetBlock = child
                            }
                        }

                        if (targetBlock) {
                            // 移除旧类以方便重新触发动画
                            targetBlock.classList.remove('sync-flash')
                            // 强制 Reflow
                            void targetBlock.offsetWidth
                            targetBlock.classList.add('sync-flash')
                        }
                    }
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

    // 缩放样式 - 应用于内容容器而非滚动容器


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
                        onMouseDown={(e) => {
                            e.preventDefault()
                            isDraggingRef.current = true
                            document.body.style.cursor = 'col-resize'
                            // 强制重新渲染以应用 transition: none
                            setSplitRatio(r => r)
                        }}
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
