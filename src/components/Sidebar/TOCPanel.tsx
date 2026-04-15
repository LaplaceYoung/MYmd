import { useEffect, useMemo, useState } from 'react'
import { List, Search, X } from 'lucide-react'
import { useEditorStore } from '@/stores/editorStore'
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
        headingIndex += 1
    }

    return items
}

export function TOCPanel() {
    const tocVisible = useEditorStore((s) => s.tocVisible)
    const setTocVisible = useEditorStore((s) => s.setTocVisible)
    const activeTab = useEditorStore((s) => {
        const id = s.activeTabId
        return s.tabs.find((tab) => tab.id === id) ?? null
    })
    const viewMode = useEditorStore((s) => s.viewMode)

    const content = activeTab?.content ?? ''
    const perfInfo = useMemo(() => analyzeDocumentPerformance(content), [content])

    const [headings, setHeadings] = useState<TOCItem[]>([])
    const [isIndexing, setIsIndexing] = useState(false)
    const [filterQuery, setFilterQuery] = useState('')
    const [activeHeadingIndex, setActiveHeadingIndex] = useState(-1)

    const getHeadingSelector = () =>
        viewMode === 'split'
            ? '.editor-split__preview .editor h1, .editor-split__preview .editor h2, .editor-split__preview .editor h3, .editor-split__preview .editor h4, .editor-split__preview .editor h5, .editor-split__preview .editor h6'
            : '.editor-wysiwyg .editor h1, .editor-wysiwyg .editor h2, .editor-wysiwyg .editor h3, .editor-wysiwyg .editor h4, .editor-wysiwyg .editor h5, .editor-wysiwyg .editor h6'

    const getScrollContainer = () =>
        viewMode === 'split'
            ? (document.querySelector('.editor-split__preview') as HTMLElement | null)
            : (document.querySelector('.editor-workspace') as HTMLElement | null)

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

    useEffect(() => {
        setFilterQuery('')
        setActiveHeadingIndex(headings.length > 0 ? headings[0].index : -1)
    }, [activeTab?.id, headings])

    useEffect(() => {
        if (!tocVisible || headings.length === 0) return

        const syncActiveHeading = () => {
            const domHeadings = Array.from(document.querySelectorAll(getHeadingSelector()))
            if (domHeadings.length === 0) return

            let nextIndex = 0
            domHeadings.forEach((heading, index) => {
                const rect = heading.getBoundingClientRect()
                if (rect.top <= 140) {
                    nextIndex = index
                }
            })

            setActiveHeadingIndex(nextIndex)
        }

        const scrollContainer = getScrollContainer()
        const queueSync = () => {
            window.requestAnimationFrame(() => {
                syncActiveHeading()
            })
        }

        queueSync()
        scrollContainer?.addEventListener('scroll', syncActiveHeading, { passive: true })
        window.addEventListener('resize', syncActiveHeading)

        const headingRoot = document.querySelector(
            viewMode === 'split' ? '.editor-split__preview .editor' : '.editor-wysiwyg .editor'
        )
        const observer = headingRoot
            ? new MutationObserver(() => {
                queueSync()
            })
            : null

        observer?.observe(headingRoot, { childList: true, subtree: true })

        return () => {
            scrollContainer?.removeEventListener('scroll', syncActiveHeading)
            window.removeEventListener('resize', syncActiveHeading)
            observer?.disconnect()
        }
    }, [activeTab?.id, headings, tocVisible, viewMode])

    const normalizedFilter = filterQuery.trim().toLowerCase()
    const filteredHeadings = normalizedFilter
        ? headings.filter((heading) => heading.text.toLowerCase().includes(normalizedFilter))
        : headings

    const handleHeadingClick = (index: number) => {
        setActiveHeadingIndex(index)
        setTimeout(() => {
            const containerSelector =
                viewMode === 'split' ? '.editor-split__preview .editor' : '.editor-wysiwyg .editor'

            const container = document.querySelector(containerSelector)
            if (!container) return

            const domHeadings = container.querySelectorAll('h1, h2, h3, h4, h5, h6')
            if (domHeadings[index]) {
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
            <div className="toc-panel__filter">
                <Search size={14} className="toc-panel__filter-icon" />
                <input
                    className="toc-panel__filter-input"
                    type="text"
                    placeholder="筛选标题..."
                    value={filterQuery}
                    onChange={(event) => setFilterQuery(event.target.value)}
                />
            </div>
            <div className="toc-panel__content">
                {isIndexing && <div className="toc-panel__empty">Indexing headings...</div>}
                {!isIndexing && headings.length === 0 ? (
                    <div className="toc-panel__empty">暂无标题</div>
                ) : !isIndexing && filteredHeadings.length === 0 ? (
                    <div className="toc-panel__empty">没有匹配的大纲</div>
                ) : (
                    filteredHeadings.map((heading) => (
                        <div
                            key={heading.id}
                            className={`toc-panel__item toc-panel__item--level-${heading.level}${heading.index === activeHeadingIndex ? ' toc-panel__item--active' : ''}`}
                            onClick={() => handleHeadingClick(heading.index)}
                            title={heading.text}
                        >
                            {heading.text}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
