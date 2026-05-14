import type {
    CustomPaperSize,
    DocumentProfile,
    ExportOptions,
    ExportPageBreakMode,
    ExportProfile,
    PaperOrientation,
    PaperPreset
} from '@/stores/editorStore'
import { replaceMermaidFencesWithRenderedBlocks } from '@/utils/mermaid'

export interface PaperPresetMeta {
    id: PaperPreset
    label: string
    detail: string
    pageSize: string
    pageWidth: string
    pageMinHeight: string
    paddingInline: string
    paddingTop: string
    paddingBottom: string
    exportMaxWidth: string
    exportPadding: string
}

export interface DocumentProfileMeta {
    id: DocumentProfile
    label: string
    detail: string
    fontFamily: string
    fontSize: string
    lineHeight: string
    paragraphSpacing: string
    h1Size: string
    h2Size: string
    h3Size: string
}

export interface ExportProfileMeta {
    id: ExportProfile
    label: string
    detail: string
    pageGuides: boolean
    printMargin: string
    screenPadding: string
    showHeader: boolean
    showFooter: boolean
    allowDarkMode: boolean
    pageBreakMode: ExportPageBreakMode
}

export const PAPER_PRESET_META: Record<PaperPreset, PaperPresetMeta> = {
    screen: {
        id: 'screen',
        label: 'Screen',
        detail: 'Flexible reading canvas',
        pageSize: 'auto',
        pageWidth: '800px',
        pageMinHeight: '980px',
        paddingInline: '80px',
        paddingTop: '72px',
        paddingBottom: '96px',
        exportMaxWidth: '980px',
        exportPadding: '45px'
    },
    a4: {
        id: 'a4',
        label: 'A4',
        detail: '210 x 297 mm',
        pageSize: 'A4',
        pageWidth: '794px',
        pageMinHeight: '1123px',
        paddingInline: '72px',
        paddingTop: '64px',
        paddingBottom: '80px',
        exportMaxWidth: '794px',
        exportPadding: '56px'
    },
    letter: {
        id: 'letter',
        label: 'Letter',
        detail: '8.5 x 11 in',
        pageSize: 'Letter',
        pageWidth: '816px',
        pageMinHeight: '1056px',
        paddingInline: '72px',
        paddingTop: '64px',
        paddingBottom: '80px',
        exportMaxWidth: '816px',
        exportPadding: '56px'
    },
    legal: {
        id: 'legal',
        label: 'Legal',
        detail: '8.5 x 14 in',
        pageSize: 'Legal',
        pageWidth: '816px',
        pageMinHeight: '1344px',
        paddingInline: '72px',
        paddingTop: '64px',
        paddingBottom: '80px',
        exportMaxWidth: '816px',
        exportPadding: '56px'
    },
    custom: {
        id: 'custom',
        label: 'Custom',
        detail: 'Adjustable paper size',
        pageSize: '180mm 260mm',
        pageWidth: '680px',
        pageMinHeight: '982px',
        paddingInline: '72px',
        paddingTop: '64px',
        paddingBottom: '80px',
        exportMaxWidth: '680px',
        exportPadding: '56px'
    }
}

export const DOCUMENT_PROFILE_META: Record<DocumentProfile, DocumentProfileMeta> = {
    standard: {
        id: 'standard',
        label: 'Standard',
        detail: 'Balanced reading and editing rhythm',
        fontFamily: "var(--font-editor)",
        fontSize: 'var(--text-lg)',
        lineHeight: '1.8',
        paragraphSpacing: '0.6em',
        h1Size: 'var(--text-3xl)',
        h2Size: 'var(--text-2xl)',
        h3Size: 'var(--text-xl)'
    },
    resume: {
        id: 'resume',
        label: 'Resume',
        detail: 'Compact spacing for one-page documents',
        fontFamily: "Inter, 'Segoe UI', sans-serif",
        fontSize: '15px',
        lineHeight: '1.55',
        paragraphSpacing: '0.35em',
        h1Size: '2rem',
        h2Size: '1.35rem',
        h3Size: '1.08rem'
    },
    manuscript: {
        id: 'manuscript',
        label: 'Manuscript',
        detail: 'Relaxed cadence for reports and long-form writing',
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: '17px',
        lineHeight: '1.92',
        paragraphSpacing: '0.8em',
        h1Size: '2.3rem',
        h2Size: '1.9rem',
        h3Size: '1.45rem'
    }
}

export const EXPORT_PROFILE_META: Record<ExportProfile, ExportProfileMeta> = {
    print: {
        id: 'print',
        label: 'Print',
        detail: 'Paginated preview with print-safe margins',
        pageGuides: true,
        printMargin: '16mm',
        screenPadding: '48px',
        showHeader: true,
        showFooter: true,
        allowDarkMode: false,
        pageBreakMode: 'sections'
    },
    share: {
        id: 'share',
        label: 'Share',
        detail: 'Balanced online readability and print fallback',
        pageGuides: false,
        printMargin: '14mm',
        screenPadding: '40px',
        showHeader: true,
        showFooter: false,
        allowDarkMode: true,
        pageBreakMode: 'manual'
    },
    web: {
        id: 'web',
        label: 'Web',
        detail: 'Continuous long-page web reading',
        pageGuides: false,
        printMargin: '12mm',
        screenPadding: '32px 40px',
        showHeader: false,
        showFooter: false,
        allowDarkMode: true,
        pageBreakMode: 'flow'
    }
}

const BUILTIN_PAPER_DIMENSIONS_MM: Record<Exclude<PaperPreset, 'screen' | 'custom'>, { widthMm: number; heightMm: number }> = {
    a4: { widthMm: 210, heightMm: 297 },
    letter: { widthMm: 216, heightMm: 279 },
    legal: { widthMm: 216, heightMm: 356 },
}

const DEFAULT_PAGE_MARGIN_MM = 16

function mmToPx(mm: number): string {
    return `${Math.round((mm * 96) / 25.4)}px`
}

function clampCustomPaperSize(size: CustomPaperSize | undefined): CustomPaperSize {
    return {
        widthMm: Math.max(120, Math.min(420, Math.round(size?.widthMm ?? 180))),
        heightMm: Math.max(120, Math.min(420, Math.round(size?.heightMm ?? 260))),
    }
}

function clampPageMarginMm(pageMarginMm: number | undefined) {
    return Math.max(8, Math.min(40, Math.round(pageMarginMm ?? DEFAULT_PAGE_MARGIN_MM)))
}

function resolvePaperDimensionsMm(
    preset: PaperPreset,
    customPaperSize: CustomPaperSize | undefined,
    paperOrientation: PaperOrientation
) {
    if (preset === 'screen') return null

    const baseDimensions = preset === 'custom'
        ? clampCustomPaperSize(customPaperSize)
        : BUILTIN_PAPER_DIMENSIONS_MM[preset]

    if (!baseDimensions) return null

    if (paperOrientation === 'landscape') {
        return {
            widthMm: baseDimensions.heightMm,
            heightMm: baseDimensions.widthMm,
        }
    }

    return {
        widthMm: baseDimensions.widthMm,
        heightMm: baseDimensions.heightMm,
    }
}

export function getPaperOrientationLabel(orientation: PaperOrientation) {
    return orientation === 'landscape' ? 'Landscape' : 'Portrait'
}

export function getPaperPresetMeta(
    preset: PaperPreset,
    customPaperSize?: CustomPaperSize,
    paperOrientation: PaperOrientation = 'portrait',
    pageMarginMm: number = DEFAULT_PAGE_MARGIN_MM
): PaperPresetMeta {
    const marginPx = mmToPx(clampPageMarginMm(pageMarginMm))

    if (preset === 'screen') {
        return {
            ...PAPER_PRESET_META.screen,
            paddingInline: marginPx,
            paddingTop: marginPx,
            paddingBottom: marginPx,
            exportPadding: marginPx,
        }
    }

    const size = resolvePaperDimensionsMm(preset, customPaperSize, paperOrientation)
    if (!size) {
        return PAPER_PRESET_META.screen
    }

    const baseMeta = PAPER_PRESET_META[preset]

    return {
        id: preset,
        label: baseMeta.label,
        detail: `${size.widthMm} x ${size.heightMm} mm`,
        pageSize: `${size.widthMm}mm ${size.heightMm}mm`,
        pageWidth: mmToPx(size.widthMm),
        pageMinHeight: mmToPx(size.heightMm),
        paddingInline: marginPx,
        paddingTop: marginPx,
        paddingBottom: marginPx,
        exportMaxWidth: mmToPx(size.widthMm),
        exportPadding: marginPx,
    }
}

export function getDocumentProfileMeta(profile: DocumentProfile): DocumentProfileMeta {
    return DOCUMENT_PROFILE_META[profile] ?? DOCUMENT_PROFILE_META.standard
}

export function getExportProfileMeta(profile: ExportProfile): ExportProfileMeta {
    return EXPORT_PROFILE_META[profile] ?? EXPORT_PROFILE_META.print
}

export function getDefaultExportOptions(profile: ExportProfile): ExportOptions {
    const meta = getExportProfileMeta(profile)
    return {
        showHeader: meta.showHeader,
        showFooter: meta.showFooter,
        pageBreakMode: meta.pageBreakMode,
    }
}

export function shouldShowPageGuides(preset: PaperPreset, profile: ExportProfile): boolean {
    return preset !== 'screen' && getExportProfileMeta(profile).pageGuides
}

export function getPaperCssVariables(
    preset: PaperPreset,
    customPaperSize?: CustomPaperSize,
    paperOrientation: PaperOrientation = 'portrait',
    pageMarginMm: number = DEFAULT_PAGE_MARGIN_MM
): Record<string, string> {
    const meta = getPaperPresetMeta(preset, customPaperSize, paperOrientation, pageMarginMm)
    return {
        '--paper-width': meta.pageWidth,
        '--paper-min-height': meta.pageMinHeight,
        '--paper-padding-inline': meta.paddingInline,
        '--paper-padding-top': meta.paddingTop,
        '--paper-padding-bottom': meta.paddingBottom
    }
}

export function getDocumentProfileCssVariables(profile: DocumentProfile): Record<string, string> {
    const meta = getDocumentProfileMeta(profile)
    return {
        '--doc-font-family': meta.fontFamily,
        '--doc-font-size': meta.fontSize,
        '--doc-line-height': meta.lineHeight,
        '--doc-paragraph-spacing': meta.paragraphSpacing,
        '--doc-h1-size': meta.h1Size,
        '--doc-h2-size': meta.h2Size,
        '--doc-h3-size': meta.h3Size
    }
}

export function buildExportHtmlStyle(
    preset: PaperPreset,
    profile: DocumentProfile,
    exportProfile: ExportProfile,
    customPaperSize?: CustomPaperSize,
    paperOrientation: PaperOrientation = 'portrait',
    pageMarginMm: number = DEFAULT_PAGE_MARGIN_MM
) {
    const meta = getPaperPresetMeta(preset, customPaperSize, paperOrientation, pageMarginMm)
    const profileMeta = getDocumentProfileMeta(profile)
    const exportMeta = getExportProfileMeta(exportProfile)
    const resolvedPageMarginMm = clampPageMarginMm(pageMarginMm)
    const pageRule = exportProfile === 'web'
        ? `@page { margin: ${resolvedPageMarginMm}mm; }`
        : meta.pageSize === 'auto'
            ? `@page { margin: ${resolvedPageMarginMm}mm; }`
            : `@page { size: ${meta.pageSize}; margin: ${resolvedPageMarginMm}mm; }`
    const bodyWidth = exportProfile === 'web' ? '1080px' : meta.exportMaxWidth
    const bodyMinHeight = exportProfile === 'web' ? 'auto' : meta.pageMinHeight
    const bodyPadding = exportProfile === 'web' ? exportMeta.screenPadding : meta.exportPadding
    const darkModeRule = exportMeta.allowDarkMode
        ? `
        @media (prefers-color-scheme: dark) {
            body {
                background-color: #0d1117;
                color: #c9d1d9;
            }
            .export-meta {
                color: #8b949e;
                border-color: rgba(139, 148, 158, 0.32);
            }
            .frontmatter-properties {
                border-color: rgba(96, 165, 250, 0.28);
                background: rgba(15, 23, 42, 0.72);
                color: #c9d1d9;
            }
            .frontmatter-properties__title {
                color: #93c5fd;
            }
            .frontmatter-properties dt {
                color: #94a3b8;
            }
            .frontmatter-properties dd {
                color: #e2e8f0;
            }
        }`
        : ''

    return `
        ${pageRule}
        * { box-sizing: border-box; }
        body {
            min-width: 200px;
            max-width: ${bodyWidth};
            min-height: ${bodyMinHeight};
            margin: 0 auto;
            padding: ${bodyPadding};
            background: #ffffff;
            color: #0f172a;
            font-family: ${profileMeta.fontFamily};
            font-size: ${profileMeta.fontSize};
            line-height: ${profileMeta.lineHeight};
        }
        .markdown-body {
            color: inherit;
        }
        .export-meta {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            color: #5b6470;
            font-size: 12px;
            letter-spacing: 0.01em;
        }
        .export-meta--header {
            margin: 0 0 24px;
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(15, 23, 42, 0.12);
        }
        .export-meta--footer {
            margin: 32px 0 0;
            padding-top: 12px;
            border-top: 1px solid rgba(15, 23, 42, 0.12);
        }
        .export-meta__title {
            color: #0f172a;
            font-size: 13px;
            font-weight: 600;
        }
        .export-meta__detail {
            text-align: right;
        }
        .frontmatter-properties {
            margin: 0 0 24px;
            padding: 16px 18px;
            border: 1px solid rgba(37, 99, 235, 0.16);
            border-radius: 16px;
            background: linear-gradient(135deg, rgba(239, 246, 255, 0.92), rgba(248, 250, 252, 0.92));
            color: #334155;
        }
        .frontmatter-properties__title {
            margin-bottom: 10px;
            color: #1d4ed8;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
        }
        .frontmatter-properties dl {
            display: grid;
            grid-template-columns: minmax(96px, 0.34fr) 1fr;
            gap: 8px 16px;
            margin: 0;
        }
        .frontmatter-properties__row {
            display: contents;
        }
        .frontmatter-properties dt {
            color: #475569;
            font-weight: 650;
        }
        .frontmatter-properties dd {
            margin: 0;
            color: #0f172a;
        }
        #content {
            min-height: ${bodyMinHeight};
        }
        a {
            color: #2563eb;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        h1 { font-size: ${profileMeta.h1Size}; margin: 0 0 0.5em; }
        h2 { font-size: ${profileMeta.h2Size}; margin: 1.1em 0 0.45em; }
        h3 { font-size: ${profileMeta.h3Size}; margin: 1em 0 0.35em; }
        p, li { margin: ${profileMeta.paragraphSpacing} 0; }
        ul, ol {
            padding-left: 1.5em;
        }
        blockquote {
            margin: 1em 0;
            padding: 0.1em 1em;
            border-left: 4px solid rgba(37, 99, 235, 0.4);
            background: rgba(37, 99, 235, 0.06);
            color: #334155;
        }
        table {
            width: max-content;
            min-width: 100%;
            max-width: none;
            border-collapse: collapse;
            margin: 1em 0;
            table-layout: auto;
        }
        th, td {
            border: 1px solid rgba(15, 23, 42, 0.14);
            padding: 0.55em 0.7em;
            text-align: left;
            vertical-align: top;
            min-width: 120px;
            word-break: break-word;
        }
        th {
            background: rgba(148, 163, 184, 0.12);
            font-weight: 600;
        }
        h1, h2, h3, table, pre, blockquote, ul, ol { break-inside: avoid; page-break-inside: avoid; }
        .page-break {
            break-before: page;
            page-break-before: always;
            height: 0;
        }
        .mermaid-export,
        .mermaid-export-fallback {
            margin: 1.25em 0;
            border: 1px solid rgba(15, 23, 42, 0.12);
            border-radius: 14px;
            background: rgba(248, 250, 252, 0.92);
            overflow: hidden;
        }
        .mermaid-export {
            padding: 18px;
        }
        .mermaid-export svg {
            display: block;
            width: 100%;
            height: auto;
        }
        .mermaid-export-fallback {
            padding: 16px 18px;
        }
        .mermaid-export-fallback__title {
            font-weight: 600;
            color: #b45309;
        }
        .mermaid-export-fallback__message {
            margin-top: 6px;
            color: #7c2d12;
            font-size: 13px;
        }
        .mermaid-export-fallback pre {
            margin: 12px 0 0;
        }
        img, svg, canvas {
            max-width: 100%;
        }
        img {
            border-radius: 10px;
        }
        pre {
            overflow-x: auto;
            padding: 16px 18px;
            border-radius: 12px;
            background: #0f172a;
            color: #e2e8f0;
        }
        pre, code {
            white-space: pre-wrap;
            word-break: break-word;
        }
        code {
            font-family: ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', monospace;
            background: rgba(148, 163, 184, 0.16);
            border-radius: 6px;
            padding: 0.12em 0.35em;
        }
        pre code {
            background: transparent;
            padding: 0;
            color: inherit;
        }
        ${darkModeRule}
        @media print {
            body {
                max-width: none;
                margin: 0;
            }
        }
    `.trim()
}

export function preprocessMarkdownForExport(markdown: string, preservePageBreakMarkers = true) {
    if (!markdown) return markdown

    if (!preservePageBreakMarkers) {
        return markdown
            .replace(/^[ \t]*<!--\s*pagebreak\s*-->[ \t]*\r?\n?/gim, '')
            .replace(/^[ \t]*:::\s*pagebreak\s*[ \t]*\r?\n?/gim, '')
    }

    return markdown
        .replace(/^[ \t]*<!--\s*pagebreak\s*-->[ \t]*$/gim, '<div class="page-break"></div>')
        .replace(/^[ \t]*:::\s*pagebreak\s*[ \t]*$/gim, '<div class="page-break"></div>')
}

export async function prepareMarkdownForExport(markdown: string, preservePageBreakMarkers = true) {
    const normalizedMarkdown = preprocessMarkdownForExport(markdown, preservePageBreakMarkers)
    return replaceMermaidFencesWithRenderedBlocks(normalizedMarkdown)
}

export function applyExportPageBreakMode(bodyHtml: string, mode: ExportPageBreakMode) {
    if (!bodyHtml || mode !== 'sections') {
        return bodyHtml
    }

    let headingCount = 0
    return bodyHtml.replace(/<h1\b/gi, (match) => {
        headingCount += 1
        return headingCount === 1 ? match : `<div class="page-break"></div>${match}`
    })
}

function escapeHtml(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

export function buildExportHtmlChrome(
    exportProfile: ExportProfile,
    exportOptions: ExportOptions | undefined,
    options: {
        title: string
        filePath: string | null
        exportedAt: string
    }
) {
    const meta = getExportProfileMeta(exportProfile)
    const resolvedOptions = exportOptions ?? getDefaultExportOptions(exportProfile)
    const sourceLabel = options.filePath ? escapeHtml(options.filePath) : 'Unsaved draft'
    const exportedAt = escapeHtml(options.exportedAt)
    const title = escapeHtml(options.title)

    const header = resolvedOptions.showHeader
        ? `
        <header class="export-meta export-meta--header">
            <div class="export-meta__title">${title}</div>
            <div class="export-meta__detail">${meta.label} export · ${sourceLabel}</div>
        </header>
        `.trim()
        : ''

    const footer = resolvedOptions.showFooter
        ? `
        <footer class="export-meta export-meta--footer">
            <div class="export-meta__title">${meta.label} profile</div>
            <div class="export-meta__detail">Exported at ${exportedAt}</div>
        </footer>
        `.trim()
        : ''

    return { header, footer }
}

export function buildExportHtmlDocument(options: {
    title: string
    bodyHtml: string
    filePath: string | null
    exportedAt: string
    paperPreset: PaperPreset
    paperOrientation?: PaperOrientation
    pageMarginMm?: number
    customPaperSize?: CustomPaperSize
    documentProfile: DocumentProfile
    exportProfile: ExportProfile
    exportOptions?: ExportOptions
}) {
    const safeTitle = escapeHtml(options.title)
    const resolvedOptions = options.exportOptions ?? getDefaultExportOptions(options.exportProfile)
    const exportChrome = buildExportHtmlChrome(options.exportProfile, resolvedOptions, {
        title: options.title,
        filePath: options.filePath,
        exportedAt: options.exportedAt,
    })

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${safeTitle}</title>
    <style>
        ${buildExportHtmlStyle(
            options.paperPreset,
            options.documentProfile,
            options.exportProfile,
            options.customPaperSize,
            options.paperOrientation,
            options.pageMarginMm
        )}
    </style>
</head>
<body class="markdown-body" data-export-profile="${options.exportProfile}" data-page-break-mode="${resolvedOptions.pageBreakMode}">
    ${exportChrome.header}
    <div id="content">${options.bodyHtml}</div>
    ${exportChrome.footer}
</body>
</html>`
}
