import { expect, test } from '@playwright/test'
import { buildContextualAiDraft } from '../src/utils/aiDrafts'

test('builds a layout draft with paper and export context', () => {
    const draft = buildContextualAiDraft({
        mode: 'layout',
        title: 'Project Brief',
        paperPreset: 'a4',
        documentProfile: 'resume',
        exportProfile: 'print',
        hasWorkspace: true,
    })

    expect(draft.taskMode).toBe('layout')
    expect(draft.includeGraphContext).toBeFalsy()
    expect(draft.instruction).toContain('Project Brief')
    expect(draft.instruction).toContain('A4')
    expect(draft.instruction).toContain('Print')
})

test('builds a graph draft that opts into graph context', () => {
    const draft = buildContextualAiDraft({
        mode: 'graph',
        title: 'Knowledge Hub',
        paperPreset: 'screen',
        documentProfile: 'standard',
        exportProfile: 'web',
        hasWorkspace: true,
    })

    expect(draft.taskMode).toBe('graph')
    expect(draft.includeGraphContext).toBeTruthy()
    expect(draft.instruction).toContain('Knowledge Hub')
    expect(draft.instruction).toContain('wiki links')
})
