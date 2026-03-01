import { Plugin, PluginKey } from '@milkdown/prose/state'
import { Decoration, DecorationSet } from '@milkdown/prose/view'

export const activeBlockPluginKey = new PluginKey('activeBlock')

export function createActiveBlockPlugin() {
    return new Plugin({
        key: activeBlockPluginKey,
        state: {
            init() { return DecorationSet.empty },
            apply(tr) {
                const { selection } = tr
                if (!selection || !selection.$from) return DecorationSet.empty

                const { $from } = selection
                // Find top-level block
                const depth = $from.depth
                if (depth > 0) {
                    try {
                        const pos = $from.before(1)
                        const node = $from.node(1)
                        if (node) {
                            const dec = Decoration.node(pos, pos + node.nodeSize, { class: 'active-block' })
                            return DecorationSet.create(tr.doc, [dec])
                        }
                    } catch (e) {
                        return DecorationSet.empty
                    }
                }
                return DecorationSet.empty
            }
        },
        props: {
            decorations(state) {
                return activeBlockPluginKey.getState(state)
            }
        }
    })
}
