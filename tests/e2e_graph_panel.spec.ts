import { expect, test, type Page } from '@playwright/test'

const GRAPH_WORKSPACE_PATH = 'C:/graph-workspace'
const GRAPH_HOME_PATH = `${GRAPH_WORKSPACE_PATH}/Home.md`

async function installGraphRuntime(page: Page) {
    await page.addInitScript(({ workspacePath, filePath }) => {
        const encoder = new TextEncoder()
        const callbacks = new Map<number, (payload: unknown) => void>()
        let callbackId = 1
        const fileState: Record<string, string> = {
            [filePath]: '# Home\n\nLink to [[Alpha]].',
            [`${workspacePath}/Research/Alpha.md`]: '# Alpha\n\nAlpha detail for graph navigation.',
            [`${workspacePath}/Research/Alpha Plan.md`]: '# Alpha Plan\n\nPlan detail.',
        }

        const graphNodes = [
            { id: 'home', title: 'Home', file_path: filePath, tags: ['daily'] },
            { id: 'alpha', title: 'Alpha', file_path: `${workspacePath}/Research/Alpha.md`, tags: ['project/roadmap', 'alpha'] },
            { id: 'alpha-plan', title: 'Alpha Plan', file_path: `${workspacePath}/Research/Alpha Plan.md`, tags: ['project/roadmap'] },
        ]
        const graphEdges = [
            { from: 'home', to: 'alpha', raw_text: '[[Alpha]]' },
            { from: 'alpha', to: 'alpha-plan', raw_text: '[[Alpha Plan]]' },
        ]

        const sessionSnapshot = {
            version: 1,
            timestamp: Date.now(),
            activeTabIndex: 0,
            viewMode: 'wysiwyg',
            activeWorkspace: workspacePath,
            tabs: [
                {
                    filePath,
                    title: 'Home.md',
                    content: '',
                    isDirty: false,
                },
            ],
        }
        window.localStorage.setItem('mymd:session:v1', JSON.stringify(sessionSnapshot))
        window.localStorage.setItem('mymd:view-mode-guide:v1', 'dismissed')

        Object.defineProperty(window, '__TAURI_EVENT_PLUGIN_INTERNALS__', {
            value: {
                unregisterListener() {
                    return null
                },
            },
            configurable: true,
        })

        Object.defineProperty(window, '__TAURI_INTERNALS__', {
            value: {
                metadata: {
                    currentWindow: { label: 'main' },
                    currentWebview: { windowLabel: 'main', label: 'main' },
                },
                transformCallback(callback: (payload: unknown) => void) {
                    const id = callbackId++
                    callbacks.set(id, callback)
                    return id
                },
                unregisterCallback(id: number) {
                    callbacks.delete(id)
                },
                convertFileSrc(inputPath: string, protocol = 'asset') {
                    return `${protocol}://localhost/${encodeURIComponent(inputPath)}`
                },
                async invoke(cmd: string, payload?: unknown) {
                    switch (cmd) {
                        case 'plugin:event|listen': {
                            const args = payload as { handler: number }
                            return args.handler
                        }
                        case 'plugin:event|unlisten':
                            return null
                        case 'plugin:window|is_maximized':
                            return false
                        case 'plugin:window|minimize':
                        case 'plugin:window|toggle_maximize':
                        case 'plugin:window|start_dragging':
                        case 'plugin:window|destroy':
                        case 'exit_app':
                            return null
                        case 'get_cli_args':
                            return []
                        case 'plugin:fs|read_dir':
                            return [
                                {
                                    name: 'Home.md',
                                    isDirectory: false,
                                    isFile: true,
                                    isSymlink: false,
                                },
                            ]
                        case 'plugin:fs|read_text_file': {
                            const args = payload as { path: string }
                            return Array.from(encoder.encode(fileState[args.path] || ''))
                        }
                        case 'read_text_file_from_path': {
                            const args = payload as { path: string }
                            return fileState[args.path] || ''
                        }
                        case 'knowledge_upsert_document':
                            return null
                        case 'knowledge_graph': {
                            const args = payload as { filter_text?: string }
                            const filterText = (args.filter_text || '').trim().toLowerCase()
                            if (!filterText) {
                                return { nodes: graphNodes, edges: graphEdges }
                            }

                            return {
                                nodes: graphNodes.filter(node =>
                                    `${node.title} ${node.file_path}`.toLowerCase().includes(filterText)
                                ),
                                edges: graphEdges.filter(edge =>
                                    `${edge.from} ${edge.to} ${edge.raw_text}`.toLowerCase().includes(filterText)
                                ),
                            }
                        }
                        default:
                            return null
                    }
                },
            },
            configurable: true,
        })
    }, {
        workspacePath: GRAPH_WORKSPACE_PATH,
        filePath: GRAPH_HOME_PATH,
    })
}

async function openGraphPanel(page: Page) {
    await installGraphRuntime(page)
    await page.goto('http://127.0.0.1:1420')
    await page.waitForLoadState('networkidle')
    await page.locator('.statusbar__right').getByRole('button', { name: /Graph|图谱/ }).dispatchEvent('click')
    await expect(page.locator('.knowledge-graph-panel')).toBeVisible()
}

test('knowledge graph panel can be toggled from status bar', async ({ page }) => {
    await openGraphPanel(page)
    await expect(page.locator('.knowledge-graph-panel__meta')).toContainText('3 nodes / 2 edges')
})

test('knowledge graph panel can open AI graph workflow with contextual draft', async ({ page }) => {
    await openGraphPanel(page)

    await page.locator('.knowledge-graph-panel__filter').evaluate((element, value) => {
        const input = element as HTMLInputElement
        const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')
        descriptor?.set?.call(input, value)
        input.dispatchEvent(new Event('input', { bubbles: true }))
    }, 'Alpha')

    await page.getByRole('button', { name: 'AI Link Plan' }).dispatchEvent('click')

    await expect(page.locator('.ai-panel')).toBeVisible()
    await expect(page.locator('.ai-panel__task-card.active')).toContainText('Graph Enrichment')
    await expect(page.locator('.ai-panel__textarea')).toHaveValue(/Alpha/i)
})

test('knowledge graph panel filters by folder tag and link depth', async ({ page }) => {
    await openGraphPanel(page)

    await page.getByLabel('Filter graph by folder').selectOption('Research')
    await expect(page.locator('.knowledge-graph-panel__meta')).toContainText('2 nodes / 1 edges')
    await expect(page.locator('.knowledge-graph-panel__node')).toContainText(['Alpha', 'Alpha Plan'])

    await page.getByLabel('Filter graph by tag').selectOption('project/roadmap')
    await expect(page.locator('.knowledge-graph-panel__filter-summary')).toContainText('Tag: #project/roadmap')
    await expect(page.locator('.knowledge-graph-panel__meta')).toContainText('2 nodes / 1 edges')

    await page.getByLabel('Filter graph by link depth').selectOption('hubs')
    await expect(page.locator('.knowledge-graph-panel__meta')).toContainText('1 nodes / 0 edges')
    await expect(page.locator('.knowledge-graph-panel__node')).toContainText('Alpha')
})

test('knowledge graph node buttons open the target note', async ({ page }) => {
    await openGraphPanel(page)

    await page.locator('.knowledge-graph-panel__node').nth(1).dispatchEvent('click')
    await expect(page.locator('.editor-wysiwyg')).toContainText('Alpha detail for graph navigation')
})
