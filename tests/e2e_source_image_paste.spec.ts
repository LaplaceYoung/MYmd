import { expect, test } from '@playwright/test'

test('source editor paste image inserts markdown image syntax', async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.setItem('mymd:view-mode-guide:v1', 'dismissed')
        window.localStorage.removeItem('mymd:session:v1')
    })

    await page.goto('http://127.0.0.1:1420')
    await page.waitForLoadState('networkidle')

    await page.locator('.welcome-word__sidebar-btn').nth(1).click()
    await expect(page.locator('.editor-wysiwyg .ProseMirror')).toBeVisible()
    await page.getByTitle('Split mode').click()

    const sourceEditor = page.locator('.editor-split__source .cm-content')
    await sourceEditor.click()

    await page.evaluate(async () => {
        const target = document.querySelector('.editor-split__source .cm-content')
        if (!(target instanceof HTMLElement)) {
            throw new Error('Source editor target not found')
        }

        const base64 =
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2pN3sAAAAASUVORK5CYII='
        const binary = atob(base64)
        const bytes = Uint8Array.from(binary, char => char.charCodeAt(0))
        const file = new File([bytes], 'source-paste.png', { type: 'image/png' })
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(file)

        target.dispatchEvent(new ClipboardEvent('paste', {
            clipboardData: dataTransfer,
            bubbles: true,
            cancelable: true,
        }))
    })

    await expect.poll(async () => {
        return await page.evaluate(() => {
            const editor = document.querySelector('.editor-split__source .cm-content')
            return editor?.textContent || ''
        })
    }).toContain('![source-paste.png](')
})
