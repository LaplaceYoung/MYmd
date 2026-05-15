import { expect, test } from '@playwright/test'
import {
    calculateWritingStats,
    stripMarkdownForWritingStats,
} from '../src/utils/writingStats'

test('writing stats count visible Markdown text instead of syntax', () => {
    const markdown = [
        '# Title',
        '',
        'Hello **world** [docs](https://example.com) and `code`.',
        '',
        '[[Project|Roadmap]] #tag/alpha',
    ].join('\n')

    const stats = calculateWritingStats(markdown)

    expect(stats.plainText).toBe('Title Hello world docs and code. Roadmap tag/alpha')
    expect(stats.wordCount).toBe(9)
    expect(stats.readingTimeMinutes).toBe(1)
})

test('writing stats skip frontmatter, comments, and table separators', () => {
    const markdown = [
        '---',
        'title: Hidden Draft',
        'tags: [private]',
        '---',
        '',
        '<!-- mymd:table-width=900 -->',
        '',
        '| Name | Value |',
        '| --- | --- |',
        '| Alpha | Beta |',
        '',
        '> Visible quote',
    ].join('\n')

    expect(stripMarkdownForWritingStats(markdown)).toBe('Name Value Alpha Beta Visible quote')
    expect(calculateWritingStats(markdown).wordCount).toBe(6)
})

test('writing stats handle mixed CJK and Latin prose', () => {
    const stats = calculateWritingStats('你好 Markdown\n\n快速写作')

    expect(stats.wordCount).toBe(7)
    expect(stats.nonWhitespaceCharacterCount).toBe(14)
    expect(stats.readingTimeMinutes).toBe(1)
})

test('writing stats report zero reading time for empty documents', () => {
    const stats = calculateWritingStats('   \n\n')

    expect(stats.wordCount).toBe(0)
    expect(stats.visibleCharacterCount).toBe(0)
    expect(stats.readingTimeMinutes).toBe(0)
})
