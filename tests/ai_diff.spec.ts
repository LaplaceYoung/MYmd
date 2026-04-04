import { expect, test } from '@playwright/test'
import { applyAiDiffBlock, buildAiDiffPreview } from '../src/utils/aiDiff'

test('returns an empty summary when content is unchanged', () => {
    const diff = buildAiDiffPreview('# Title\r\n\r\nAlpha', '# Title\n\nAlpha')

    expect(diff.hasChanges).toBeFalsy()
    expect(diff.changedLines).toBe(0)
    expect(diff.addedLines).toBe(0)
    expect(diff.removedLines).toBe(0)
    expect(diff.previewBlocks).toHaveLength(0)
})

test('summarizes replaced and appended lines across multiple diff blocks', () => {
    const diff = buildAiDiffPreview(
        ['# Title', 'Alpha', 'Beta', 'Gamma'].join('\n'),
        ['# Title', 'Alpha revised', 'Beta', 'Gamma', 'Delta'].join('\n')
    )

    expect(diff.hasChanges).toBeTruthy()
    expect(diff.changedLines).toBe(1)
    expect(diff.addedLines).toBe(1)
    expect(diff.removedLines).toBe(0)
    expect(diff.totalBlocks).toBe(2)
    expect(diff.previewBlocks[0]).toMatchObject({
        beforeStartLine: 2,
        afterStartLine: 2,
        removed: ['Alpha'],
        added: ['Alpha revised'],
    })
    expect(diff.previewBlocks[1]).toMatchObject({
        beforeStartLine: 5,
        afterStartLine: 5,
        removed: [],
        added: ['Delta'],
    })
})

test('tracks removed lines inside a replacement block', () => {
    const diff = buildAiDiffPreview(
        ['Intro', 'Line A', 'Line B', 'Outro'].join('\n'),
        ['Intro', 'Line Z', 'Outro'].join('\n')
    )

    expect(diff.hasChanges).toBeTruthy()
    expect(diff.changedLines).toBe(1)
    expect(diff.addedLines).toBe(0)
    expect(diff.removedLines).toBe(1)
    expect(diff.previewBlocks).toHaveLength(1)
    expect(diff.previewBlocks[0]).toMatchObject({
        beforeStartLine: 2,
        afterStartLine: 2,
        removed: ['Line A', 'Line B'],
        added: ['Line Z'],
    })
})

test('applies only the selected diff block', () => {
    const original = ['# Title', '', 'Alpha'].join('\n')
    const next = ['# Revised', '', 'Beta'].join('\n')

    expect(applyAiDiffBlock(original, next, 0)).toBe(['# Revised', '', 'Alpha'].join('\n'))
    expect(applyAiDiffBlock(original, next, 1)).toBe(['# Title', '', 'Beta'].join('\n'))
})

test('returns the original content when the diff block index is out of range', () => {
    const original = ['# Title', '', 'Alpha'].join('\n')
    const next = ['# Revised', '', 'Beta'].join('\n')

    expect(applyAiDiffBlock(original, next, 99)).toBe(original)
})
