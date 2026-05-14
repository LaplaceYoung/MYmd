import { useEffect, useState, useRef, useCallback } from 'react'
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror'
import { SearchCursor, SearchQuery, getSearchQuery, setSearchQuery, findNext, findPrevious, replaceNext, replaceAll, search } from '@codemirror/search'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { acceptCompletion, autocompletion, startCompletion, type Completion, type CompletionContext } from '@codemirror/autocomplete'
import { Decoration, EditorView, keymap, type DecorationSet } from '@codemirror/view'
import { Prec, RangeSetBuilder, StateField, type EditorState } from '@codemirror/state'
import { useEditorStore } from '@/stores/editorStore'
import { getKnowledgeGraph, queryKnowledge } from '@/knowledge/service'
import { copyImageToLocalAssets, saveBlobImageToLocalAssets } from '@/utils/fileUtils'
import { extractImageFileFromDataTransfer, readImageFromClipboardApi } from '@/utils/editorClipboard'
import { buildMediaEmbedSnippet } from '@/utils/mediaEmbeds'
import { getHtmlPasteMarkdown } from '@/utils/htmlPaste'
import { convertFileSrc } from '@tauri-apps/api/core'

interface SourceEditorProps {
    tabId: string
    content: string
}

const sourceSearchMatchMark = Decoration.mark({ class: 'cm-searchMatch' })
const sourceSelectedSearchMatchMark = Decoration.mark({ class: 'cm-searchMatch cm-searchMatch-selected' })

function buildSourceSearchDecorations(state: EditorState): DecorationSet {
    const query = getSearchQuery(state)
    if (!query.search) return Decoration.none

    const normalize = query.caseSensitive ? undefined : (value: string) => value.toLowerCase()
    const cursor = new SearchCursor(state.doc, query.search, 0, state.doc.length, normalize)
    const builder = new RangeSetBuilder<Decoration>()
    const selection = state.selection.main

    while (!cursor.next().done) {
        const { from, to } = cursor.value
        builder.add(
            from,
            to,
            from === selection.from && to === selection.to
                ? sourceSelectedSearchMatchMark
                : sourceSearchMatchMark
        )
    }

    return builder.finish()
}

const sourceSearchHighlightField = StateField.define<DecorationSet>({
    create(state) {
        return buildSourceSearchDecorations(state)
    },
    update(_value, transaction) {
        return buildSourceSearchDecorations(transaction.state)
    },
    provide: field => EditorView.decorations.from(field),
})

const wikilinkCompletionTrigger = EditorView.updateListener.of((update) => {
    if (!update.docChanged) return

    const selection = update.state.selection.main
    if (!selection.empty) return

    const line = update.state.doc.lineAt(selection.head)
    const textBeforeCursor = line.text.slice(0, selection.head - line.from)
    if (/\[\[[^\]\n]*$/.test(textBeforeCursor)) {
        startCompletion(update.view)
    }
})

const wikilinkCompletionKeymap = Prec.highest(keymap.of([
    {
        key: 'Enter',
        run: acceptCompletion
    }
]))

function normalizeCompletionPath(value: string) {
    return value.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/\/$/, '')
}

function stripMarkdownExtension(value: string) {
    return value.replace(/\.md$/i, '')
}

function pathDirname(value: string) {
    const normalized = normalizeCompletionPath(value)
    const index = normalized.lastIndexOf('/')
    return index <= 0 ? normalized : normalized.slice(0, index)
}

function pathBasename(value: string) {
    const normalized = normalizeCompletionPath(value)
    const index = normalized.lastIndexOf('/')
    return index >= 0 ? normalized.slice(index + 1) : normalized
}

function isSameOrInsidePath(basePath: string, filePath: string) {
    const base = normalizeCompletionPath(basePath).toLowerCase()
    const file = normalizeCompletionPath(filePath).toLowerCase()
    return file === base || file.startsWith(`${base}/`)
}

function toWikilinkDocTarget(
    filePath: string,
    fallbackTitle: string,
    activeFilePath: string | null,
    activeWorkspace: string | null
) {
    const normalizedFile = normalizeCompletionPath(filePath)
    const title = stripMarkdownExtension((fallbackTitle || pathBasename(normalizedFile)).trim())

    if (!normalizedFile) return title

    if (activeFilePath && pathDirname(activeFilePath).toLowerCase() === pathDirname(normalizedFile).toLowerCase()) {
        return stripMarkdownExtension(pathBasename(normalizedFile))
    }

    if (activeWorkspace && isSameOrInsidePath(activeWorkspace, normalizedFile)) {
        const workspaceRoot = normalizeCompletionPath(activeWorkspace)
        const relativePath = normalizedFile.slice(workspaceRoot.length).replace(/^\/+/, '')
        return `/${stripMarkdownExtension(relativePath)}`
    }

    return stripMarkdownExtension(normalizedFile)
}

// 检测实际使用的暗色模式（结合 store 和系统偏好）
function useIsDark() {
    const themeMode = useEditorStore(s => s.themeMode)
    const [systemDark, setSystemDark] = useState(() =>
        window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
    )

    useEffect(() => {
        const mq = window.matchMedia('(prefers-color-scheme: dark)')
        const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches)
        mq.addEventListener('change', handler)
        return () => mq.removeEventListener('change', handler)
    }, [])

    if (themeMode === 'dark') return true
    if (themeMode === 'light') return false
    return systemDark // system 模式跟随系统
}

export function SourceEditor({ tabId, content }: SourceEditorProps) {
    const updateContent = useEditorStore(s => s.updateContent)
    const registerCommand = useEditorStore(s => s.registerCommand)
    const unregisterCommand = useEditorStore(s => s.unregisterCommand)

    const [val, setVal] = useState(content)
    const isDark = useIsDark()
    const editorFontSize = useEditorStore(s => s.editorFontSize)
    const focusMode = useEditorStore(s => s.focusMode)
    const typewriterMode = useEditorStore(s => s.typewriterMode)
    const activeWorkspace = useEditorStore(s => s.activeWorkspace)
    const activeFilePath = useEditorStore(s => s.tabs.find(tab => tab.id === s.activeTabId)?.filePath ?? null)
    const editorRef = useRef<ReactCodeMirrorRef>(null)

    const blobToDataUrl = useCallback((blob: Blob) => {
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
            reader.onerror = () => reject(reader.error ?? new Error('Failed to read image blob'))
            reader.readAsDataURL(blob)
        })
    }, [])

    const insertImageMarkdown = useCallback((src: string, alt?: string) => {
        const view = editorRef.current?.view
        if (!view || !src) return false

        const label = (alt || '').trim()
        const insertion = `![${label}](${src})`
        const from = view.state.selection.main.from
        const to = view.state.selection.main.to
        view.dispatch({
            changes: { from, to, insert: insertion },
            selection: { anchor: from + insertion.length }
        })
        return true
    }, [])

    const insertMarkdownAtSelection = useCallback((markdown: string) => {
        const view = editorRef.current?.view
        if (!view || !markdown) return false

        const from = view.state.selection.main.from
        const to = view.state.selection.main.to
        view.dispatch({
            changes: { from, to, insert: markdown },
            selection: { anchor: from + markdown.length }
        })
        return true
    }, [])

    const resolveInsertableImageSrc = useCallback(async (file: File, sourcePath?: string) => {
        const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
        const activeTab = useEditorStore.getState().getActiveTab()

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
    }, [blobToDataUrl])

    const completeWikilink = useCallback(async (context: CompletionContext) => {
        const before = context.matchBefore(/\[\[[^\]\n]*$/)
        if (!before) return null
        if (before.from === before.to && !context.explicit) return null

        const typed = before.text.slice(2).trim()

        try {
            const [result, graph] = await Promise.all([
                typed ? queryKnowledge(typed, 12, 0) : Promise.resolve({ documents: [], headings: [], tags: [] }),
                getKnowledgeGraph(typed, 12)
            ])
            const options: Completion[] = []
            const seen = new Set<string>()

            const pushOption = (option: Completion & { apply: string }) => {
                const key = `${option.apply}:${option.detail ?? ''}`
                if (seen.has(key)) return
                seen.add(key)
                options.push(option)
            }

            for (const node of graph.nodes.slice(0, 8)) {
                const title = (node.title || '').trim() || node.file_path
                const target = toWikilinkDocTarget(node.file_path, title, activeFilePath, activeWorkspace)
                if (!target) continue
                pushOption({
                    label: title,
                    type: 'text',
                    apply: `[[${target}]]`,
                    detail: typed ? 'Document' : 'Recent note',
                    info: node.file_path,
                    boost: typed ? 12 : 8
                })
            }

            for (const doc of result.documents.slice(0, 6)) {
                const title = (doc.title || '').trim() || doc.file_path
                const target = toWikilinkDocTarget(doc.file_path, title, activeFilePath, activeWorkspace)
                if (!target) continue
                pushOption({
                    label: title,
                    type: 'text',
                    apply: `[[${target}]]`,
                    detail: 'Document',
                    info: doc.file_path,
                    boost: 10
                })
            }

            for (const heading of result.headings.slice(0, 6)) {
                const base = toWikilinkDocTarget(
                    heading.file_path,
                    heading.document_title || heading.file_path,
                    activeFilePath,
                    activeWorkspace
                )
                const headingText = heading.heading_text.trim()
                if (!base || !headingText) continue
                pushOption({
                    label: `${base}#${headingText}`,
                    type: 'text',
                    apply: `[[${base}#${headingText}]]`,
                    detail: 'Heading',
                    info: heading.file_path,
                    boost: 6
                })
            }

            if (options.length === 0) return null
            return {
                from: before.from,
                options,
                filter: false,
                validFor: /^\[\[[^\]\n]*$/
            }
        } catch (error) {
            console.warn('wikilink completion failed:', error)
            return null
        }
    }, [activeFilePath, activeWorkspace])

    const executeCommand = useCallback((cmd: string, payload?: unknown) => {
        const view = editorRef.current?.view;
        if (!view) return;

        switch (cmd) {
            case 'insertLink': {
                const { href, text } = payload as { href: string; text?: string }
                if (!href) break
                const label = (text || '').trim() || href
                const insertion = `[${label}](${href})`
                const from = view.state.selection.main.from
                const to = view.state.selection.main.to
                view.dispatch({
                    changes: { from, to, insert: insertion },
                    selection: { anchor: from + insertion.length }
                })
                break
            }
            case 'insertImage': {
                const { src, alt } = payload as { src: string; alt?: string }
                if (!src) break
                const label = (alt || '').trim()
                const insertion = `![${label}](${src})`
                const from = view.state.selection.main.from
                const to = view.state.selection.main.to
                view.dispatch({
                    changes: { from, to, insert: insertion },
                    selection: { anchor: from + insertion.length }
                })
                break
            }
            case 'insertAudio': {
                const { src, title } = payload as { src: string; title?: string }
                const insertion = buildMediaEmbedSnippet('audio', { src, title })
                if (!insertion) break
                const from = view.state.selection.main.from
                const to = view.state.selection.main.to
                view.dispatch({
                    changes: { from, to, insert: `${insertion}\n\n` },
                    selection: { anchor: from + insertion.length + 2 }
                })
                break
            }
            case 'insertVideo': {
                const { src, title } = payload as { src: string; title?: string }
                const insertion = buildMediaEmbedSnippet('video', { src, title })
                if (!insertion) break
                const from = view.state.selection.main.from
                const to = view.state.selection.main.to
                view.dispatch({
                    changes: { from, to, insert: `${insertion}\n\n` },
                    selection: { anchor: from + insertion.length + 2 }
                })
                break
            }
            case 'insertEmbed': {
                const { src, title } = payload as { src: string; title?: string }
                const insertion = buildMediaEmbedSnippet('embed', { src, title })
                if (!insertion) break
                const from = view.state.selection.main.from
                const to = view.state.selection.main.to
                view.dispatch({
                    changes: { from, to, insert: `${insertion}\n\n` },
                    selection: { anchor: from + insertion.length + 2 }
                })
                break
            }
            case 'insertText': {
                const insertion = String(payload ?? '')
                if (!insertion) break
                const from = view.state.selection.main.from
                const to = view.state.selection.main.to
                view.dispatch({
                    changes: { from, to, insert: insertion },
                    selection: { anchor: from + insertion.length }
                })
                break
            }
            case 'search': {
                const queryStr = payload as string;
                view.dispatch({
                    effects: setSearchQuery.of(new SearchQuery({ search: queryStr }))
                });
                break;
            }
            case 'searchNext': {
                findNext(view);
                break;
            }
            case 'searchPrev': {
                findPrevious(view);
                break;
            }
            case 'replace': {
                const { search: q, replace: r } = payload as { search: string, replace: string }
                view.dispatch({
                    effects: setSearchQuery.of(new SearchQuery({ search: q, replace: r }))
                });
                replaceNext(view);
                break;
            }
            case 'replaceAll': {
                const { search: q, replace: r } = payload as { search: string, replace: string }
                view.dispatch({
                    effects: setSearchQuery.of(new SearchQuery({ search: q, replace: r }))
                });
                replaceAll(view);
                break;
            }
        }
    }, [])

    useEffect(() => {
        const cmdId = `source-${tabId}`
        registerCommand(cmdId, executeCommand)
        return () => unregisterCommand(cmdId)
    }, [executeCommand, registerCommand, unregisterCommand, tabId])

    useEffect(() => {
        setVal(content)
    }, [content])

    const onChange = (value: string) => {
        setVal(value)
        updateContent(tabId, value)
    }

    return (
        <div className={`source-editor-container${focusMode ? ' focus-mode' : ''}${typewriterMode ? ' typewriter-mode' : ''}`} style={{ height: '100%' }}>
            <CodeMirror
                ref={editorRef}
                value={val}
                height="100%"
                style={{
                    height: '100%',
                    fontSize: `${editorFontSize}px`,
                    fontFamily: 'var(--font-mono)',
                    lineHeight: '1.8',
                }}
                extensions={[
                    search({
                        top: false,
                    }),
                    sourceSearchHighlightField,
                    markdown({ base: markdownLanguage, codeLanguages: languages }),
                    wikilinkCompletionTrigger,
                    wikilinkCompletionKeymap,
                    autocompletion({ override: [completeWikilink], selectOnOpen: true }),
                    EditorView.domEventHandlers({
                        drop: (_event, view) => {
                            const event = _event as DragEvent
                            const files = event.dataTransfer?.files
                            const file = files?.[0]
                            if (!file || !file.type.startsWith('image/')) return false

                            void (async () => {
                                const tauriFile = file as File & { path?: string }
                                const finalUrl = await resolveInsertableImageSrc(file, tauriFile.path)
                                if (finalUrl && view === editorRef.current?.view) {
                                    insertImageMarkdown(finalUrl, file.name)
                                }
                            })()

                            event.preventDefault()
                            return true
                        },
                        paste: (_event, view) => {
                            const event = _event as ClipboardEvent
                            const clipboardData = event.clipboardData
                            const htmlMarkdown = getHtmlPasteMarkdown(clipboardData)
                            const immediateImageFile = extractImageFileFromDataTransfer(clipboardData)
                            const hasTextPayload = Boolean(
                                clipboardData &&
                                Array.from(clipboardData.types).some(type => type.startsWith('text/'))
                            )

                            if (htmlMarkdown) {
                                event.preventDefault()
                                if (view === editorRef.current?.view) {
                                    insertMarkdownAtSelection(htmlMarkdown)
                                }
                                return true
                            }

                            if (!immediateImageFile && hasTextPayload) {
                                return false
                            }

                            void (async () => {
                                const file =
                                    immediateImageFile ??
                                    (hasTextPayload ? null : await readImageFromClipboardApi())
                                if (!file) return

                                const finalUrl = await resolveInsertableImageSrc(file)
                                if (finalUrl && view === editorRef.current?.view) {
                                    insertImageMarkdown(finalUrl, file.name || 'pasted-image')
                                }
                            })()

                            event.preventDefault()
                            return true
                        }
                    })
                ]}
                onChange={onChange}
                theme={isDark ? 'dark' : 'light'}
                basicSetup={{
                    lineNumbers: true,
                    highlightActiveLineGutter: true,
                    highlightSpecialChars: true,
                    history: true,
                    foldGutter: true,
                    drawSelection: true,
                    dropCursor: true,
                    allowMultipleSelections: true,
                    indentOnInput: true,
                    syntaxHighlighting: true,
                    bracketMatching: true,
                    closeBrackets: true,
                    autocompletion: true,
                    rectangularSelection: true,
                    crosshairCursor: true,
                    highlightActiveLine: true,
                    highlightSelectionMatches: true,
                    closeBracketsKeymap: true,
                    defaultKeymap: true,
                    searchKeymap: false,
                    historyKeymap: true,
                    foldKeymap: true,
                    completionKeymap: true,
                    lintKeymap: true,
                }}
            />
        </div>
    )
}
