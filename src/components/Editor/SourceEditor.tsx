import { useEffect, useState, useRef, useCallback } from 'react'
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror'
import { SearchQuery, setSearchQuery, findNext, findPrevious, replaceNext, replaceAll } from '@codemirror/search'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { autocompletion, type Completion, type CompletionContext } from '@codemirror/autocomplete'
import { useEditorStore } from '@/stores/editorStore'
import { queryKnowledge } from '@/knowledge/service'

interface SourceEditorProps {
    tabId: string
    content: string
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
    const editorRef = useRef<ReactCodeMirrorRef>(null)

    const completeWikilink = useCallback(async (context: CompletionContext) => {
        const before = context.matchBefore(/\[\[[^\]\n]*$/)
        if (!before) return null
        if (before.from === before.to && !context.explicit) return null

        const typed = before.text.slice(2).trim()
        if (!typed) return null

        try {
            const result = await queryKnowledge(typed, 12, 0)
            const options: Completion[] = []

            for (const doc of result.documents.slice(0, 6)) {
                const title = (doc.title || '').trim() || doc.file_path
                options.push({
                    label: title,
                    type: 'text',
                    apply: `[[${title}]]`,
                    detail: 'Document'
                })
            }

            for (const heading of result.headings.slice(0, 6)) {
                const base = (heading.document_title || '').trim() || heading.file_path
                const headingText = heading.heading_text.trim()
                if (!base || !headingText) continue
                options.push({
                    label: `${base}#${headingText}`,
                    type: 'text',
                    apply: `[[${base}#${headingText}]]`,
                    detail: 'Heading'
                })
            }

            if (options.length === 0) return null
            return {
                from: before.from,
                options
            }
        } catch (error) {
            console.warn('wikilink completion failed:', error)
            return null
        }
    }, [])

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
                    markdown({ base: markdownLanguage, codeLanguages: languages }),
                    autocompletion({ override: [completeWikilink] })
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
