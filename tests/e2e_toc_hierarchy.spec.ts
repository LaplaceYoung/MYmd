import { expect, test } from '@playwright/test'

test('toc hierarchy can collapse nested headings and preserve state across tab switches', async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.clear()
    })

    await page.goto('http://localhost:1420')
    await page.getByRole('button', { name: /新建|New/ }).click()
    await page.getByTitle(/Split mode|分屏/).click()

    const sourceEditor = page.locator('.editor-split__source .cm-content')
    await sourceEditor.click()
    await page.keyboard.press('Control+A')
    await page.evaluate(() => {
        const target = document.querySelector('.editor-split__source .cm-content')
        if (!(target instanceof HTMLElement)) {
            throw new Error('Source editor target not found')
        }

        const dataTransfer = new DataTransfer()
        dataTransfer.setData('text/plain', '# Root\n\n## Beta\n\n### Gamma\n\n# Delta\n')

        target.dispatchEvent(new ClipboardEvent('paste', {
            clipboardData: dataTransfer,
            bubbles: true,
            cancelable: true,
        }))
    })

    await expect.poll(async () => {
        return await sourceEditor.textContent()
    }).toContain('Root')

    await page.getByTitle(/Table of contents|目录/).click()

    await expect(page.locator('.toc-panel')).toBeVisible()
    await expect(page.locator('.toc-panel__item').filter({ hasText: 'Beta' })).toBeVisible()
    await expect(page.locator('.toc-panel__item').filter({ hasText: 'Gamma' })).toBeVisible()
    await expect(page.locator('.toc-panel__item').filter({ hasText: 'Delta' })).toBeVisible()

    await page.locator('.toc-panel__toggle[data-toc-index="0"]').click()

    await expect(page.locator('.toc-panel__item').filter({ hasText: 'Beta' })).toHaveCount(0)
    await expect(page.locator('.toc-panel__item').filter({ hasText: 'Gamma' })).toHaveCount(0)
    await expect(page.locator('.toc-panel__item').filter({ hasText: 'Delta' })).toBeVisible()

    await page.locator('.toc-panel__item[data-toc-index="3"]').click()
    await expect(page.locator('.toc-panel__item--active')).toContainText('Delta')

    await page.getByRole('button', { name: /新建|New/ }).click()
    await page.locator('.tabbar__tab').first().click()

    await expect(page.locator('.toc-panel__item').filter({ hasText: 'Beta' })).toHaveCount(0)
    await expect(page.locator('.toc-panel__item').filter({ hasText: 'Gamma' })).toHaveCount(0)
    await expect(page.locator('.toc-panel__item--active')).toContainText('Delta')
})

test('toc filter and active heading survive heading recompute in the same tab', async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.clear()
    })

    await page.goto('http://localhost:1420')
    await page.getByRole('button', { name: /新建|New/ }).click()
    await page.getByTitle(/Split mode|分屏/).click()

    const sourceEditor = page.locator('.editor-split__source .cm-content')
    await sourceEditor.click()
    await page.keyboard.press('Control+A')
    await page.evaluate(() => {
        const target = document.querySelector('.editor-split__source .cm-content')
        if (!(target instanceof HTMLElement)) {
            throw new Error('Source editor target not found')
        }

        const dataTransfer = new DataTransfer()
        dataTransfer.setData('text/plain', '# Root\n\n## Beta\n\n### Gamma\n\n# Delta\n')

        target.dispatchEvent(new ClipboardEvent('paste', {
            clipboardData: dataTransfer,
            bubbles: true,
            cancelable: true,
        }))
    })

    await page.getByTitle(/Table of contents|目录/).click()
    const filterInput = page.locator('.toc-panel__filter-input')
    await filterInput.fill('Delta')
    await page.locator('.toc-panel__item').filter({ hasText: 'Delta' }).click()
    await expect(page.locator('.toc-panel__item--active')).toContainText('Delta')

    await sourceEditor.click()
    await page.keyboard.press('Control+A')
    await page.evaluate(() => {
        const target = document.querySelector('.editor-split__source .cm-content')
        if (!(target instanceof HTMLElement)) {
            throw new Error('Source editor target not found')
        }

        const dataTransfer = new DataTransfer()
        dataTransfer.setData('text/plain', '# Root\n\n## Beta\n\n### Gamma Updated\n\n# Delta\n')

        target.dispatchEvent(new ClipboardEvent('paste', {
            clipboardData: dataTransfer,
            bubbles: true,
            cancelable: true,
        }))
    })

    await expect(filterInput).toHaveValue('Delta')
    await expect(page.locator('.toc-panel__item')).toHaveCount(1)
    await expect(page.locator('.toc-panel__item--active')).toContainText('Delta')
})
