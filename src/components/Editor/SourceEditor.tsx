import { useEffect, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { useEditorStore } from '@/stores/editorStore'

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
    const [val, setVal] = useState(content)
    const isDark = useIsDark()

    useEffect(() => {
        setVal(content)
    }, [content])

    const onChange = (value: string) => {
        setVal(value)
        updateContent(tabId, value)
    }

    return (
        <CodeMirror
            value={val}
            height="100%"
            style={{
                height: '100%',
                fontSize: '16px',
                fontFamily: 'var(--font-mono)',
                lineHeight: '1.8',
            }}
            extensions={[markdown({ base: markdownLanguage, codeLanguages: languages })]}
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
                searchKeymap: true,
                historyKeymap: true,
                foldKeymap: true,
                completionKeymap: true,
                lintKeymap: true,
            }}
        />
    )
}
