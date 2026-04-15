export type MediaEmbedKind = 'audio' | 'video' | 'embed'

interface MediaEmbedPayload {
    src: string
    title?: string
}

interface ParsedMediaEmbed {
    kind: MediaEmbedKind
    src: string
    title: string
}

const EMBED_HOST_WHITELIST = [
    'youtube.com',
    'www.youtube.com',
    'youtu.be',
    'player.bilibili.com',
    'bilibili.com',
    'www.bilibili.com',
    'vimeo.com',
    'player.vimeo.com',
]

function escapeHtmlAttribute(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
}

export function isAllowedEmbedUrl(source: string) {
    try {
        const url = new URL(source)
        if (!['http:', 'https:'].includes(url.protocol)) {
            return false
        }
        return EMBED_HOST_WHITELIST.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`))
    } catch {
        return false
    }
}

export function buildMediaEmbedSnippet(kind: MediaEmbedKind, payload: MediaEmbedPayload) {
    const src = payload.src.trim()
    const title = payload.title?.trim() || ''
    if (!src) return ''

    const safeSrc = escapeHtmlAttribute(src)
    const safeTitle = escapeHtmlAttribute(title)

    if (kind === 'audio') {
        return `<audio controls src="${safeSrc}">${safeTitle || 'Your browser does not support audio playback.'}</audio>`
    }

    if (kind === 'video') {
        return `<video controls preload="metadata" src="${safeSrc}">${safeTitle || 'Your browser does not support video playback.'}</video>`
    }

    return `<iframe src="${safeSrc}" title="${safeTitle || 'Embedded content'}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin allow-presentation" allowfullscreen></iframe>`
}

function parseAttribute(tagContent: string, key: string) {
    const matcher = new RegExp(`${key}\\s*=\\s*\"([^\"]+)\"`, 'i')
    const match = tagContent.match(matcher)
    return match?.[1]?.trim() || ''
}

export function extractMediaEmbedFromText(source: string): ParsedMediaEmbed | null {
    const normalized = source.trim()
    if (!normalized) return null

    const audioMatch = normalized.match(/^<audio\b([^>]*)>/i)
    if (audioMatch) {
        const attrs = audioMatch[1] || ''
        const src = parseAttribute(attrs, 'src')
        if (!src) return null
        return {
            kind: 'audio',
            src,
            title: parseAttribute(attrs, 'title'),
        }
    }

    const videoMatch = normalized.match(/^<video\b([^>]*)>/i)
    if (videoMatch) {
        const attrs = videoMatch[1] || ''
        const src = parseAttribute(attrs, 'src')
        if (!src) return null
        return {
            kind: 'video',
            src,
            title: parseAttribute(attrs, 'title'),
        }
    }

    const iframeMatch = normalized.match(/^<iframe\b([^>]*)>/i)
    if (iframeMatch) {
        const attrs = iframeMatch[1] || ''
        const src = parseAttribute(attrs, 'src')
        if (!src) return null
        return {
            kind: 'embed',
            src,
            title: parseAttribute(attrs, 'title'),
        }
    }

    return null
}
