const TABLE_WIDTH_DIRECTIVE_RE = /^<!--\s*mymd:table-width=(\d+)\s*-->$/
const TABLE_HEADER_RE = /^\|(?:.*\|)+\s*$/
const TABLE_DIVIDER_RE = /^\|?(?:\s*:?-{3,}:?\s*\|)+\s*$/

export function clampTableWidthPx(widthPx: number) {
    if (!Number.isFinite(widthPx)) return 720
    return Math.max(320, Math.min(2400, Math.round(widthPx)))
}

function isMarkdownTableStart(lines: string[], index: number) {
    if (index < 0 || index >= lines.length - 1) return false
    return TABLE_HEADER_RE.test(lines[index].trim()) && TABLE_DIVIDER_RE.test(lines[index + 1].trim())
}

function collectMarkdownTableMeta(markdown: string) {
    const lines = markdown.split('\n')
    const tables: Array<{ startLine: number; directiveLine: number | null }> = []
    let pendingDirectiveLine: number | null = null

    for (let i = 0; i < lines.length; i += 1) {
        const trimmed = lines[i].trim()

        if (TABLE_WIDTH_DIRECTIVE_RE.test(trimmed)) {
            pendingDirectiveLine = i
            continue
        }

        if (isMarkdownTableStart(lines, i)) {
            tables.push({
                startLine: i,
                directiveLine: pendingDirectiveLine,
            })

            pendingDirectiveLine = null
            i += 1
            while (i + 1 < lines.length && TABLE_HEADER_RE.test(lines[i + 1].trim())) {
                i += 1
            }
            continue
        }

        if (trimmed.length > 0) {
            pendingDirectiveLine = null
        }
    }

    return { lines, tables }
}

export function extractMarkdownTableWidths(markdown: string) {
    const { lines, tables } = collectMarkdownTableMeta(markdown)
    const result = new Map<number, number>()

    tables.forEach((table, tableIndex) => {
        if (table.directiveLine === null) return
        const match = lines[table.directiveLine].trim().match(TABLE_WIDTH_DIRECTIVE_RE)
        if (!match) return
        result.set(tableIndex, clampTableWidthPx(Number(match[1])))
    })

    return result
}

export function countMarkdownTables(markdown: string) {
    return collectMarkdownTableMeta(markdown).tables.length
}

export function upsertMarkdownTableWidth(markdown: string, tableIndex: number, widthPx: number | null) {
    const { lines, tables } = collectMarkdownTableMeta(markdown)
    const target = tables[tableIndex]
    if (!target) return markdown

    const nextLines = lines.slice()
    const directive = widthPx === null ? null : `<!-- mymd:table-width=${clampTableWidthPx(widthPx)} -->`

    if (target.directiveLine !== null) {
        if (directive) {
            nextLines[target.directiveLine] = directive
        } else {
            nextLines.splice(target.directiveLine, 1)
        }
    } else if (directive) {
        nextLines.splice(target.startLine, 0, directive)
    }

    return nextLines.join('\n')
}

function injectWidthIntoTableTag(tableTag: string, widthPx: number) {
    const widthStyle = `width: ${clampTableWidthPx(widthPx)}px;`

    if (/style=/i.test(tableTag)) {
        return tableTag.replace(/style=(["'])(.*?)\1/i, (_match, quote: string, styleValue: string) => {
            const normalized = styleValue.trim()
            const prefix = normalized.length > 0 && !normalized.endsWith(';') ? `${normalized}; ` : normalized
            return `style=${quote}${prefix}${widthStyle}${quote}`
        }).replace('<table', `<table data-table-width="${clampTableWidthPx(widthPx)}"`)
    }

    return tableTag.replace('<table', `<table data-table-width="${clampTableWidthPx(widthPx)}" style="${widthStyle}"`)
}

export function applyTableWidthDirectivesToHtml(bodyHtml: string, markdown: string) {
    const widthMap = extractMarkdownTableWidths(markdown)
    if (!bodyHtml || widthMap.size === 0) return bodyHtml

    let tableIndex = 0
    return bodyHtml.replace(/<table\b[^>]*>/gi, (tableTag) => {
        const widthPx = widthMap.get(tableIndex)
        tableIndex += 1
        return widthPx ? injectWidthIntoTableTag(tableTag, widthPx) : tableTag
    })
}
