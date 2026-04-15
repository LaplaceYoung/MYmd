import { expect, test } from '@playwright/test'

test('inserting audio/video/embed snippets shows media previews in editor', async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.setItem('mymd:view-mode-guide:v1', 'dismissed')
        window.localStorage.removeItem('mymd:session:v1')
    })

    await page.goto('http://127.0.0.1:1420')
    await page.waitForLoadState('networkidle')

    await page.locator('.welcome-word__sidebar-btn').nth(1).dispatchEvent('click')
    await expect(page.locator('.ribbon')).toBeVisible()

    await page.locator('.ribbon__tab').nth(2).click()

    await page.locator('[title=\"插入音频\"]').click()
    await page.locator('.insert-dialog__input').first().fill('https://example.com/audio.mp3')
    await page.locator('.insert-dialog__btn--confirm').click()
    await expect(page.locator('.media-embed-preview audio')).toBeVisible()

    await page.locator('[title=\"插入视频\"]').click()
    await page.locator('.insert-dialog__input').first().fill('https://example.com/video.mp4')
    await page.locator('.insert-dialog__btn--confirm').click()
    await expect(page.locator('.media-embed-preview video')).toBeVisible()

    await page.locator('[title=\"嵌入网页\"]').click()
    await page.locator('.insert-dialog__input').first().fill('https://www.youtube.com/embed/dQw4w9WgXcQ')
    await page.locator('.insert-dialog__btn--confirm').click()
    await expect(page.locator('.media-embed-preview iframe')).toBeVisible()
})

test('untrusted embed URLs are blocked with warning', async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.setItem('mymd:view-mode-guide:v1', 'dismissed')
        window.localStorage.removeItem('mymd:session:v1')
    })

    await page.goto('http://127.0.0.1:1420')
    await page.waitForLoadState('networkidle')

    await page.locator('.welcome-word__sidebar-btn').nth(1).dispatchEvent('click')
    await page.locator('.ribbon__tab').nth(2).click()

    await page.locator('[title=\"嵌入网页\"]').click()
    await page.locator('.insert-dialog__input').first().fill('https://evil.example.com/embed')
    await page.locator('.insert-dialog__btn--confirm').click()

    await expect(page.locator('.media-embed-preview__warning')).toContainText('Embed blocked')
})
