import { expect, test } from '@playwright/test'

test('in-document search highlights source editor matches and selects the first result', async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.setItem('mymd:view-mode-guide:v1', 'dismissed')
        window.localStorage.removeItem('mymd:session:v1')
    })

    await page.goto('http://127.0.0.1:1420')
    await page.waitForLoadState('networkidle')

    await page.locator('.welcome-word__sidebar-btn').nth(1).click()
    await page.locator('.statusbar__right .statusbar__icon-btn').nth(3).click()
    await page.waitForTimeout(300)

    await page.locator('.cm-content').click()
    await page.keyboard.press('Control+a')
    await page.keyboard.type('alpha beta alpha gamma alpha')
    await page.keyboard.press('Control+f')

    const searchInput = page.locator('.search-bar__input')
    await expect(searchInput).toBeVisible()
    await searchInput.fill('alpha')

    await expect(page.locator('.search-bar__count')).toHaveText('1/3')
    await expect(page.locator('.cm-searchMatch')).toHaveCount(3)
    await expect(page.locator('.cm-searchMatch-selected')).toHaveCount(1)

    await searchInput.press('Enter')
    await expect(page.locator('.search-bar__count')).toHaveText('2/3')
    await expect(page.locator('.cm-searchMatch-selected')).toHaveCount(1)
})

test('welcome view shows only the latest ten recent files from persisted history', async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.clear()
        window.localStorage.setItem('mymd:view-mode-guide:v1', 'dismissed')
        window.localStorage.setItem('mymd.recentFiles', JSON.stringify(
            Array.from({ length: 12 }, (_, index) => ({
                path: `C:\\\\docs\\\\file-${index + 1}.md`,
                title: `file-${index + 1}.md`,
                time: Date.now() - index * 60_000,
            }))
        ))
    })

    await page.goto('http://127.0.0.1:1420')
    await page.waitForLoadState('networkidle')

    const rows = page.locator('.welcome-word__recent-row')
    await expect(rows).toHaveCount(10)
    await expect(rows.first()).toContainText('file-1.md')
    await expect(page.locator('.welcome-word__recent-list')).not.toContainText('file-11.md')
    await expect(page.locator('.welcome-word__recent-list')).not.toContainText('file-12.md')
})
