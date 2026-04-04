import { expect, test } from '@playwright/test'
import {
    applyExportPageBreakMode,
    buildExportHtmlDocument,
    getDefaultExportOptions,
    preprocessMarkdownForExport,
} from '../src/utils/paper'

test('builds self-contained export html without CDN dependencies', () => {
    const html = buildExportHtmlDocument({
        title: 'Product Spec',
        bodyHtml: '<h1>Spec</h1><p>Hello export.</p>',
        filePath: 'F:/vault/Product Spec.md',
        exportedAt: '2026-04-04 20:00:00',
        paperPreset: 'a4',
        documentProfile: 'standard',
        exportProfile: 'print'
    })

    expect(html).toContain('<body class="markdown-body" data-export-profile="print" data-page-break-mode="sections">')
    expect(html).toContain('<h1>Spec</h1><p>Hello export.</p>')
    expect(html).toContain('Product Spec')
    expect(html).not.toContain('cdn.jsdelivr.net')
    expect(html).not.toContain('github-markdown-css')
    expect(html).not.toContain('marked.parse')
})

test('supports explicit export header/footer overrides', () => {
    const html = buildExportHtmlDocument({
        title: 'Weekly Brief',
        bodyHtml: '<h1>Brief</h1><p>Body</p>',
        filePath: null,
        exportedAt: '2026-04-04 20:10:00',
        paperPreset: 'a4',
        documentProfile: 'resume',
        exportProfile: 'print',
        exportOptions: {
            showHeader: false,
            showFooter: true,
            pageBreakMode: 'manual',
        },
    })

    expect(html).not.toContain('<header class="export-meta export-meta--header">')
    expect(html).toContain('<footer class="export-meta export-meta--footer">')
})

test('supports custom paper sizes in export styles', () => {
    const html = buildExportHtmlDocument({
        title: 'Custom Sheet',
        bodyHtml: '<h1>Sheet</h1><p>Body</p>',
        filePath: null,
        exportedAt: '2026-04-04 20:11:00',
        paperPreset: 'custom',
        customPaperSize: {
            widthMm: 180,
            heightMm: 260,
        },
        documentProfile: 'standard',
        exportProfile: 'print',
    })

    expect(html).toContain('@page { size: 180mm 260mm; margin: 16mm; }')
    expect(html).toContain('max-width: 680px;')
})

test('converts explicit page-break markers in markdown before export', () => {
    const markdown = [
        '# First',
        '',
        'Alpha',
        '',
        '<!-- pagebreak -->',
        '',
        ':::pagebreak',
        '',
        '# Second',
    ].join('\n')

    const preprocessed = preprocessMarkdownForExport(markdown)

    expect(preprocessed).toContain('<div class="page-break"></div>')
    expect(preprocessed.match(/page-break/g)?.length).toBe(2)
})

test('injects section page breaks before subsequent h1 blocks when section mode is enabled', () => {
    const html = applyExportPageBreakMode(
        '<h1>First</h1><p>Alpha</p><h1>Second</h1><p>Beta</p><h1>Third</h1>',
        'sections'
    )

    expect(html).toContain('<h1>First</h1><p>Alpha</p><div class="page-break"></div><h1>Second</h1>')
    expect(html).toContain('<p>Beta</p><div class="page-break"></div><h1>Third</h1>')
})

test('returns profile-aligned default export options', () => {
    expect(getDefaultExportOptions('print')).toEqual({
        showHeader: true,
        showFooter: true,
        pageBreakMode: 'sections',
    })

    expect(getDefaultExportOptions('web')).toEqual({
        showHeader: false,
        showFooter: false,
        pageBreakMode: 'flow',
    })
})
