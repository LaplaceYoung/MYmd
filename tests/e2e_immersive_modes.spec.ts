import { expect, test } from '@playwright/test'

test('focus and typewriter modes stay consistent across wysiwyg and split source', async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.setItem('mymd:view-mode-guide:v1', 'dismissed')
        window.localStorage.setItem('mymd:session:v1', JSON.stringify({
            version: 1,
            timestamp: Date.now(),
            activeTabIndex: 0,
            viewMode: 'wysiwyg',
            activeWorkspace: null,
            tabs: [
                {
                    filePath: null,
                    title: 'Immersive.md',
                    content: '# Draft\n\nParagraph one.\n\nParagraph two.\n',
                    isDirty: true,
                },
            ],
        }))
    })

    await page.goto('http://localhost:1420')
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: /视图|View/ }).click()
    await page.getByRole('button', { name: /专注模式|Focus/ }).click()
    await page.getByRole('button', { name: /打字机模式|Typewriter/ }).click()

    const wysiwyg = page.locator('.editor-wysiwyg').first()
    await expect(wysiwyg).toHaveClass(/focus-mode/)
    await expect(wysiwyg).toHaveClass(/typewriter-mode/)

    await page.getByRole('button', { name: /源码与预览/ }).click()
    await expect(page.locator('.source-editor-container')).toHaveClass(/focus-mode/)
    await expect(page.locator('.source-editor-container')).toHaveClass(/typewriter-mode/)
    await expect(page.locator('.editor-split__preview .editor-wysiwyg')).toHaveClass(/focus-mode/)
    await expect(page.locator('.editor-split__preview .editor-wysiwyg')).toHaveClass(/typewriter-mode/)

    await page.getByRole('button', { name: /专注模式|Focus/ }).click()
    await page.getByRole('button', { name: /打字机模式|Typewriter/ }).click()

    await expect(page.locator('.source-editor-container')).not.toHaveClass(/focus-mode/)
    await expect(page.locator('.source-editor-container')).not.toHaveClass(/typewriter-mode/)
})
