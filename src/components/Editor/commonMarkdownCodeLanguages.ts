import { LanguageDescription } from '@codemirror/language'
import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import { javascript } from '@codemirror/lang-javascript'

// Keep source editing fast by loading only the code-fence languages MYmd users
// most often need for Markdown notes, docs, and technical writing.
export const commonMarkdownCodeLanguages: readonly LanguageDescription[] = [
    LanguageDescription.of({
        name: 'JavaScript',
        alias: ['js', 'node'],
        extensions: ['js', 'mjs', 'cjs'],
        support: javascript()
    }),
    LanguageDescription.of({
        name: 'TypeScript',
        alias: ['ts'],
        extensions: ['ts', 'mts', 'cts'],
        support: javascript({ typescript: true })
    }),
    LanguageDescription.of({
        name: 'JSX',
        extensions: ['jsx'],
        support: javascript({ jsx: true })
    }),
    LanguageDescription.of({
        name: 'TSX',
        extensions: ['tsx'],
        support: javascript({ jsx: true, typescript: true })
    }),
    LanguageDescription.of({
        name: 'JSON',
        extensions: ['json', 'map'],
        load: () => import('@codemirror/lang-json').then(module => module.json())
    }),
    LanguageDescription.of({
        name: 'HTML',
        alias: ['xhtml'],
        extensions: ['html', 'htm'],
        support: html()
    }),
    LanguageDescription.of({
        name: 'CSS',
        extensions: ['css'],
        support: css()
    }),
    LanguageDescription.of({
        name: 'Python',
        alias: ['py'],
        extensions: ['py', 'pyw'],
        load: () => import('@codemirror/lang-python').then(module => module.python())
    }),
    LanguageDescription.of({
        name: 'SQL',
        alias: ['mysql', 'postgres', 'postgresql', 'sqlite'],
        extensions: ['sql'],
        load: () => import('@codemirror/lang-sql').then(module => module.sql())
    }),
    LanguageDescription.of({
        name: 'XML',
        alias: ['rss', 'wsdl', 'xsd', 'svg'],
        extensions: ['xml', 'xsl', 'xsd', 'svg'],
        load: () => import('@codemirror/lang-xml').then(module => module.xml())
    }),
    LanguageDescription.of({
        name: 'YAML',
        alias: ['yml'],
        extensions: ['yaml', 'yml'],
        load: () => import('@codemirror/lang-yaml').then(module => module.yaml())
    })
]
