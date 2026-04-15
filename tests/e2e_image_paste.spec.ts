import { expect, test } from '@playwright/test'

test('wysiwyg paste image inserts a rendered image node', async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.setItem('mymd:view-mode-guide:v1', 'dismissed')
        window.localStorage.removeItem('mymd:session:v1')
    })

    await page.goto('http://127.0.0.1:1420')
    await page.waitForLoadState('networkidle')

    await page.locator('.welcome-word__sidebar-btn').nth(1).click()

    const editor = page.locator('.editor-wysiwyg .ProseMirror')
    await expect(editor).toBeVisible()
    await editor.click()

    await page.evaluate(async () => {
        const target = document.querySelector('.editor-wysiwyg .ProseMirror')
        if (!(target instanceof HTMLElement)) {
            throw new Error('Editor target not found')
        }

        const base64 =
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2pN3sAAAAASUVORK5CYII='
        const binary = atob(base64)
        const bytes = Uint8Array.from(binary, char => char.charCodeAt(0))
        const file = new File([bytes], 'clipboard-image.png', { type: 'image/png' })
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(file)

        target.dispatchEvent(new ClipboardEvent('paste', {
            clipboardData: dataTransfer,
            bubbles: true,
            cancelable: true,
        }))
    })

    const image = page.locator('.editor-wysiwyg .ProseMirror img:not(.ProseMirror-separator)').first()
    await expect(image).toBeVisible()
    await expect(image).toHaveAttribute('src', /^(data:image\/png;base64,|assets\/|asset:|http)/)
})
