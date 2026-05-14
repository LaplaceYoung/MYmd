import { expect, test } from '@playwright/test'
import { renderMarkdownBodyHtml, renderMarkdownDocumentToHtml } from '../src/utils/renderApi'

test('renders markdown body html through the shared export preparation lane', async () => {
    const result = await renderMarkdownBodyHtml([
        '# Automation Surface',
        '',
        'A paragraph with **bold** text.',
        '',
        '- One',
        '- Two',
        '',
        '```mermaid',
        'graph TD',
        '  A[Start] --> B[Done]',
        '```',
    ].join('\n'))

    expect(result.preparedMarkdown).toContain('data-mermaid-export=')
    expect(result.bodyHtml).toContain('<h1>Automation Surface</h1>')
    expect(result.bodyHtml).toContain('<strong>bold</strong>')
    expect(result.bodyHtml).toContain('<li>One</li>')
    expect(result.bodyHtml).toContain('data-mermaid-export=')
})

test('renders leading yaml frontmatter as export properties', async () => {
    const result = await renderMarkdownBodyHtml([
        '---',
        'title: "Launch Plan"',
        'status: draft',
        'tags: [alpha, beta]',
        'owner: "<Ops>"',
        '---',
        '',
        '# Launch Plan',
        '',
        'Keep the document body focused.',
    ].join('\n'))

    expect(result.bodyHtml).toContain('class="frontmatter-properties"')
    expect(result.bodyHtml).toContain('<dt>title</dt>')
    expect(result.bodyHtml).toContain('<dd>Launch Plan</dd>')
    expect(result.bodyHtml).toContain('<dd>alpha, beta</dd>')
    expect(result.bodyHtml).toContain('&lt;Ops&gt;')
    expect(result.bodyHtml).toContain('<h1>Launch Plan</h1>')
    expect(result.bodyHtml).toContain('Keep the document body focused.')
    expect(result.bodyHtml).not.toContain('title:')
    expect(result.bodyHtml).not.toContain('<hr>')
})

test('builds a full export html document from raw markdown input', async () => {
    const result = await renderMarkdownDocumentToHtml({
        title: 'Automation Brief',
        markdown: [
            '# Automation Brief',
            '',
            'Ship a stable export lane.',
            '',
            '## Checklist',
            '',
            '- Preserve theme',
            '- Keep Markdown readable',
        ].join('\n'),
        filePath: 'F:/vault/Automation Brief.md',
        exportedAt: '2026-04-15 22:10:00',
        paperPreset: 'a4',
        documentProfile: 'standard',
        exportProfile: 'print',
    })

    expect(result.exportOptions).toEqual({
        showHeader: true,
        showFooter: true,
        pageBreakMode: 'sections',
    })
    expect(result.bodyHtml).toContain('<h2>Checklist</h2>')
    expect(result.html).toContain('<title>Automation Brief</title>')
    expect(result.html).toContain('data-export-profile="print"')
    expect(result.html).toContain('Automation Brief')
    expect(result.html).toContain('Ship a stable export lane.')
    expect(result.html).not.toContain('cdn.jsdelivr.net')
})
