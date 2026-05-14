import { expect, test } from '@playwright/test'

const WORKSPACE_ROOT = 'C:/mock-workspace'
const INBOX_PATH = `${WORKSPACE_ROOT}/Inbox.md`
const TAG_SOURCE_PATH = `${WORKSPACE_ROOT}/Project.md`

test.beforeEach(async ({ page }) => {
    await page.addInitScript(({ inboxPath, tagSourcePath }) => {
        const files: Record<string, string> = {
            [inboxPath]: '# Inbox\n\n',
            [tagSourcePath]: '# Project\n\n#project #project/roadmap #productivity\n'
        }
        const tags = ['project', 'project/roadmap', 'productivity']

        const normalizePath = (value: string) =>
            String(value || '')
                .replace(/\\/g, '/')
                .replace(/\/+/g, '/')
                .replace(/\/$/, '')

        Object.defineProperty(window, '__TAURI_INTERNALS__', {
            value: {
                metadata: {
                    currentWindow: { label: 'main' },
                    currentWebview: { windowLabel: 'main', label: 'main' },
                },
                transformCallback() {
                    return 1
                },
                unregisterCallback() {},
                runCallback() {},
                convertFileSrc(filePath: string, protocol = 'asset') {
                    return `${protocol}://localhost/${encodeURIComponent(filePath)}`
                },
                async invoke(cmd: string, payload?: unknown) {
                    switch (cmd) {
                        case 'plugin:window|is_maximized':
                            return false
                        case 'plugin:window|minimize':
                        case 'plugin:window|toggle_maximize':
                        case 'plugin:window|start_dragging':
                        case 'plugin:window|destroy':
                        case 'exit_app':
                            return null
                        case 'plugin:event|listen':
                            return 1
                        case 'plugin:event|unlisten':
                        case 'plugin:event|emit':
                            return null
                        case 'get_cli_args':
                            return [inboxPath]
                        case 'read_text_file_from_path': {
                            const args = payload as { path: string }
                            return files[normalizePath(args.path)] || ''
                        }
                        case 'write_text_file_to_path': {
                            const args = payload as { path: string; content: string }
                            files[normalizePath(args.path)] = args.content
                            return null
                        }
                        case 'knowledge_upsert_document':
                            return null
                        case 'knowledge_query': {
                            const args = payload as { search_text?: string; searchText?: string }
                            const query = (args.search_text ?? args.searchText ?? '').trim().toLowerCase()
                            return {
                                documents: [],
                                headings: [],
                                tags: tags
                                    .filter(tag => tag.includes(query))
                                    .map(tag => ({
                                        file_path: tagSourcePath,
                                        document_title: 'Project',
                                        tag
                                    }))
                            }
                        }
                        case 'knowledge_graph':
                            return { nodes: [], edges: [] }
                        case 'knowledge_get_backlinks':
                        case 'knowledge_get_unlinked_mentions':
                            return []
                        case 'knowledge_link_unlinked_mention':
                            return false
                        default:
                            return null
                    }
                },
            },
            configurable: true,
        })

        window.localStorage.clear()
    }, {
        inboxPath: INBOX_PATH,
        tagSourcePath: TAG_SOURCE_PATH,
    })
})

test('typing a tag prefix shows indexed tag suggestions and inserts the selected tag', async ({ page }) => {
    await page.goto('http://127.0.0.1:1420')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('.tabbar__tab--active .tabbar__tab-title')).toHaveText('Inbox.md')
    await page.locator('button[title="分屏模式"], button[title="Split mode"]').last().click()

    const source = page.locator('.editor-split__source .cm-content')
    await expect(source).toBeVisible()
    await source.click()
    await page.keyboard.type('#pro')

    const completion = page.locator('.cm-tooltip-autocomplete')
    await expect(completion).toBeVisible()
    await expect(completion).toContainText('#project/roadmap')

    await page.locator('.cm-tooltip-autocomplete li', { hasText: '#project/roadmap' }).first().click()

    await expect
        .poll(() => source.innerText())
        .toContain('#project/roadmap')
})
