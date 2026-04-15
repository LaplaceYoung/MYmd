import { readDir, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs'
import { invoke } from '@tauri-apps/api/core'

export function basenameFromPath(path: string): string {
    const normalized = path.replace(/\\/g, '/')
    const value = normalized.split('/').pop()
    return value && value.length > 0 ? value : path
}

export function dirnameFromPath(path: string): string {
    const normalized = path.replace(/\\/g, '/')
    const lastSlash = normalized.lastIndexOf('/')
    if (lastSlash <= 0) return normalized
    return normalized.slice(0, lastSlash)
}

export function normalizePath(path: string): string {
    return path.replace(/\\/g, '/').replace(/\/+$/, '')
}

export function matchesPathPrefix(basePath: string, candidatePath: string): boolean {
    const normalizedBase = normalizePath(basePath)
    const normalizedCandidate = normalizePath(candidatePath)
    return normalizedCandidate === normalizedBase || normalizedCandidate.startsWith(`${normalizedBase}/`)
}

export function ensureMarkdownFileName(name: string, isDirectory: boolean): string {
    if (isDirectory) return name
    return /\.md$/i.test(name) ? name : `${name}.md`
}

export function joinPath(base: string, name: string): string {
    if (!base) return name
    if (base.endsWith('/') || base.endsWith('\\')) {
        return `${base}${name}`
    }
    return `${base}/${name}`
}

export async function readWorkspaceFile(path: string): Promise<string> {
    try {
        return await readTextFile(path)
    } catch (fsError) {
        console.warn('plugin-fs read failed, fallback to backend command:', path, fsError)
        return await invoke<string>('read_text_file_from_path', { path })
    }
}

export async function writeWorkspaceFile(path: string, content: string): Promise<void> {
    try {
        await writeTextFile(path, content)
    } catch (fsError) {
        console.warn('plugin-fs write failed, fallback to backend command:', path, fsError)
        await invoke('write_text_file_to_path', { path, content })
    }
}

export async function collectMarkdownFiles(
    root: string,
    maxFiles = 1800,
    signal?: AbortSignal
): Promise<string[]> {
    const files: string[] = []
    const queue = [root]

    while (queue.length > 0 && files.length < maxFiles) {
        if (signal?.aborted) {
            throw new Error('Knowledge indexing aborted')
        }
        const dir = queue.shift()
        if (!dir) break

        let entries
        try {
            entries = await readDir(dir)
        } catch {
            continue
        }

        for (const entry of entries) {
            if (!entry.name) continue
            const path = joinPath(dir, entry.name)
            if (entry.isDirectory) {
                queue.push(path)
                continue
            }
            if (entry.name.toLowerCase().endsWith('.md')) {
                files.push(path)
                if (files.length >= maxFiles) break
            }
        }
    }

    return files
}
