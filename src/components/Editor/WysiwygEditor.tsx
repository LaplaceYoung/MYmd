import { useEffect, useRef, useCallback, useState } from 'react'
import { Editor, rootCtx, defaultValueCtx, editorViewCtx, serializerCtx } from '@milkdown/kit/core'
import { commonmark } from '@milkdown/kit/preset/commonmark'
import { gfm } from '@milkdown/kit/preset/gfm'
import { history } from '@milkdown/kit/plugin/history'
import { listener, listenerCtx } from '@milkdown/kit/plugin/listener'
import { clipboard } from '@milkdown/kit/plugin/clipboard'
import { indent } from '@milkdown/kit/plugin/indent'
import { trailing } from '@milkdown/kit/plugin/trailing'
import { replaceAll, callCommand, insert } from '@milkdown/kit/utils'
import { math } from '@milkdown/plugin-math'
import { diagram } from '@milkdown/plugin-diagram'
import { prism } from '@milkdown/plugin-prism'
import { search as prosemirrorSearchPlugin, SearchQuery, setSearchState, findNext, findPrev, replaceNext, replaceAll as pmReplaceAll } from 'prosemirror-search'
import { TextSelection } from '@milkdown/kit/prose/state'
import { createSyntaxHintPlugin } from './plugins/syntaxHintPlugin'
import { mathEditPlugin } from './plugins/mathEditPlugin'
import { diagramViewPlugin } from './plugins/diagramPlugin'
import { createActiveBlockPlugin } from './plugins/activeBlockPlugin'
import { createMediaEmbedPlugin } from './plugins/mediaEmbedPlugin'
import { createTaskListTogglePlugin } from './plugins/taskListTogglePlugin'
import { EditorContextMenu } from './EditorContextMenu'
import { copyImageToLocalAssets, saveBlobImageToLocalAssets } from '@/utils/fileUtils'
import { convertFileSrc } from '@tauri-apps/api/core'
import { dirname, join } from '@tauri-apps/api/path'
import { deleteColumn, deleteRow } from '@milkdown/kit/prose/tables'
import { extractImageFileFromDataTransfer, readImageFromClipboardApi, rememberEditableTarget } from '@/utils/editorClipboard'
import { buildMediaEmbedSnippet } from '@/utils/mediaEmbeds'
import { getHtmlPasteMarkdown } from '@/utils/htmlPaste'
import { clampTableWidthPx, extractMarkdownTableWidths, upsertMarkdownTableWidth } from '@/utils/tableWidths'

// commonmark 命令
import {
    toggleStrongCommand,
    toggleEmphasisCommand,
    toggleInlineCodeCommand,
    wrapInHeadingCommand,
    wrapInBulletListCommand,
    wrapInOrderedListCommand,
    wrapInBlockquoteCommand,
    createCodeBlockCommand,
    insertHrCommand,
    insertImageCommand,
    turnIntoTextCommand,
    sinkListItemCommand,
    liftListItemCommand,
} from '@milkdown/kit/preset/commonmark'

// gfm 命令
import {
    toggleStrikethroughCommand,
    insertTableCommand,
    addRowBeforeCommand,
    addRowAfterCommand,
    addColBeforeCommand,
    addColAfterCommand,
} from '@milkdown/kit/preset/gfm'

// history 命令
import { undoCommand, redoCommand } from '@milkdown/kit/plugin/history'

import 'katex/dist/katex.min.css'
import 'prism-themes/themes/prism-one-light.css'

import { useEditorStore } from '@/stores/editorStore'

interface WysiwygEditorProps {
    tabId: string
    content: string
    onCommandRef?: React.MutableRefObject<((cmd: string, payload?: unknown) => void) | null>
    /** 只读模式（分屏预览侧使用） */
    readOnly?: boolean
}

function isMissingEditorViewContext(error: unknown) {
    return error instanceof Error && error.message.includes('Context "editorView" not found')
}

export function WysiwygEditor({ tabId, content, onCommandRef, readOnly = false }: WysiwygEditorProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const editorRef = useRef<Editor | null>(null)
    const updateContent = useEditorStore(s => s.updateContent)
    const registerCommand = useEditorStore(s => s.registerCommand)
    const unregisterCommand = useEditorStore(s => s.unregisterCommand)
    const setActiveMarks = useEditorStore(s => s.setActiveMarks)
    const spellcheck = useEditorStore(s => s.spellcheck)
    const editorFontSize = useEditorStore(s => s.editorFontSize)
    const focusMode = useEditorStore(s => s.focusMode)
    const typewriterMode = useEditorStore(s => s.typewriterMode)

    // 追踪编辑器自身产生的最新 markdown，避免反向同步引起闪烁
    const lastEditorMarkdownRef = useRef(content)
    const isUpdatingRef = useRef(false)
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null)
    const contextTargetRef = useRef<EventTarget | null>(null)
    const lastTableTargetRef = useRef<HTMLTableElement | null>(null)

    const preventReadonlyMutation = useCallback((event: React.SyntheticEvent<HTMLDivElement>) => {
        if (!readOnly) return
        event.preventDefault()
    }, [readOnly])

    const handleReadonlyKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        if (!readOnly) return
        if (event.metaKey || event.ctrlKey || event.altKey) return

        if (event.key.length === 1 || event.key === 'Enter' || event.key === 'Backspace' || event.key === 'Delete') {
            event.preventDefault()
        }
    }, [readOnly])

    const blobToDataUrl = useCallback((blob: Blob) => {
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
            reader.onerror = () => reject(reader.error ?? new Error('Failed to read image blob'))
            reader.readAsDataURL(blob)
        })
    }, [])

    // 检测当前选区的活跃 marks
    const detectActiveMarks = useCallback((editor: Editor) => {
        try {
            editor.action(ctx => {
                const view = ctx.get(editorViewCtx)
                const { state } = view
                const { $from } = state.selection
                const marks: string[] = []
                const storedMarks = state.storedMarks || $from.marks()
                for (const mark of storedMarks) {
                    const markName = mark.type.name
                    if (markName === 'strong') marks.push('bold')
                    else if (markName === 'emphasis') marks.push('italic')
                    else if (markName === 'strikethrough') marks.push('strikethrough')
                    else if (markName === 'inlineCode') marks.push('code')
                    else if (markName === 'link') marks.push('link')
                }

                // 检测当前块级节点类型
                const node = $from.parent
                if (node.type.name === 'heading') {
                    marks.push(`heading-${node.attrs.level}`)
                } else if (node.type.name === 'blockquote' || $from.depth > 1 && $from.node($from.depth - 1)?.type.name === 'blockquote') {
                    marks.push('blockquote')
                }

                setActiveMarks(marks)
            })
        } catch {
            // 静默处理
        }
    }, [setActiveMarks])

    const syncMarkdownFromEditor = useCallback((editor: Editor) => {
        if (readOnly) return

        try {
            editor.action(ctx => {
                const serializer = ctx.get(serializerCtx)
                const view = ctx.get(editorViewCtx)
                const markdown = serializer(view.state.doc)
                lastEditorMarkdownRef.current = markdown
                updateContent(tabId, markdown)
            })
        } catch (error) {
            console.warn('Failed to sync markdown after paste conversion:', error)
        }
    }, [readOnly, tabId, updateContent])

    const applyTableWidthsToDom = useCallback((markdownContent: string) => {
        const root = containerRef.current
        if (!root) return

        const widthMap = extractMarkdownTableWidths(markdownContent)
        const tables = Array.from(root.querySelectorAll<HTMLTableElement>('.milkdown table'))

        tables.forEach((table, index) => {
            const widthPx = widthMap.get(index)
            if (widthPx) {
                table.style.width = `${widthPx}px`
                table.dataset.tableWidth = String(widthPx)
            } else {
                table.style.removeProperty('width')
                delete table.dataset.tableWidth
            }
        })
    }, [])

    const getSelectedTableContext = useCallback((editor: Editor) => {
        return editor.action(ctx => {
            const view = ctx.get(editorViewCtx)
            const domSelection = window.getSelection()
            const fromSelection = domSelection?.anchorNode instanceof Element
                ? domSelection.anchorNode
                : domSelection?.anchorNode?.parentElement ?? null
            const fromContextTarget = contextTargetRef.current instanceof Element
                ? contextTargetRef.current
                : null
            const fromLastTableTarget = lastTableTargetRef.current
            const selectionNode = view.domAtPos(view.state.selection.from).node
            const fromEditorPosition = selectionNode instanceof Element
                ? selectionNode
                : selectionNode.parentElement
            const table =
                fromContextTarget?.closest('table') ??
                fromLastTableTarget ??
                fromSelection?.closest('table') ??
                fromEditorPosition?.closest('table') ??
                null

            if (!(table instanceof HTMLTableElement) || !containerRef.current) return null

            const tables = Array.from(containerRef.current.querySelectorAll<HTMLTableElement>('.milkdown table'))
            const index = tables.indexOf(table)
            if (index < 0) return null

            return { table, index }
        })
    }, [])

    const setSelectedTableWidth = useCallback((nextWidthPx: number | null) => {
        if (readOnly) return false
        if (!editorRef.current) return false

        const editor = editorRef.current
        let tableContext = getSelectedTableContext(editor)
        if (!tableContext && containerRef.current) {
            const tables = Array.from(containerRef.current.querySelectorAll<HTMLTableElement>('.milkdown table'))
            if (tables.length === 1) {
                tableContext = { table: tables[0], index: 0 }
            }
        }
        if (!tableContext) return false

        const state = useEditorStore.getState()
        const sourceMarkdown = state.tabs.find(tab => tab.id === tabId)?.content ?? lastEditorMarkdownRef.current
        const updatedMarkdown = upsertMarkdownTableWidth(sourceMarkdown, tableContext.index, nextWidthPx)

        updateContent(tabId, updatedMarkdown)
        applyTableWidthsToDom(updatedMarkdown)
        return true
    }, [applyTableWidthsToDom, getSelectedTableContext, readOnly, tabId, updateContent])

    // 创建编辑器
    useEffect(() => {
        if (!containerRef.current) return

        let editor: Editor | null = null
        let destroyed = false

        const initEditor = async () => {
            editor = await Editor.make()
                .config(ctx => {
                    ctx.set(rootCtx, containerRef.current!)

                    // 只读模式下禁用编辑
                    if (readOnly) {
                        // Milkdown 通过 ProseMirror editable 属性控制
                        // 在 editor 创建后设置
                    }
                    ctx.set(defaultValueCtx, content)

                    // 设置内容变更监听
                    const listenerManager = ctx.get(listenerCtx)
                    listenerManager.markdownUpdated((_ctx, markdown) => {
                        if (!isUpdatingRef.current && !destroyed) {
                            lastEditorMarkdownRef.current = markdown
                            if (readOnly) return
                            updateContent(tabId, markdown)
                        }
                    })
                })
                .use(commonmark)
                .use(gfm)
                .use(history)
                .use(listener)
                .use(clipboard)
                .use(indent)
                .use(trailing)
                .use(math)
                .use(diagram)
                .use(diagramViewPlugin)
                .use(prism)
                .use(mathEditPlugin)
                .create()

            if (!destroyed) {
                editorRef.current = editor

                // 注入 Typora 风格语法提示插件
                editor.action(ctx => {
                    const view = ctx.get(editorViewCtx)

                    // 通过 reconfigure 添加自定义 ProseMirror 插件
                    const newState = view.state.reconfigure({
                        plugins: [
                            ...view.state.plugins,
                            createSyntaxHintPlugin(),
                            prosemirrorSearchPlugin(),
                            createActiveBlockPlugin(),
                            createMediaEmbedPlugin(),
                            createTaskListTogglePlugin(readOnly)
                        ]
                    })
                    view.updateState(newState)

                    // 只读模式：禁用编辑
                    if (readOnly) {
                        view.setProps({ editable: () => false })
                    }

                    // 监听选区变化以更新活跃 marks（仅非只读模式）
                    if (!readOnly) {
                        const dom = view.dom
                        dom.addEventListener('mouseup', () => detectActiveMarks(editor!))
                        dom.addEventListener('keyup', () => detectActiveMarks(editor!))

                        const resolveInsertableImageSrc = async (file: File, sourcePath?: string) => {
                            const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
                            const state = useEditorStore.getState()
                            const activeTab = state.getActiveTab()

                            if (isTauri && activeTab?.filePath) {
                                if (sourcePath) {
                                    try {
                                        const relativePath = await copyImageToLocalAssets(sourcePath, activeTab.filePath)
                                        if (relativePath) return relativePath
                                    } catch (err) {
                                        console.warn('Failed to copy dropped image to assets:', err)
                                    }
                                }

                                try {
                                    const relativePath = await saveBlobImageToLocalAssets(file, activeTab.filePath, file.name)
                                    if (relativePath) return relativePath
                                } catch (err) {
                                    console.warn('Failed to persist pasted image to assets:', err)
                                }
                            }

                            if (sourcePath) {
                                return isTauri ? convertFileSrc(sourcePath) : sourcePath
                            }

                            return await blobToDataUrl(file)
                        }

                        const handleFileEvent = async (e: Event, files: FileList | null) => {
                            if (!files || files.length === 0) return

                            const file = files[0]
                            if (!file.type.startsWith('image/')) return

                            const tauriFile = file as File & { path?: string }
                            const sourcePath = tauriFile.path

                            e.preventDefault()
                            const finalUrl = await resolveInsertableImageSrc(file, sourcePath)

                            if (finalUrl) {
                                editor?.action(callCommand(insertImageCommand.key, { src: finalUrl, alt: file.name }))
                            }
                        }

                        dom.addEventListener('drop', (e) => handleFileEvent(e, (e as DragEvent).dataTransfer?.files || null))
                        dom.addEventListener('paste', async (e) => {
                            const clipboardEvent = e as ClipboardEvent
                            const clipboardData = clipboardEvent.clipboardData
                            const htmlMarkdown = getHtmlPasteMarkdown(clipboardData)
                            if (htmlMarkdown) {
                                e.preventDefault()
                                if (editor) {
                                    editor.action(insert(htmlMarkdown))
                                    syncMarkdownFromEditor(editor)
                                }
                                return
                            }

                            const hasTextPayload = Boolean(
                                clipboardData &&
                                Array.from(clipboardData.types).some(type => type.startsWith('text/'))
                            )
                            const file =
                                extractImageFileFromDataTransfer(clipboardData) ??
                                (hasTextPayload ? null : await readImageFromClipboardApi())
                            if (!file) return

                            e.preventDefault()
                            const finalUrl = await resolveInsertableImageSrc(file)
                            if (finalUrl) {
                                editor?.action(callCommand(insertImageCommand.key, { src: finalUrl, alt: file.name || 'pasted-image' }))
                            }
                        }, true)
                    }
                })
            }
        }

        initEditor()

        // 监听生成的 DOM，动态替换相对路径的图片以便在 Tauri 下合法显示
        let observer: MutationObserver | null = null
        if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
            const resolveRelativeImages = async (mutations: MutationRecord[] = []) => {
                const state = useEditorStore.getState()
                const t = state.tabs.find(x => x.id === tabId)
                if (!t || !t.filePath) return
                if (!containerRef.current) return

                const baseDir = await dirname(t.filePath)
                const shouldResolveRelativeImage = (src: string) =>
                    !!src &&
                    !src.startsWith('http://') &&
                    !src.startsWith('https://') &&
                    !src.startsWith('data:') &&
                    !src.startsWith('blob:') &&
                    !src.startsWith('asset://')

                const resolveImageElement = async (img: HTMLImageElement) => {
                    const currentAttr = img.getAttribute('src')?.trim() || ''
                    if (shouldResolveRelativeImage(currentAttr)) {
                        img.dataset.mymdOriginalSrc = currentAttr
                    }

                    const originalSrc = img.dataset.mymdOriginalSrc || currentAttr
                    if (!shouldResolveRelativeImage(originalSrc)) return

                    try {
                        const absPath = await join(baseDir, originalSrc)
                        const localUrl = convertFileSrc(absPath)
                        if (img.getAttribute('src') !== localUrl) {
                            img.setAttribute('src', localUrl)
                        }
                    } catch (e) {
                        console.warn('Failed to resolve relative image path:', e)
                    }
                }

                const existingImages = Array.from(containerRef.current.querySelectorAll('img'))
                await Promise.all(existingImages.map(img => resolveImageElement(img as HTMLImageElement)))

                for (const mutation of mutations) {
                    if (mutation.type === 'attributes' && mutation.target instanceof HTMLImageElement) {
                        await resolveImageElement(mutation.target)
                        continue
                    }

                    if (mutation.type === 'childList') {
                        const imageTasks: Promise<void>[] = []
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                const element = node as HTMLElement
                                // 查找新增节点及其子节点中的图片
                                const images = element.tagName === 'IMG' ? [element as HTMLImageElement] : Array.from(element.querySelectorAll('img'))

                                images.forEach((img) => {
                                    imageTasks.push(resolveImageElement(img as HTMLImageElement))
                                })
                            }
                        })
                        await Promise.all(imageTasks)
                    }
                }
            }

            observer = new MutationObserver((mutations) => {
                void resolveRelativeImages(mutations)
            })

            observer.observe(containerRef.current, { childList: true, attributes: true, attributeFilter: ['src'], subtree: true })
            void resolveRelativeImages()
        }

        return () => {
            destroyed = true
            observer?.disconnect()
            editor?.destroy()
            editorRef.current = null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [detectActiveMarks, blobToDataUrl, content, readOnly, syncMarkdownFromEditor, tabId, updateContent])

    // 仅当外部内容与编辑器自身产出不同时才同步
    useEffect(() => {
        if (!editorRef.current) return
        if (content === lastEditorMarkdownRef.current) return

        let cancelled = false
        let retryTimer = 0

        const syncExternalContent = () => {
            if (cancelled || !editorRef.current || content === lastEditorMarkdownRef.current) return

            isUpdatingRef.current = true
            try {
                editorRef.current.action(replaceAll(content))
                lastEditorMarkdownRef.current = content
            } catch (error) {
                if (isMissingEditorViewContext(error)) {
                    retryTimer = window.setTimeout(syncExternalContent, 50)
                    return
                }
                console.warn('Failed to sync external markdown into editor:', error)
            } finally {
                isUpdatingRef.current = false
            }
        }

        syncExternalContent()
        return () => {
            cancelled = true
            window.clearTimeout(retryTimer)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [content])

    useEffect(() => {
        const root = containerRef.current
        if (!root) return

        applyTableWidthsToDom(content)
        const observer = new MutationObserver(() => applyTableWidthsToDom(content))
        observer.observe(root, { childList: true, subtree: true })

        return () => observer.disconnect()
    }, [applyTableWidthsToDom, content])

    // 编辑器命令执行器
    useEffect(() => {
        if (!editorRef.current) return

        editorRef.current.action(ctx => {
            const view = ctx.get(editorViewCtx)
            view.setProps({ editable: () => !readOnly })
        })
    }, [readOnly])

    const executeCommand = useCallback((cmd: string, payload?: unknown) => {
        if (!editorRef.current) return

        const editor = editorRef.current

        try {
            switch (cmd) {
                // 文本格式命令
                case 'bold':
                    editor.action(callCommand(toggleStrongCommand.key))
                    break
                case 'italic':
                    editor.action(callCommand(toggleEmphasisCommand.key))
                    break
                case 'strikethrough':
                    editor.action(callCommand(toggleStrikethroughCommand.key))
                    break
                case 'code':
                    editor.action(callCommand(toggleInlineCodeCommand.key))
                    break

                // 标题层级切换
                case 'heading':
                    editor.action(callCommand(wrapInHeadingCommand.key, payload as number))
                    break

                // 恢复为普通段落
                case 'paragraph':
                    editor.action(callCommand(turnIntoTextCommand.key))
                    break

                // 列表
                case 'bulletList':
                    editor.action(callCommand(wrapInBulletListCommand.key))
                    break
                case 'orderedList':
                    editor.action(callCommand(wrapInOrderedListCommand.key))
                    break

                // 任务列表
                case 'taskList': {
                    editor.action(ctx => {
                        const view = ctx.get(editorViewCtx)
                        const { state, dispatch } = view
                        const { from } = state.selection
                        const tr = state.tr.insertText('- [ ] ', from)
                        dispatch(tr)
                        view.focus()
                    })
                    break
                }

                // 引用
                case 'blockquote':
                    editor.action(callCommand(wrapInBlockquoteCommand.key))
                    break

                // 代码块
                case 'codeBlock':
                    editor.action(callCommand(createCodeBlockCommand.key))
                    break

                // 分隔线
                case 'hr':
                    editor.action(callCommand(insertHrCommand.key))
                    break

                // 插入链接（由 InsertDialog 调用，payload 中包含 href 和 text）
                case 'insertLink': {
                    const linkData = payload as { href: string; text?: string }
                    if (linkData?.href) {
                        editor.action(ctx => {
                            const view = ctx.get(editorViewCtx)
                            const { state, dispatch } = view
                            const { from, to, empty } = state.selection
                            const linkMark = state.schema.marks.link?.create({ href: linkData.href })
                            if (!linkMark) return

                            const label = (linkData.text || '').trim()
                            const fallbackText = state.doc.textBetween(from, to, ' ').trim()
                            const finalText = label || fallbackText || linkData.href
                            let tr = state.tr

                            if (empty) {
                                tr = tr.insert(from, state.schema.text(finalText, [linkMark]))
                                const pos = from + finalText.length
                                tr = tr.setSelection(TextSelection.create(tr.doc, pos))
                            } else {
                                tr = tr.insertText(finalText, from, to)
                                tr = tr.addMark(from, from + finalText.length, linkMark)
                                tr = tr.setSelection(TextSelection.create(tr.doc, from + finalText.length))
                            }

                            dispatch(tr.scrollIntoView())
                            view.focus()
                        })
                    }
                    break
                }

                // 保留旧的 link 命令以兼容（打开弹窗）
                case 'link': {
                    useEditorStore.getState().setInsertDialog('link')
                    break
                }

                // 插入图片（由 InsertDialog 调用，payload 中包含 src 和 alt）
                case 'insertImage': {
                    const imgData = payload as { src: string; alt?: string }
                    if (imgData?.src) {
                        editor.action(callCommand(insertImageCommand.key, { src: imgData.src, alt: imgData.alt || '' }))
                    }
                    break
                }
                case 'insertAudio': {
                    const { src, title } = payload as { src: string; title?: string }
                    const snippet = buildMediaEmbedSnippet('audio', { src, title })
                    if (!snippet) break
                    editor.action(ctx => {
                        const view = ctx.get(editorViewCtx)
                        const { state, dispatch } = view
                        const { from, to } = state.selection
                        const tr = state.tr.insertText(`${snippet}\n\n`, from, to)
                        dispatch(tr.scrollIntoView())
                        view.focus()
                    })
                    break
                }
                case 'insertVideo': {
                    const { src, title } = payload as { src: string; title?: string }
                    const snippet = buildMediaEmbedSnippet('video', { src, title })
                    if (!snippet) break
                    editor.action(ctx => {
                        const view = ctx.get(editorViewCtx)
                        const { state, dispatch } = view
                        const { from, to } = state.selection
                        const tr = state.tr.insertText(`${snippet}\n\n`, from, to)
                        dispatch(tr.scrollIntoView())
                        view.focus()
                    })
                    break
                }
                case 'insertEmbed': {
                    const { src, title } = payload as { src: string; title?: string }
                    const snippet = buildMediaEmbedSnippet('embed', { src, title })
                    if (!snippet) break
                    editor.action(ctx => {
                        const view = ctx.get(editorViewCtx)
                        const { state, dispatch } = view
                        const { from, to } = state.selection
                        const tr = state.tr.insertText(`${snippet}\n\n`, from, to)
                        dispatch(tr.scrollIntoView())
                        view.focus()
                    })
                    break
                }

                // 保留旧的 image 命令以兼容（打开弹窗）
                case 'image': {
                    useEditorStore.getState().setInsertDialog('image')
                    break
                }

                // 插入表格（payload 传入 { row, col }）
                case 'table': {
                    const tableData = payload as { row: number; col: number } | undefined
                    editor.action(callCommand(insertTableCommand.key, tableData || { row: 3, col: 3 }))
                    break
                }
                case 'tableAddRowBefore':
                    editor.action(callCommand(addRowBeforeCommand.key))
                    break
                case 'tableAddRowAfter':
                    editor.action(callCommand(addRowAfterCommand.key))
                    break
                case 'tableAddColBefore':
                    editor.action(callCommand(addColBeforeCommand.key))
                    break
                case 'tableAddColAfter':
                    editor.action(callCommand(addColAfterCommand.key))
                    break
                case 'tableDeleteRow':
                    editor.action(ctx => {
                        const view = ctx.get(editorViewCtx)
                        deleteRow(view.state, view.dispatch)
                        view.focus()
                    })
                    break
                case 'tableDeleteCol':
                    editor.action(ctx => {
                        const view = ctx.get(editorViewCtx)
                        deleteColumn(view.state, view.dispatch)
                        view.focus()
                    })
                    break
                case 'tableSetWidth': {
                    const { widthPx } = (payload ?? {}) as { widthPx?: number }
                    if (typeof widthPx === 'number') {
                        setSelectedTableWidth(clampTableWidthPx(widthPx))
                    }
                    break
                }
                case 'tableAdjustWidth': {
                    const { deltaPx = 120 } = (payload ?? {}) as { deltaPx?: number }
                    const tableContext = getSelectedTableContext(editor)
                    if (!tableContext) break

                    const state = useEditorStore.getState()
                    const sourceMarkdown = state.tabs.find(tab => tab.id === tabId)?.content ?? lastEditorMarkdownRef.current
                    const widthMap = extractMarkdownTableWidths(sourceMarkdown)
                    const currentWidth = widthMap.get(tableContext.index) ?? Math.round(tableContext.table.getBoundingClientRect().width)
                    setSelectedTableWidth(currentWidth + deltaPx)
                    break
                }
                case 'tableResetWidth':
                    setSelectedTableWidth(null)
                    break

                // 撤销/恢复
                case 'undo':
                    editor.action(callCommand(undoCommand.key))
                    break
                case 'redo':
                    editor.action(callCommand(redoCommand.key))
                    break

                // 缩进操作
                case 'indent':
                    editor.action(callCommand(sinkListItemCommand.key))
                    break
                case 'outdent':
                    editor.action(callCommand(liftListItemCommand.key))
                    break

                // 搜索相关
                case 'search': {
                    editor.action(ctx => {
                        const view = ctx.get(editorViewCtx)
                        const queryStr = payload as string
                        const query = new SearchQuery({ search: queryStr })
                        view.dispatch(setSearchState(view.state.tr, query))
                    })
                    break
                }
                case 'searchNext': {
                    editor.action(ctx => {
                        const view = ctx.get(editorViewCtx)
                        findNext(view.state, view.dispatch)
                    })
                    break
                }
                case 'searchPrev': {
                    editor.action(ctx => {
                        const view = ctx.get(editorViewCtx)
                        findPrev(view.state, view.dispatch)
                    })
                    break
                }
                case 'replace': {
                    editor.action(ctx => {
                        const view = ctx.get(editorViewCtx)
                        const { search: q, replace: r } = payload as { search: string, replace: string }
                        const query = new SearchQuery({ search: q, replace: r })
                        view.dispatch(setSearchState(view.state.tr, query))
                        replaceNext(view.state, view.dispatch)
                    })
                    break
                }
                case 'replaceAll': {
                    editor.action(ctx => {
                        const view = ctx.get(editorViewCtx)
                        const { search: q, replace: r } = payload as { search: string, replace: string }
                        const query = new SearchQuery({ search: q, replace: r })
                        view.dispatch(setSearchState(view.state.tr, query))
                        pmReplaceAll(view.state, view.dispatch)
                    })
                    break
                }

                // 插入纯文本（用于 TOC 等）
                case 'insertText': {
                    editor.action(ctx => {
                        const view = ctx.get(editorViewCtx)
                        const { state, dispatch } = view
                        const text = payload as string
                        if (text) {
                            const tr = state.tr.insertText(text, state.selection.from)
                            dispatch(tr)
                            view.focus()
                        }
                    })
                    break
                }

                default:
                    editor.action(ctx => {
                        const view = ctx.get(editorViewCtx)
                        view.focus()
                    })
                    break
            }

            // 命令执行后更新活跃 marks
            setTimeout(() => detectActiveMarks(editor), 50)
        } catch (e) {
            console.warn(`命令 "${cmd}" 执行失败:`, e)
        }
    }, [detectActiveMarks, getSelectedTableContext, setSelectedTableWidth, tabId])

    useEffect(() => {
        // 只读模式下不注册命令处理器
        if (readOnly) return

        if (onCommandRef) {
            onCommandRef.current = executeCommand
        }

        const cmdId = `wysiwyg-${tabId}`
        registerCommand(cmdId, executeCommand)

        return () => {
            unregisterCommand(cmdId)
        }
    }, [executeCommand, onCommandRef, registerCommand, unregisterCommand, tabId, readOnly])

    return (
        <>
            <div
                ref={containerRef}
                className={`editor-wysiwyg selectable${readOnly ? ' editor-wysiwyg--readonly' : ''}${focusMode ? ' focus-mode' : ''}${typewriterMode ? ' typewriter-mode' : ''}`}
                aria-readonly={readOnly ? 'true' : undefined}
                data-editor-surface={readOnly ? 'preview' : 'editor'}
                style={{ fontSize: `${editorFontSize}px` }}
                spellCheck={readOnly ? false : spellcheck}
                onBeforeInputCapture={preventReadonlyMutation}
                onPasteCapture={preventReadonlyMutation}
                onDropCapture={preventReadonlyMutation}
                onKeyDownCapture={handleReadonlyKeyDown}
                onMouseDownCapture={(e) => {
                    lastTableTargetRef.current =
                        e.target instanceof Element
                            ? e.target.closest('table')
                            : null
                }}
                onContextMenu={(e) => {
                    if (readOnly) return
                    e.preventDefault()
                    contextTargetRef.current = e.target
                    lastTableTargetRef.current =
                        e.target instanceof Element
                            ? e.target.closest('table')
                            : null
                    rememberEditableTarget(e.target)
                    setContextMenu({ x: e.clientX, y: e.clientY })
                }}
            />
            {contextMenu && (
                <EditorContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    onCommand={executeCommand}
                />
            )}
        </>
    )
}
