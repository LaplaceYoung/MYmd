import { useEffect, useRef, useCallback } from 'react'
import {
    Scissors, Copy, ClipboardPaste,
    Bold, Italic,
    Link, Image,
    Undo2, Redo2,
    type LucideIcon
} from 'lucide-react'
import './EditorContextMenu.css'
import { copyFromEditor, cutFromEditor, pasteToEditor } from '@/utils/editorClipboard'

interface ContextMenuItemData {
    id: string
    label: string
    icon?: LucideIcon
    shortcut?: string
    command?: string
    payload?: unknown
    disabled?: boolean
    /** 自定义动作（非编辑器命令） */
    action?: () => void
}

interface ContextMenuGroup {
    items: ContextMenuItemData[]
}

interface EditorContextMenuProps {
    x: number
    y: number
    onClose: () => void
    onCommand: (cmd: string, payload?: unknown) => void
}

/** 构建菜单数据 */
function buildMenuGroups(): ContextMenuGroup[] {
    return [
        {
            items: [
                { id: 'cut', label: '剪切', icon: Scissors, shortcut: 'Ctrl+X', action: () => cutFromEditor() },
                { id: 'copy', label: '复制', icon: Copy, shortcut: 'Ctrl+C', action: () => copyFromEditor() },
                {
                    id: 'paste', label: '粘贴', icon: ClipboardPaste, shortcut: 'Ctrl+V',
                    action: () => { void pasteToEditor() }
                },
            ],
        },
        {
            items: [
                { id: 'bold', label: '加粗', icon: Bold, shortcut: 'Ctrl+B', command: 'bold' },
                { id: 'italic', label: '斜体', icon: Italic, shortcut: 'Ctrl+I', command: 'italic' },
            ],
        },
        {
            items: [
                { id: 'link', label: '插入链接…', icon: Link, command: 'link' },
                { id: 'image', label: '插入图片…', icon: Image, command: 'image' },
            ],
        },
        {
            items: [
                { id: 'undo', label: '撤销', icon: Undo2, shortcut: 'Ctrl+Z', command: 'undo' },
                { id: 'redo', label: '恢复', icon: Redo2, shortcut: 'Ctrl+Y', command: 'redo' },
            ],
        },
    ]
}

export function EditorContextMenu({ x, y, onClose, onCommand }: EditorContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null)

    // 边界检测 — 确保菜单不超出可视区域
    useEffect(() => {
        const menu = menuRef.current
        if (!menu) return

        const rect = menu.getBoundingClientRect()
        const vw = window.innerWidth
        const vh = window.innerHeight

        let adjustedX = x
        let adjustedY = y

        if (x + rect.width > vw) {
            adjustedX = vw - rect.width - 8
        }
        if (y + rect.height > vh) {
            adjustedY = vh - rect.height - 8
        }

        menu.style.left = `${Math.max(4, adjustedX)}px`
        menu.style.top = `${Math.max(4, adjustedY)}px`
    }, [x, y])

    // 点击外部关闭
    useEffect(() => {
        function handleMouseDown(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose()
            }
        }
        // 使用 setTimeout 避免右键事件本身触发关闭
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleMouseDown)
        }, 0)

        return () => {
            clearTimeout(timer)
            document.removeEventListener('mousedown', handleMouseDown)
        }
    }, [onClose])

    // Escape 关闭
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                onClose()
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [onClose])

    // 执行菜单项
    const handleItemClick = useCallback((item: ContextMenuItemData) => {
        if (item.disabled) return

        if (item.action) {
            item.action()
        } else if (item.command) {
            onCommand(item.command, item.payload)
        }
        onClose()
    }, [onCommand, onClose])

    const groups = buildMenuGroups()

    return (
        <div
            ref={menuRef}
            className="editor-context-menu"
            style={{ left: x, top: y }}
            onContextMenu={(e) => e.preventDefault()}
        >
            {groups.map((group, gi) => (
                <div key={gi}>
                    {gi > 0 && <div className="editor-context-menu-separator" />}
                    <div className="editor-context-menu-group">
                        {group.items.map((item) => (
                            <button
                                key={item.id}
                                className={`editor-context-menu-item${item.disabled ? ' disabled' : ''}`}
                                onClick={() => handleItemClick(item)}
                                disabled={item.disabled}
                            >
                                <span className="editor-context-menu-item__icon">
                                    {item.icon ? <item.icon size={16} strokeWidth={1.8} /> : null}
                                </span>
                                <span className="editor-context-menu-item__label">{item.label}</span>
                                {item.shortcut && (
                                    <span className="editor-context-menu-item__shortcut">{item.shortcut}</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}
