import {
    type PluginCommand,
    type PluginSearchHit,
    type PluginSearchProvider,
    type PluginSidebarCard,
    useEditorStore
} from '@/stores/editorStore'

export interface ReadonlyPluginManifest {
    id: string
    name: string
    version: string
    description?: string
}

function namespacedCommandId(pluginId: string, commandId: string): string {
    return `plugin:${pluginId}.${commandId}`
}

export function registerReadonlyPluginCommand(
    manifest: ReadonlyPluginManifest,
    command: Omit<PluginCommand, 'id'>
) {
    const id = namespacedCommandId(manifest.id, command.title.toLowerCase().replace(/\s+/g, '-'))
    const registered: PluginCommand = {
        ...command,
        id
    }
    useEditorStore.getState().registerPluginCommand(registered)
    return () => useEditorStore.getState().unregisterPluginCommand(id)
}

export function registerReadonlyPluginSidebarCard(
    manifest: ReadonlyPluginManifest,
    card: Omit<PluginSidebarCard, 'id'>
) {
    const id = `${manifest.id}:${card.title.toLowerCase().replace(/\s+/g, '-')}`
    useEditorStore.getState().registerPluginSidebarCard({ ...card, id })
    return () => useEditorStore.getState().unregisterPluginSidebarCard(id)
}

export function registerReadonlyPluginSearchProvider(
    manifest: ReadonlyPluginManifest,
    provider: {
        search: (query: string) => Promise<PluginSearchHit[]>
    }
) {
    const id = `${manifest.id}:search`
    const wrapped: PluginSearchProvider = {
        id,
        search: provider.search
    }
    useEditorStore.getState().registerPluginSearchProvider(wrapped)
    return () => useEditorStore.getState().unregisterPluginSearchProvider(id)
}
