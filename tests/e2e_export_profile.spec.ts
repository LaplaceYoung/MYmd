import { expect, test } from '@playwright/test'

test('print export profile is reflected in the status bar and enables page guides', async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.clear()
    })

    await page.goto('http://localhost:1420')
    await page.waitForLoadState('networkidle')

    await page.locator('.welcome-word__sidebar-btn.text-only').nth(1).click()
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

    await page.getByRole('button', { name: /^A4/i }).click()
    await page.getByRole('button', { name: /^Web/i }).click()
    await page.getByRole('button', { name: /^Print/i }).click()
    await page.locator('.welcome-word__sidebar-btn').nth(1).click()

    await expect(page.locator('.statusbar')).toContainText('A4')
    await expect(page.locator('.statusbar')).toContainText('Print')
    await expect(page.locator('.editor-workspace').first()).toHaveAttribute('data-export-profile', 'print')
    await expect(page.locator('.editor-workspace').first()).toHaveAttribute('data-page-guides', 'on')
})

test('custom paper size flows through settings, editor canvas, and persists across reloads', async ({ page }) => {
    await page.addInitScript(() => {
        if (window.sessionStorage.getItem('mymd:custom-paper-init') === 'done') {
            return
        }
        window.localStorage.clear()
        window.sessionStorage.setItem('mymd:custom-paper-init', 'done')
    })

    await page.goto('http://localhost:1420')
    await page.waitForLoadState('networkidle')

    await page.locator('.welcome-word__sidebar-btn.text-only').nth(1).click()
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

    await page.getByRole('button', { name: /^Custom/i }).click()
    await page.getByLabel('Custom paper width').fill('180')
    await page.getByLabel('Custom paper height').fill('260')
    await page.getByRole('button', { name: /^Print/i }).click()
    await page.locator('.welcome-word__sidebar-btn').nth(1).click()

    await expect(page.locator('.statusbar')).toContainText('Custom 180 x 260 mm')
    await expect(page.locator('.editor-workspace').first()).toHaveAttribute('data-paper-preset', 'custom')
    await expect(page.locator('.editor-zoom-container').first()).toHaveCSS('--paper-width', '680px')

    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.locator('.welcome-word__sidebar-btn.text-only').nth(1).click()
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
    await page.getByRole('button', { name: /^Custom/i }).click()

    await expect(page.getByLabel('Custom paper width')).toHaveValue('180')
    await expect(page.getByLabel('Custom paper height')).toHaveValue('260')
})

test('paper orientation and page margin flow through settings, editor canvas, and persist across reloads', async ({ page }) => {
    await page.addInitScript(() => {
        if (window.sessionStorage.getItem('mymd:paper-layout-init') === 'done') {
            return
        }
        window.localStorage.clear()
        window.sessionStorage.setItem('mymd:paper-layout-init', 'done')
    })

    await page.goto('http://localhost:1420')
    await page.waitForLoadState('networkidle')

    await page.locator('.welcome-word__sidebar-btn.text-only').nth(1).click()
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

    await page.getByRole('button', { name: /^A4/i }).click()
    await page.getByRole('button', { name: /^Landscape/i }).click()
    await page.getByLabel('Page margin').fill('20')
    await page.getByRole('button', { name: /^Print/i }).click()
    await page.locator('.welcome-word__sidebar-btn').nth(1).click()

    await expect(page.locator('.statusbar')).toContainText('A4 Landscape')
    await expect(page.locator('.editor-workspace').first()).toHaveAttribute('data-paper-orientation', 'landscape')
    await expect(page.locator('.editor-zoom-container').first()).toHaveCSS('--paper-width', '1123px')
    await expect(page.locator('.editor-zoom-container').first()).toHaveCSS('--paper-padding-inline', '76px')

    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.locator('.welcome-word__sidebar-btn.text-only').nth(1).click()
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

    await expect(page.getByLabel('Page margin')).toHaveValue('20')
    await expect(page.getByRole('button', { name: /^Landscape/i })).toHaveClass(/active/)
})
