import { useEditorStore } from '@/stores/editorStore'
import { X, List } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { analyzeDocumentPerformance } from '@/utils/performance'
import './TOCPanel.css'

interface TOCItem {
    id: string
    level: number
    text: string
    index: number
}

function extractHeadings(content: string): TOCItem[] {
    if (!content) return []

    const lines = content.split('\n')
    const items: TOCItem[] = []
    let headingIndex = 0
    let inCodeBlock = false

    for (const line of lines) {
        if (line.trim().startsWith('```')) {
            inCodeBlock = !inCodeBlock
            continue
        }
        if (inCodeBlock) continue

        const match = line.match(/^(#{1,6})\s+(.+)$/)
        if (!match) continue

        items.push({
            id: `toc-${headingIndex}`,
            level: match[1].length,
            text: match[2].trim(),
            index: headingIndex,
        })
        headingIndex++
    }

    return items
}

export function TOCPanel() {
    const tocVisible = useEditorStore((s) => s.tocVisible)
    const setTocVisible = useEditorStore((s) => s.setTocVisible)
    const activeTabId = useEditorStore((s) => s.activeTabId)
    const tabs = useEditorStore((s) => s.tabs)
    const viewMode = useEditorStore((s) => s.viewMode)

    const activeTab = tabs.find((t) => t.id === activeTabId)
    const content = activeTab?.content || ''
    const [headings, setHeadings] = useState<TOCItem[]>([])
    const [isIndexing, setIsIndexing] = useState(false)
    const perfInfo = useMemo(() => analyzeDocumentPerformance(content), [content])

    useEffect(() => {
        let cancelled = false

        if (!content) {
            setHeadings([])
            setIsIndexing(false)
            return () => {
                cancelled = true
            }
        }

        const commitHeadings = () => {
            const next = extractHeadings(content)
            if (cancelled) return
            setHeadings(next)
            setIsIndexing(false)
        }

        if (perfInfo.isLarge) {
            setIsIndexing(true)
            const idleWindow = window as Window & {
                requestIdleCallback?: (
                    callback: IdleRequestCallback,
                    options?: IdleRequestOptions
                ) => number
                cancelIdleCallback?: (id: number) => void
            }

            if (idleWindow.requestIdleCallback && idleWindow.cancelIdleCallback) {
                const idleId = idleWindow.requestIdleCallback(
                    () => {
                        commitHeadings()
                    },
                    { timeout: 300 }
                )

                return () => {
                    cancelled = true
                    idleWindow.cancelIdleCallback?.(idleId)
                }
            }

            const timer = window.setTimeout(() => {
                commitHeadings()
            }, 40)

            return () => {
                cancelled = true
                window.clearTimeout(timer)
            }
        }

        commitHeadings()
        return () => {
            cancelled = true
        }
    }, [content, perfInfo.isLarge])

    const handleHeadingClick = (index: number) => {
        setTimeout(() => {
            let containerSelector = '.editor-wysiwyg .editor'
            if (viewMode === 'split') {
                containerSelector = '.editor-split__preview .editor'
            }

            const container = document.querySelector(containerSelector)
            if (!container) return

            const domHeadings = container.querySelectorAll('h1, h2, h3, h4, h5, h6')
            if (domHeadings && domHeadings[index]) {
                domHeadings[index].scrollIntoView({ behavior: 'smooth', block: 'start' })
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
                {isIndexing && <div className="toc-panel__empty">Indexing headings...</div>}
                {!isIndexing && headings.length === 0 ? (
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
