import { useEditorStore } from '@/stores/editorStore'
import {
    registerReadonlyPluginCommand,
    registerReadonlyPluginSearchProvider,
    registerReadonlyPluginSidebarCard,
    type ReadonlyPluginManifest
} from './api'

const MANIFEST: ReadonlyPluginManifest = {
    id: 'builtin-ai',
    name: 'AI Assistant',
    version: '0.1.0',
    description: 'Built-in AI editing entry for layout, content and knowledge graph improvements.'
}

let installed = false
let cleanupFns: Array<() => void> = []

export function installBuiltinAiPlugin() {
    if (installed) {
        return () => {}
    }
    installed = true

    cleanupFns.push(
        registerReadonlyPluginCommand(MANIFEST, {
            title: 'open-ai-assistant',
            run: () => {
                useEditorStore.getState().setAiPanelVisible(true)
            }
        })
    )

    cleanupFns.push(
        registerReadonlyPluginSidebarCard(MANIFEST, {
            title: 'AI Writing Assistant',
            description: 'Open a human-in-the-loop AI panel for layout polish, rewriting and graph suggestions.',
            actionLabel: 'Open AI',
            onAction: () => {
                useEditorStore.getState().setAiPanelVisible(true)
            }
        })
    )

    cleanupFns.push(
        registerReadonlyPluginSearchProvider(MANIFEST, {
            search: async (query) => {
                const normalized = query.toLowerCase()
                if (!'ai assistant rewrite layout graph polish'.split(' ').some(token => normalized.includes(token))) {
                    return []
                }

                return [
                    {
                        id: 'open-ai-panel',
                        title: 'Open AI Assistant',
                        subtitle: 'Layout polish / rewrite / graph enhancement',
                        onSelect: () => {
                            useEditorStore.getState().setAiPanelVisible(true)
                        }
                    }
                ]
            }
        })
    )

    return () => {
        cleanupFns.forEach(fn => fn())
        cleanupFns = []
        installed = false
    }
}
