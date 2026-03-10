import { expect, test } from '@playwright/test'

test('top search enter opens global knowledge search with initial query', async ({ page }) => {
    await page.goto('http://localhost:1420')

    const topSearchInput = page.locator('.top-search-menu__input')
    await topSearchInput.click()
    await topSearchInput.fill('markdown')
    await topSearchInput.press('Enter')

    await expect(page.locator('.global-search__panel')).toBeVisible()
    await expect(page.locator('.global-search__input-wrap input')).toHaveValue('markdown')
})
