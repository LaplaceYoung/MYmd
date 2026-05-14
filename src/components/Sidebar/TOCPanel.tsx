import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronRight, List, Search, X } from 'lucide-react'
import { useEditorStore } from '@/stores/editorStore'
import { analyzeDocumentPerformance } from '@/utils/performance'
import './TOCPanel.css'

interface TOCItem {
    id: string
    level: number
    text: string
    index: number
}

interface TOCTreeNode extends TOCItem {
    children: TOCTreeNode[]
    parentId: string | null
}

interface PersistedTocState {
    collapsedByTab: Record<string, string[]>
    activeByTab: Record<string, number>
}

const TOC_STATE_STORAGE_KEY = 'mymd:toc-state:v1'

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

function buildHeadingTree(items: TOCItem[]): TOCTreeNode[] {
    const roots: TOCTreeNode[] = []
    const stack: TOCTreeNode[] = []

    for (const item of items) {
        const node: TOCTreeNode = {
            ...item,
            children: [],
            parentId: null,
        }

        while (stack.length > 0 && stack[stack.length - 1].level >= node.level) {
            stack.pop()
        }

        const parent = stack[stack.length - 1] ?? null
        if (parent) {
            node.parentId = parent.id
            parent.children.push(node)
        } else {
            roots.push(node)
        }

        stack.push(node)
    }

    return roots
}

function filterHeadingTree(nodes: TOCTreeNode[], query: string): TOCTreeNode[] {
    if (!query) return nodes

    const lowered = query.toLowerCase()
    const visit = (node: TOCTreeNode): TOCTreeNode | null => {
        const children = node.children
            .map(visit)
            .filter((child): child is TOCTreeNode => child !== null)

        if (node.text.toLowerCase().includes(lowered) || children.length > 0) {
            return { ...node, children }
        }

        return null
    }

    return nodes
        .map(visit)
        .filter((node): node is TOCTreeNode => node !== null)
}

function flattenVisibleTree(
    nodes: TOCTreeNode[],
    collapsedIds: Set<string>,
    forceExpand = false
): TOCTreeNode[] {
    const result: TOCTreeNode[] = []

    const visit = (node: TOCTreeNode) => {
        result.push(node)
        if (forceExpand || !collapsedIds.has(node.id)) {
            node.children.forEach(visit)
        }
    }

    nodes.forEach(visit)
    return result
}

function loadPersistedTocState(): PersistedTocState {
    if (typeof window === 'undefined') {
        return { collapsedByTab: {}, activeByTab: {} }
    }

    try {
        const raw = window.localStorage.getItem(TOC_STATE_STORAGE_KEY)
        if (!raw) return { collapsedByTab: {}, activeByTab: {} }

        const parsed = JSON.parse(raw) as Partial<PersistedTocState>
        return {
            collapsedByTab: parsed.collapsedByTab ?? {},
            activeByTab: parsed.activeByTab ?? {},
        }
    } catch {
        return { collapsedByTab: {}, activeByTab: {} }
    }
}

function persistTocState(nextState: PersistedTocState) {
    if (typeof window === 'undefined') return

    try {
        window.localStorage.setItem(TOC_STATE_STORAGE_KEY, JSON.stringify(nextState))
    } catch {
        // ignore persistence failures
    }
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
    const [collapsedIds, setCollapsedIds] = useState<string[]>([])
    const pendingRestoreTabIdRef = useRef<string | null>(null)

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

        if (!activeTab?.id) {
            setCollapsedIds([])
            setActiveHeadingIndex(-1)
            return
        }

        const persisted = loadPersistedTocState()
        pendingRestoreTabIdRef.current = activeTab.id
        setCollapsedIds(persisted.collapsedByTab[activeTab.id] ?? [])
        setActiveHeadingIndex(persisted.activeByTab[activeTab.id] ?? -1)
    }, [activeTab?.id])

    useEffect(() => {
        const validHeadingIds = new Set(headings.map((heading) => heading.id))

        setCollapsedIds((current) => current.filter((id) => validHeadingIds.has(id)))
        setActiveHeadingIndex((current) => (
            headings.some((heading) => heading.index === current)
                ? current
                : (headings[0]?.index ?? -1)
        ))
    }, [headings])

    useEffect(() => {
        if (!activeTab?.id) return
        if (pendingRestoreTabIdRef.current === activeTab.id) {
            pendingRestoreTabIdRef.current = null
            return
        }

        const persisted = loadPersistedTocState()
        persisted.collapsedByTab[activeTab.id] = collapsedIds
        if (activeHeadingIndex >= 0) {
            persisted.activeByTab[activeTab.id] = activeHeadingIndex
        }
        persistTocState(persisted)
    }, [activeHeadingIndex, activeTab?.id, collapsedIds])

    const headingTree = useMemo(() => buildHeadingTree(headings), [headings])
    const normalizedFilter = filterQuery.trim().toLowerCase()
    const filteredTree = useMemo(
        () => filterHeadingTree(headingTree, normalizedFilter),
        [headingTree, normalizedFilter]
    )
    const collapsedIdSet = useMemo(() => new Set(collapsedIds), [collapsedIds])
    const visibleHeadings = useMemo(
        () => flattenVisibleTree(filteredTree, collapsedIdSet, Boolean(normalizedFilter)),
        [collapsedIdSet, filteredTree, normalizedFilter]
    )

    useEffect(() => {
        if (!tocVisible || headings.length === 0 || normalizedFilter) return

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
        let observer: MutationObserver | null = null
        if (headingRoot) {
            observer = new MutationObserver(() => {
                queueSync()
            })
            observer.observe(headingRoot, { childList: true, subtree: true })
        }

        return () => {
            scrollContainer?.removeEventListener('scroll', syncActiveHeading)
            window.removeEventListener('resize', syncActiveHeading)
            observer?.disconnect()
        }
    }, [activeTab?.id, headings, normalizedFilter, tocVisible, viewMode])

    const toggleCollapsed = (headingId: string) => {
        setCollapsedIds((current) => (
            current.includes(headingId)
                ? current.filter((id) => id !== headingId)
                : [...current, headingId]
        ))
    }

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
                ) : !isIndexing && visibleHeadings.length === 0 ? (
                    <div className="toc-panel__empty">没有匹配的大纲</div>
                ) : (
                    visibleHeadings.map((heading) => (
                        <div
                            key={heading.id}
                            className={`toc-panel__item toc-panel__item--level-${heading.level}${heading.index === activeHeadingIndex ? ' toc-panel__item--active' : ''}`}
                            data-toc-index={heading.index}
                            title={heading.text}
                        >
                            <div
                                className="toc-panel__row"
                                onClick={() => handleHeadingClick(heading.index)}
                            >
                                {heading.children.length > 0 ? (
                                    <button
                                        type="button"
                                        className={`toc-panel__toggle${collapsedIdSet.has(heading.id) && !normalizedFilter ? ' is-collapsed' : ''}`}
                                        data-toc-index={heading.index}
                                        aria-label={collapsedIdSet.has(heading.id) && !normalizedFilter ? 'Expand heading section' : 'Collapse heading section'}
                                        aria-expanded={collapsedIdSet.has(heading.id) && !normalizedFilter ? 'false' : 'true'}
                                        onClick={(event) => {
                                            event.stopPropagation()
                                            toggleCollapsed(heading.id)
                                        }}
                                    >
                                        <ChevronRight size={12} />
                                    </button>
                                ) : (
                                    <span className="toc-panel__toggle-spacer" />
                                )}
                                <span className="toc-panel__item-label">{heading.text}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
