import { expect, test } from '@playwright/test'

test('unsaved tab close opens save confirm dialog', async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.clear()
    })
    await page.goto('http://localhost:1420')

    await page.getByRole('button', { name: /^(新建|New)$/ }).click()
    await page.locator('.editor-wysiwyg .ProseMirror').click()
    await page.evaluate(() => {
        const editor = document.querySelector('.editor-wysiwyg .ProseMirror')
        if (!(editor instanceof HTMLElement)) {
            throw new Error('editor not found')
        }
        editor.focus()
        document.execCommand('insertText', false, ' dirty content')
    })
    await expect(page.locator('.tabbar__tab--active .tabbar__tab-dirty')).toBeVisible()

    await page.locator('.tabbar__tab--active .tabbar__tab-close').click()
    await expect(page.locator('.save-confirm-dialog')).toBeVisible()
})
