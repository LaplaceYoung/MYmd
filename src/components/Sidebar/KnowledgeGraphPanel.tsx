import { useEffect, useMemo, useState } from 'react'
import { Network, X } from 'lucide-react'
import { useEditorStore } from '@/stores/editorStore'
import { getKnowledgeGraph } from '@/knowledge/service'
import type { KnowledgeGraphEdge, KnowledgeGraphNode } from '@/knowledge/types'
import { readTextFileWithFallback } from '@/utils/fileRead'
import './KnowledgeGraphPanel.css'

type GraphDepthFilter = 'all' | 'linked' | 'hubs'

const ALL_FOLDERS = '__all_folders__'
const ALL_TAGS = '__all_tags__'

function normalizeGraphKey(value: string): string {
    return value.trim().replace(/\\/g, '/').toLowerCase()
}

function titleFromPath(filePath: string): string {
    const name = filePath.replace(/\\/g, '/').split('/').pop() ?? filePath
    return name.replace(/\.md$/i, '')
}

function folderLabelForNode(filePath: string, workspaceRoot: string | null): string {
    const normalizedPath = filePath.replace(/\\/g, '/')
    const normalizedRoot = workspaceRoot?.replace(/\\/g, '/').replace(/\/+$/u, '') ?? ''
    let relativePath = normalizedPath

    if (normalizedRoot && normalizeGraphKey(normalizedPath).startsWith(normalizeGraphKey(normalizedRoot) + '/')) {
        relativePath = normalizedPath.slice(normalizedRoot.length + 1)
    }

    const parts = relativePath.split('/').filter(Boolean)
    if (parts.length <= 1) return 'Workspace root'
    return parts.slice(0, -1).join('/')
}

function nodeTags(node: KnowledgeGraphNode): string[] {
    return Array.from(new Set((node.tags ?? []).map(tag => tag.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b))
}

export function KnowledgeGraphPanel() {
    const knowledgeGraphVisible = useEditorStore(s => s.knowledgeGraphVisible)
    const setKnowledgeGraphVisible = useEditorStore(s => s.setKnowledgeGraphVisible)
    const activeWorkspace = useEditorStore(s => s.activeWorkspace)
    const openAiPanelWithDraft = useEditorStore(s => s.openAiPanelWithDraft)
    const addTab = useEditorStore(s => s.addTab)
    const markSaved = useEditorStore(s => s.markSaved)
    const pluginSidebarCardsMap = useEditorStore(s => s.pluginSidebarCards)
    const pluginSidebarCards = useMemo(
        () => Object.values(pluginSidebarCardsMap),
        [pluginSidebarCardsMap]
    )

    const [filterText, setFilterText] = useState('')
    const [folderFilter, setFolderFilter] = useState(ALL_FOLDERS)
    const [tagFilter, setTagFilter] = useState(ALL_TAGS)
    const [depthFilter, setDepthFilter] = useState<GraphDepthFilter>('all')
    const [loading, setLoading] = useState(false)
    const [nodes, setNodes] = useState<KnowledgeGraphNode[]>([])
    const [edges, setEdges] = useState<KnowledgeGraphEdge[]>([])

    useEffect(() => {
        if (!knowledgeGraphVisible) return
        setLoading(true)
        getKnowledgeGraph('', 320)
            .then(result => {
                setNodes(result.nodes)
                setEdges(result.edges)
            })
            .catch(error => {
                console.warn('load graph failed:', error)
                setNodes([])
                setEdges([])
            })
            .finally(() => setLoading(false))
    }, [activeWorkspace, knowledgeGraphVisible])

    const graphIndex = useMemo(() => {
        const keyToNodeId = new Map<string, string>()
        const nodeById = new Map<string, KnowledgeGraphNode>()

        for (const node of nodes) {
            nodeById.set(node.id, node)
            const aliases = [
                node.id,
                node.title,
                node.file_path,
                titleFromPath(node.file_path),
            ]
            for (const alias of aliases) {
                const key = normalizeGraphKey(alias)
                if (key) keyToNodeId.set(key, node.id)
            }
        }

        const resolveEndpointId = (endpoint: string) => {
            const key = normalizeGraphKey(endpoint)
            return keyToNodeId.get(key) ?? key
        }

        const degreeByNodeId = new Map<string, number>()
        for (const edge of edges) {
            const fromId = resolveEndpointId(edge.from)
            const toId = resolveEndpointId(edge.to)
            degreeByNodeId.set(fromId, (degreeByNodeId.get(fromId) ?? 0) + 1)
            degreeByNodeId.set(toId, (degreeByNodeId.get(toId) ?? 0) + 1)
        }

        return { degreeByNodeId, keyToNodeId, nodeById, resolveEndpointId }
    }, [edges, nodes])

    const folderOptions = useMemo(() => {
        return Array.from(new Set(nodes.map(node => folderLabelForNode(node.file_path, activeWorkspace))))
            .sort((a, b) => a.localeCompare(b))
    }, [activeWorkspace, nodes])

    const tagOptions = useMemo(() => {
        return Array.from(new Set(nodes.flatMap(node => nodeTags(node))))
            .sort((a, b) => a.localeCompare(b))
    }, [nodes])

    const filteredNodes = useMemo(() => {
        const query = filterText.trim().toLowerCase()

        return nodes.filter(node => {
            const tags = nodeTags(node)
            const folder = folderLabelForNode(node.file_path, activeWorkspace)
            const nodeId = graphIndex.resolveEndpointId(node.id)
            const degree = graphIndex.degreeByNodeId.get(nodeId) ?? 0

            if (query) {
                const searchable = `${node.title} ${node.file_path} ${tags.join(' ')}`.toLowerCase()
                if (!searchable.includes(query)) return false
            }

            if (folderFilter !== ALL_FOLDERS && folder !== folderFilter) return false
            if (tagFilter !== ALL_TAGS && !tags.includes(tagFilter)) return false
            if (depthFilter === 'linked' && degree < 1) return false
            if (depthFilter === 'hubs' && degree < 2) return false

            return true
        })
    }, [activeWorkspace, depthFilter, filterText, folderFilter, graphIndex, nodes, tagFilter])

    const filteredNodeIds = useMemo(() => new Set(filteredNodes.map(node => node.id)), [filteredNodes])

    const filteredEdges = useMemo(() => {
        return edges.filter(edge => {
            const fromId = graphIndex.resolveEndpointId(edge.from)
            const toId = graphIndex.resolveEndpointId(edge.to)
            return filteredNodeIds.has(fromId) && filteredNodeIds.has(toId)
        })
    }, [edges, filteredNodeIds, graphIndex])

    const edgePreview = useMemo(() => filteredEdges.slice(0, 20), [filteredEdges])

    const activeFilterSummary = useMemo(() => {
        const parts: string[] = []
        const query = filterText.trim()
        if (query) parts.push(`Text: ${query}`)
        if (folderFilter !== ALL_FOLDERS) parts.push(`Folder: ${folderFilter}`)
        if (tagFilter !== ALL_TAGS) parts.push(`Tag: #${tagFilter}`)
        if (depthFilter === 'linked') parts.push('Depth: connected')
        if (depthFilter === 'hubs') parts.push('Depth: hubs')
        return parts.join(' / ')
    }, [depthFilter, filterText, folderFilter, tagFilter])

    const displayEndpoint = (endpoint: string) => {
        const nodeId = graphIndex.resolveEndpointId(endpoint)
        const node = graphIndex.nodeById.get(nodeId)
        return node?.title || titleFromPath(node?.file_path ?? endpoint)
    }

    const openAiGraphWorkflow = (mode: 'links' | 'cluster') => {
        const filterHint = activeFilterSummary
            ? ` Focus on the current graph slice filtered by ${activeFilterSummary}.`
            : ' Focus on the current visible graph slice.'
        const graphHint = ` The current graph view contains ${filteredNodes.length} nodes and ${filteredEdges.length} edges.`

        const instruction = mode === 'links'
            ? `Suggest missing wiki links, backlink opportunities, and hub-note upgrades for this knowledge graph.${graphHint}${filterHint}`
            : `Suggest clearer topic clusters, hub notes, and note split opportunities for this knowledge graph.${graphHint}${filterHint}`

        openAiPanelWithDraft({
            taskMode: 'graph',
            instruction,
            includeGraphContext: true,
        })
    }

    const openNode = async (filePath: string) => {
        try {
            const content = await readTextFileWithFallback(filePath)
            const tabId = addTab(filePath, content)
            markSaved(tabId, filePath)
        } catch (error) {
            console.warn('open graph node failed:', filePath, error)
        }
    }

    if (!knowledgeGraphVisible) return null

    const graphSummary = loading
        ? 'Loading graph...'
        : String(filteredNodes.length) + ' nodes / ' + String(filteredEdges.length) + ' edges'

    return (
        <div className="knowledge-graph-panel">
            <div className="knowledge-graph-panel__header">
                <div className="knowledge-graph-panel__title">
                    <Network size={16} />
                    <span>Graph</span>
                </div>
                <button className="knowledge-graph-panel__close" onClick={() => setKnowledgeGraphVisible(false)}>
                    <X size={16} />
                </button>
            </div>
            <div className="knowledge-graph-panel__content">
                <div className="knowledge-graph-panel__hint">Advanced view for connected notes. Use it after the workspace has enough links.</div>
                <input
                    className="knowledge-graph-panel__filter"
                    aria-label="Search graph by title, path, or tag"
                    placeholder="Search title, path, or tag..."
                    value={filterText}
                    onChange={e => setFilterText(e.target.value)}
                />
                <div className="knowledge-graph-panel__controls" aria-label="Graph filters">
                    <label className="knowledge-graph-panel__control">
                        <span>Folder</span>
                        <select
                            aria-label="Filter graph by folder"
                            value={folderFilter}
                            onChange={e => setFolderFilter(e.target.value)}
                        >
                            <option value={ALL_FOLDERS}>All folders</option>
                            {folderOptions.map(folder => (
                                <option key={folder} value={folder}>{folder}</option>
                            ))}
                        </select>
                    </label>
                    <label className="knowledge-graph-panel__control">
                        <span>Tag</span>
                        <select
                            aria-label="Filter graph by tag"
                            value={tagFilter}
                            onChange={e => setTagFilter(e.target.value)}
                        >
                            <option value={ALL_TAGS}>All tags</option>
                            {tagOptions.map(tag => (
                                <option key={tag} value={tag}>#{tag}</option>
                            ))}
                        </select>
                    </label>
                    <label className="knowledge-graph-panel__control">
                        <span>Link depth</span>
                        <select
                            aria-label="Filter graph by link depth"
                            value={depthFilter}
                            onChange={e => setDepthFilter(e.target.value as GraphDepthFilter)}
                        >
                            <option value="all">All nodes</option>
                            <option value="linked">Connected</option>
                            <option value="hubs">Hubs 2+</option>
                        </select>
                    </label>
                </div>
                <div className="knowledge-graph-panel__meta">{graphSummary}</div>
                {activeFilterSummary && (
                    <div className="knowledge-graph-panel__filter-summary">{activeFilterSummary}</div>
                )}
                <div className="knowledge-graph-panel__actions">
                    <button
                        className="knowledge-graph-panel__action"
                        onClick={() => openAiGraphWorkflow('links')}
                    >
                        AI Link Plan
                    </button>
                    <button
                        className="knowledge-graph-panel__action"
                        onClick={() => openAiGraphWorkflow('cluster')}
                    >
                        AI Cluster Map
                    </button>
                </div>

                <div className="knowledge-graph-panel__section">
                    <div className="knowledge-graph-panel__section-title">Edges</div>
                    {edgePreview.map((edge, idx) => (
                        <div key={edge.from + '-' + edge.to + '-' + idx} className="knowledge-graph-panel__edge">
                            <span className="knowledge-graph-panel__edge-from">{displayEndpoint(edge.from)}</span>
                            <span className="knowledge-graph-panel__edge-arrow">-&gt;</span>
                            <span className="knowledge-graph-panel__edge-to">{displayEndpoint(edge.to)}</span>
                        </div>
                    ))}
                    {!loading && edgePreview.length === 0 && (
                        <div className="knowledge-graph-panel__empty">Not enough links yet to render a graph.</div>
                    )}
                </div>

                <div className="knowledge-graph-panel__section">
                    <div className="knowledge-graph-panel__section-title">Nodes</div>
                    {filteredNodes.slice(0, 24).map(node => (
                        <button
                            key={node.id}
                            className="knowledge-graph-panel__node"
                            onClick={() => void openNode(node.file_path)}
                            title={node.file_path}
                        >
                            <span className="knowledge-graph-panel__node-title">{node.title || node.file_path}</span>
                            <span className="knowledge-graph-panel__node-path">{folderLabelForNode(node.file_path, activeWorkspace)}</span>
                            {nodeTags(node).length > 0 && (
                                <span className="knowledge-graph-panel__node-tags">
                                    {nodeTags(node).map(tag => `#${tag}`).join(' ')}
                                </span>
                            )}
                        </button>
                    ))}
                    {!loading && filteredNodes.length === 0 && (
                        <div className="knowledge-graph-panel__empty">Adjust filters to reveal graph nodes.</div>
                    )}
                </div>

                {pluginSidebarCards.length > 0 && (
                    <div className="knowledge-graph-panel__section">
                        <div className="knowledge-graph-panel__section-title">Plugin Cards</div>
                        {pluginSidebarCards.map(card => (
                            <div key={card.id} className="knowledge-graph-panel__plugin-card">
                                <div className="knowledge-graph-panel__plugin-title">{card.title}</div>
                                {card.description && (
                                    <div className="knowledge-graph-panel__plugin-desc">{card.description}</div>
                                )}
                                {card.onAction && (
                                    <button className="knowledge-graph-panel__plugin-action" onClick={card.onAction}>
                                        {card.actionLabel || 'Open'}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
