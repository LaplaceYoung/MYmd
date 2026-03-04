import { useState, useRef, useEffect } from 'react'
import {
    Bold, Italic, Strikethrough, Heading,
    List, ListOrdered, Quote, Code, CodeSquare,
    Image, Table, Link, Minus, CheckSquare,
    Columns2, PenTool, ChevronDown
} from 'lucide-react'
import { useEditorStore } from '@/stores/editorStore'
import './Toolbar.css'

export function Toolbar() {
    const viewMode = useEditorStore(s => s.viewMode)
    const setViewMode = useEditorStore(s => s.setViewMode)
    const executeCommand = useEditorStore(s => s.executeCommand)
    const [showHeadingMenu, setShowHeadingMenu] = useState(false)
    const headingRef = useRef<HTMLDivElement>(null)

    // 点击外部关闭标题菜单
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (headingRef.current && !headingRef.current.contains(e.target as Node)) {
                setShowHeadingMenu(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    const exec = (cmd: string, payload?: unknown) => {
        executeCommand(cmd, payload)
    }

    return (
        <div className="toolbar">
            {/* 标题层级 */}
            <div ref={headingRef} style={{ position: 'relative' }}>
                <button
                    className="toolbar__btn toolbar__btn--dropdown"
                    onClick={() => setShowHeadingMenu(!showHeadingMenu)}
                    title="标题"
                >
                    <Heading size={16} />
                    <ChevronDown size={12} />
                </button>
                {showHeadingMenu && (
                    <div className="toolbar__heading-menu">
                        {[1, 2, 3, 4, 5, 6].map(level => (
                            <button
                                key={level}
                                className="toolbar__heading-item"
                                onClick={() => { exec('heading', level); setShowHeadingMenu(false) }}
                                style={{ fontSize: `${20 - level * 2}px`, fontWeight: level <= 2 ? 700 : 600 }}
                            >
                                H{level} {'标题'.repeat(1)}
                            </button>
                        ))}
                        <button
                            className="toolbar__heading-item"
                            onClick={() => { exec('paragraph'); setShowHeadingMenu(false) }}
                        >
                            正文
                        </button>
                    </div>
                )}
            </div>

            <div className="toolbar__divider" />

            {/* 字体样式 */}
            <button className="toolbar__btn" onClick={() => exec('bold')} title="加粗 Ctrl+B">
                <Bold size={16} />
            </button>
            <button className="toolbar__btn" onClick={() => exec('italic')} title="斜体 Ctrl+I">
                <Italic size={16} />
            </button>
            <button className="toolbar__btn" onClick={() => exec('strikethrough')} title="删除线 Ctrl+Shift+S">
                <Strikethrough size={16} />
            </button>
            <button className="toolbar__btn" onClick={() => exec('code')} title="行内代码 Ctrl+E">
                <Code size={16} />
            </button>

            <div className="toolbar__divider" />

            {/* 列表与引用 */}
            <button className="toolbar__btn" onClick={() => exec('bulletList')} title="无序列表">
                <List size={16} />
            </button>
            <button className="toolbar__btn" onClick={() => exec('orderedList')} title="有序列表">
                <ListOrdered size={16} />
            </button>
            <button className="toolbar__btn" onClick={() => exec('taskList')} title="任务列表">
                <CheckSquare size={16} />
            </button>
            <button className="toolbar__btn" onClick={() => exec('blockquote')} title="引用">
                <Quote size={16} />
            </button>

            <div className="toolbar__divider" />

            {/* 插入 */}
            <button className="toolbar__btn" onClick={() => exec('codeBlock')} title="代码块">
                <CodeSquare size={16} />
            </button>
            <button className="toolbar__btn" onClick={() => exec('table')} title="插入表格">
                <Table size={16} />
            </button>
            <button className="toolbar__btn" onClick={() => exec('image')} title="插入图片">
                <Image size={16} />
            </button>
            <button className="toolbar__btn" onClick={() => exec('link')} title="插入链接 Ctrl+K">
                <Link size={16} />
            </button>
            <button className="toolbar__btn" onClick={() => exec('hr')} title="分隔线">
                <Minus size={16} />
            </button>

            {/* 右侧视图切换 */}
            <div className="toolbar__view-group">
                <button
                    className={`toolbar__view-btn ${viewMode === 'wysiwyg' ? 'toolbar__view-btn--active' : ''}`}
                    onClick={() => setViewMode('wysiwyg')}
                >
                    <PenTool size={14} />
                    所见即所得
                </button>
                <button
                    className={`toolbar__view-btn ${viewMode === 'split' ? 'toolbar__view-btn--active' : ''}`}
                    onClick={() => setViewMode('split')}
                >
                    <Columns2 size={14} />
                    分屏
                </button>
            </div>
        </div>
    )
}
