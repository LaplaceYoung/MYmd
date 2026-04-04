import { expect, test } from '@playwright/test'
import {
    clearAiHistory,
    deleteAiHistoryEntry,
    filterAiHistoryEntries,
    loadAiHistory,
    persistAiHistory,
    pushAiHistoryEntry,
    renameAiHistoryEntry,
    sortAiHistoryEntries,
    toggleAiHistoryFavorite,
} from '../src/utils/aiHistory'

test('prepends the latest history entry and caps the list length', () => {
    let history = [] as Array<{
        id: string
        taskMode: 'layout' | 'content' | 'graph'
        instruction: string
        result: string
        source: 'generated' | 'saved'
        createdAt: string
    }>

    for (let index = 0; index < 10; index += 1) {
        history = pushAiHistoryEntry(history, {
            taskMode: 'layout',
            instruction: `Instruction ${index}`,
            result: `Result ${index}`,
            source: 'generated',
        }, 8)
    }

    expect(history).toHaveLength(8)
    expect(history[0].result).toBe('Result 9')
    expect(history[7].result).toBe('Result 2')
})

test('skips consecutive duplicate history results', () => {
    const history = pushAiHistoryEntry([], {
        taskMode: 'content',
        instruction: 'Tighten this',
        result: 'Version A',
        source: 'generated',
    })

    const nextHistory = pushAiHistoryEntry(history, {
        taskMode: 'content',
        instruction: 'Tighten this',
        result: 'Version A',
        source: 'saved',
    })

    expect(nextHistory).toHaveLength(1)
    expect(nextHistory[0].source).toBe('generated')
})

test('stores document title and supports rename plus favorite toggle', () => {
    const history = pushAiHistoryEntry([], {
        taskMode: 'content',
        documentTitle: 'Roadmap.md',
        instruction: 'Tighten this',
        result: 'Version A',
        source: 'saved',
    })

    expect(history[0].documentTitle).toBe('Roadmap.md')
    expect(history[0].favorite).toBeFalsy()
    expect(history[0].label).toBe('')

    const renamed = renameAiHistoryEntry(history, history[0].id, 'Polished draft')
    expect(renamed[0].label).toBe('Polished draft')

    const favorited = toggleAiHistoryFavorite(renamed, renamed[0].id)
    expect(favorited[0].favorite).toBeTruthy()
})

test('pins favorites first and filters history by label or document title', () => {
    let history = pushAiHistoryEntry([], {
        taskMode: 'content',
        documentTitle: 'Weekly Review.md',
        instruction: 'Rewrite weekly summary',
        result: 'Weekly rewrite',
        source: 'saved',
    })

    history = pushAiHistoryEntry(history, {
        taskMode: 'layout',
        documentTitle: 'Hiring Plan.md',
        instruction: 'Polish the hiring plan',
        result: 'Hiring rewrite',
        source: 'generated',
    })

    const renamed = renameAiHistoryEntry(history, history[1].id, 'Pinned summary')
    const favorited = toggleAiHistoryFavorite(renamed, renamed[1].id)
    const sorted = sortAiHistoryEntries(favorited)

    expect(sorted[0].id).toBe(favorited[1].id)
    expect(filterAiHistoryEntries(sorted, 'Pinned summary')).toHaveLength(1)
    expect(filterAiHistoryEntries(sorted, 'Hiring Plan')).toHaveLength(1)
    expect(filterAiHistoryEntries(sorted, 'missing')).toHaveLength(0)
})

test('persists, reloads, deletes, and clears history entries', () => {
    const storage = new Map<string, string>()
    const history = pushAiHistoryEntry([], {
        taskMode: 'graph',
        instruction: 'Link notes',
        result: 'History A',
        source: 'saved',
    })

    persistAiHistory(history, {
        getItem: (key) => storage.get(key) ?? null,
        setItem: (key, value) => void storage.set(key, value),
        removeItem: (key) => void storage.delete(key),
    })

    const loaded = loadAiHistory({
        getItem: (key) => storage.get(key) ?? null,
    })
    expect(loaded).toHaveLength(1)
    expect(loaded[0].result).toBe('History A')

    const afterDelete = deleteAiHistoryEntry(loaded, loaded[0].id)
    expect(afterDelete).toHaveLength(0)

    persistAiHistory(loaded, {
        getItem: (key) => storage.get(key) ?? null,
        setItem: (key, value) => void storage.set(key, value),
        removeItem: (key) => void storage.delete(key),
    })
    clearAiHistory({
        removeItem: (key) => void storage.delete(key),
    })

    expect(storage.size).toBe(0)
})
