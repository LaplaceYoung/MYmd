import { useEffect, useMemo, useState } from 'react'
import { Network, X } from 'lucide-react'
import { useEditorStore } from '@/stores/editorStore'
import { getKnowledgeGraph } from '@/knowledge/service'
import { readTextFileWithFallback } from '@/utils/fileRead'
import './KnowledgeGraphPanel.css'

export function KnowledgeGraphPanel() {
    const knowledgeGraphVisible = useEditorStore(s => s.knowledgeGraphVisible)
    const setKnowledgeGraphVisible = useEditorStore(s => s.setKnowledgeGraphVisible)
    const addTab = useEditorStore(s => s.addTab)
    const markSaved = useEditorStore(s => s.markSaved)
    const pluginSidebarCards = useEditorStore(s => Object.values(s.pluginSidebarCards))

    const [filterText, setFilterText] = useState('')
    const [loading, setLoading] = useState(false)
    const [nodes, setNodes] = useState<{ id: string; title: string; file_path: string }[]>([])
    const [edges, setEdges] = useState<{ from: string; to: string; raw_text: string }[]>([])

    useEffect(() => {
        if (!knowledgeGraphVisible) return
        setLoading(true)
        getKnowledgeGraph(filterText, 220)
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
    }, [filterText, knowledgeGraphVisible])

    const edgePreview = useMemo(() => edges.slice(0, 20), [edges])

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

    const graphSummary = loading ? 'Loading graph...' : String(nodes.length) + ' nodes / ' + String(edges.length) + ' edges'

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
                    placeholder="Filter graph nodes..."
                    value={filterText}
                    onChange={e => setFilterText(e.target.value)}
                />
                <div className="knowledge-graph-panel__meta">{graphSummary}</div>

                <div className="knowledge-graph-panel__section">
                    <div className="knowledge-graph-panel__section-title">Edges</div>
                    {edgePreview.map((edge, idx) => (
                        <div key={edge.from + '-' + edge.to + '-' + idx} className="knowledge-graph-panel__edge">
                            <span className="knowledge-graph-panel__edge-from">{edge.from}</span>
                            <span className="knowledge-graph-panel__edge-arrow">-&gt;</span>
                            <span className="knowledge-graph-panel__edge-to">{edge.to}</span>
                        </div>
                    ))}
                    {!loading && edgePreview.length === 0 && (
                        <div className="knowledge-graph-panel__empty">Not enough links yet to render a graph.</div>
                    )}
                </div>

                <div className="knowledge-graph-panel__section">
                    <div className="knowledge-graph-panel__section-title">Nodes</div>
                    {nodes.slice(0, 24).map(node => (
                        <button
                            key={node.id}
                            className="knowledge-graph-panel__node"
                            onClick={() => void openNode(node.file_path)}
                            title={node.file_path}
                        >
                            {node.title || node.file_path}
                        </button>
                    ))}
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