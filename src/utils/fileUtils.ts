import { readFile, writeFile, mkdir, exists } from '@tauri-apps/plugin-fs'
import { buildLocalAssetFileName, buildLocalAssetRelativePath, LOCAL_ASSETS_DIR_NAME } from '@/utils/localAssets'

async function ensureDir(dirPath: string) {
    if (!await exists(dirPath)) {
        await mkdir(dirPath, { recursive: true })
    }
}

function getParentDir(filePath: string): string | null {
    const lastSlashIndex = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'))
    if (lastSlashIndex === -1) return null
    return filePath.substring(0, lastSlashIndex)
}

async function writeImageBytesToLocalAssets(
    fileData: Uint8Array,
    activeTabFilePath: string,
    preferredName?: string,
    mimeType?: string
): Promise<string | null> {
    if (!activeTabFilePath) {
        console.warn('Current document has not been saved yet. Cannot determine relative path.')
        return null
    }

    try {
        const docDir = getParentDir(activeTabFilePath)
        if (!docDir) return null

        const assetsDir = `${docDir}/${LOCAL_ASSETS_DIR_NAME}`
        await ensureDir(assetsDir)

        const fileName = buildLocalAssetFileName(fileData, preferredName, mimeType)
        const targetPath = `${assetsDir}/${fileName}`
        await writeFile(targetPath, fileData)

        return buildLocalAssetRelativePath(fileName)
    } catch (e) {
        console.error('Failed to persist image into local assets:', e)
        return null
    }
}

export async function copyImageToLocalAssets(sourceImgPath: string, activeTabFilePath: string): Promise<string | null> {
    try {
        const fileData = await readFile(sourceImgPath)
        const preferredName = sourceImgPath.split(/[\\/]/).pop()
        return await writeImageBytesToLocalAssets(fileData, activeTabFilePath, preferredName)
    } catch (e) {
        console.error('Failed to copy image:', e)
        return null
    }
}

export async function saveBlobImageToLocalAssets(
    blob: Blob,
    activeTabFilePath: string,
    preferredName?: string
): Promise<string | null> {
    try {
        const fileData = new Uint8Array(await blob.arrayBuffer())
        return await writeImageBytesToLocalAssets(fileData, activeTabFilePath, preferredName, blob.type)
    } catch (e) {
        console.error('Failed to save clipboard image:', e)
        return null
    }
}
