import { useState, useEffect, useCallback } from 'react'
import { Minus, Square, X, Copy, Save, Undo, Redo, User } from 'lucide-react'
import logoSrc from '@/assets/logo.svg'
import { TopSearchMenu } from './TopSearchMenu'
import { useEditorStore } from '@/stores/editorStore'
import { getCurrentWindow } from '@tauri-apps/api/window'
import './TitleBar.css'

// 检测是否在 Tauri 环境中
const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

export function TitleBar() {
    const [isMaximized, setIsMaximized] = useState(false)

    useEffect(() => {
        if (!isTauri) return

        const appWindow = getCurrentWindow()

        // 查询初始最大化状态
        appWindow.isMaximized().then(setIsMaximized)

        // 监听最大化状态变化
        let unlistenMax: () => void
        appWindow.onResized(async () => {
            const max = await appWindow.isMaximized()
            setIsMaximized(max)
        }).then(unlisten => {
            unlistenMax = unlisten
        })

        // 监听主进程的关闭请求
        let unlistenClose: () => void
        appWindow.onCloseRequested(async (event) => {
            // 拦截所有原生关闭动作，统一交给 store 逻辑处理
            event.preventDefault()
            useEditorStore.getState().requestCloseWindow()
        }).then(unlisten => {
            unlistenClose = unlisten
        })

        return () => {
            if (unlistenMax) unlistenMax()
            if (unlistenClose) unlistenClose()
        }
    }, [])

    // 窗口控制按钮处理函数
    const handleMinimize = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (isTauri) getCurrentWindow().minimize()
    }, [])

    const handleMaximize = useCallback(async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (!isTauri) return
        const appWindow = getCurrentWindow()
        await appWindow.toggleMaximize()
    }, [])

    const handleClose = useCallback((e: React.MouseEvent) => {
        if (e) {
            e.preventDefault()
            e.stopPropagation()
        }
        // 不直接调用原生 close，而是交给 store 判断是否可以关闭
        useEditorStore.getState().requestCloseWindow()
    }, [])

    // 标题栏拖拽处理 - 使用官方推荐的 startDragging() 方式
    const handleTitlebarMouseDown = useCallback((e: React.MouseEvent) => {
        if (!isTauri) return
        // 只处理左键
        if (e.buttons !== 1) return
        // 双击切换最大化
        if (e.detail === 2) {
            getCurrentWindow().toggleMaximize()
        } else {
            getCurrentWindow().startDragging()
        }
    }, [])

    const activeTabId = useEditorStore(s => s.activeTabId)
    const tabs = useEditorStore(s => s.tabs)
    const saveActiveTab = useEditorStore(s => s.saveActiveTab)
    const executeCommand = useEditorStore(s => s.executeCommand)

    const activeTab = tabs.find(t => t.id === activeTabId)
    const docTitle = (activeTab?.title || '文档1') + (activeTab?.isDirty ? ' *' : '')

    // 保存按钮点击
    const handleSave = () => {
        saveActiveTab()
    }

    // 撤销
    const handleUndo = () => {
        executeCommand('undo')
    }

    // 恢复
    const handleRedo = () => {
        executeCommand('redo')
    }

    return (
        <div className="titlebar titlebar--fluent">
            {/* 左侧: logo + 快捷工具 + 文档标题 */}
            <div className="titlebar__left">
                <div className="titlebar__logo">
                    <img src={logoSrc} alt="MYmd Logo" className="titlebar__logo-icon-img" />
                </div>
                <div className="titlebar__quick-access">
                    <button type="button" className="titlebar__tool-btn" title="保存 (Ctrl+S)" onClick={handleSave}>
                        <Save size={14} />
                    </button>
                    <button type="button" className="titlebar__tool-btn" title="撤销 (Ctrl+Z)" onClick={handleUndo}>
                        <Undo size={14} />
                    </button>
                    <button type="button" className="titlebar__tool-btn" title="恢复 (Ctrl+Y)" onClick={handleRedo}>
                        <Redo size={14} />
                    </button>
                </div>
                <div className="titlebar__doc-title">{docTitle} - MYmd</div>
            </div>

            {/* 中间: 拖拽区域 + 搜索框 */}
            <div
                className="titlebar__center"
                onMouseDown={handleTitlebarMouseDown}
            >
                <div className="titlebar__search">
                    <TopSearchMenu />
                </div>
            </div>

            {/* 右侧: 用户头像 + 窗口控制按钮 */}
            <div className="titlebar__right">
                <div className="titlebar__profile">
                    <div className="titlebar__avatar">
                        <User size={14} />
                    </div>
                </div>
                <div className="titlebar__controls">
                    <button
                        type="button"
                        className="titlebar__btn"
                        onClick={handleMinimize}
                        title="最小化"
                    >
                        <Minus />
                    </button>
                    <button
                        type="button"
                        className="titlebar__btn"
                        onClick={handleMaximize}
                        title={isMaximized ? '还原' : '最大化'}
                    >
                        {isMaximized ? <Copy size={14} /> : <Square size={14} />}
                    </button>
                    <button
                        type="button"
                        className="titlebar__btn titlebar__btn--close"
                        onClick={(e) => handleClose(e)}
                        title="关闭"
                    >
                        <X />
                    </button>
                </div>
            </div>
        </div>
    )
}
