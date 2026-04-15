import { expect, test } from '@playwright/test'

test('table width command persists a width directive and applies width-aware HTML rendering', async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.setItem('mymd:view-mode-guide:v1', 'dismissed')
        window.localStorage.removeItem('mymd:session:v1')
    })

    await page.goto('http://localhost:1420')
    await page.waitForLoadState('networkidle')

    await page.evaluate(async () => {
        const { useEditorStore } = await import('/src/stores/editorStore.ts')
        const markdown = [
            '# Wide table',
            '',
            '| Name | Value | Status |',
            '| --- | --- | --- |',
            '| Alpha | 120 | Active |',
            '| Beta | 96 | Review |',
        ].join('\n')

        const store = useEditorStore.getState()
        const tabId = store.getActiveTab()?.id ?? store.addTab(null, markdown)
        store.setActiveTab(tabId)
        useEditorStore.getState().updateContent(tabId, markdown)
    })

    await page.evaluate(async () => {
        const { useEditorStore } = await import('/src/stores/editorStore.ts')
        useEditorStore.getState().executeCommand('tableSetWidth', { widthPx: 1180 })
    })

    await expect.poll(async () => {
        return await page.evaluate(async () => {
            const { useEditorStore } = await import('/src/stores/editorStore.ts')
            return useEditorStore.getState().getActiveTab()?.content ?? ''
        })
    }).toContain('<!-- mymd:table-width=1180 -->')

    await expect.poll(async () => {
        return await page.evaluate(async () => {
            const { useEditorStore } = await import('/src/stores/editorStore.ts')
            const { renderMarkdownBodyHtml } = await import('/src/utils/renderApi.ts')
            const markdown = useEditorStore.getState().getActiveTab()?.content ?? ''
            const rendered = await renderMarkdownBodyHtml(markdown)
            return rendered.bodyHtml
        })
    }).toContain('data-table-width="1180"')
})
