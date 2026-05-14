import { expect, test } from '@playwright/test'

test('layout profile selection is reflected in the editor status bar', async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.clear()
    })
    await page.goto('http://localhost:1420')

    await page.getByRole('button', { name: /^(选项|Options)$/ }).click()
    await expect(page.getByRole('heading', { name: /^(设置|Settings)$/ })).toBeVisible()

    await page.getByRole('button', { name: /Resume/i }).click()
    await page.getByRole('button', { name: /^(新建|New)$/ }).click()

    await expect(page.locator('.statusbar')).toContainText('Resume')
})
