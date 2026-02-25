/**
 * Typora 风格语法提示插件
 *
 * 当光标进入某个块级节点时，在该节点内的 inline marks（加粗、斜体、行内代码等）
 * 前后显示对应的 Markdown 语法标记（如 **、*、`），点击离开后标记消失。
 * 块级节点（标题、引用）通过在节点前插入语法标记（#、>）来提示。
 */
import { Plugin, PluginKey } from '@milkdown/kit/prose/state'
import { Decoration, DecorationSet } from '@milkdown/kit/prose/view'
import type { EditorState } from '@milkdown/kit/prose/state'
import type { Node, Mark } from '@milkdown/kit/prose/model'

const syntaxHintKey = new PluginKey('syntax-hint')

/**
 * 为 mark 生成前后缀的 Markdown 语法字符
 */
function getMarkSyntax(mark: Mark): { before: string; after: string } | null {
    switch (mark.type.name) {
        case 'strong':
            return { before: '**', after: '**' }
        case 'emphasis':
            return { before: '*', after: '*' }
        case 'inlineCode':
            return { before: '`', after: '`' }
        case 'strikethrough':
            return { before: '~~', after: '~~' }
        case 'link':
            return { before: '[', after: `](${mark.attrs.href || ''})` }
        default:
            return null
    }
}

/**
 * 为块级节点生成前缀的 Markdown 语法字符
 */
function getBlockSyntax(node: Node): string | null {
    switch (node.type.name) {
        case 'heading':
            return '#'.repeat(node.attrs.level || 1) + ' '
        case 'blockquote':
            return '> '
        default:
            return null
    }
}

/**
 * 构建光标所在块级节点内所有 mark 的装饰集
 */
function buildDecorations(state: EditorState): DecorationSet {
    const { selection, doc } = state
    const { $from } = selection

    // 找到光标所在的最近块级节点
    const blockNode = $from.parent
    const blockStart = $from.start()

    const decorations: Decoration[] = []

    // 1. 块级语法提示（# 标题、> 引用）
    const blockPrefix = getBlockSyntax(blockNode)
    if (blockPrefix) {
        const widget = Decoration.widget(blockStart, () => {
            const span = document.createElement('span')
            span.className = 'syntax-hint syntax-hint--block'
            span.textContent = blockPrefix
            return span
        }, { side: -1 })
        decorations.push(widget)
    }

    // 对于 blockquote，光标可能在其子节点中
    if ($from.depth > 1) {
        const grandParent = $from.node($from.depth - 1)
        if (grandParent.type.name === 'blockquote') {
            const gpStart = $from.start($from.depth - 1)
            const widget = Decoration.widget(gpStart, () => {
                const span = document.createElement('span')
                span.className = 'syntax-hint syntax-hint--block'
                span.textContent = '> '
                return span
            }, { side: -1 })
            decorations.push(widget)
        }
    }

    // 2. 内联 mark 语法提示（**加粗**、*斜体*、`代码`等）
    // 遍历光标所在块级节点的所有文本片段
    blockNode.forEach((child, offset) => {
        if (!child.isText || !child.marks.length) return

        const absStart = blockStart + offset
        const absEnd = absStart + child.nodeSize

        for (const mark of child.marks) {
            const syntax = getMarkSyntax(mark)
            if (!syntax) continue

            // 检测该 mark 的连续范围（找到 mark 的起始和结束位置）
            // 只在 mark 范围的首尾添加装饰
            const isMarkStart = offset === 0 || !blockNode.child(findChildIndex(blockNode, offset) - 1)?.marks.some(m => m.eq(mark))
            const nextChildIdx = findChildIndex(blockNode, offset) + 1
            const isMarkEnd = nextChildIdx >= blockNode.childCount || !blockNode.child(nextChildIdx)?.marks.some(m => m.eq(mark))

            if (isMarkStart) {
                const widget = Decoration.widget(absStart, () => {
                    const span = document.createElement('span')
                    span.className = 'syntax-hint syntax-hint--inline'
                    span.textContent = syntax.before
                    return span
                }, { side: -1 })
                decorations.push(widget)
            }

            if (isMarkEnd) {
                const widget = Decoration.widget(absEnd, () => {
                    const span = document.createElement('span')
                    span.className = 'syntax-hint syntax-hint--inline'
                    span.textContent = syntax.after
                    return span
                }, { side: 1 })
                decorations.push(widget)
            }
        }
    })

    return DecorationSet.create(doc, decorations)
}

/**
 * 根据偏移量找到子节点索引
 */
function findChildIndex(node: Node, offset: number): number {
    let pos = 0
    for (let i = 0; i < node.childCount; i++) {
        if (pos === offset) return i
        pos += node.child(i).nodeSize
    }
    return node.childCount - 1
}

/**
 * 创建语法提示 ProseMirror 插件
 */
export function createSyntaxHintPlugin(): Plugin {
    return new Plugin({
        key: syntaxHintKey,
        state: {
            init(_, state) {
                return buildDecorations(state)
            },
            apply(tr, oldDecorations, _oldState, newState) {
                // 仅在选区变化或文档变化时重新构建
                if (tr.selectionSet || tr.docChanged) {
                    return buildDecorations(newState)
                }
                return oldDecorations
            }
        },
        props: {
            decorations(state) {
                return this.getState(state)
            }
        }
    })
}
