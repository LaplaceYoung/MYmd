import { expect, test } from '@playwright/test'

test('editor runtime query api reflects current mode and surface state', async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.setItem('mymd:view-mode-guide:v1', 'dismissed')
        window.localStorage.removeItem('mymd:session:v1')
    })

    await page.goto('http://localhost:1420')
    await page.waitForLoadState('networkidle')
    await page.locator('.welcome-word__sidebar-btn').nth(1).click()

    const initialState = await page.evaluate(async () => {
        const { getEditorRuntimeStateSnapshot, canQueryEditorState, isSplitEditorRuntime } = await import('/src/utils/editorRuntime.ts')
        return {
            snapshot: getEditorRuntimeStateSnapshot(),
            canQuery: canQueryEditorState(),
            isSplit: isSplitEditorRuntime(),
        }
    })

    expect(initialState.canQuery).toBe(true)
    expect(initialState.isSplit).toBe(false)
    expect(initialState.snapshot.viewMode).toBe('wysiwyg')
    expect(initialState.snapshot.surfaces.primary).toBe('wysiwyg')
    expect(initialState.snapshot.surfaces.hasPreview).toBe(false)
    expect(initialState.snapshot.surfaces.previewReadonly).toBe(false)
    expect(initialState.snapshot.registeredEditorCommandIds.some((id: string) => id.startsWith('wysiwyg-'))).toBe(true)

    await page.getByTitle('Split mode').click()

    await expect.poll(async () => {
        return await page.evaluate(async () => {
            const { getEditorRuntimeStateSnapshot, isSplitEditorRuntime } = await import('/src/utils/editorRuntime.ts')
            return {
                snapshot: getEditorRuntimeStateSnapshot(),
                isSplit: isSplitEditorRuntime(),
            }
        })
    }).toMatchObject({
        isSplit: true,
        snapshot: {
            viewMode: 'split',
            surfaces: {
                primary: 'source',
                hasPreview: true,
                previewReadonly: true,
                hasWritableEditor: true,
            },
        },
    })
})
