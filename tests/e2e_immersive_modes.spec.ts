import { expect, test } from '@playwright/test'

test('focus and typewriter modes stay consistent across wysiwyg and split source', async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.setItem('mymd:view-mode-guide:v1', 'dismissed')
        window.localStorage.removeItem('mymd:session:v1')
    })

    await page.goto('http://localhost:1420')
    await page.waitForLoadState('networkidle')

    await page.evaluate(async () => {
        const { useEditorStore } = await import('/src/stores/editorStore.ts')
        const store = useEditorStore.getState()
        const tabId = store.addTab(null, '# Draft\n\nParagraph one.\n\nParagraph two.\n')
        store.setActiveTab(tabId)
        store.setViewMode('wysiwyg')
        store.setFocusMode(false)
        store.setTypewriterMode(false)
    })

    await page.getByRole('button', { name: /视图|View/ }).click()
    await page.getByRole('button', { name: /专注模式|Focus/ }).click()
    await page.getByRole('button', { name: /打字机模式|Typewriter/ }).click()

    const wysiwyg = page.locator('.editor-wysiwyg').first()
    await expect(wysiwyg).toHaveClass(/focus-mode/)
    await expect(wysiwyg).toHaveClass(/typewriter-mode/)

    await expect.poll(async () => {
        return await page.evaluate(async () => {
            const { useEditorStore } = await import('/src/stores/editorStore.ts')
            const state = useEditorStore.getState()
            return {
                focusMode: state.focusMode,
                typewriterMode: state.typewriterMode,
            }
        })
    }).toEqual({ focusMode: true, typewriterMode: true })

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
