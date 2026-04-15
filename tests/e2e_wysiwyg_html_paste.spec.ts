import { expect, test } from '@playwright/test'

test('wysiwyg paste html uses shared markdown conversion pipeline', async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.setItem('mymd:view-mode-guide:v1', 'dismissed')
        window.localStorage.removeItem('mymd:session:v1')
    })

    await page.goto('http://localhost:1420')
    await page.waitForLoadState('networkidle')
    await page.locator('.welcome-word__sidebar-btn').nth(1).click()

    const wysiwygEditor = page.locator('.editor-wysiwyg .ProseMirror')
    await wysiwygEditor.click()

    await page.evaluate(() => {
        const target = document.querySelector('.editor-wysiwyg .ProseMirror')
        if (!(target instanceof HTMLElement)) {
            throw new Error('WYSIWYG editor target not found')
        }

        const html = [
            '<h3>Pipeline Heading</h3>',
            '<p>Shared <strong>paste</strong> keeps <a href="https://example.com">links</a>.</p>',
            '<blockquote><p>Stay polished.</p></blockquote>',
        ].join('')

        const dataTransfer = new DataTransfer()
        dataTransfer.setData('text/html', html)
        dataTransfer.setData('text/plain', 'fallback plain text')

        target.dispatchEvent(new ClipboardEvent('paste', {
            clipboardData: dataTransfer,
            bubbles: true,
            cancelable: true,
        }))
    })

    await expect(wysiwygEditor.locator('h3')).toContainText('Pipeline Heading')
    await expect(wysiwygEditor.locator('strong')).toContainText('paste')
    await expect(wysiwygEditor.locator('a[href="https://example.com"]')).toContainText('links')
    await expect(wysiwygEditor.locator('blockquote')).toContainText('Stay polished.')

    await expect.poll(async () => {
        return await page.evaluate(async () => {
            const { useEditorStore } = await import('/src/stores/editorStore.ts')
            return useEditorStore.getState().getActiveTab()?.content ?? ''
        })
    }).toContain('### Pipeline Heading')

    await page.getByTitle('Split mode').click()
    const sourceEditor = page.locator('.editor-split__source .cm-content')
    await expect(sourceEditor).toContainText('### Pipeline Heading')
    await expect(sourceEditor).toContainText('Shared **paste** keeps [links](https://example.com).')
    await expect(sourceEditor).toContainText('> Stay polished.')
})
