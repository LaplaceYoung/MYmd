import { expect, test } from '@playwright/test'

test('wysiwyg task list checkboxes update markdown source directly', async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.setItem('mymd:view-mode-guide:v1', 'dismissed')
        window.localStorage.removeItem('mymd:session:v1')
    })

    await page.goto('http://localhost:1420')
    await page.waitForLoadState('networkidle')

    await page.evaluate(async () => {
        const { useEditorStore } = await import('/src/stores/editorStore.ts')
        const store = useEditorStore.getState()
        const tabId = store.addTab(null, '- [ ] Draft outline\n- [x] Ship release\n')
        store.setActiveTab(tabId)
        store.setViewMode('wysiwyg')
    })

    const wysiwygEditor = page.locator('.editor-wysiwyg .ProseMirror')
    const checkboxes = wysiwygEditor.locator('.editor-task-list__checkbox')

    await expect(checkboxes).toHaveCount(2)
    await expect(checkboxes.nth(0)).not.toBeChecked()
    await expect(checkboxes.nth(1)).toBeChecked()

    await checkboxes.nth(0).click()
    await expect.poll(async () => {
        return await page.evaluate(async () => {
            const { useEditorStore } = await import('/src/stores/editorStore.ts')
            return useEditorStore.getState().getActiveTab()?.content ?? ''
        })
    }).toMatch(/^[*-] \[x\] Draft outline/m)

    await checkboxes.nth(1).click()
    await expect.poll(async () => {
        return await page.evaluate(async () => {
            const { useEditorStore } = await import('/src/stores/editorStore.ts')
            return useEditorStore.getState().getActiveTab()?.content ?? ''
        })
    }).toMatch(/^[*-] \[ \] Ship release/m)

    await page.getByTitle('Split mode').click()
    const sourceEditor = page.locator('.editor-split__source .cm-content')
    await expect(sourceEditor).toContainText(/[*-] \[x\] Draft outline/)
    await expect(sourceEditor).toContainText(/[*-] \[ \] Ship release/)

    const previewCheckboxes = page.locator('.editor-split__preview .editor-task-list__checkbox')
    await expect(previewCheckboxes).toHaveCount(2)
    await expect(previewCheckboxes.nth(0)).toBeDisabled()
    await expect(previewCheckboxes.nth(1)).toBeDisabled()
})
