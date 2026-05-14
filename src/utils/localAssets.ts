const IMAGE_EXTENSION_BY_MIME: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'image/bmp': 'bmp',
}

const SAFE_IMAGE_EXTENSIONS = new Set(Object.values(IMAGE_EXTENSION_BY_MIME))
const MAX_ASSET_BASE_LENGTH = 48

export const LOCAL_ASSETS_DIR_NAME = 'assets'

export function sanitizeAssetBaseName(value: string): string {
    const fileName = value.split(/[\\/]/).pop() ?? value
    const sanitized = fileName
        .replace(/\.[^.]+$/, '')
        .replace(/\.+/g, '-')
        .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
        .trim()

    return (sanitized || 'image').slice(0, MAX_ASSET_BASE_LENGTH)
}

export function imageExtensionFromMime(mimeType?: string): string | null {
    return IMAGE_EXTENSION_BY_MIME[(mimeType || '').toLowerCase()] ?? null
}

function safeImageExtension(preferredName?: string, mimeType?: string): string {
    const explicitExtension = preferredName?.includes('.')
        ? preferredName.split('.').pop()?.toLowerCase()
        : null

    if (explicitExtension && SAFE_IMAGE_EXTENSIONS.has(explicitExtension)) {
        return explicitExtension
    }

    return imageExtensionFromMime(mimeType) ?? 'png'
}

function hashBytes(fileData: Uint8Array): string {
    let hash = 0x811c9dc5
    for (const byte of fileData) {
        hash ^= byte
        hash = Math.imul(hash, 0x01000193) >>> 0
    }

    return hash.toString(36).padStart(7, '0')
}

export function buildLocalAssetFileName(
    fileData: Uint8Array,
    preferredName?: string,
    mimeType?: string
): string {
    const baseName = sanitizeAssetBaseName(preferredName?.trim() || '')
    const extension = safeImageExtension(preferredName, mimeType)
    return `${baseName}-${hashBytes(fileData)}.${extension}`
}

export function buildLocalAssetRelativePath(fileName: string): string {
    return `${LOCAL_ASSETS_DIR_NAME}/${fileName}`
}
