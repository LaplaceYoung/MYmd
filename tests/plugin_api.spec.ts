import { expect, test } from '@playwright/test'
import {
    registerReadonlyPluginCommand,
    registerReadonlyPluginSearchProvider,
    registerReadonlyPluginSidebarCard,
    type ReadonlyPluginManifest,
} from '../src/plugins/api'
import { useEditorStore } from '../src/stores/editorStore'

const MANIFEST: ReadonlyPluginManifest = {
    id: 'contract-plugin',
    name: 'Contract Plugin',
    version: '0.1.0',
}

test('readonly plugin commands use stable namespaced ids and cleanup', () => {
    let payloadSeen: unknown = null

    const cleanup = registerReadonlyPluginCommand(MANIFEST, {
        id: 'open-workflow',
        title: 'Open Workflow',
        run: payload => {
            payloadSeen = payload
        },
    })

    const commandId = 'plugin:contract-plugin.open-workflow'
    expect(useEditorStore.getState().pluginCommands[commandId]?.title).toBe('Open Workflow')

    useEditorStore.getState().runPluginCommand(commandId, { source: 'test' })
    expect(payloadSeen).toEqual({ source: 'test' })

    cleanup()
    expect(useEditorStore.getState().pluginCommands[commandId]).toBeUndefined()
})

test('readonly plugin command ids fall back to slugified titles', () => {
    const cleanup = registerReadonlyPluginCommand(MANIFEST, {
        title: 'Open Knowledge Graph',
        run: () => {},
    })

    const commandId = 'plugin:contract-plugin.open-knowledge-graph'
    expect(useEditorStore.getState().pluginCommands[commandId]?.title).toBe('Open Knowledge Graph')

    cleanup()
    expect(useEditorStore.getState().pluginCommands[commandId]).toBeUndefined()
})

test('readonly plugin sidebar cards and search providers are removable', async () => {
    const cleanupCard = registerReadonlyPluginSidebarCard(MANIFEST, {
        id: 'insight-card',
        title: 'Insight Card',
        description: 'Shows plugin-provided context.',
        actionLabel: 'Open',
    })
    const cleanupSearch = registerReadonlyPluginSearchProvider(MANIFEST, {
        id: 'insight-search',
        search: async query => [{
            id: `hit:${query}`,
            title: `Plugin hit for ${query}`,
            onSelect: () => {},
        }],
    })

    const cardId = 'contract-plugin:insight-card'
    const providerId = 'contract-plugin:insight-search'
    expect(useEditorStore.getState().pluginSidebarCards[cardId]?.title).toBe('Insight Card')
    expect(useEditorStore.getState().pluginSearchProviders[providerId]).toBeDefined()

    await expect(useEditorStore.getState().queryPluginSearch('alpha')).resolves.toEqual([
        expect.objectContaining({
            id: 'hit:alpha',
            title: 'Plugin hit for alpha',
        }),
    ])

    cleanupCard()
    cleanupSearch()
    expect(useEditorStore.getState().pluginSidebarCards[cardId]).toBeUndefined()
    expect(useEditorStore.getState().pluginSearchProviders[providerId]).toBeUndefined()
})
