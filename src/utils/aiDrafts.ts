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

export function buildContextualAiDraft(input: BuildContextualAiDraftInput): Omit<AiPanelDraft, 'version'> {
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
