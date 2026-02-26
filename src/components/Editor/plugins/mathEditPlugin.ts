import { Plugin, PluginKey } from '@milkdown/prose/state'
import { editorViewCtx } from '@milkdown/kit/core'
import type { MilkdownPlugin } from '@milkdown/ctx'
import { $prose } from '@milkdown/utils'

export const mathEditPluginKey = new PluginKey('math-edit-plugin')

export const mathEditPlugin: MilkdownPlugin = $prose((ctx) => {
    return new Plugin({
        key: mathEditPluginKey,
        props: {
            handleClick(view, pos, event) {
                const target = event.target as HTMLElement
                // 寻找被点击的元素是否在数学公式渲染块内
                const mathElement = target.closest('.math-inline, .math-block') as HTMLElement
                if (!mathElement) return false

                try {
                    // 由于 KaTeX 复杂的 DOM 结构，浏览器返回的 pos 经常不准
                    // 优先通过真实点击坐标反求节点位置
                    const posObj = view.posAtCoords({ left: event.clientX, top: event.clientY })

                    let targetPos = pos
                    let node = view.state.doc.nodeAt(pos)

                    if (posObj) {
                        // inside 通常指向原子节点本身所在位置
                        const testPos = posObj.inside >= 0 ? posObj.inside : posObj.pos
                        const testNode = view.state.doc.nodeAt(testPos)

                        if (testNode && (testNode.type.name === 'math_inline' || testNode.type.name === 'math_block')) {
                            targetPos = testPos
                            node = testNode
                        } else {
                            // 尝试回退一步：有时光标会落在其后的空隙
                            const $pos = view.state.doc.resolve(posObj.pos)
                            if ($pos.nodeBefore && ($pos.nodeBefore.type.name === 'math_inline' || $pos.nodeBefore.type.name === 'math_block')) {
                                targetPos = posObj.pos - $pos.nodeBefore.nodeSize
                                node = $pos.nodeBefore
                            }
                        }
                    }

                    if (node && (node.type.name === 'math_inline' || node.type.name === 'math_block')) {
                        event.preventDefault()
                        const currentValue = node.attrs.value || ''
                        const newValue = window.prompt('编辑数学公式 (LaTeX):', currentValue)

                        if (newValue !== null && newValue !== currentValue) {
                            view.dispatch(
                                view.state.tr.setNodeMarkup(targetPos, undefined, {
                                    ...node.attrs,
                                    value: newValue
                                })
                            )
                        }
                        return true // 阻止默认的选中行为
                    }
                } catch (e) {
                    console.error('Failed to handle math edit click:', e)
                }

                return false
            }
        }
    })
})
