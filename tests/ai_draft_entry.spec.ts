import { expect, test } from '@playwright/test'
import {
    buildContextualAiDraft,
    buildScenarioAiDraft,
    getAiScenarioCards,
} from '../src/utils/aiDrafts'

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

test('returns scenario cards for result-first AI workflows', () => {
    const cards = getAiScenarioCards()

    expect(cards.length).toBeGreaterThanOrEqual(5)
    expect(cards.some((card) => card.id === 'resume-project')).toBeTruthy()
    expect(cards.some((card) => card.id === 'weekly-brief')).toBeTruthy()
    expect(cards.some((card) => card.id === 'readme-refresh')).toBeTruthy()
})

test('builds a resume-project scenario draft with resume-aware instruction', () => {
    const draft = buildScenarioAiDraft('resume-project', {
        title: 'MYmd Upgrade Notes',
        paperPreset: 'a4',
        documentProfile: 'resume',
        exportProfile: 'print',
        hasWorkspace: true,
    })

    expect(draft.taskMode).toBe('writing')
    expect(draft.includeGraphContext).toBeFalsy()
    expect(draft.instruction).toContain('resume')
    expect(draft.instruction).toContain('MYmd Upgrade Notes')
    expect(draft.instruction).toContain('A4')
})
