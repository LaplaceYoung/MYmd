import { useEditorStore } from '@/stores/editorStore'
import { X, List } from 'lucide-react'
import { useMemo } from 'react'
import './TOCPanel.css'

interface TOCItem {
    id: string
    level: number
    text: string
    index: number
}

export function TOCPanel() {
    const tocVisible = useEditorStore(s => s.tocVisible)
    const setTocVisible = useEditorStore(s => s.setTocVisible)
    const activeTabId = useEditorStore(s => s.activeTabId)
    const tabs = useEditorStore(s => s.tabs)
    const viewMode = useEditorStore(s => s.viewMode)

    const activeTab = tabs.find(t => t.id === activeTabId)
    const content = activeTab?.content || ''

    // 动态提取标题
    const headings = useMemo<TOCItem[]>(() => {
        if (!content) return []
        const lines = content.split('\n')
        const items: TOCItem[] = []
        let headingIndex = 0

        let inCodeBlock = false
        for (const line of lines) {
            // 跳过代码块内部的 #
            if (line.trim().startsWith('```')) {
                inCodeBlock = !inCodeBlock
                continue
            }
            if (inCodeBlock) continue

            const match = line.match(/^(#{1,6})\s+(.+)$/)
            if (match) {
                items.push({
                    id: `toc-${headingIndex}`,
                    level: match[1].length,
                    text: match[2].trim(),
                    index: headingIndex
                })
                headingIndex++
            }
        }
        return items
    }, [content])

    const handleHeadingClick = (index: number) => {
        // 尝试在 DOM 中寻找对应的标题元素并滚动
        setTimeout(() => {
            let containerSelector = '.editor-wysiwyg .editor'
            if (viewMode === 'split') {
                containerSelector = '.editor-split__preview .editor'
            }

            const container = document.querySelector(containerSelector)
            if (container) {
                const domHeadings = container.querySelectorAll('h1, h2, h3, h4, h5, h6')
                if (domHeadings && domHeadings[index]) {
                    domHeadings[index].scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
            }
        }, 50)
    }

    if (!tocVisible) return null

    return (
        <div className="toc-panel">
            <div className="toc-panel__header">
                <div className="toc-panel__title">
                    <List size={16} />
                    <span>大纲</span>
                </div>
                <button className="toc-panel__close" onClick={() => setTocVisible(false)}>
                    <X size={16} />
                </button>
            </div>
            <div className="toc-panel__content">
                {headings.length === 0 ? (
                    <div className="toc-panel__empty">无标题</div>
                ) : (
                    headings.map((h) => (
                        <div
                            key={h.id}
                            className={`toc-panel__item toc-panel__item--level-${h.level}`}
                            onClick={() => handleHeadingClick(h.index)}
                            title={h.text}
                        >
                            {h.text}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
