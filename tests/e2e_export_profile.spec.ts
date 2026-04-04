import { expect, test } from '@playwright/test'

test('print export profile is reflected in the status bar and enables page guides', async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.clear()
    })

    await page.goto('http://localhost:1420')
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: '选项' }).click()
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

    await page.getByRole('button', { name: /^A4/i }).click()
    await page.getByRole('button', { name: /^Web/i }).click()
    await page.getByRole('button', { name: /^Print/i }).click()
    await page.getByRole('button', { name: '新建' }).click()

    await expect(page.locator('.statusbar')).toContainText('A4')
    await expect(page.locator('.statusbar')).toContainText('Print')
    await expect(page.locator('.editor-workspace').first()).toHaveAttribute('data-export-profile', 'print')
    await expect(page.locator('.editor-workspace').first()).toHaveAttribute('data-page-guides', 'on')
})

test('custom paper size flows through settings, editor canvas, and persists across reloads', async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.clear()
    })

    await page.goto('http://localhost:1420')
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: '选项' }).click()
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

    await page.getByRole('button', { name: /^Custom/i }).click()
    await page.getByLabel('Custom paper width').fill('180')
    await page.getByLabel('Custom paper height').fill('260')
    await page.getByRole('button', { name: /^Print/i }).click()
    await page.getByRole('button', { name: '新建' }).click()

    await expect(page.locator('.statusbar')).toContainText('Custom 180 x 260 mm')
    await expect(page.locator('.editor-workspace').first()).toHaveAttribute('data-paper-preset', 'custom')
    await expect(page.locator('.editor-zoom-container').first()).toHaveCSS('--paper-width', '680px')

    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: '选项' }).click()
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
    await page.getByRole('button', { name: /^Custom/i }).click()

    await expect(page.getByLabel('Custom paper width')).toHaveValue('180')
    await expect(page.getByLabel('Custom paper height')).toHaveValue('260')
})
