import { expect, test, type Page } from '@playwright/test'

const WORKSPACE_PATH = 'C:/index-workspace'
const GOOD_PATH = `${WORKSPACE_PATH}/Good.md`
const BAD_PATH = `${WORKSPACE_PATH}/Bad.md`

async function installIndexRuntime(page: Page) {
    await page.addInitScript(({ workspacePath, goodPath, badPath }) => {
        const encoder = new TextEncoder()
        let badReadAttempts = 0
        const files: Record<string, string> = {
            [goodPath]: '# Good\n\n#project\n\nLink to [[Bad]].',
            [badPath]: '# Bad\n\n#project/retry\n\nRecovered note.',
        }

        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

        const sessionSnapshot = {
            version: 1,
            timestamp: Date.now(),
            activeTabIndex: 0,
            viewMode: 'wysiwyg',
            activeWorkspace: workspacePath,
            tabs: [
                {
                    filePath: goodPath,
                    title: 'Good.md',
                    content: '',
                    isDirty: false,
                },
            ],
        }

        window.localStorage.clear()
        window.localStorage.setItem('mymd.locale', 'zh-CN')
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
                transformCallback() {
                    return 1
                },
                unregisterCallback() { },
                runCallback() { },
                convertFileSrc(filePath: string, protocol = 'asset') {
                    return `${protocol}://localhost/${encodeURIComponent(filePath)}`
                },
                async invoke(cmd: string, payload?: unknown) {
                    switch (cmd) {
                        case 'plugin:event|listen':
                            return 1
                        case 'plugin:event|unlisten':
                        case 'plugin:event|emit':
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
                        case 'plugin:fs|read_dir': {
                            return [
                                { name: 'Good.md', isDirectory: false, isFile: true, isSymlink: false },
                                { name: 'Bad.md', isDirectory: false, isFile: true, isSymlink: false },
                            ]
                        }
                        case 'plugin:fs|read_text_file': {
                            const args = payload as { path: string }
                            if (args.path === badPath) {
                                badReadAttempts += 1
                            }
                            if (args.path === badPath && badReadAttempts === 1) {
                                await delay(1000)
                                throw new Error('Read failed for Bad.md')
                            }
                            await delay(args.path === goodPath ? 20 : 30)
                            return Array.from(encoder.encode(files[args.path] || ''))
                        }
                        case 'read_text_file_from_path': {
                            const args = payload as { path: string }
                            if (args.path === badPath && badReadAttempts === 1) {
                                throw new Error('Read failed for Bad.md')
                            }
                            return files[args.path] || ''
                        }
                        case 'knowledge_upsert_document':
                            return null
                        case 'knowledge_query':
                            return { documents: [], headings: [], tags: [] }
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
    }, {
        workspacePath: WORKSPACE_PATH,
        goodPath: GOOD_PATH,
        badPath: BAD_PATH,
    })
}

test('workspace indexing shows progress, skipped files, and retry recovery', async ({ page }) => {
    await installIndexRuntime(page)
    await page.goto('http://127.0.0.1:1420')

    await expect(page.locator('.file-explorer__index-status--indexing')).toContainText('正在建立索引 1/2')
    await expect(page.locator('.file-explorer__index-status--warning')).toContainText('1 个需重试')
    await expect(page.locator('.file-explorer__index-status--warning')).toContainText('Bad.md')
    await expect(page.locator('.statusbar__btn--warning')).toContainText('1 个需重试')

    await page.getByRole('button', { name: '重试索引' }).click()

    await expect(page.locator('.file-explorer__index-status--warning')).toHaveCount(0)
    await expect(page.locator('.statusbar__btn--action', { hasText: '已索引 2 个文件' })).toBeVisible()

    const runtimeState = await page.evaluate(async () => {
        const mod = await import('/src/utils/editorRuntime.ts')
        return mod.getEditorRuntimeStateSnapshot()
    })

    expect(runtimeState.knowledgeIndexStatus).toBe('idle')
    expect(runtimeState.knowledgeIndexProcessed).toBe(2)
    expect(runtimeState.knowledgeIndexTotal).toBe(2)
    expect(runtimeState.knowledgeIndexSkipped).toBe(0)
})
