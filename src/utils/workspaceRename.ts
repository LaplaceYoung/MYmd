import { rename } from '@tauri-apps/plugin-fs'
import { rewriteWikilinksForPathChange } from '@/knowledge/parser'
import { useEditorStore } from '@/stores/editorStore'
import {
    basenameFromPath,
    collectMarkdownFiles,
    dirnameFromPath,
    ensureMarkdownFileName,
    joinPath,
    matchesPathPrefix,
    normalizePath,
    readWorkspaceFile,
    writeWorkspaceFile,
} from '@/utils/workspacePaths'

export function syncTabsAfterRename(fromPath: string, toPath: string, isDirectory: boolean) {
    useEditorStore.setState((state) => ({
        tabs: state.tabs.map((tab) => {
            if (!tab.filePath) return tab
            const normalizedFilePath = normalizePath(tab.filePath)

            if (isDirectory) {
                if (!matchesPathPrefix(fromPath, normalizedFilePath)) return tab
                const suffix = normalizedFilePath.slice(normalizePath(fromPath).length)
                const nextPath = `${normalizePath(toPath)}${suffix}`
                return {
                    ...tab,
                    filePath: nextPath,
                    title: basenameFromPath(nextPath),
                }
            }

            if (normalizedFilePath !== normalizePath(fromPath)) return tab
            return {
                ...tab,
                filePath: toPath,
                title: basenameFromPath(toPath),
            }
        }),
    }))
}

export function syncOpenTabContent(filePath: string, nextContent: string, keepDirty: boolean) {
    useEditorStore.setState((state) => ({
        tabs: state.tabs.map((tab) => {
            if (!tab.filePath || normalizePath(tab.filePath) !== normalizePath(filePath)) {
                return tab
            }
            return {
                ...tab,
                content: nextContent,
                isDirty: keepDirty ? tab.isDirty : false,
            }
        }),
    }))
}

export async function rewriteWorkspaceLinksAfterRename(
    workspacePath: string | null,
    fromPath: string,
    toPath: string,
    isDirectory: boolean
) {
    if (!workspacePath) return

    const markdownFiles = await collectMarkdownFiles(workspacePath)

    for (const filePath of markdownFiles) {
        const openTab = useEditorStore
            .getState()
            .tabs.find((tab) => tab.filePath && normalizePath(tab.filePath) === normalizePath(filePath))

        const sourceContent = openTab?.content ?? await readWorkspaceFile(filePath)
        const rewritten = rewriteWikilinksForPathChange({
            content: sourceContent,
            currentFilePath: filePath,
            workspacePath,
            fromPath,
            toPath,
            isDirectory,
        })

        if (!rewritten.changed) continue

        if (openTab?.isDirty) {
            syncOpenTabContent(filePath, rewritten.content, true)
            continue
        }

        await writeWorkspaceFile(filePath, rewritten.content)

        if (openTab) {
            syncOpenTabContent(filePath, rewritten.content, false)
        }
    }
}

export async function renameMarkdownPath(
    fromPath: string,
    nextDisplayName: string,
    options: { isDirectory?: boolean; workspacePath: string | null }
): Promise<string> {
    const isDirectory = options.isDirectory ?? false
    const nextPath = joinPath(
        dirnameFromPath(fromPath),
        ensureMarkdownFileName(nextDisplayName.trim(), isDirectory)
    )

    if (normalizePath(nextPath) === normalizePath(fromPath)) {
        return fromPath
    }

    await rename(fromPath, nextPath)
    syncTabsAfterRename(fromPath, nextPath, isDirectory)
    await rewriteWorkspaceLinksAfterRename(options.workspacePath, fromPath, nextPath, isDirectory)
    return nextPath
}
