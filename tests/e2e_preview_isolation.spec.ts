import { expect, test } from '@playwright/test'

test('split preview remains read-only after focus and typing attempts', async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.setItem('mymd:view-mode-guide:v1', 'dismissed')
        window.localStorage.removeItem('mymd:session:v1')
    })

    await page.goto('http://localhost:1420')
    await page.waitForLoadState('networkidle')

    await page.locator('.welcome-word__sidebar-btn').nth(1).click()
    await expect(page.locator('.ribbon')).toBeVisible()

    await page.getByTitle('Split mode').click()

    const sourceEditor = page.locator('.editor-split__source .cm-content')
    await sourceEditor.click()
    await page.keyboard.type('# Preview Isolation')

    const previewSurface = page.locator('.editor-split__preview .editor-wysiwyg')
    const previewEditor = page.locator('.editor-split__preview .ProseMirror')

    await expect(previewSurface).toHaveAttribute('aria-readonly', 'true')
    await expect(previewEditor).toHaveAttribute('contenteditable', 'false')

    await previewEditor.click()
    await page.keyboard.type(' SHOULD-NOT-APPEAR')

    await page.evaluate(() => {
        const target = document.querySelector('.editor-split__preview .ProseMirror')
        if (!(target instanceof HTMLElement)) {
            throw new Error('Preview editor target not found')
        }

        const dataTransfer = new DataTransfer()
        dataTransfer.setData('text/plain', 'PASTE-SHOULD-NOT-APPEAR')

        target.dispatchEvent(new ClipboardEvent('paste', {
            clipboardData: dataTransfer,
            bubbles: true,
            cancelable: true,
        }))
    })

    await expect(sourceEditor).toContainText('# Preview Isolation')
    await expect(sourceEditor).not.toContainText('SHOULD-NOT-APPEAR')
    await expect(sourceEditor).not.toContainText('PASTE-SHOULD-NOT-APPEAR')
})
