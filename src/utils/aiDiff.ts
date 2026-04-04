export interface AiDiffPreviewBlock {
    beforeStartLine: number
    afterStartLine: number
    removed: string[]
    added: string[]
}

export interface AiDiffPreview {
    hasChanges: boolean
    changedLines: number
    addedLines: number
    removedLines: number
    totalBlocks: number
    previewBlocks: AiDiffPreviewBlock[]
    truncated: boolean
}

export interface AiDiffSummary {
    hasChanges: boolean
    changedLines: number
    addedLines: number
    removedLines: number
    preview: string[]
}

interface BuildAiDiffPreviewOptions {
    previewBlockLimit?: number
    previewLineLimit?: number
}

type DiffOp =
    | { type: 'equal'; line: string }
    | { type: 'add'; line: string }
    | { type: 'remove'; line: string }

const MAX_LCS_CELLS = 48_000
const DEFAULT_PREVIEW_BLOCK_LIMIT = 3
const DEFAULT_PREVIEW_LINE_LIMIT = 3
const DEFAULT_SUMMARY_PREVIEW_LIMIT = 6

function normalizeContent(content: string): string {
    return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

function toLines(content: string): string[] {
    if (!content.length) return []
    return content.split('\n')
}

function buildLcsOps(previous: string[], next: string[]): DiffOp[] {
    const rows = previous.length
    const cols = next.length
    const matrix = Array.from({ length: rows + 1 }, () => Array<number>(cols + 1).fill(0))

    for (let row = rows - 1; row >= 0; row -= 1) {
        for (let col = cols - 1; col >= 0; col -= 1) {
            matrix[row][col] = previous[row] === next[col]
                ? matrix[row + 1][col + 1] + 1
                : Math.max(matrix[row + 1][col], matrix[row][col + 1])
        }
    }

    const ops: DiffOp[] = []
    let row = 0
    let col = 0

    while (row < rows && col < cols) {
        if (previous[row] === next[col]) {
            ops.push({ type: 'equal', line: previous[row] })
            row += 1
            col += 1
            continue
        }

        if (matrix[row + 1][col] >= matrix[row][col + 1]) {
            ops.push({ type: 'remove', line: previous[row] })
            row += 1
            continue
        }

        ops.push({ type: 'add', line: next[col] })
        col += 1
    }

    while (row < rows) {
        ops.push({ type: 'remove', line: previous[row] })
        row += 1
    }

    while (col < cols) {
        ops.push({ type: 'add', line: next[col] })
        col += 1
    }

    return ops
}

function buildFallbackOps(previous: string[], next: string[]): DiffOp[] {
    let prefix = 0
    while (
        prefix < previous.length &&
        prefix < next.length &&
        previous[prefix] === next[prefix]
    ) {
        prefix += 1
    }

    let previousSuffix = previous.length - 1
    let nextSuffix = next.length - 1
    while (
        previousSuffix >= prefix &&
        nextSuffix >= prefix &&
        previous[previousSuffix] === next[nextSuffix]
    ) {
        previousSuffix -= 1
        nextSuffix -= 1
    }

    const ops: DiffOp[] = previous.slice(0, prefix).map((line) => ({ type: 'equal', line }))
    ops.push(
        ...previous.slice(prefix, previousSuffix + 1).map((line) => ({ type: 'remove' as const, line })),
        ...next.slice(prefix, nextSuffix + 1).map((line) => ({ type: 'add' as const, line })),
        ...previous.slice(previousSuffix + 1).map((line) => ({ type: 'equal' as const, line })),
    )
    return ops
}

function buildDiffBlocks(ops: DiffOp[]): AiDiffPreviewBlock[] {
    const blocks: AiDiffPreviewBlock[] = []
    let current: AiDiffPreviewBlock | null = null
    let beforeLine = 1
    let afterLine = 1

    for (const op of ops) {
        if (op.type === 'equal') {
            if (current) {
                blocks.push(current)
                current = null
            }
            beforeLine += 1
            afterLine += 1
            continue
        }

        if (!current) {
            current = {
                beforeStartLine: beforeLine,
                afterStartLine: afterLine,
                removed: [],
                added: [],
            }
        }

        if (op.type === 'remove') {
            current.removed.push(op.line)
            beforeLine += 1
        } else {
            current.added.push(op.line)
            afterLine += 1
        }
    }

    if (current) {
        blocks.push(current)
    }

    return blocks
}

function createEmptyPreview(): AiDiffPreview {
    return {
        hasChanges: false,
        changedLines: 0,
        addedLines: 0,
        removedLines: 0,
        totalBlocks: 0,
        previewBlocks: [],
        truncated: false,
    }
}

function formatPreviewLine(line: string): string {
    return line.length > 0 ? line : '(blank line)'
}

function resolveDiffBlocks(previousContent: string, nextContent: string): AiDiffPreviewBlock[] {
    const normalizedPrevious = normalizeContent(previousContent)
    const normalizedNext = normalizeContent(nextContent)

    if (normalizedPrevious === normalizedNext) {
        return []
    }

    const previousLines = toLines(normalizedPrevious)
    const nextLines = toLines(normalizedNext)
    const cells = previousLines.length * nextLines.length
    const ops = cells <= MAX_LCS_CELLS
        ? buildLcsOps(previousLines, nextLines)
        : buildFallbackOps(previousLines, nextLines)

    return buildDiffBlocks(ops)
}

export function buildAiDiffPreview(
    previousContent: string,
    nextContent: string,
    options: BuildAiDiffPreviewOptions = {}
): AiDiffPreview {
    const blocks = resolveDiffBlocks(previousContent, nextContent)
    if (blocks.length === 0) {
        return createEmptyPreview()
    }
    const previewBlockLimit = options.previewBlockLimit ?? DEFAULT_PREVIEW_BLOCK_LIMIT
    const previewLineLimit = options.previewLineLimit ?? DEFAULT_PREVIEW_LINE_LIMIT

    let changedLines = 0
    let addedLines = 0
    let removedLines = 0

    for (const block of blocks) {
        changedLines += Math.min(block.removed.length, block.added.length)
        addedLines += Math.max(0, block.added.length - block.removed.length)
        removedLines += Math.max(0, block.removed.length - block.added.length)
    }

    return {
        hasChanges: blocks.length > 0,
        changedLines,
        addedLines,
        removedLines,
        totalBlocks: blocks.length,
        previewBlocks: blocks.slice(0, previewBlockLimit).map((block) => ({
            beforeStartLine: block.beforeStartLine,
            afterStartLine: block.afterStartLine,
            removed: block.removed.slice(0, previewLineLimit),
            added: block.added.slice(0, previewLineLimit),
        })),
        truncated: blocks.length > previewBlockLimit || blocks.some(
            (block) => block.removed.length > previewLineLimit || block.added.length > previewLineLimit
        ),
    }
}

export function applyAiDiffBlock(
    previousContent: string,
    nextContent: string,
    blockIndex: number
): string {
    const blocks = resolveDiffBlocks(previousContent, nextContent)
    const block = blocks[blockIndex]

    if (!block) {
        return previousContent
    }

    const lines = toLines(normalizeContent(previousContent))
    const startIndex = Math.max(0, block.beforeStartLine - 1)
    lines.splice(startIndex, block.removed.length, ...block.added)
    return lines.join('\n')
}

export function summarizeAiDiff(
    previousContent: string,
    nextContent: string,
    previewLimit = DEFAULT_SUMMARY_PREVIEW_LIMIT
): AiDiffSummary {
    const diff = buildAiDiffPreview(previousContent, nextContent, {
        previewBlockLimit: previewLimit,
        previewLineLimit: previewLimit,
    })

    if (!diff.hasChanges) {
        return {
            hasChanges: false,
            changedLines: 0,
            addedLines: 0,
            removedLines: 0,
            preview: [],
        }
    }

    const preview: string[] = []

    for (const block of diff.previewBlocks) {
        for (const line of block.removed) {
            if (preview.length >= previewLimit) break
            preview.push(`- ${formatPreviewLine(line)}`)
        }

        for (const line of block.added) {
            if (preview.length >= previewLimit) break
            preview.push(`+ ${formatPreviewLine(line)}`)
        }

        if (preview.length >= previewLimit) break
    }

    return {
        hasChanges: diff.hasChanges,
        changedLines: diff.changedLines,
        addedLines: diff.addedLines,
        removedLines: diff.removedLines,
        preview,
    }
}
