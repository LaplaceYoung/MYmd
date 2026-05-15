import { expect, test } from '@playwright/test'

test('wysiwyg task list checkboxes update markdown source directly', async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.setItem('mymd:view-mode-guide:v1', 'dismissed')
        window.localStorage.setItem('mymd:session:v1', JSON.stringify({
            version: 1,
            timestamp: Date.now(),
            activeTabIndex: 0,
            viewMode: 'wysiwyg',
            activeWorkspace: null,
            tabs: [
                {
                    filePath: null,
                    title: 'Tasks.md',
                    content: '- [ ] Draft outline\n- [x] Ship release\n',
                    isDirty: true,
                },
            ],
        }))
    })

    await page.goto('http://localhost:1420')
    await page.waitForLoadState('networkidle')

    const wysiwygEditor = page.locator('.editor-wysiwyg .ProseMirror')
    const checkboxes = wysiwygEditor.locator('.editor-task-list__checkbox')

    await expect(checkboxes).toHaveCount(2)
    await expect(checkboxes.nth(0)).not.toBeChecked()
    await expect(checkboxes.nth(1)).toBeChecked()

    await checkboxes.nth(0).click()
    await expect(checkboxes.nth(0)).toBeChecked()
    await expect.poll(async () => {
        return await page.evaluate(() => {
            const snapshot = window.localStorage.getItem('mymd:session:v1')
            if (!snapshot) return ''
            return JSON.parse(snapshot).tabs?.[0]?.content ?? ''
        })
    }).toMatch(/^[*-] \[x\] Draft outline/m)

    await checkboxes.nth(1).click()
    await expect(checkboxes.nth(1)).not.toBeChecked()

    await expect.poll(async () => {
        return await page.evaluate(() => {
            const snapshot = window.localStorage.getItem('mymd:session:v1')
            if (!snapshot) return ''
            return JSON.parse(snapshot).tabs?.[0]?.content ?? ''
        })
    }).toMatch(/^[*-] \[x\] Draft outline[\s\S]*^[*-] \[ \] Ship release/m)

    await page.getByTitle('Split mode').click()
    const sourceEditor = page.locator('.editor-split__source .cm-content')
    await expect(sourceEditor).toContainText(/[*-] \[x\] Draft outline/)
    await expect(sourceEditor).toContainText(/[*-] \[ \] Ship release/)

    const previewCheckboxes = page.locator('.editor-split__preview .editor-task-list__checkbox')
    await expect(previewCheckboxes).toHaveCount(2)
    await expect(previewCheckboxes.nth(0)).toBeDisabled()
    await expect(previewCheckboxes.nth(1)).toBeDisabled()
})
