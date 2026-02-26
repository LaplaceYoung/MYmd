import { $prose } from '@milkdown/utils'
import { Plugin, PluginKey } from '@milkdown/prose/state'
import type { Node as ProseNode } from '@milkdown/prose/model'
import type { EditorView, NodeView } from '@milkdown/prose/view'
import mermaid from 'mermaid'

// Mermaid 渲染配置
mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose'
})

let mermaidIdCounter = 0

class DiagramNodeView implements NodeView {
    dom: HTMLElement
    contentDOM?: HTMLElement

    private previewElement: HTMLDivElement
    private editContainer: HTMLDivElement
    private inputElement: HTMLTextAreaElement

    private isEditing: boolean = false
    private getPos: () => number | undefined

    constructor(
        public node: ProseNode,
        public view: EditorView,
        getPos: () => number | undefined
    ) {
        this.getPos = getPos

        // 主容器
        this.dom = document.createElement('div')
        this.dom.className = 'mermaid-node-view'
        this.dom.dataset.type = 'diagram'
        this.dom.dataset.value = this.node.attrs.value || ''

        // 预览容器（挂载 svg）
        this.previewElement = document.createElement('div')
        this.previewElement.className = 'mermaid-preview'
        // 添加点击事件进入编辑
        this.previewElement.addEventListener('click', (e) => {
            if (!this.isEditing) {
                e.preventDefault()
                this.startEditing()
            }
        })

        // 当预览为空或出错时显示的占位
        this.previewElement.innerHTML = '<div class="mermaid-empty">点击编辑 Mermaid 图表</div>'

        // 编辑容器
        this.editContainer = document.createElement('div')
        this.editContainer.className = 'mermaid-edit-container'
        this.editContainer.style.display = 'none'

        this.inputElement = document.createElement('textarea')
        this.inputElement.className = 'mermaid-edit-input'
        this.inputElement.spellcheck = false

        // 处理键盘与焦点的事件
        this.inputElement.addEventListener('keydown', (e) => {
            // 阻止冒泡到外层编辑器
            e.stopPropagation()
            if (e.key === 'Escape') {
                e.preventDefault()
                this.stopEditing(false)
            }
        })

        // 允许组合键提交或其他方式
        // 失焦时保存
        this.inputElement.addEventListener('blur', () => {
            this.stopEditing(true)
        })

        this.editContainer.appendChild(this.inputElement)

        this.dom.appendChild(this.previewElement)
        this.dom.appendChild(this.editContainer)

        this.renderMermaid()
    }

    startEditing() {
        if (this.isEditing) return
        this.isEditing = true
        this.previewElement.style.display = 'none'
        this.editContainer.style.display = 'block'

        const value = this.node.attrs.value || ''
        this.inputElement.value = value
        this.inputElement.rows = Math.max(3, value.split('\n').length)

        this.inputElement.focus()
    }

    stopEditing(save: boolean) {
        if (!this.isEditing) return
        this.isEditing = false

        this.editContainer.style.display = 'none'
        this.previewElement.style.display = 'block'

        const newValue = this.inputElement.value
        const pos = typeof this.getPos === 'function' ? this.getPos() : undefined

        if (save && typeof pos === 'number' && newValue !== this.node.attrs.value) {
            const tr = this.view.state.tr.setNodeMarkup(pos, undefined, {
                ...this.node.attrs,
                value: newValue
            })
            this.view.dispatch(tr)
        } else {
            this.renderMermaid()
        }
    }

    async renderMermaid() {
        const value = this.node.attrs.value || ''
        if (!value.trim()) {
            this.previewElement.innerHTML = '<div class="mermaid-empty" style="padding: 20px; text-align: center; border: 1px dashed var(--border); color: var(--text-muted); cursor: pointer;">点击填写 Mermaid 图表代码</div>'
            return
        }

        try {
            mermaidIdCounter++
            const id = `mermaid-svg-${mermaidIdCounter}`
            // mermaid.render 是异步的
            const { svg } = await mermaid.render(id, value)
            this.previewElement.innerHTML = svg
        } catch (err: any) {
            this.previewElement.innerHTML = `<div class="mermaid-error" style="color: red; padding: 10px; border: 1px solid red;">渲染错误: ${err.message || String(err)}<br/><span style="font-size: 12px; color: var(--text-muted); cursor: pointer">点击修改源码</span></div>`
        }
    }

    update(node: ProseNode) {
        if (node.type !== this.node.type) return false
        if (node.attrs.value !== this.node.attrs.value) {
            this.node = node
            this.dom.dataset.value = node.attrs.value || ''
            this.renderMermaid()
        } else {
            this.node = node
        }
        return true
    }

    ignoreMutation() {
        return true
    }
}

const diagramPluginKey = new PluginKey('diagram_plugin')

export const diagramViewPlugin = $prose(
    () =>
        new Plugin({
            key: diagramPluginKey,
            props: {
                nodeViews: {
                    diagram: (node, view, getPos) => new DiagramNodeView(node, view, getPos)
                }
            }
        })
)
