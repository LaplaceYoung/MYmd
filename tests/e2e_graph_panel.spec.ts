import { expect, test } from '@playwright/test'

test('knowledge graph panel can be toggled from status bar', async ({ page }) => {
    await page.goto('http://localhost:1420')

    await page.getByRole('button', { name: '新建' }).click()
    await page.getByTitle('Knowledge graph').click()

    await expect(page.locator('.knowledge-graph-panel')).toBeVisible()
})
