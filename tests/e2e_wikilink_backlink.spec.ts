import { expect, test, type Page } from '@playwright/test'

const WORKSPACE_ROOT = 'C:/mock-workspace'
const TARGET_PATH = `${WORKSPACE_ROOT}/Target.md`
const RENAMED_TARGET_PATH = `${WORKSPACE_ROOT}/Project Target.md`
const REF_PATH = `${WORKSPACE_ROOT}/Ref.md`
const LOOSE_MENTION_PATH = `${WORKSPACE_ROOT}/Loose Mention.md`
const NOTES_DIR = `${WORKSPACE_ROOT}/Notes`
const EXISTING_NOTE_PATH = `${NOTES_DIR}/Existing.md`
const CREATED_NOTE_PATH = `${NOTES_DIR}/Fresh Note.md`
const CREATED_FOLDER_PATH = `${WORKSPACE_ROOT}/Archive`

const INITIAL_FILES = {
    [TARGET_PATH]: [
        '# Target',
        '',
        '## Section One',
        '',
        'Target content.',
    ].join('\n'),
    [REF_PATH]: [
        '# Ref',
        '',
        'See [[Target#Section One]] for the current plan.',
    ].join('\n'),
    [LOOSE_MENTION_PATH]: [
        '# Loose Mention',
        '',
        'Target appears here as plain text before it becomes a link.',
    ].join('\n'),
    [EXISTING_NOTE_PATH]: [
        '# Existing',
        '',
        'Nested note.',
    ].join('\n'),
}

async function setDialogInputValue(page: Page, value: string) {
    await page.locator('.file-explorer-dialog__input').evaluate((element, nextValue) => {
        const input = element as HTMLInputElement
        const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')
        descriptor?.set?.call(input, nextValue)
        input.dispatchEvent(new Event('input', { bubbles: true }))
    }, value)
}

test.beforeEach(async ({ page }) => {
    await page.addInitScript(
        ({ workspaceRoot, initialFiles }) => {
            const encoder = new TextEncoder()
            const decoder = new TextDecoder()
            const callbacks = new Map<number, (payload: unknown) => void>()
            const eventListeners = new Map<string, number[]>()
            const knowledgeDocs: Record<string, {
                file_path: string
                title: string
                content: string
                headings: Array<{ text: string; slug: string }>
                wikilinks: Array<{ raw_text: string; to_doc_path: string; to_heading_slug: string }>
                mtime: number
            }> = {}
            let callbackId = 1

            const normalizePath = (value: string) =>
                String(value || '')
                    .replace(/\\/g, '/')
                    .replace(/\/+/g, '/')
                    .replace(/\/$/, '')

            const dirname = (value: string) => {
                const normalized = normalizePath(value)
                const index = normalized.lastIndexOf('/')
                return index <= 0 ? normalized : normalized.slice(0, index)
            }

            const basename = (value: string) => {
                const normalized = normalizePath(value)
                const index = normalized.lastIndexOf('/')
                return index >= 0 ? normalized.slice(index + 1) : normalized
            }

            const fileStem = (value: string) => {
                const name = basename(value)
                return name.toLowerCase().endsWith('.md') ? name.slice(0, -3) : name
            }

            const decodeTextPayload = (payload: unknown) => {
                if (payload instanceof Uint8Array) return decoder.decode(payload)
                if (payload instanceof ArrayBuffer) return decoder.decode(new Uint8Array(payload))
                if (Array.isArray(payload)) return decoder.decode(Uint8Array.from(payload))
                if (typeof payload === 'string') return payload
                return ''
            }

            const pathFromInvokeOptions = (options?: { headers?: Record<string, string> }) => {
                const rawPath = options?.headers?.path
                return rawPath ? decodeURIComponent(rawPath) : ''
            }

            const fileState: Record<string, string> = {}
            const directoryState = new Set<string>([normalizePath(workspaceRoot)])

            const ensureDirectory = (path: string) => {
                const normalized = normalizePath(path)
                if (!normalized) return
                const parts = normalized.split('/')
                let current = parts[0]
                directoryState.add(current)
                for (let i = 1; i < parts.length; i += 1) {
                    current = `${current}/${parts[i]}`
                    directoryState.add(current)
                }
            }

            Object.entries(initialFiles).forEach(([filePath, content]) => {
                const normalizedFile = normalizePath(filePath)
                fileState[normalizedFile] = content
                ensureDirectory(dirname(normalizedFile))
            })

            const getDirEntries = (dirPath: string) => {
                const normalizedDir = normalizePath(dirPath)
                const prefix = normalizedDir.length > 0 ? `${normalizedDir}/` : ''
                const entries = new Map<string, { name: string; isDirectory: boolean; isFile: boolean; isSymlink: boolean }>()

                Array.from(directoryState).forEach((directoryPath) => {
                    if (!directoryPath.startsWith(prefix) || directoryPath === normalizedDir) return
                    const remainder = directoryPath.slice(prefix.length)
                    if (!remainder || remainder.includes('/')) return
                    entries.set(remainder, {
                        name: remainder,
                        isDirectory: true,
                        isFile: false,
                        isSymlink: false,
                    })
                })

                Object.keys(fileState).forEach((filePath) => {
                    if (!filePath.startsWith(prefix)) return
                    const remainder = filePath.slice(prefix.length)
                    if (!remainder || remainder.includes('/')) return
                    entries.set(remainder, {
                        name: remainder,
                        isDirectory: false,
                        isFile: true,
                        isSymlink: false,
                    })
                })

                return Array.from(entries.values()).sort((a, b) => {
                    if (a.isDirectory && !b.isDirectory) return -1
                    if (!a.isDirectory && b.isDirectory) return 1
                    return a.name.localeCompare(b.name)
                })
            }

            const renameFileOrDirectory = (oldPath: string, newPath: string) => {
                const normalizedOld = normalizePath(oldPath)
                const normalizedNew = normalizePath(newPath)
                const oldPrefix = `${normalizedOld}/`

                Object.entries({ ...fileState }).forEach(([filePath, content]) => {
                    if (filePath === normalizedOld) {
                        delete fileState[filePath]
                        fileState[normalizedNew] = content
                    } else if (filePath.startsWith(oldPrefix)) {
                        delete fileState[filePath]
                        fileState[`${normalizedNew}${filePath.slice(normalizedOld.length)}`] = content
                    }
                })

                Array.from(directoryState).forEach((directoryPath) => {
                    if (directoryPath === normalizedOld || directoryPath.startsWith(oldPrefix)) {
                        directoryState.delete(directoryPath)
                        directoryState.add(`${normalizedNew}${directoryPath.slice(normalizedOld.length)}`)
                    }
                })

                ensureDirectory(dirname(normalizedNew))

                Object.keys(knowledgeDocs).forEach((filePath) => {
                    if (filePath === normalizedOld || filePath.startsWith(oldPrefix)) {
                        delete knowledgeDocs[filePath]
                    }
                })
            }

            const removeFileOrDirectory = (targetPath: string, recursive: boolean) => {
                const normalizedTarget = normalizePath(targetPath)
                const prefix = `${normalizedTarget}/`

                if (fileState[normalizedTarget] != null) {
                    delete fileState[normalizedTarget]
                }

                Object.keys({ ...fileState }).forEach((filePath) => {
                    if (filePath.startsWith(prefix)) {
                        delete fileState[filePath]
                    }
                })

                if (recursive) {
                    Array.from(directoryState).forEach((directoryPath) => {
                        if (directoryPath === normalizedTarget || directoryPath.startsWith(prefix)) {
                            directoryState.delete(directoryPath)
                        }
                    })
                } else {
                    directoryState.delete(normalizedTarget)
                }

                Object.keys(knowledgeDocs).forEach((filePath) => {
                    if (filePath === normalizedTarget || filePath.startsWith(prefix)) {
                        delete knowledgeDocs[filePath]
                    }
                })
            }

            const extractSnippet = (content: string, rawText: string) => {
                const index = content.indexOf(rawText)
                if (index === -1) return content.slice(0, 80)
                const start = Math.max(0, index - 20)
                const end = Math.min(content.length, index + rawText.length + 20)
                return content.slice(start, end)
            }

            const emitMockEvent = (event: string, payload: unknown) => {
                const listeners = eventListeners.get(event) || []
                listeners.forEach((id) => {
                    callbacks.get(id)?.({ event, id, payload })
                })
            }

            const getBacklinks = (filePath: string) => {
                const normalizedPath = normalizePath(filePath)
                const targetDoc = knowledgeDocs[normalizedPath]
                const backlinks = Object.values(knowledgeDocs).flatMap((doc) =>
                    doc.wikilinks
                        .filter((link) => normalizePath(link.to_doc_path) === normalizedPath)
                        .map((link) => ({
                            from_file_path: doc.file_path,
                            from_title: doc.title,
                            raw_text: link.raw_text,
                            to_heading_slug: link.to_heading_slug,
                            snippet: extractSnippet(doc.content, link.raw_text),
                            matched_heading_text:
                                targetDoc?.headings.find((heading) => heading.slug === link.to_heading_slug)?.text || '',
                            updated_at: doc.mtime,
                        }))
                )

                backlinks.sort((left, right) => right.updated_at - left.updated_at)
                return backlinks
            }

            const getUnlinkedMentions = (filePath: string) => {
                const normalizedPath = normalizePath(filePath)
                const targetDoc = knowledgeDocs[normalizedPath]
                const mentionText = (targetDoc?.title || fileStem(normalizedPath)).trim()
                if (!mentionText) return []

                const mentionNeedle = mentionText.toLowerCase()
                return Object.values(knowledgeDocs)
                    .filter((doc) => {
                        if (doc.file_path === normalizedPath) return false
                        if (!doc.content.toLowerCase().includes(mentionNeedle)) return false
                        return !doc.wikilinks.some((link) => normalizePath(link.to_doc_path) === normalizedPath)
                    })
                    .map((doc) => ({
                        from_file_path: doc.file_path,
                        from_title: doc.title,
                        mention_text: mentionText,
                        snippet: extractSnippet(doc.content, mentionText),
                        updated_at: doc.mtime,
                    }))
                    .sort((left, right) => right.updated_at - left.updated_at)
            }

            Object.defineProperty(window, '__MYMD_TEST_RUNTIME__', {
                value: {
                    workspaceRoot: normalizePath(workspaceRoot),
                    files: fileState,
                    directories: directoryState,
                    knowledgeDocs,
                    normalizePath,
                    basename,
                },
                configurable: true,
            })

            Object.defineProperty(window, '__TAURI_EVENT_PLUGIN_INTERNALS__', {
                value: {
                    unregisterListener(event: string, eventId: number) {
                        const listeners = eventListeners.get(event)
                        if (!listeners) return
                        eventListeners.set(
                            event,
                            listeners.filter((id) => id !== eventId)
                        )
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
                    runCallback(id: number, payload: unknown) {
                        callbacks.get(id)?.(payload)
                    },
                    convertFileSrc(filePath: string, protocol = 'asset') {
                        return `${protocol}://localhost/${encodeURIComponent(filePath)}`
                    },
                    async invoke(cmd: string, payload?: unknown, options?: { headers?: Record<string, string> }) {
                        switch (cmd) {
                            case 'plugin:event|listen': {
                                const args = payload as { event: string; handler: number }
                                const listeners = eventListeners.get(args.event) || []
                                listeners.push(args.handler)
                                eventListeners.set(args.event, listeners)
                                return args.handler
                            }
                            case 'plugin:event|unlisten': {
                                const args = payload as { event: string; eventId: number }
                                const listeners = eventListeners.get(args.event) || []
                                eventListeners.set(args.event, listeners.filter((id) => id !== args.eventId))
                                return null
                            }
                            case 'plugin:event|emit': {
                                const args = payload as { event: string; payload: unknown }
                                emitMockEvent(args.event, args.payload)
                                return null
                            }
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
                            case 'plugin:dialog|open': {
                                const args = payload as { options?: { directory?: boolean } }
                                return args.options?.directory ? normalizePath(workspaceRoot) : null
                            }
                            case 'plugin:dialog|save':
                                return `${normalizePath(workspaceRoot)}/export.md`
                            case 'plugin:fs|read_dir': {
                                const args = payload as { path: string }
                                return getDirEntries(args.path)
                            }
                            case 'plugin:fs|read_text_file': {
                                const args = payload as { path: string }
                                return Array.from(encoder.encode(fileState[normalizePath(args.path)] || ''))
                            }
                            case 'plugin:fs|write_text_file': {
                                const filePath = normalizePath(pathFromInvokeOptions(options))
                                ensureDirectory(dirname(filePath))
                                fileState[filePath] = decodeTextPayload(payload)
                                return null
                            }
                            case 'plugin:fs|mkdir': {
                                const args = payload as { path: string }
                                ensureDirectory(args.path)
                                return null
                            }
                            case 'plugin:fs|remove': {
                                const args = payload as { path: string; options?: { recursive?: boolean } }
                                removeFileOrDirectory(args.path, Boolean(args.options?.recursive))
                                return null
                            }
                            case 'plugin:fs|rename': {
                                const args = payload as { oldPath: string; newPath: string }
                                renameFileOrDirectory(args.oldPath, args.newPath)
                                return null
                            }
                            case 'read_text_file_from_path': {
                                const args = payload as { path: string }
                                return fileState[normalizePath(args.path)] || ''
                            }
                            case 'write_text_file_to_path': {
                                const args = payload as { path: string; content: string }
                                ensureDirectory(dirname(args.path))
                                fileState[normalizePath(args.path)] = args.content
                                return null
                            }
                            case 'knowledge_upsert_document': {
                                const args = payload as {
                                    payload: {
                                        file_path: string
                                        title: string
                                        content: string
                                        headings: Array<{ text: string; slug: string }>
                                        wikilinks: Array<{ raw_text: string; to_doc_path: string; to_heading_slug: string }>
                                        mtime: number
                                    }
                                }
                                const doc = {
                                    ...args.payload,
                                    file_path: normalizePath(args.payload.file_path),
                                }
                                knowledgeDocs[doc.file_path] = doc
                                return null
                            }
                            case 'knowledge_get_backlinks': {
                                const args = payload as { file_path: string }
                                return getBacklinks(args.file_path)
                            }
                            case 'knowledge_get_unlinked_mentions': {
                                const args = payload as { file_path: string }
                                return getUnlinkedMentions(args.file_path)
                            }
                            case 'knowledge_link_unlinked_mention': {
                                const args = payload as {
                                    from_file_path: string
                                    target_file_path: string
                                    mention_text: string
                                }
                                const sourcePath = normalizePath(args.from_file_path)
                                const sourceContent = fileState[sourcePath] || ''
                                const targetTitle = fileStem(args.target_file_path)
                                const replacement =
                                    args.mention_text.toLowerCase() === targetTitle.toLowerCase()
                                        ? `[[${targetTitle}]]`
                                        : `[[${targetTitle}|${args.mention_text}]]`

                                if (!sourceContent.includes(args.mention_text)) return false
                                fileState[sourcePath] = sourceContent.replace(args.mention_text, replacement)
                                return true
                            }
                            case 'knowledge_graph':
                                return { nodes: [], edges: [] }
                            case 'knowledge_query':
                                return { documents: [], headings: [], tags: [] }
                            default:
                                return null
                        }
                    },
                },
                configurable: true,
            })

            window.localStorage.clear()
        },
        {
            workspaceRoot: WORKSPACE_ROOT,
            initialFiles: INITIAL_FILES,
        }
    )
})

test('renaming a linked workspace note keeps backlinks aligned after reindex', async ({ page }) => {
    await page.goto('http://127.0.0.1:1420')
    await page.waitForLoadState('networkidle')

    await page.locator('.file-explorer__empty .btn-primary').click()
    await expect(page.locator('.file-explorer__workspace-name')).toHaveText('mock-workspace')

    await expect
        .poll(() =>
            page.evaluate(() => Object.keys((window as typeof window & {
                __MYMD_TEST_RUNTIME__: { knowledgeDocs: Record<string, unknown> }
            }).__MYMD_TEST_RUNTIME__.knowledgeDocs).length)
        )
        .toBe(4)

    await page.locator('.file-node__name', { hasText: 'Target.md' }).click()
    await expect(page.locator('.tabbar__tab--active .tabbar__tab-title')).toHaveText('Target.md')

    await page.getByTitle('Backlinks').click()
    const backlinksPanel = page.locator('.backlinks-panel')
    await expect(backlinksPanel).toBeVisible()
    await expect(backlinksPanel).toContainText('Linked mentions')
    const linkedSection = backlinksPanel.locator('section[aria-label="Linked mentions"]')
    await expect(linkedSection.locator('.backlinks-panel__item-title')).toHaveText('Ref')
    await expect(backlinksPanel).toContainText('[[Target#Section One]]')
    await expect(backlinksPanel).toContainText('Heading: Section One')

    const targetNode = page
        .locator('.file-node')
        .filter({ has: page.locator('.file-node__name', { hasText: 'Target.md' }) })
        .first()

    await targetNode.hover()
    await targetNode.getByTitle('重命名').click()
    await expect(page.locator('.file-explorer-dialog')).toBeVisible()
    await setDialogInputValue(page, 'Project Target')
    await page.locator('.file-explorer-dialog__footer button').last().click()

    await expect(page.locator('.tabbar__tab--active .tabbar__tab-title')).toHaveText('Project Target.md')
    await expect(page.locator('.file-node__name', { hasText: 'Project Target.md' })).toBeVisible()

    await expect
        .poll(() =>
            page.evaluate(
                ({ refPath }) =>
                    (window as typeof window & {
                        __MYMD_TEST_RUNTIME__: { files: Record<string, string> }
                    }).__MYMD_TEST_RUNTIME__.files[refPath],
                { refPath: REF_PATH }
            )
        )
        .toContain('[[Project Target#Section One]]')

    await expect
        .poll(() =>
            page.evaluate(
                ({ renamedTargetPath }) =>
                    (
                        window as typeof window & {
                            __MYMD_TEST_RUNTIME__: { knowledgeDocs: Record<string, unknown> }
                        }
                    ).__MYMD_TEST_RUNTIME__.knowledgeDocs[renamedTargetPath] != null,
                { renamedTargetPath: RENAMED_TARGET_PATH }
            )
        )
        .toBeTruthy()

    await expect(backlinksPanel).toContainText('[[Project Target#Section One]]')
    await expect(backlinksPanel).toContainText('Heading: Section One')
    await expect(linkedSection.locator('.backlinks-panel__item-title')).toHaveText('Ref')
})

test('converting an unlinked mention updates the source note and refreshes backlinks', async ({ page }) => {
    await page.goto('http://127.0.0.1:1420')
    await page.waitForLoadState('networkidle')

    await page.locator('.file-explorer__empty .btn-primary').click()
    await expect(page.locator('.file-explorer__workspace-name')).toHaveText('mock-workspace')

    await expect
        .poll(() =>
            page.evaluate(() => Object.keys((window as typeof window & {
                __MYMD_TEST_RUNTIME__: { knowledgeDocs: Record<string, unknown> }
            }).__MYMD_TEST_RUNTIME__.knowledgeDocs).length)
        )
        .toBe(4)

    await page.locator('.file-node__name', { hasText: 'Target.md' }).click()
    await expect(page.locator('.tabbar__tab--active .tabbar__tab-title')).toHaveText('Target.md')

    await page.getByTitle('Backlinks').click()
    const backlinksPanel = page.locator('.backlinks-panel')
    const linkedSection = backlinksPanel.locator('section[aria-label="Linked mentions"]')
    const unlinkedSection = backlinksPanel.locator('section[aria-label="Unlinked mentions"]')

    await expect(backlinksPanel).toBeVisible()
    await expect(linkedSection.locator('.backlinks-panel__item-title')).toHaveText('Ref')
    await expect(unlinkedSection).toBeVisible()
    await expect(unlinkedSection.locator('.backlinks-panel__item-title')).toHaveText('Loose Mention')
    await expect(unlinkedSection).toContainText('Target appears here')

    await unlinkedSection.getByRole('button', { name: 'Convert Target mention to wikilink' }).click()

    await expect
        .poll(() =>
            page.evaluate(
                ({ looseMentionPath }) =>
                    (window as typeof window & {
                        __MYMD_TEST_RUNTIME__: { files: Record<string, string> }
                    }).__MYMD_TEST_RUNTIME__.files[looseMentionPath],
                { looseMentionPath: LOOSE_MENTION_PATH }
            )
        )
        .toContain('[[Target]] appears here as plain text before it becomes a link.')

    await expect
        .poll(() =>
            page.evaluate(
                ({ looseMentionPath }) =>
                    (window as typeof window & {
                        __MYMD_TEST_RUNTIME__: {
                            knowledgeDocs: Record<string, {
                                wikilinks: Array<{ raw_text: string; to_doc_path: string }>
                            }>
                        }
                    }).__MYMD_TEST_RUNTIME__.knowledgeDocs[looseMentionPath]?.wikilinks,
                { looseMentionPath: LOOSE_MENTION_PATH }
            )
        )
        .toEqual([{ raw_text: 'Target', to_doc_path: TARGET_PATH, to_heading_slug: '', alias_text: '' }])

    await expect(unlinkedSection).toHaveCount(0)
    await expect(linkedSection.locator('.backlinks-panel__item-title')).toContainText(['Loose Mention', 'Ref'])
    await expect(linkedSection).toContainText('[[Target]]')
})

test('workspace file actions preserve open folders across refresh and close clean tabs on delete', async ({ page }) => {
    await page.goto('http://127.0.0.1:1420')
    await page.waitForLoadState('networkidle')

    await page.locator('.file-explorer__empty .btn-primary').click()

    const notesNode = page
        .locator('.file-node')
        .filter({ has: page.locator('.file-node__name', { hasText: 'Notes' }) })
        .first()

    await notesNode.click()
    await expect(page.locator('.file-node__name', { hasText: 'Existing.md' })).toBeVisible()

    await notesNode.hover()
    await notesNode.getByTitle('新建文档').click()
    await setDialogInputValue(page, 'Fresh Note')
    await page.locator('.file-explorer-dialog__footer button').last().click()
    await expect(page.locator('.file-node__name', { hasText: 'Fresh Note.md' })).toBeVisible()

    await page.getByTitle('在工作区根目录新建文件夹').click()
    await setDialogInputValue(page, 'Archive')
    await page.locator('.file-explorer-dialog__footer button').last().click()
    await expect(page.locator('.file-node__name', { hasText: 'Archive' })).toBeVisible()

    await page.locator('.file-node__name', { hasText: 'Fresh Note.md' }).click()
    await expect(page.locator('.tabbar__tab--active .tabbar__tab-title')).toHaveText('Fresh Note.md')

    await page.getByTitle('刷新工作区').click()
    await expect(page.locator('.file-node__name', { hasText: 'Fresh Note.md' })).toBeVisible()
    await expect(page.locator('.file-node__name', { hasText: 'Existing.md' })).toBeVisible()

    const freshNoteNode = page
        .locator('.file-node')
        .filter({ has: page.locator('.file-node__name', { hasText: 'Fresh Note.md' }) })
        .first()

    await freshNoteNode.hover()
    await freshNoteNode.getByTitle('删除').click()
    await expect(page.locator('.file-explorer-dialog')).toBeVisible()
    await page.locator('.file-explorer-dialog__footer button').last().click()

    await expect(page.locator('.file-node__name', { hasText: 'Fresh Note.md' })).toHaveCount(0)
    await expect(page.locator('.tabbar__tab-title', { hasText: 'Fresh Note.md' })).toHaveCount(0)

    await expect
        .poll(() =>
            page.evaluate(
                ({ createdNotePath, createdFolderPath }) => {
                    const runtime = (window as typeof window & {
                        __MYMD_TEST_RUNTIME__: {
                            files: Record<string, string>
                            directories: Set<string>
                        }
                    }).__MYMD_TEST_RUNTIME__

                    return {
                        noteExists: runtime.files[createdNotePath] != null,
                        folderExists: runtime.directories.has(createdFolderPath),
                    }
                },
                { createdNotePath: CREATED_NOTE_PATH, createdFolderPath: CREATED_FOLDER_PATH }
            )
        )
        .toEqual({ noteExists: false, folderExists: true })
})
