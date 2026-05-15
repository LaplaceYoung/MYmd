export interface WritingStats {
    sourceCharacterCount: number
    visibleCharacterCount: number
    nonWhitespaceCharacterCount: number
    wordCount: number
    readingTimeMinutes: number
    plainText: string
}

const CJK_CHARACTER_PATTERN = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\u3040-\u30FF\uAC00-\uD7AF]/gu
const WORD_PATTERN = /[\p{L}\p{N}]+(?:['’._-][\p{L}\p{N}]+)*/gu
const DEFAULT_LATIN_WORDS_PER_MINUTE = 225
const DEFAULT_CJK_CHARACTERS_PER_MINUTE = 500

function removeFrontmatter(markdown: string) {
    return markdown.replace(/^(---|\+\+\+)\n[\s\S]*?\n\1(?:\n|$)/, '')
}

export function stripMarkdownForWritingStats(markdown: string) {
    let text = removeFrontmatter(markdown.replace(/\r\n?/g, '\n'))

    text = text
        .replace(/<!--[\s\S]*?-->/g, ' ')
        .replace(/```[^\n]*\n([\s\S]*?)```/g, '\n$1\n')
        .replace(/~~~[^\n]*\n([\s\S]*?)~~~/g, '\n$1\n')
        .replace(/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/gm, ' ')
        .replace(/^\s{0,3}#{1,6}\s+/gm, '')
        .replace(/^\s{0,3}>\s?/gm, '')
        .replace(/^\s*[-+*]\s+\[[ xX]\]\s+/gm, '')
        .replace(/^\s*[-+*]\s+/gm, '')
        .replace(/^\s*\d+[.)]\s+/gm, '')
        .replace(/\[\^[^\]]+\]:/g, ' ')
        .replace(/\[\^[^\]]+\]/g, ' ')
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\[([^\]]+)\]\[[^\]]*\]/g, '$1')
        .replace(/\[\[[^\]|]+\|([^\]]+)\]\]/g, '$1')
        .replace(/\[\[([^\]]+)\]\]/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/<[^>]+>/g, ' ')
        .replace(/https?:\/\/\S+/g, ' ')
        .replace(/^[\s*_~=-]{3,}$/gm, ' ')
        .replace(/[*_~`>#|[\](){}]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

    return text
}

export function calculateWritingStats(markdown: string): WritingStats {
    const plainText = stripMarkdownForWritingStats(markdown)
    const cjkCharacters = plainText.match(CJK_CHARACTER_PATTERN) ?? []
    const latinText = plainText.replace(CJK_CHARACTER_PATTERN, ' ')
    const latinWords = latinText.match(WORD_PATTERN) ?? []
    const wordCount = latinWords.length + cjkCharacters.length
    const visibleCharacterCount = plainText.length
    const nonWhitespaceCharacterCount = (plainText.match(/\S/g) ?? []).length
    const readingTimeRaw =
        latinWords.length / DEFAULT_LATIN_WORDS_PER_MINUTE +
        cjkCharacters.length / DEFAULT_CJK_CHARACTERS_PER_MINUTE
    const readingTimeMinutes = wordCount === 0 ? 0 : Math.max(1, Math.ceil(readingTimeRaw))

    return {
        sourceCharacterCount: markdown.length,
        visibleCharacterCount,
        nonWhitespaceCharacterCount,
        wordCount,
        readingTimeMinutes,
        plainText,
    }
}
