import type {
    AiPanelDraft,
    CustomPaperSize,
    DocumentProfile,
    ExportProfile,
    PaperPreset,
} from '@/stores/editorStore'
import {
    getDocumentProfileMeta,
    getExportProfileMeta,
    getPaperPresetMeta,
} from '@/utils/paper'

export interface BuildContextualAiDraftInput {
    mode: AiPanelDraft['taskMode']
    title: string
    paperPreset: PaperPreset
    customPaperSize?: CustomPaperSize
    documentProfile: DocumentProfile
    exportProfile: ExportProfile
    hasWorkspace: boolean
}

export function buildContextualAiDraft(input: BuildContextualAiDraftInput): Omit<AiPanelDraft, 'version'> {
    const paperMeta = getPaperPresetMeta(input.paperPreset, input.customPaperSize)
    const paperLabel = paperMeta.id === 'custom'
        ? `${paperMeta.label} (${paperMeta.detail})`
        : paperMeta.label
    const profileLabel = getDocumentProfileMeta(input.documentProfile).label
    const exportLabel = getExportProfileMeta(input.exportProfile).label
    const title = input.title.trim() || 'Untitled document'

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
