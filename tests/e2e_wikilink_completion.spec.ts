import { expect, test } from '@playwright/test'

const WORKSPACE_ROOT = 'C:/mock-workspace'
const INBOX_PATH = `${WORKSPACE_ROOT}/Inbox.md`
const ALPHA_PATH = `${WORKSPACE_ROOT}/Alpha.md`
const BETA_PATH = `${WORKSPACE_ROOT}/Projects/Beta Plan.md`

test.beforeEach(async ({ page }) => {
    await page.addInitScript(({ workspaceRoot, inboxPath, alphaPath, betaPath }) => {
        const files: Record<string, string> = {
            [inboxPath]: '# Inbox\n\n',
            [alphaPath]: '# Alpha\n\n## Roadmap\n\nPlan.',
            [betaPath]: '# Beta Plan\n\n'
        }

        const normalizePath = (value: string) =>
            String(value || '')
                .replace(/\\/g, '/')
                .replace(/\/+/g, '/')
                .replace(/\/$/, '')

        const nodes = [
            { id: 'alpha', title: 'Alpha', file_path: alphaPath },
            { id: 'beta-plan', title: 'Beta Plan', file_path: betaPath },
        ]

        const filterByText = <T extends { title: string; file_path: string }>(items: T[], text: string) => {
            const normalized = text.trim().toLowerCase()
            if (!normalized) return items
            return items.filter(item =>
                item.title.toLowerCase().includes(normalized) ||
                item.file_path.toLowerCase().includes(normalized)
            )
        }

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
                        case 'knowledge_graph': {
                            const args = payload as { filter_text?: string; filterText?: string }
                            const query = args.filter_text ?? args.filterText ?? ''
                            return {
                                nodes: filterByText(nodes, query),
                                edges: []
                            }
                        }
                        case 'knowledge_query': {
                            const args = payload as { search_text?: string; searchText?: string }
                            const query = args.search_text ?? args.searchText ?? ''
                            const documents = filterByText(nodes, query).map(node => ({
                                file_path: node.file_path,
                                title: node.title,
                                preview: ''
                            }))
                            const headings = query.trim().toLowerCase()
                                ? [{
                                    file_path: alphaPath,
                                    document_title: 'Alpha',
                                    heading_text: 'Roadmap',
                                    heading_slug: 'roadmap',
                                    level: 2
                                }]
                                : []
                            return { documents, headings, tags: [] }
                        }
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

        Object.defineProperty(window, '__MYMD_WIKILINK_TEST__', {
            value: { files, workspaceRoot },
            configurable: true
        })

        window.localStorage.clear()
    }, {
        workspaceRoot: WORKSPACE_ROOT,
        inboxPath: INBOX_PATH,
        alphaPath: ALPHA_PATH,
        betaPath: BETA_PATH,
    })
})

test('typing wikilink opener shows note suggestions and inserts a valid target', async ({ page }) => {
    await page.goto('http://127.0.0.1:1420')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('.tabbar__tab--active .tabbar__tab-title')).toHaveText('Inbox.md')

    const splitButton = page.locator('button[title="分屏模式"], button[title="Split mode"]').last()
    await splitButton.click()

    const source = page.locator('.editor-split__source .cm-content')
    await expect(source).toBeVisible()
    await source.click()
    await page.keyboard.type('[[')

    const completion = page.locator('.cm-tooltip-autocomplete')
    await expect(completion).toBeVisible()
    await expect(completion).toContainText('Alpha')
    await expect(completion).toContainText('Beta Plan')
    await expect(page.locator('.cm-tooltip-autocomplete li[aria-selected="true"]').first()).toBeVisible()

    await page.locator('.cm-tooltip-autocomplete li', { hasText: 'Alpha' }).first().click()

    await expect
        .poll(() => source.innerText())
        .toContain('[[Alpha]]')
})

test('wikilink completion includes heading targets after typing a query', async ({ page }) => {
    await page.goto('http://127.0.0.1:1420')
    await page.waitForLoadState('networkidle')

    await page.locator('button[title="分屏模式"], button[title="Split mode"]').last().click()

    const source = page.locator('.editor-split__source .cm-content')
    await expect(source).toBeVisible()
    await source.click()
    await page.keyboard.type('[[Alpha')

    const completion = page.locator('.cm-tooltip-autocomplete')
    await expect(completion).toBeVisible()
    await expect(completion).toContainText('Roadmap')
})
