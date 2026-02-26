import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, Sigma } from 'lucide-react'
import katex from 'katex'
import { useEditorStore } from '@/stores/editorStore'
import type { Editor } from '@milkdown/kit/core'
import { editorViewCtx } from '@milkdown/kit/core'
import './MathEditOverlay.css'

interface MathEditOverlayProps {
    editorRef: React.MutableRefObject<Editor | null>
}

/**
 * 数学公式内联编辑器浮层
 * 点击公式后在其下方弹出，提供 LaTeX 编辑和实时 KaTeX 预览
 */
export function MathEditOverlay({ editorRef }: MathEditOverlayProps) {
    const mathEdit = useEditorStore(s => s.mathEdit)
    const closeMathEdit = useEditorStore(s => s.closeMathEdit)
    const zoom = useEditorStore(s => s.zoom)

    const [latex, setLatex] = useState('')
    const [renderedHtml, setRenderedHtml] = useState('')
    const [renderError, setRenderError] = useState('')
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const overlayRef = useRef<HTMLDivElement>(null)

    // 当浮层打开时初始化内容
    useEffect(() => {
        if (mathEdit) {
            setLatex(mathEdit.value)
            renderPreview(mathEdit.value, mathEdit.nodeType === 'math_block')
            // 延迟聚焦，确保 DOM 已挂载
            setTimeout(() => {
                textareaRef.current?.focus()
                textareaRef.current?.select()
            }, 50)
        }
    }, [mathEdit])

    // 渲染 KaTeX 预览
    const renderPreview = useCallback((value: string, displayMode: boolean) => {
        if (!value.trim()) {
            setRenderedHtml('')
            setRenderError('')
            return
        }
        try {
            const html = katex.renderToString(value, {
                displayMode,
                throwOnError: true,
                strict: false,
            })
            setRenderedHtml(html)
            setRenderError('')
        } catch (e: unknown) {
            setRenderedHtml('')
            setRenderError(e instanceof Error ? e.message : '渲染错误')
        }
    }, [])

    // LaTeX 内容变更
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value
        setLatex(val)
        renderPreview(val, mathEdit?.nodeType === 'math_block')
    }

    // 确认编辑
    const handleConfirm = useCallback(() => {
        if (!mathEdit || !editorRef.current) return

        const editor = editorRef.current
        try {
            editor.action(ctx => {
                const view = ctx.get(editorViewCtx)
                const node = view.state.doc.nodeAt(mathEdit.targetPos)
                if (node && (node.type.name === 'math_inline' || node.type.name === 'math_block')) {
                    view.dispatch(
                        view.state.tr.setNodeMarkup(mathEdit.targetPos, undefined, {
                            ...node.attrs,
                            value: latex,
                        })
                    )
                }
            })
        } catch (e) {
            console.error('数学公式更新失败:', e)
        }

        closeMathEdit()
    }, [mathEdit, latex, editorRef, closeMathEdit])

    // 键盘快捷键
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.preventDefault()
            closeMathEdit()
        } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault()
            handleConfirm()
        }
    }

    if (!mathEdit) return null

    // 计算浮层位置：在点击的公式元素下方居中
    const { rect } = mathEdit
    const overlayWidth = 420

    // 由于 rect 本身就是 getBoundingClientRect() 返回的视口坐标，
    // 在 Portal (document.body) 下直接使用即可，无需考虑 zoom 偏移（因为 rect 已包含缩放后的视觉位置）
    let left = rect.left + rect.width / 2 - overlayWidth / 2
    let top = rect.top + rect.height + 8

    // 防止超出视口
    if (left < 8) left = 8
    if (left + overlayWidth > window.innerWidth - 8) {
        left = window.innerWidth - overlayWidth - 8
    }
    if (top + 300 > window.innerHeight) {
        // 改为显示在上方
        top = rect.top - 8 - 250 // 预估高度
        if (top < 8) top = rect.top + rect.height + 8 // 如果上方也放不下，还是放下面
    }

    const isBlock = mathEdit.nodeType === 'math_block'

    return createPortal(
        <>
            {/* 透明遮罩，用于点击空白区域关闭 */}
            <div className="math-edit-backdrop" onClick={closeMathEdit} />
            <div
                ref={overlayRef}
                className="math-edit-overlay"
                style={{ top: `${top}px`, left: `${left}px` }}
                onKeyDown={handleKeyDown}
            >
                {/* 头部 */}
                <div className="math-edit-overlay__header">
                    <span className="math-edit-overlay__title">
                        <Sigma size={14} />
                        {isBlock ? '编辑块级公式' : '编辑行内公式'}
                    </span>
                    <button className="math-edit-overlay__close" onClick={closeMathEdit} title="关闭">
                        <X size={14} />
                    </button>
                </div>

                {/* LaTeX 输入 */}
                <textarea
                    ref={textareaRef}
                    className="math-edit-overlay__input"
                    value={latex}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="输入 LaTeX 公式，如 E = mc^2"
                    spellCheck={false}
                />

                {/* 实时预览 */}
                <div className="math-edit-overlay__preview">
                    <div className="math-edit-overlay__preview-content">
                        {renderError ? (
                            <span className="math-edit-overlay__preview-error">{renderError}</span>
                        ) : renderedHtml ? (
                            <span dangerouslySetInnerHTML={{ __html: renderedHtml }} />
                        ) : (
                            <span className="math-edit-overlay__preview-empty">输入公式以预览</span>
                        )}
                    </div>
                </div>

                {/* 操作栏 */}
                <div className="math-edit-overlay__actions">
                    <span className="math-edit-overlay__hint">
                        <kbd>Ctrl+Enter</kbd> 确认 · <kbd>Esc</kbd> 取消
                    </span>
                    <div className="math-edit-overlay__buttons">
                        <button
                            className="math-edit-overlay__btn math-edit-overlay__btn--cancel"
                            onClick={closeMathEdit}
                        >
                            取消
                        </button>
                        <button
                            className="math-edit-overlay__btn math-edit-overlay__btn--confirm"
                            onClick={handleConfirm}
                        >
                            确认
                        </button>
                    </div>
                </div>
            </div>
        </>,
        document.body
    )
}
