import { expect, test } from '@playwright/test'

test('mermaid export preprocessing renders svg and falls back to source when invalid', async ({ page }) => {
    await page.goto('http://localhost:1420')

    const prepared = await page.evaluate(async () => {
        const { prepareMarkdownForExport } = await import('/src/utils/paper.ts')

        return prepareMarkdownForExport([
            '# Mermaid Export',
            '',
            '```mermaid',
            'graph TD',
            '  A[Start] --> B[Done]',
            '```',
            '',
            '```mermaid',
            'graph TD',
            '  A -->',
            '```',
        ].join('\n'))
    })

    expect(prepared).toContain('data-mermaid-export="rendered"')
    expect(prepared).toContain('<svg')
    expect(prepared).toContain('data-mermaid-export="fallback"')
    expect(prepared).toContain('Mermaid export fallback')
    expect(prepared).toContain('A --&gt;')
    expect(prepared).not.toContain('```mermaid')
})
