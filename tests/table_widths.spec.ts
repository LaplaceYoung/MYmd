import { expect, test } from '@playwright/test'
import {
    extractMarkdownTableWidths,
    upsertMarkdownTableWidth,
} from '../src/utils/tableWidths'

test('upserts a persisted width directive before the targeted markdown table', () => {
    const markdown = [
        '# Tables',
        '',
        '| Name | Value |',
        '| --- | --- |',
        '| A | 1 |',
        '',
        '| City | Score |',
        '| --- | --- |',
        '| Paris | 9 |',
    ].join('\n')

    const updated = upsertMarkdownTableWidth(markdown, 1, 1180)

    expect(updated).toContain('<!-- mymd:table-width=1180 -->')
    expect(extractMarkdownTableWidths(updated).get(1)).toBe(1180)
    expect(extractMarkdownTableWidths(updated).get(0)).toBeUndefined()
})

test('removes an existing width directive when resetting a table back to auto width', () => {
    const markdown = [
        '# Tables',
        '',
        '<!-- mymd:table-width=960 -->',
        '| Name | Value |',
        '| --- | --- |',
        '| A | 1 |',
    ].join('\n')

    const updated = upsertMarkdownTableWidth(markdown, 0, null)

    expect(updated).not.toContain('mymd:table-width=')
    expect(extractMarkdownTableWidths(updated).size).toBe(0)
})
