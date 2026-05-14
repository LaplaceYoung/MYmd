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

export type ReadonlyPluginCommandRegistration = Omit<PluginCommand, 'id'> & {
    id?: string
}

export type ReadonlyPluginSidebarCardRegistration = Omit<PluginSidebarCard, 'id'> & {
    id?: string
}

export interface ReadonlyPluginSearchProviderRegistration {
    id?: string
    search: (query: string) => Promise<PluginSearchHit[]>
}

function slugifyPluginEntryId(value: string) {
    const normalized = value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/g, '-')
        .replace(/^-+|-+$/g, '')

    return normalized || 'entry'
}

function namespacedCommandId(pluginId: string, commandId: string): string {
    return `plugin:${pluginId}.${slugifyPluginEntryId(commandId)}`
}

function namespacedPluginEntryId(pluginId: string, entryId: string): string {
    return `${pluginId}:${slugifyPluginEntryId(entryId)}`
}

export function registerReadonlyPluginCommand(
    manifest: ReadonlyPluginManifest,
    command: ReadonlyPluginCommandRegistration
) {
    const { id: entryId, ...commandInput } = command
    const id = namespacedCommandId(manifest.id, entryId ?? command.title)
    const registered: PluginCommand = {
        ...commandInput,
        id
    }
    useEditorStore.getState().registerPluginCommand(registered)
    return () => useEditorStore.getState().unregisterPluginCommand(id)
}

export function registerReadonlyPluginSidebarCard(
    manifest: ReadonlyPluginManifest,
    card: ReadonlyPluginSidebarCardRegistration
) {
    const { id: entryId, ...cardInput } = card
    const id = namespacedPluginEntryId(manifest.id, entryId ?? card.title)
    useEditorStore.getState().registerPluginSidebarCard({ ...cardInput, id })
    return () => useEditorStore.getState().unregisterPluginSidebarCard(id)
}

export function registerReadonlyPluginSearchProvider(
    manifest: ReadonlyPluginManifest,
    provider: ReadonlyPluginSearchProviderRegistration
) {
    const id = namespacedPluginEntryId(manifest.id, provider.id ?? 'search')
    const wrapped: PluginSearchProvider = {
        id,
        search: provider.search
    }
    useEditorStore.getState().registerPluginSearchProvider(wrapped)
    return () => useEditorStore.getState().unregisterPluginSearchProvider(id)
}
