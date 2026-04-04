import type { AiTaskMode } from '@/utils/ai'

const AI_HISTORY_STORAGE_KEY = 'mymd:ai-history:v1'

interface StorageReader {
    getItem: (key: string) => string | null
}

interface StorageWriter extends StorageReader {
    setItem: (key: string, value: string) => void
    removeItem: (key: string) => void
}

export interface AiHistoryEntry {
    id: string
    taskMode: AiTaskMode
    instruction: string
    result: string
    source: 'generated' | 'saved'
    createdAt: string
    documentTitle: string
    label: string
    favorite: boolean
}

export interface PushAiHistoryEntryInput {
    taskMode: AiTaskMode
    instruction: string
    result: string
    source: AiHistoryEntry['source']
    documentTitle: string
}

function getDefaultStorage(): StorageWriter | null {
    if (typeof window === 'undefined') return null
    return window.localStorage
}

function isAiTaskMode(value: unknown): value is AiTaskMode {
    return value === 'layout' || value === 'content' || value === 'graph'
}

function isAiHistorySource(value: unknown): value is AiHistoryEntry['source'] {
    return value === 'generated' || value === 'saved'
}

function normalizeDocumentTitle(value: unknown) {
    if (typeof value !== 'string') return 'Untitled document'
    return value.trim() || 'Untitled document'
}

function normalizeHistoryLabel(value: unknown) {
    if (typeof value !== 'string') return ''
    return value.trim()
}

function normalizeAiHistoryEntry(entry: unknown): AiHistoryEntry | null {
    if (!entry || typeof entry !== 'object') return null

    const candidate = entry as Partial<AiHistoryEntry>
    if (
        typeof candidate.id !== 'string' ||
        !isAiTaskMode(candidate.taskMode) ||
        typeof candidate.instruction !== 'string' ||
        typeof candidate.result !== 'string' ||
        !isAiHistorySource(candidate.source) ||
        typeof candidate.createdAt !== 'string'
    ) {
        return null
    }

    return {
        id: candidate.id,
        taskMode: candidate.taskMode,
        instruction: candidate.instruction,
        result: candidate.result,
        source: candidate.source,
        createdAt: candidate.createdAt,
        documentTitle: normalizeDocumentTitle(candidate.documentTitle),
        label: normalizeHistoryLabel(candidate.label),
        favorite: candidate.favorite === true,
    }
}

function updateAiHistoryEntry(
    history: AiHistoryEntry[],
    id: string,
    updater: (entry: AiHistoryEntry) => AiHistoryEntry
): AiHistoryEntry[] {
    return history.map((entry) => (entry.id === id ? updater(entry) : entry))
}

export function pushAiHistoryEntry(
    history: AiHistoryEntry[],
    input: PushAiHistoryEntryInput,
    limit = 8
): AiHistoryEntry[] {
    const result = input.result.trim()
    if (!result) return history

    const latest = history[0]
    if (latest && latest.result === result) {
        return history
    }

    const entry: AiHistoryEntry = {
        id: `ai-history-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        taskMode: input.taskMode,
        instruction: input.instruction.trim(),
        result,
        source: input.source,
        createdAt: new Date().toLocaleTimeString('zh-CN', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        }),
        documentTitle: normalizeDocumentTitle(input.documentTitle),
        label: '',
        favorite: false,
    }

    return [entry, ...history].slice(0, Math.max(1, limit))
}

export function loadAiHistory(storage: StorageReader | null = getDefaultStorage(), limit = 8): AiHistoryEntry[] {
    if (!storage) return []

    try {
        const raw = storage.getItem(AI_HISTORY_STORAGE_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []

        return parsed
            .map((entry) => normalizeAiHistoryEntry(entry))
            .filter((entry): entry is AiHistoryEntry => entry !== null)
            .slice(0, Math.max(1, limit))
    } catch {
        return []
    }
}

export function persistAiHistory(history: AiHistoryEntry[], storage: StorageWriter | null = getDefaultStorage()) {
    if (!storage) return

    try {
        if (history.length === 0) {
            storage.removeItem(AI_HISTORY_STORAGE_KEY)
            return
        }
        storage.setItem(AI_HISTORY_STORAGE_KEY, JSON.stringify(history))
    } catch {
        // ignore persistence failures
    }
}

export function deleteAiHistoryEntry(history: AiHistoryEntry[], id: string): AiHistoryEntry[] {
    return history.filter((entry) => entry.id !== id)
}

export function renameAiHistoryEntry(history: AiHistoryEntry[], id: string, label: string): AiHistoryEntry[] {
    return updateAiHistoryEntry(history, id, (entry) => ({
        ...entry,
        label: label.trim(),
    }))
}

export function toggleAiHistoryFavorite(history: AiHistoryEntry[], id: string): AiHistoryEntry[] {
    return updateAiHistoryEntry(history, id, (entry) => ({
        ...entry,
        favorite: !entry.favorite,
    }))
}

export function sortAiHistoryEntries(history: AiHistoryEntry[]): AiHistoryEntry[] {
    const favorites = history.filter((entry) => entry.favorite)
    const regular = history.filter((entry) => !entry.favorite)
    return [...favorites, ...regular]
}

export function filterAiHistoryEntries(history: AiHistoryEntry[], query: string): AiHistoryEntry[] {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    if (!normalizedQuery) return history

    return history.filter((entry) => {
        const haystack = [
            entry.label,
            entry.documentTitle,
            entry.instruction,
            entry.result,
        ]
            .join('\n')
            .toLocaleLowerCase()

        return haystack.includes(normalizedQuery)
    })
}

export function clearAiHistory(storage: Pick<StorageWriter, 'removeItem'> | null = getDefaultStorage()) {
    if (!storage) return
    try {
        storage.removeItem(AI_HISTORY_STORAGE_KEY)
    } catch {
        // ignore persistence failures
    }
}
