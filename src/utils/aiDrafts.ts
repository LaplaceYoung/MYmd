import type {
    AiPanelDraft,
    CustomPaperSize,
    DocumentProfile,
    ExportProfile,
    PaperOrientation,
    PaperPreset,
} from '@/stores/editorStore'
import {
    getDocumentProfileMeta,
    getExportProfileMeta,
    getPaperOrientationLabel,
    getPaperPresetMeta,
} from '@/utils/paper'

export interface BuildContextualAiDraftInput {
    mode: AiPanelDraft['taskMode']
    title: string
    paperPreset: PaperPreset
    paperOrientation?: PaperOrientation
    customPaperSize?: CustomPaperSize
    pageMarginMm?: number
    documentProfile: DocumentProfile
    exportProfile: ExportProfile
    hasWorkspace: boolean
}

export interface AiScenarioCard {
    id: 'resume-project' | 'weekly-brief' | 'readme-refresh' | 'publish-article' | 'knowledge-cards'
    label: string
    description: string
}

function buildDraftMeta(input: Omit<BuildContextualAiDraftInput, 'mode'>) {
    const paperMeta = getPaperPresetMeta(
        input.paperPreset,
        input.customPaperSize,
        input.paperOrientation,
        input.pageMarginMm
    )
    const orientationLabel = getPaperOrientationLabel(input.paperOrientation ?? 'portrait')
    const paperLabel = paperMeta.id === 'screen'
        ? `${paperMeta.label} (${orientationLabel}, ${input.pageMarginMm ?? 16}mm margin)`
        : `${paperMeta.label} ${orientationLabel} (${paperMeta.detail}, ${input.pageMarginMm ?? 16}mm margin)`
    const profileLabel = getDocumentProfileMeta(input.documentProfile).label
    const exportLabel = getExportProfileMeta(input.exportProfile).label
    const title = input.title.trim() || 'Untitled document'

    return {
        paperLabel,
        profileLabel,
        exportLabel,
        title,
    }
}

export function getAiScenarioCards(): AiScenarioCard[] {
    return [
        {
            id: 'resume-project',
            label: 'Resume Project',
            description: 'Turn raw notes into concise, interview-ready project bullets.',
        },
        {
            id: 'weekly-brief',
            label: 'Weekly Brief',
            description: 'Convert ongoing work into a tight status update with outcomes and next steps.',
        },
        {
            id: 'readme-refresh',
            label: 'README Refresh',
            description: 'Restructure product notes into a cleaner README with clearer value and setup.',
        },
        {
            id: 'publish-article',
            label: 'Publish Article',
            description: 'Expand rough notes into a polished article draft with headings and readable flow.',
        },
        {
            id: 'knowledge-cards',
            label: 'Knowledge Cards',
            description: 'Split a long note into reusable linked cards and hub-note candidates.',
        },
    ]
}

export function buildScenarioAiDraft(
    scenarioId: AiScenarioCard['id'],
    input: Omit<BuildContextualAiDraftInput, 'mode'>
): Omit<AiPanelDraft, 'version'> {
    const { paperLabel, profileLabel, exportLabel, title } = buildDraftMeta(input)

    if (scenarioId === 'resume-project') {
        return {
            taskMode: 'writing',
            includeGraphContext: false,
            instruction: `Rewrite "${title}" into a resume-ready project entry for the ${profileLabel} profile. Keep it factual, compact, metric-aware when evidence exists, and make the output fit a ${paperLabel} ${exportLabel} handoff.`,
        }
    }

    if (scenarioId === 'weekly-brief') {
        return {
            taskMode: 'writing',
            includeGraphContext: false,
            instruction: `Turn "${title}" into a weekly brief with progress, outcomes, blockers, and next steps. Keep the structure easy to scan and suitable for the ${exportLabel} export profile.`,
        }
    }

    if (scenarioId === 'readme-refresh') {
        return {
            taskMode: 'writing',
            includeGraphContext: false,
            instruction: `Restructure "${title}" into a sharper README. Clarify product value, core capabilities, setup steps, and usage flow while preserving the original facts and matching the ${profileLabel} profile tone.`,
        }
    }

    if (scenarioId === 'publish-article') {
        return {
            taskMode: 'writing',
            includeGraphContext: false,
            instruction: `Expand "${title}" into a polished article draft with a strong title, clean H2/H3 structure, natural transitions, and a readable pace suitable for the ${exportLabel} export profile on a ${paperLabel} canvas.`,
        }
    }

    return {
        taskMode: 'graph',
        includeGraphContext: input.hasWorkspace,
        instruction: `Break "${title}" into reusable knowledge cards, suggest stronger wiki links, and identify hub-note opportunities. Use current graph context when available and keep the structure aligned with the ${profileLabel} document profile.`,
    }
}

export function buildContextualAiDraft(input: BuildContextualAiDraftInput): Omit<AiPanelDraft, 'version'> {
    const { paperLabel, profileLabel, exportLabel, title } = buildDraftMeta(input)

    if (input.mode === 'layout') {
        return {
            taskMode: 'layout',
            includeGraphContext: false,
            instruction: `Improve the layout of "${title}" for a ${paperLabel} canvas using the ${profileLabel} layout profile and ${exportLabel} export profile. Tighten heading rhythm, spacing, lists, and print readiness without changing the facts.`,
        }
    }

    if (input.mode === 'graph') {
        return {
            taskMode: 'graph',
            includeGraphContext: input.hasWorkspace,
            instruction: `Improve the knowledge structure of "${title}" with stronger wiki links, hub notes, backlinks, and note-splitting suggestions. Use the current graph context when it is available.`,
        }
    }

    return {
        taskMode: 'content',
        includeGraphContext: false,
        instruction: `Rewrite "${title}" into a clearer, tighter draft while preserving the facts. Improve flow, reduce redundancy, and keep the tone aligned with the ${profileLabel} document profile.`,
    }
}
