import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, Sigma } from 'lucide-react'
import katex from 'katex'
import { useEditorStore } from '@/stores/editorStore'
import { useI18n } from '@/i18n'
import type { Editor } from '@milkdown/kit/core'
import { editorViewCtx } from '@milkdown/kit/core'
import './MathEditOverlay.css'

interface MathEditOverlayProps {
    editorRef: React.MutableRefObject<Editor | null>
}

export function MathEditOverlay({ editorRef }: MathEditOverlayProps) {
    const { t } = useI18n()
    const mathEdit = useEditorStore(s => s.mathEdit)
    const closeMathEdit = useEditorStore(s => s.closeMathEdit)

    const [latex, setLatex] = useState('')
    const [renderedHtml, setRenderedHtml] = useState('')
    const [renderError, setRenderError] = useState('')
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const overlayRef = useRef<HTMLDivElement>(null)

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
        } catch (error: unknown) {
            setRenderedHtml('')
            setRenderError(error instanceof Error ? error.message : t('math.renderError'))
        }
    }, [t])

    useEffect(() => {
        if (!mathEdit) return

        setLatex(mathEdit.value)
        renderPreview(mathEdit.value, mathEdit.nodeType === 'math_block')

        const timer = window.setTimeout(() => {
            textareaRef.current?.focus()
            textareaRef.current?.select()
        }, 50)

        return () => window.clearTimeout(timer)
    }, [mathEdit, renderPreview])

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = event.target.value
        setLatex(value)
        renderPreview(value, mathEdit?.nodeType === 'math_block')
    }

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
        } catch (error) {
            console.error('Failed to update formula node:', error)
        }

        closeMathEdit()
    }, [mathEdit, latex, editorRef, closeMathEdit])

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Escape') {
            event.preventDefault()
            closeMathEdit()
        } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault()
            handleConfirm()
        }
    }

    if (!mathEdit) return null

    const { rect } = mathEdit
    const overlayWidth = 420

    let left = rect.left + rect.width / 2 - overlayWidth / 2
    let top = rect.top + rect.height + 8

    if (left < 8) left = 8
    if (left + overlayWidth > window.innerWidth - 8) {
        left = window.innerWidth - overlayWidth - 8
    }
    if (top + 300 > window.innerHeight) {
        top = rect.top - 8 - 250
        if (top < 8) top = rect.top + rect.height + 8
    }

    const isBlock = mathEdit.nodeType === 'math_block'

    return createPortal(
        <>
            <div className="math-edit-backdrop" onClick={closeMathEdit} />
            <div
                ref={overlayRef}
                className="math-edit-overlay"
                style={{ top: `${top}px`, left: `${left}px` }}
                onKeyDown={handleKeyDown}
            >
                <div className="math-edit-overlay__header">
                    <span className="math-edit-overlay__title">
                        <Sigma size={14} />
                        {isBlock ? t('math.editBlock') : t('math.editInline')}
                    </span>
                    <button className="math-edit-overlay__close" onClick={closeMathEdit} title={t('math.close')}>
                        <X size={14} />
                    </button>
                </div>

                <textarea
                    ref={textareaRef}
                    className="math-edit-overlay__input"
                    value={latex}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder={t('math.placeholder')}
                    spellCheck={false}
                />

                <div className="math-edit-overlay__preview">
                    <div className="math-edit-overlay__preview-content">
                        {renderError ? (
                            <span className="math-edit-overlay__preview-error">{renderError}</span>
                        ) : renderedHtml ? (
                            <span dangerouslySetInnerHTML={{ __html: renderedHtml }} />
                        ) : (
                            <span className="math-edit-overlay__preview-empty">{t('math.previewEmpty')}</span>
                        )}
                    </div>
                </div>

                <div className="math-edit-overlay__actions">
                    <span className="math-edit-overlay__hint">
                        <kbd>Ctrl+Enter</kbd> {t('math.confirmHint')} · <kbd>Esc</kbd> {t('common.cancel')}
                    </span>
                    <div className="math-edit-overlay__buttons">
                        <button
                            className="math-edit-overlay__btn math-edit-overlay__btn--cancel"
                            onClick={closeMathEdit}
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            className="math-edit-overlay__btn math-edit-overlay__btn--confirm"
                            onClick={handleConfirm}
                        >
                            {t('math.confirm')}
                        </button>
                    </div>
                </div>
            </div>
        </>,
        document.body
    )
}
