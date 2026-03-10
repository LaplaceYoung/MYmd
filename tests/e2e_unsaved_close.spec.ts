import { expect, test } from '@playwright/test'

test('unsaved tab close opens save confirm dialog', async ({ page }) => {
    await page.goto('http://localhost:1420')

    await page.getByRole('button', { name: '新建' }).click()
    await page.locator('.editor-wysiwyg .ProseMirror').click()
    await page.keyboard.type('test dirty content')

    await page.locator('.tabbar__tab-close').first().click()
    await expect(page.locator('.save-confirm-dialog')).toBeVisible()
})
