import { useEditorStore } from '@/stores/editorStore'
import {
    registerReadonlyPluginCommand,
    registerReadonlyPluginSearchProvider,
    registerReadonlyPluginSidebarCard,
    type ReadonlyPluginManifest
} from './api'

const MANIFEST: ReadonlyPluginManifest = {
    id: 'builtin-knowledge',
    name: 'Knowledge Tools',
    version: '0.1.0',
    description: 'Built-in read-only plugin surface for local knowledge workflow.'
}

let installed = false
let cleanupFns: Array<() => void> = []

export function installBuiltinKnowledgePlugin() {
    if (installed) {
        return () => {}
    }
    installed = true

    cleanupFns.push(
        registerReadonlyPluginCommand(MANIFEST, {
            title: 'rebuild-knowledge-index',
            run: () => {
                void useEditorStore.getState().rebuildKnowledgeIndex()
            }
        })
    )

    cleanupFns.push(
        registerReadonlyPluginSidebarCard(MANIFEST, {
            title: 'Knowledge Toolkit',
            description: 'Quickly rebuild index or open the graph panel.',
            actionLabel: 'Open Graph',
            onAction: () => {
                useEditorStore.getState().setKnowledgeGraphVisible(true)
            }
        })
    )

    cleanupFns.push(
        registerReadonlyPluginSearchProvider(MANIFEST, {
            search: async (query) => {
                const normalized = query.toLowerCase()
                const hits: Array<{ id: string; title: string; subtitle?: string; onSelect: () => void }> = []

                if ('graph network knowledge'.split(' ').some(token => normalized.includes(token))) {
                    hits.push({
                        id: 'open-graph',
                        title: 'Open Knowledge Graph',
                        subtitle: 'Plugin quick action',
                        onSelect: () => useEditorStore.getState().setKnowledgeGraphVisible(true)
                    })
                }

                if ('index reindex rebuild'.split(' ').some(token => normalized.includes(token))) {
                    hits.push({
                        id: 'rebuild-index',
                        title: 'Rebuild Knowledge Index',
                        subtitle: 'Plugin quick action',
                        onSelect: () => {
                            void useEditorStore.getState().rebuildKnowledgeIndex()
                        }
                    })
                }

                return hits
            }
        })
    )

    return () => {
        cleanupFns.forEach(fn => fn())
        cleanupFns = []
        installed = false
    }
}
