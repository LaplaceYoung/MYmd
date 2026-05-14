import { Plugin } from '@milkdown/kit/prose/state'
import { Decoration, DecorationSet } from '@milkdown/kit/prose/view'
import type { EditorView } from '@milkdown/kit/prose/view'

function toggleTaskItem(view: EditorView, itemPos: number) {
    const node = view.state.doc.nodeAt(itemPos)
    if (!node || node.type.name !== 'list_item' || typeof node.attrs.checked !== 'boolean') return

    const tr = view.state.tr.setNodeMarkup(itemPos, undefined, {
        ...node.attrs,
        checked: !node.attrs.checked,
    })

    view.dispatch(tr.scrollIntoView())
    view.focus()
}

export function createTaskListTogglePlugin(readOnly: boolean) {
    return new Plugin({
        props: {
            decorations(state) {
                const decorations: Decoration[] = []

                state.doc.descendants((node, pos) => {
                    if (node.type.name !== 'list_item' || typeof node.attrs.checked !== 'boolean') return

                    const checked = Boolean(node.attrs.checked)
                    decorations.push(Decoration.widget(
                        pos + 1,
                        (view, getPos) => {
                            const checkbox = document.createElement('input')
                            checkbox.type = 'checkbox'
                            checkbox.className = 'editor-task-list__checkbox'
                            checkbox.checked = checked
                            checkbox.disabled = readOnly
                            checkbox.contentEditable = 'false'
                            checkbox.setAttribute('aria-label', checked ? 'Mark task incomplete' : 'Mark task complete')

                            checkbox.addEventListener('mousedown', event => {
                                event.preventDefault()
                                event.stopPropagation()
                            })

                            checkbox.addEventListener('click', event => {
                                event.preventDefault()
                                event.stopPropagation()

                                if (readOnly) return

                                const widgetPos = getPos()
                                if (typeof widgetPos !== 'number') return
                                toggleTaskItem(view, widgetPos - 1)
                            })

                            return checkbox
                        },
                        {
                            key: `mymd-task-toggle-${pos}-${checked}-${readOnly ? 'readonly' : 'edit'}`,
                            side: -1,
                            ignoreSelection: true,
                            stopEvent: () => true,
                        },
                    ))
                })

                return DecorationSet.create(state.doc, decorations)
            },
        },
    })
}
