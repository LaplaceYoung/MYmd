import { expect, test } from '@playwright/test'

test('ribbon AI quick actions open the assistant in the matching mode', async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.setItem('mymd:view-mode-guide:v1', 'dismissed')
        window.localStorage.removeItem('mymd:session:v1')
    })

    await page.goto('http://127.0.0.1:1420')
    await page.waitForLoadState('networkidle')

    await page.locator('.welcome-word__sidebar-btn').nth(1).dispatchEvent('click')
    await expect(page.locator('.ribbon')).toBeVisible()

    await page.locator('[data-ai-entry="layout"]').dispatchEvent('click')
    await expect(page.locator('.ai-panel')).toBeVisible()
    await expect(page.locator('.ai-panel__task-card.active')).toContainText('Layout Polish')

    await page.locator('[data-ai-entry="content"]').dispatchEvent('click')
    await expect(page.locator('.ai-panel__task-card.active')).toContainText('Content Rewrite')

    await page.locator('[data-ai-entry="graph"]').dispatchEvent('click')
    await expect(page.locator('.ai-panel__task-card.active')).toContainText('Graph Enrichment')
})

test('ai panel shows a diff summary and preview for edited results', async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.setItem('mymd:view-mode-guide:v1', 'dismissed')
        window.localStorage.removeItem('mymd:session:v1')
    })

    await page.goto('http://127.0.0.1:1420')
    await page.waitForLoadState('networkidle')

    await page.locator('.welcome-word__sidebar-btn').nth(1).dispatchEvent('click')
    await page.locator('[data-ai-entry="layout"]').dispatchEvent('click')

    await page.locator('.ai-panel__result').fill('# Revised\n\nSharper structure')

    await expect(page.locator('.ai-panel__diff-title')).toBeVisible()
    await expect(page.locator('.ai-panel__diff-pill')).toHaveCount(3)
    await expect(page.locator('.ai-panel__diff-line--added').last()).toContainText('Sharper structure')
})

test('ai panel can apply a single diff block and restore the original document', async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.setItem('mymd:view-mode-guide:v1', 'dismissed')
        window.localStorage.removeItem('mymd:session:v1')
    })

    await page.goto('http://127.0.0.1:1420')
    await page.waitForLoadState('networkidle')

    await page.locator('.welcome-word__sidebar-btn').nth(1).dispatchEvent('click')
    await page.locator('[data-ai-entry="layout"]').dispatchEvent('click')
    await page.locator('.ai-panel__result').fill('# Revised\n\nSharper structure')

    await page.locator('.ai-panel__diff-apply').first().click()
    await expect(page.locator('.editor-wysiwyg .ProseMirror')).toContainText('Revised')

    await page.locator('.ai-panel__ghost--restore').click()
    await expect(page.locator('.editor-wysiwyg .ProseMirror')).not.toContainText('Revised')
})

test('ai panel can save and reload session history snapshots', async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.setItem('mymd:view-mode-guide:v1', 'dismissed')
        window.localStorage.removeItem('mymd:session:v1')
        window.localStorage.removeItem('mymd:ai-history:v1')
    })

    await page.goto('http://127.0.0.1:1420')
    await page.waitForLoadState('networkidle')

    await page.locator('.welcome-word__sidebar-btn').nth(1).dispatchEvent('click')
    await page.locator('[data-ai-entry="content"]').dispatchEvent('click')

    await page.locator('.ai-panel__result').fill('Version one')
    await page.locator('.ai-panel__ghost--snapshot').click()
    await page.locator('.ai-panel__result').fill('Version two')
    await page.locator('.ai-panel__ghost--snapshot').click()

    await expect(page.locator('.ai-panel__history-item')).toHaveCount(2)
    await page.locator('.ai-panel__history-load').nth(1).click()
    await expect(page.locator('.ai-panel__result')).toHaveValue('Version one')
})

test('ai history persists across reload and supports delete and clear', async ({ page }) => {
    await page.addInitScript(() => {
        if (window.sessionStorage.getItem('mymd:ai-history-persist-init') === 'done') {
            return
        }
        window.localStorage.setItem('mymd:view-mode-guide:v1', 'dismissed')
        window.localStorage.removeItem('mymd:session:v1')
        window.localStorage.removeItem('mymd:ai-history:v1')
        window.sessionStorage.setItem('mymd:ai-history-persist-init', 'done')
    })

    await page.goto('http://127.0.0.1:1420')
    await page.waitForLoadState('networkidle')

    await page.locator('.welcome-word__sidebar-btn').nth(1).dispatchEvent('click')
    await page.locator('[data-ai-entry="content"]').dispatchEvent('click')

    await page.locator('.ai-panel__result').fill('Persisted one')
    await page.locator('.ai-panel__ghost--snapshot').click()
    await page.locator('.ai-panel__result').fill('Persisted two')
    await page.locator('.ai-panel__ghost--snapshot').click()

    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.locator('.welcome-word__sidebar-btn').nth(1).dispatchEvent('click')
    await page.locator('[data-ai-entry="content"]').dispatchEvent('click')

    await expect(page.locator('.ai-panel__history-item')).toHaveCount(2)
    await page.locator('.ai-panel__history-delete').first().click()
    await expect(page.locator('.ai-panel__history-item')).toHaveCount(1)

    await page.locator('.ai-panel__history-clear').click()
    await expect(page.locator('.ai-panel__history-item')).toHaveCount(0)
})

test('ai history supports favorite and rename metadata across reloads', async ({ page }) => {
    await page.addInitScript(() => {
        if (window.sessionStorage.getItem('mymd:ai-history-meta-init') === 'done') {
            return
        }
        window.localStorage.setItem('mymd:view-mode-guide:v1', 'dismissed')
        window.localStorage.removeItem('mymd:session:v1')
        window.localStorage.removeItem('mymd:ai-history:v1')
        window.sessionStorage.setItem('mymd:ai-history-meta-init', 'done')
    })

    await page.goto('http://127.0.0.1:1420')
    await page.waitForLoadState('networkidle')

    await page.locator('.welcome-word__sidebar-btn').nth(1).dispatchEvent('click')
    await page.locator('[data-ai-entry="content"]').dispatchEvent('click')

    await page.locator('.ai-panel__result').fill('Meta version')
    await page.locator('.ai-panel__ghost--snapshot').click()

    await page.locator('.ai-panel__history-favorite').first().click()
    await page.locator('.ai-panel__history-rename').first().click()
    await page.locator('.ai-panel__history-label-input').first().fill('Pinned rewrite')
    await page.locator('.ai-panel__history-save-label').first().click()

    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.locator('.welcome-word__sidebar-btn').nth(1).dispatchEvent('click')
    await page.locator('[data-ai-entry="content"]').dispatchEvent('click')

    await expect(page.locator('.ai-panel__history-item')).toHaveCount(1)
    await expect(page.locator('.ai-panel__history-item').first()).toContainText('Pinned rewrite')
    await expect(page.locator('.ai-panel__history-item').first()).toContainText('未命名.md')
    await expect(page.locator('.ai-panel__history-favorite').first()).toContainText('Unfavorite')
})

test('ai history can pin favorites to the top and filter entries', async ({ page }) => {
    await page.addInitScript(() => {
        if (window.sessionStorage.getItem('mymd:ai-history-filter-init') === 'done') {
            return
        }
        window.localStorage.setItem('mymd:view-mode-guide:v1', 'dismissed')
        window.localStorage.removeItem('mymd:session:v1')
        window.localStorage.removeItem('mymd:ai-history:v1')
        window.sessionStorage.setItem('mymd:ai-history-filter-init', 'done')
    })

    await page.goto('http://127.0.0.1:1420')
    await page.waitForLoadState('networkidle')

    await page.locator('.welcome-word__sidebar-btn').nth(1).dispatchEvent('click')
    await page.locator('[data-ai-entry="content"]').dispatchEvent('click')

    await page.locator('.ai-panel__result').fill('First version')
    await page.locator('.ai-panel__ghost--snapshot').click()
    await page.locator('.ai-panel__history-rename').first().click()
    await page.locator('.ai-panel__history-label-input').first().fill('Pinned summary')
    await page.locator('.ai-panel__history-save-label').first().click()
    await page.locator('.ai-panel__history-favorite').first().click()

    await page.locator('.ai-panel__result').fill('Second version')
    await page.locator('.ai-panel__ghost--snapshot').click()

    await expect(page.locator('.ai-panel__history-item')).toHaveCount(2)
    await expect(page.locator('.ai-panel__history-item').first()).toContainText('Pinned summary')

    await page.locator('.ai-panel__history-search').fill('Second version')
    await expect(page.locator('.ai-panel__history-item')).toHaveCount(1)
    await expect(page.locator('.ai-panel__history-item').first()).toContainText('Second version')

    await page.locator('.ai-panel__history-search').fill('Pinned summary')
    await expect(page.locator('.ai-panel__history-item')).toHaveCount(1)
    await expect(page.locator('.ai-panel__history-item').first()).toContainText('Pinned summary')
})
