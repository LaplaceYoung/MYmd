import { readFile, writeFile, mkdir, exists } from '@tauri-apps/plugin-fs'

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

function sanitizeFileSegment(value: string): string {
    return value
        .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
        .replace(/\s+/g, '-')
        .trim()
}

function extensionFromMime(mimeType?: string): string | null {
    switch ((mimeType || '').toLowerCase()) {
        case 'image/png':
            return 'png'
        case 'image/jpeg':
            return 'jpg'
        case 'image/gif':
            return 'gif'
        case 'image/webp':
            return 'webp'
        case 'image/svg+xml':
            return 'svg'
        case 'image/bmp':
            return 'bmp'
        default:
            return null
    }
}

function buildAssetFileName(preferredName?: string, mimeType?: string): string {
    const originalName = preferredName?.trim() || ''
    const baseName = originalName.replace(/\.[^.]+$/, '')
    const sanitizedBase = sanitizeFileSegment(baseName) || 'image'
    const explicitExt = originalName.includes('.') ? originalName.split('.').pop()?.toLowerCase() : null
    const ext = explicitExt || extensionFromMime(mimeType) || 'png'
    const stamp = `${Date.now()}-${Math.floor(Math.random() * 1000)}`
    return `${sanitizedBase}-${stamp}.${ext}`
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

        const assetsDir = `${docDir}/assets`
        await ensureDir(assetsDir)

        const fileName = buildAssetFileName(preferredName, mimeType)
        const targetPath = `${assetsDir}/${fileName}`
        await writeFile(targetPath, fileData)

        return `assets/${fileName}`
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
