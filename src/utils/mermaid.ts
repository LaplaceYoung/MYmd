import mermaid from 'mermaid'

let isMermaidInitialized = false
let mermaidRenderCounter = 0

function ensureMermaid() {
    if (isMermaidInitialized) return mermaid

    mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
    })

    isMermaidInitialized = true
    return mermaid
}

function escapeHtml(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

export function getMermaidEmptyMarkup() {
    return '<div class="mermaid-empty">Click to edit Mermaid diagram</div>'
}

export function getMermaidErrorMessage(error: unknown) {
    if (error instanceof Error && error.message.trim()) {
        return error.message.trim()
    }

    if (typeof error === 'string' && error.trim()) {
        return error.trim()
    }

    return 'Unknown Mermaid render error'
}

export function getMermaidErrorMarkup(source: string, error: unknown) {
    const safeMessage = escapeHtml(getMermaidErrorMessage(error))
    const safeSource = escapeHtml(source.trim())

    return `
        <div class="mermaid-error" data-render-state="error">
            <div class="mermaid-error__title">Mermaid render failed</div>
            <div class="mermaid-error__message">${safeMessage}</div>
            <pre class="mermaid-error__source"><code>${safeSource}</code></pre>
            <div class="mermaid-error__hint">Click to fix the Mermaid source.</div>
        </div>
    `.trim()
}

export async function renderMermaidSvg(source: string, idPrefix = 'mermaid-svg') {
    const renderer = ensureMermaid()
    mermaidRenderCounter += 1
    const renderId = `${idPrefix}-${mermaidRenderCounter}`
    const { svg } = await renderer.render(renderId, source)
    return svg
}

export async function replaceMermaidFencesWithRenderedBlocks(markdown: string) {
    if (!markdown || !markdown.includes('```mermaid')) {
        return markdown
    }

    const pattern = /```mermaid[^\n]*\r?\n([\s\S]*?)```/g
    const matches = Array.from(markdown.matchAll(pattern))

    if (matches.length === 0) {
        return markdown
    }

    let cursor = 0
    const parts: string[] = []

    for (const match of matches) {
        const fullMatch = match[0]
        const source = match[1] ?? ''
        const matchIndex = match.index ?? 0

        parts.push(markdown.slice(cursor, matchIndex))

        try {
            const svg = await renderMermaidSvg(source, 'mermaid-export')
            parts.push(`<div class="mermaid-export" data-mermaid-export="rendered">${svg}</div>`)
        } catch (error) {
            parts.push(`
                <div class="mermaid-export-fallback" data-mermaid-export="fallback">
                    <div class="mermaid-export-fallback__title">Mermaid export fallback</div>
                    <div class="mermaid-export-fallback__message">${escapeHtml(getMermaidErrorMessage(error))}</div>
                    <pre><code class="language-mermaid">${escapeHtml(source.trim())}</code></pre>
                </div>
            `.trim())
        }

        cursor = matchIndex + fullMatch.length
    }

    parts.push(markdown.slice(cursor))
    return parts.join('')
}
