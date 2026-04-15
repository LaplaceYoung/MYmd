import { $prose } from '@milkdown/utils'
import { Plugin, PluginKey } from '@milkdown/prose/state'
import type { Node as ProseNode } from '@milkdown/prose/model'
import type { EditorView, NodeView } from '@milkdown/prose/view'
import {
    getMermaidEmptyMarkup,
    getMermaidErrorMarkup,
    renderMermaidSvg,
} from '@/utils/mermaid'

class DiagramNodeView implements NodeView {
    dom: HTMLElement
    contentDOM?: HTMLElement

    private previewElement: HTMLDivElement
    private editContainer: HTMLDivElement
    private inputElement: HTMLTextAreaElement
    private isEditing = false
    private getPos: () => number | undefined

    constructor(
        public node: ProseNode,
        public view: EditorView,
        getPos: () => number | undefined
    ) {
        this.getPos = getPos

        this.dom = document.createElement('div')
        this.dom.className = 'mermaid-node-view'
        this.dom.dataset.type = 'diagram'
        this.dom.dataset.value = this.node.attrs.value || ''

        this.previewElement = document.createElement('div')
        this.previewElement.className = 'mermaid-preview'
        this.previewElement.addEventListener('click', (event) => {
            if (this.isEditing) return
            event.preventDefault()
            this.startEditing()
        })

        this.editContainer = document.createElement('div')
        this.editContainer.className = 'mermaid-edit-container'
        this.editContainer.style.display = 'none'

        this.inputElement = document.createElement('textarea')
        this.inputElement.className = 'mermaid-edit-input'
        this.inputElement.spellcheck = false
        this.inputElement.addEventListener('keydown', (event) => {
            event.stopPropagation()
            if (event.key === 'Escape') {
                event.preventDefault()
                this.stopEditing(false)
            }
        })
        this.inputElement.addEventListener('blur', () => {
            this.stopEditing(true)
        })

        this.editContainer.appendChild(this.inputElement)
        this.dom.appendChild(this.previewElement)
        this.dom.appendChild(this.editContainer)

        void this.renderMermaid()
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
            const transaction = this.view.state.tr.setNodeMarkup(pos, undefined, {
                ...this.node.attrs,
                value: newValue,
            })
            this.view.dispatch(transaction)
            return
        }

        void this.renderMermaid()
    }

    async renderMermaid() {
        const value = this.node.attrs.value || ''

        if (!value.trim()) {
            this.dom.dataset.renderState = 'empty'
            this.previewElement.innerHTML = getMermaidEmptyMarkup()
            return
        }

        try {
            const svg = await renderMermaidSvg(value, 'mermaid-editor')
            this.dom.dataset.renderState = 'rendered'
            this.previewElement.innerHTML = svg
        } catch (error) {
            this.dom.dataset.renderState = 'error'
            this.previewElement.innerHTML = getMermaidErrorMarkup(value, error)
        }
    }

    update(node: ProseNode) {
        if (node.type !== this.node.type) return false

        const didValueChange = node.attrs.value !== this.node.attrs.value
        this.node = node
        this.dom.dataset.value = node.attrs.value || ''

        if (didValueChange) {
            void this.renderMermaid()
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
                    diagram: (node, view, getPos) => new DiagramNodeView(node, view, getPos),
                },
            },
        })
)
