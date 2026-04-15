import { marked } from 'marked'
import {
    buildExportHtmlDocument,
    getDefaultExportOptions,
    prepareMarkdownForExport,
} from '@/utils/paper'
import { applyTableWidthDirectivesToHtml } from '@/utils/tableWidths'
import type {
    CustomPaperSize,
    DocumentProfile,
    ExportOptions,
    ExportProfile,
    PaperOrientation,
    PaperPreset,
} from '@/stores/editorStore'

export interface RenderMarkdownDocumentInput {
    title: string
    markdown: string
    filePath?: string | null
    exportedAt?: string
    paperPreset?: PaperPreset
    paperOrientation?: PaperOrientation
    pageMarginMm?: number
    customPaperSize?: CustomPaperSize
    documentProfile?: DocumentProfile
    exportProfile?: ExportProfile
    exportOptions?: ExportOptions
    preservePageBreakMarkers?: boolean
}

export interface RenderMarkdownDocumentResult {
    title: string
    preparedMarkdown: string
    bodyHtml: string
    html: string
    exportOptions: ExportOptions
}

marked.setOptions({
    gfm: true,
    breaks: false,
})

function resolveExportTimestamp(value?: string) {
    return value?.trim() || new Date().toISOString()
}

export async function renderMarkdownBodyHtml(markdown: string, preservePageBreakMarkers = true) {
    const preparedMarkdown = await prepareMarkdownForExport(markdown, preservePageBreakMarkers)
    const rawBodyHtml = marked.parse(preparedMarkdown) as string
    const bodyHtml = applyTableWidthDirectivesToHtml(rawBodyHtml, preparedMarkdown)
    return {
        preparedMarkdown,
        bodyHtml,
    }
}

export async function renderMarkdownDocumentToHtml(
    input: RenderMarkdownDocumentInput
): Promise<RenderMarkdownDocumentResult> {
    const paperPreset = input.paperPreset ?? 'screen'
    const paperOrientation = input.paperOrientation ?? 'portrait'
    const documentProfile = input.documentProfile ?? 'standard'
    const exportProfile = input.exportProfile ?? 'web'
    const exportOptions = input.exportOptions ?? getDefaultExportOptions(exportProfile)
    const exportedAt = resolveExportTimestamp(input.exportedAt)
    const { preparedMarkdown, bodyHtml } = await renderMarkdownBodyHtml(
        input.markdown,
        input.preservePageBreakMarkers ?? true
    )

    const html = buildExportHtmlDocument({
        title: input.title,
        bodyHtml,
        filePath: input.filePath ?? null,
        exportedAt,
        paperPreset,
        paperOrientation,
        pageMarginMm: input.pageMarginMm,
        customPaperSize: input.customPaperSize,
        documentProfile,
        exportProfile,
        exportOptions,
    })

    return {
        title: input.title,
        preparedMarkdown,
        bodyHtml,
        html,
        exportOptions,
    }
}
