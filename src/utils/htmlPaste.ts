const BLOCK_TAGS = new Set([
    'ADDRESS',
    'ARTICLE',
    'ASIDE',
    'BLOCKQUOTE',
    'DIV',
    'DL',
    'FIELDSET',
    'FIGCAPTION',
    'FIGURE',
    'FOOTER',
    'FORM',
    'H1',
    'H2',
    'H3',
    'H4',
    'H5',
    'H6',
    'HEADER',
    'HR',
    'LI',
    'MAIN',
    'NAV',
    'OL',
    'P',
    'PRE',
    'SECTION',
    'TABLE',
    'TD',
    'TH',
    'TR',
    'UL',
])

function decodeHtml(value: string) {
    const textarea = document.createElement('textarea')
    textarea.innerHTML = value
    return textarea.value
}

function normalizeWhitespace(value: string) {
    return value
        .replace(/\u00a0/g, ' ')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n[ \t]+/g, '\n')
        .replace(/[ \t]{2,}/g, ' ')
}

function escapeMarkdownText(value: string) {
    return value
        .replace(/\\/g, '\\\\')
        .replace(/([*_`[\]])/g, '\\$1')
}

function escapeMarkdownLink(value: string) {
    return value.replace(/[()\\]/g, '\\$&')
}

function cleanInline(value: string) {
    return normalizeWhitespace(value).replace(/\n+/g, ' ').trim()
}

function collapseMarkdown(value: string) {
    return value
        .replace(/\r\n?/g, '\n')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
}

function wrapInline(marker: string, value: string) {
    const content = cleanInline(value)
    return content ? `${marker}${content}${marker}` : ''
}

function renderInlineChildren(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
        return escapeMarkdownText(decodeHtml(node.textContent || ''))
    }

    if (!(node instanceof HTMLElement)) {
        return ''
    }

    const tag = node.tagName
    const content = Array.from(node.childNodes).map(renderInlineChildren).join('')

    switch (tag) {
        case 'BR':
            return '\n'
        case 'STRONG':
        case 'B':
            return wrapInline('**', content)
        case 'EM':
        case 'I':
            return wrapInline('*', content)
        case 'DEL':
        case 'S':
            return wrapInline('~~', content)
        case 'CODE':
            if (node.closest('pre')) return content
            return `\`${cleanInline(content).replace(/`/g, '\\`')}\``
        case 'A': {
            const href = node.getAttribute('href')?.trim()
            const label = cleanInline(content) || href || ''
            if (!href) return label
            return `[${label}](${escapeMarkdownLink(href)})`
        }
        case 'IMG': {
            const src = node.getAttribute('src')?.trim()
            const alt = escapeMarkdownText(node.getAttribute('alt')?.trim() || '')
            return src ? `![${alt}](${escapeMarkdownLink(src)})` : ''
        }
        default:
            return content
    }
}

function indentBlock(value: string, prefix: string) {
    return value
        .split('\n')
        .map(line => `${prefix}${line}`)
        .join('\n')
}

function renderListItem(node: HTMLElement, ordered: boolean, index: number, depth: number): string {
    const indent = '  '.repeat(Math.max(0, depth - 1))
    const marker = ordered ? `${index + 1}. ` : '- '
    const childBlocks: string[] = []
    let inlineBuffer = ''

    const flushInline = () => {
        const line = cleanInline(inlineBuffer)
        if (line) childBlocks.push(line)
        inlineBuffer = ''
    }

    for (const child of Array.from(node.childNodes)) {
        if (child instanceof HTMLElement && BLOCK_TAGS.has(child.tagName) && child.tagName !== 'BR') {
            flushInline()
            const block = renderBlockNode(child, depth + 1)
            if (block) childBlocks.push(block)
            continue
        }

        inlineBuffer += renderInlineChildren(child)
    }

    flushInline()

    if (childBlocks.length === 0) {
        return `${indent}${marker}`.trimEnd()
    }

    const [first, ...rest] = childBlocks
    const firstLine = `${indent}${marker}${first}`
    if (rest.length === 0) return firstLine

    const nested = rest.map(block => indentBlock(block, `${indent}  `)).join('\n')
    return `${firstLine}\n${nested}`
}

function renderTable(node: HTMLElement): string {
    const rows = Array.from(node.querySelectorAll('tr'))
        .map((row) =>
            Array.from(row.children)
                .filter((cell): cell is HTMLElement => cell instanceof HTMLElement)
                .map(cell => cleanInline(renderInlineChildren(cell)) || ' ')
        )
        .filter(row => row.length > 0)

    if (rows.length === 0) return ''

    const columnCount = Math.max(...rows.map(row => row.length))
    const normalizedRows = rows.map((row) => {
        const padded = row.slice()
        while (padded.length < columnCount) padded.push(' ')
        return padded
    })

    const header = normalizedRows[0]
    const separator = header.map(() => '---')
    const body = normalizedRows.slice(1)

    return [
        `| ${header.join(' | ')} |`,
        `| ${separator.join(' | ')} |`,
        ...body.map(row => `| ${row.join(' | ')} |`),
    ].join('\n')
}

function renderBlockNode(node: Node, depth = 0): string {
    if (node.nodeType === Node.TEXT_NODE) {
        return cleanInline(renderInlineChildren(node))
    }

    if (!(node instanceof HTMLElement)) {
        return ''
    }

    const tag = node.tagName

    switch (tag) {
        case 'H1':
        case 'H2':
        case 'H3':
        case 'H4':
        case 'H5':
        case 'H6': {
            const level = Number(tag[1])
            const text = cleanInline(renderInlineChildren(node))
            return text ? `${'#'.repeat(level)} ${text}` : ''
        }
        case 'P':
        case 'DIV':
        case 'SECTION':
        case 'ARTICLE':
        case 'ASIDE':
        case 'HEADER':
        case 'FOOTER':
        case 'MAIN':
        case 'NAV':
        case 'FIGURE':
        case 'FIGCAPTION': {
            return cleanInline(Array.from(node.childNodes).map(renderInlineChildren).join(''))
        }
        case 'BR':
            return ''
        case 'HR':
            return '---'
        case 'BLOCKQUOTE': {
            const content = renderChildrenAsBlocks(node, depth)
            return content ? indentBlock(content, '> ') : ''
        }
        case 'UL':
        case 'OL': {
            const ordered = tag === 'OL'
            const items = Array.from(node.children)
                .filter((child): child is HTMLElement => child instanceof HTMLElement && child.tagName === 'LI')
                .map((child, index) => renderListItem(child, ordered, index, depth + 1))
                .filter(Boolean)
            return items.join('\n')
        }
        case 'PRE': {
            const code = node.textContent?.replace(/\r\n?/g, '\n').trimEnd() || ''
            if (!code) return ''
            return `\`\`\`\n${code}\n\`\`\``
        }
        case 'TABLE':
            return renderTable(node)
        default: {
            if (tag === 'LI') {
                return renderListItem(node, false, 0, depth + 1)
            }

            return cleanInline(Array.from(node.childNodes).map(renderInlineChildren).join(''))
        }
    }
}

function renderChildrenAsBlocks(root: ParentNode, depth = 0) {
    const blocks = Array.from(root.childNodes)
        .map(node => renderBlockNode(node, depth))
        .filter(Boolean)

    return collapseMarkdown(blocks.join('\n\n'))
}

export function convertHtmlToMarkdown(html: string) {
    if (!html.trim()) return ''

    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    return renderChildrenAsBlocks(doc.body)
}

export function getHtmlPasteMarkdown(data: DataTransfer | null) {
    if (!data) return null

    const html = data.getData('text/html')?.trim()
    if (!html) return null

    const markdown = convertHtmlToMarkdown(html)
    return markdown || null
}
