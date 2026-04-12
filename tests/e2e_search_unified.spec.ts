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

test('top search supports keyboard command selection', async ({ page }) => {
    await page.goto('http://localhost:1420')

    const topSearchInput = page.locator('.top-search-menu__input')
    await topSearchInput.click()
    await expect(topSearchInput).toBeFocused()
    await expect(page.locator('.top-search-dropdown')).toBeVisible()

    await topSearchInput.press('ArrowDown')
    await expect(page.locator('.top-search-item--active')).toContainText(/New document|新建文档/)

    await topSearchInput.press('Enter')

    await expect(page.locator('.tabbar__tab--active')).toContainText(/Untitled|未命名/)
})

test('global search supports keyboard selection for plugin results', async ({ page }) => {
    await page.goto('http://localhost:1420')

    const topSearchInput = page.locator('.top-search-menu__input')
    await topSearchInput.click()
    await topSearchInput.fill('graph')
    await topSearchInput.press('Enter')

    const globalSearchInput = page.locator('.global-search__input-wrap input')
    await expect(globalSearchInput).toHaveValue('graph')
    await expect(page.locator('.global-search__item')).toContainText([/Graph|图谱/, /AI Assistant|AI 助手/])

    await globalSearchInput.press('ArrowDown')
    await expect(page.locator('.global-search__item--active')).toContainText(/Graph|图谱|AI Assistant|AI 助手/)

    await globalSearchInput.press('Enter')

    await expect(page.locator('.knowledge-graph-panel, .ai-panel')).toBeVisible()
})

test('toc panel supports filtering and highlights current heading', async ({ page }) => {
    await page.goto('http://localhost:1420')

    await page.getByRole('button', { name: /新建|New/ }).click()
    await page.getByTitle(/Table of contents|目录/).click()

    await expect(page.locator('.toc-panel')).toBeVisible()
    await expect(page.locator('.toc-panel__item--active')).toContainText(/Untitled|未命名|New document|新文档/)

    const filterInput = page.locator('.toc-panel__filter-input')
    await filterInput.fill('not-found-keyword')

    await expect(page.locator('.toc-panel__empty')).toContainText(/No matching|没有匹配/)
})
