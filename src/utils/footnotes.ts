import { marked } from 'marked'

interface FootnoteDefinition {
    key: string
    label: string
    content: string
}

interface FootnoteReference {
    key: string
    index: number
    domId: string
    label: string
    content: string
}

function normalizeFootnoteKey(value: string) {
    return value.trim().toLowerCase()
}

function escapeAttribute(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
}

function createSafeDomSuffix(key: string, index: number) {
    const suffix = key
        .trim()
        .replace(/[^\p{L}\p{N}_-]+/gu, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase()

    return suffix ? `${index}-${suffix}` : String(index)
}

function stripContinuationIndent(line: string) {
    return line.replace(/^(?: {2,4}|\t)/, '')
}

function isFootnoteContinuation(line: string) {
    return /^(?: {2,}|\t)/.test(line)
}

function collectFootnoteDefinitions(markdown: string) {
    const lines = markdown.split(/\r?\n/)
    const bodyLines: string[] = []
    const definitions = new Map<string, FootnoteDefinition>()
    let inFence = false

    for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index]
        if (/^\s*(```|~~~)/.test(line)) {
            inFence = !inFence
            bodyLines.push(line)
            continue
        }

        const definitionMatch = !inFence ? line.match(/^\[\^([^\]\s]+)\]:\s*(.*)$/) : null
        if (!definitionMatch) {
            bodyLines.push(line)
            continue
        }

        const label = definitionMatch[1].trim()
        const key = normalizeFootnoteKey(label)
        const contentLines = [definitionMatch[2] ?? '']

        while (index + 1 < lines.length) {
            const nextLine = lines[index + 1]
            if (isFootnoteContinuation(nextLine)) {
                contentLines.push(stripContinuationIndent(nextLine))
                index += 1
                continue
            }
            break
        }

        if (key) {
            definitions.set(key, {
                key,
                label,
                content: contentLines.join('\n').trim(),
            })
        }
    }

    return {
        markdown: bodyLines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd(),
        definitions,
    }
}

function renderFootnoteContent(content: string) {
    const rendered = marked.parseInline(content || ' ') as string
    return rendered.trim()
}

function renderFootnoteList(references: FootnoteReference[]) {
    const items = references
        .map((reference) => {
            const safeDomId = escapeAttribute(reference.domId)
            const safeBackLabel = escapeAttribute(`Back to reference ${reference.index}`)
            return [
                `<li id="fn-${safeDomId}" class="footnotes__item">`,
                `<p>${renderFootnoteContent(reference.content)} <a href="#fnref-${safeDomId}" class="footnote-backref" aria-label="${safeBackLabel}">Back</a></p>`,
                '</li>',
            ].join('')
        })
        .join('\n')

    return [
        '<section class="footnotes" role="doc-endnotes">',
        '<hr>',
        '<ol>',
        items,
        '</ol>',
        '</section>',
    ].join('\n')
}

export function prepareFootnotesForMarked(markdown: string) {
    if (!markdown.includes('[^')) return markdown

    const { markdown: bodyMarkdown, definitions } = collectFootnoteDefinitions(markdown)
    if (definitions.size === 0) return markdown

    const references = new Map<string, FootnoteReference>()
    const referencePattern = /\[\^([^\]\s]+)\]/g
    const markdownWithRefs = bodyMarkdown.replace(referencePattern, (match, rawLabel: string) => {
        const key = normalizeFootnoteKey(rawLabel)
        const definition = definitions.get(key)
        if (!definition) return match

        if (!references.has(key)) {
            const index = references.size + 1
            references.set(key, {
                key,
                index,
                domId: createSafeDomSuffix(key, index),
                label: definition.label,
                content: definition.content,
            })
        }

        const reference = references.get(key)!
        const safeDomId = escapeAttribute(reference.domId)
        const safeLabel = escapeAttribute(`Footnote ${reference.index}: ${reference.label}`)
        return `<sup id="fnref-${safeDomId}" class="footnote-ref"><a href="#fn-${safeDomId}" role="doc-noteref" aria-label="${safeLabel}">${reference.index}</a></sup>`
    })

    const orderedReferences = Array.from(references.values()).sort((left, right) => left.index - right.index)
    if (orderedReferences.length === 0) return markdown

    return `${markdownWithRefs}\n\n${renderFootnoteList(orderedReferences)}`
}
