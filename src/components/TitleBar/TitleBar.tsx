import { useState, useEffect } from 'react'
import { Minus, Square, X, Copy, Search, Save, Undo, Redo, User } from 'lucide-react'
import logoSrc from '@/assets/logo.svg'
import { useEditorStore } from '@/stores/editorStore'
import './TitleBar.css'

// 检测是否在 Electron 环境中
const isElectron = typeof window !== 'undefined' && window.api !== undefined

export function TitleBar() {
    const [isMaximized, setIsMaximized] = useState(false)

    useEffect(() => {
        if (!isElectron) return

        // 查询初始最大化状态
        window.api.window.isMaximized().then(setIsMaximized)

        // 监听最大化状态变化
        const unsubscribeMax = window.api.window.onMaximizedChanged(setIsMaximized)

        // 监听主进程的关闭请求（如 Alt+F4, 任务栏关闭等）
        const unsubscribeClose = window.api.window.onRequestClose(() => {
            useEditorStore.getState().requestCloseWindow()
        })

        return () => {
            unsubscribeMax()
            unsubscribeClose()
        }
    }, [])

    const handleMinimize = () => {
        if (isElectron) window.api.window.minimize()
    }

    const handleMaximize = () => {
        if (isElectron) window.api.window.maximize()
    }

    const handleClose = () => {
        requestCloseWindow()
    }

    const activeTabId = useEditorStore(s => s.activeTabId)
    const tabs = useEditorStore(s => s.tabs)
    const editorCommand = useEditorStore(s => s.editorCommand)
    const saveActiveTab = useEditorStore(s => s.saveActiveTab)
    const requestCloseWindow = useEditorStore(s => s.requestCloseWindow)

    const activeTab = tabs.find(t => t.id === activeTabId)
    const docTitle = activeTab?.title || '文档1'

    // 保存按钮点击
    const handleSave = () => {
        saveActiveTab()
    }

    // 撤销
    const handleUndo = () => {
        editorCommand?.('undo')
    }

    // 恢复
    const handleRedo = () => {
        editorCommand?.('redo')
    }

    return (
        <div className="titlebar titlebar--fluent">
            <div className="titlebar__left">
                <div className="titlebar__logo">
                    <img src={logoSrc} alt="MYmd Logo" className="titlebar__logo-icon-img" />
                </div>
                <div className="titlebar__quick-access">
                    <button className="titlebar__tool-btn" title="保存 (Ctrl+S)" onClick={handleSave}>
                        <Save size={14} />
                    </button>
                    <button className="titlebar__tool-btn" title="撤销 (Ctrl+Z)" onClick={handleUndo}>
                        <Undo size={14} />
                    </button>
                    <button className="titlebar__tool-btn" title="恢复 (Ctrl+Y)" onClick={handleRedo}>
                        <Redo size={14} />
                    </button>
                </div>
                <div className="titlebar__doc-title">{docTitle} - MYmd</div>
            </div>

            <div className="titlebar__center">
                <div className="titlebar__search">
                    <Search size={14} />
                    <span>搜索 (Alt+Q)</span>
                </div>
            </div>

            <div className="titlebar__right">
                <div className="titlebar__profile">
                    <div className="titlebar__avatar">
                        <User size={14} />
                    </div>
                </div>
                <div className="titlebar__controls">
                    <button
                        className="titlebar__btn"
                        onClick={handleMinimize}
                        title="最小化"
                    >
                        <Minus />
                    </button>
                    <button
                        className="titlebar__btn"
                        onClick={handleMaximize}
                        title={isMaximized ? '还原' : '最大化'}
                    >
                        {isMaximized ? <Copy size={14} /> : <Square size={14} />}
                    </button>
                    <button
                        className="titlebar__btn titlebar__btn--close"
                        onClick={handleClose}
                        title="关闭"
                    >
                        <X />
                    </button>
                </div>
            </div>
        </div>
    )
}
