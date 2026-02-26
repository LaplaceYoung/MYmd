import { Plugin } from '@milkdown/prose/state'
import type { Node as ProseNode } from '@milkdown/prose/model'
import type { EditorView, NodeView } from '@milkdown/prose/view'
import { $prose } from '@milkdown/utils'
import katex from 'katex'

/**
 * 核心设计：自定义的数学公式 NodeView
 * 使得公式在未选中时显示为 KaTeX，在点击时就地“变身”为输入框（支持直写源码）。
 * 失焦或回车（部分情况）时自动提交变更并恢复 KaTeX 预览。
 */
class MathNodeView implements NodeView {
    dom: HTMLElement
    private previewElement: HTMLElement
    private inputElement: HTMLTextAreaElement | HTMLInputElement | null = null
    private isEditing = false

    constructor(
        public node: ProseNode,
        public view: EditorView,
        public getPos: () => number | undefined,
        public displayMode: boolean
    ) {
        this.dom = document.createElement('span')
        // 添加通用的包裹类和选区识别支持
        this.dom.className = displayMode ? 'math-block' : 'math-inline'

        this.previewElement = document.createElement('span')
        this.previewElement.className = 'math-preview'
        this.dom.appendChild(this.previewElement)

        this.renderKaTeX()

        // 只有未在编辑状态时点击，才转入编辑
        this.dom.addEventListener('mousedown', (e) => {
            if (!this.isEditing) {
                e.preventDefault()
                this.startEditing()
            }
        })
    }

    getValue() {
        return this.displayMode ? (this.node.attrs.value || '') : (this.node.textContent || '')
    }

    startEditing() {
        if (this.isEditing) return
        this.isEditing = true
        this.previewElement.style.display = 'none'

        // 根据行内/块级决定使用 input 还是 textarea
        if (this.displayMode) {
            this.inputElement = document.createElement('textarea')
            this.inputElement.className = 'math-edit-input math-edit-input--block'
                ; (this.inputElement as HTMLTextAreaElement).rows = Math.max(3, (this.getValue()).split('\n').length)
        } else {
            this.inputElement = document.createElement('input')
            this.inputElement.type = 'text'
            this.inputElement.className = 'math-edit-input math-edit-input--inline'
        }

        const input = this.inputElement
        input.value = this.getValue()

        // 阻止编辑器的默认按键捕获，允许内部正常输入
        input.addEventListener('keydown', (e) => {
            const kEvent = e as KeyboardEvent
            kEvent.stopPropagation()
            if (kEvent.key === 'Escape') {
                kEvent.preventDefault()
                this.stopEditing(false)
            } else if (kEvent.key === 'Enter') {
                // 行内公式回车直接确认；块级公式如果按了 ctrl/meta，也确认
                if (!this.displayMode || kEvent.ctrlKey || kEvent.metaKey) {
                    kEvent.preventDefault()
                    this.stopEditing(true)
                }
            }
        })

        // 失去焦点时自动确认
        input.addEventListener('blur', () => this.stopEditing(true))

        this.dom.appendChild(input)

        // 选中文本
        setTimeout(() => {
            input.focus()
            input.select()
        }, 10)
    }

    stopEditing(save: boolean) {
        if (!this.isEditing || !this.inputElement) return
        this.isEditing = false

        const newValue = this.inputElement.value
        this.inputElement.remove()
        this.inputElement = null
        this.previewElement.style.display = ''

        const pos = typeof this.getPos === 'function' ? this.getPos() : undefined

        if (save && typeof pos === 'number' && newValue !== this.getValue()) {
            // 调度更新 transaction
            let tr = this.view.state.tr
            if (this.displayMode) {
                tr = tr.setNodeMarkup(pos, undefined, {
                    ...this.node.attrs,
                    value: newValue
                })
            } else {
                const mathInlineType = this.view.state.schema.nodes.math_inline
                const newTextNode = newValue ? this.view.state.schema.text(newValue) : null
                const newNode = mathInlineType.create(null, newTextNode)
                tr = tr.replaceWith(pos, pos + this.node.nodeSize, newNode)
            }
            // 通过 setSelection 使光标留在原处（或跳出块），防止页面跳动
            this.view.dispatch(tr)
        } else {
            // 只需重新渲染
            this.renderKaTeX()
        }
    }

    renderKaTeX() {
        const value = this.getValue()
        if (!value.trim()) {
            this.previewElement.innerHTML = this.displayMode
                ? '<div class="math-empty">点击填写块级公式</div>'
                : '<span class="math-empty">点击填写内联公式</span>'
            return
        }
        try {
            katex.render(value, this.previewElement, {
                displayMode: this.displayMode,
                throwOnError: false
            })
        } catch (e) {
            this.previewElement.innerText = (e as Error).message
        }
    }

    update(node: ProseNode) {
        if (node.type.name !== this.node.type.name) return false
        this.node = node
        if (!this.isEditing) {
            this.renderKaTeX()
        }
        return true
    }

    ignoreMutation() {
        // 忽略 DOM 突变，使得内部 input 怎么折腾都不会触发 ProseMirror 同步重绘
        return true
    }

    destroy() {
        if (this.inputElement) {
            this.inputElement.remove()
        }
    }
}

/**
 * 拦截 Milkdown 的 NodeView 渲染，注入自定义交互式的数学视图
 */
export const mathEditPlugin = $prose(() => {
    return new Plugin({
        props: {
            nodeViews: {
                math_inline: (node, view, getPos) => new MathNodeView(node, view, getPos, false),
                math_block: (node, view, getPos) => new MathNodeView(node, view, getPos, true)
            }
        }
    })
})

