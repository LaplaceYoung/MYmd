import { expect, test } from '@playwright/test'

test('source editor paste html converts into markdown blocks', async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.setItem('mymd:view-mode-guide:v1', 'dismissed')
        window.localStorage.removeItem('mymd:session:v1')
    })

    await page.goto('http://localhost:1420')
    await page.waitForLoadState('networkidle')
    await page.locator('.welcome-word__sidebar-btn').nth(1).click()
    await page.getByTitle('Split mode').click()

    const sourceEditor = page.locator('.editor-split__source .cm-content')
    await sourceEditor.click()

    await page.evaluate(() => {
        const target = document.querySelector('.editor-split__source .cm-content')
        if (!(target instanceof HTMLElement)) {
            throw new Error('Source editor target not found')
        }

        const html = [
            '<h2>Paste Title</h2>',
            '<p>Hello <strong>bold</strong> and <em>calm</em>.</p>',
            '<ul><li>First item</li><li>Second item</li></ul>',
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

    await expect.poll(async () => {
        return await page.evaluate(() => {
            const editor = document.querySelector('.editor-split__source .cm-content')
            return editor?.textContent || ''
        })
    }).toContain('## Paste Title')

    await expect(sourceEditor).toContainText('Hello **bold** and *calm*.')
    await expect(sourceEditor).toContainText('- First item')
    await expect(sourceEditor).toContainText('- Second item')
})
