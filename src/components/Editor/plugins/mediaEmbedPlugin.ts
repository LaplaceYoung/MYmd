import { Plugin, PluginKey } from '@milkdown/kit/prose/state'
import { Decoration, DecorationSet } from '@milkdown/kit/prose/view'
import type { EditorState } from '@milkdown/kit/prose/state'
import { extractMediaEmbedFromText, isAllowedEmbedUrl } from '@/utils/mediaEmbeds'

const mediaEmbedPluginKey = new PluginKey('media-embed-plugin')

function createEmbedPreviewElement(rawLine: string) {
    const parsed = extractMediaEmbedFromText(rawLine)
    if (!parsed) return null

    const wrapper = document.createElement('div')
    wrapper.className = `media-embed-preview media-embed-preview--${parsed.kind}`

    if (parsed.kind === 'audio') {
        const audio = document.createElement('audio')
        audio.controls = true
        audio.preload = 'metadata'
        audio.src = parsed.src
        wrapper.appendChild(audio)
        return wrapper
    }

    if (parsed.kind === 'video') {
        const video = document.createElement('video')
        video.controls = true
        video.preload = 'metadata'
        video.src = parsed.src
        video.style.width = '100%'
        video.style.maxWidth = '100%'
        video.style.borderRadius = '10px'
        wrapper.appendChild(video)
        return wrapper
    }

    if (!isAllowedEmbedUrl(parsed.src)) {
        const warning = document.createElement('div')
        warning.className = 'media-embed-preview__warning'
        warning.textContent = 'Embed blocked: URL is not in the trusted host whitelist.'
        wrapper.appendChild(warning)
        return wrapper
    }

    const iframe = document.createElement('iframe')
    iframe.src = parsed.src
    iframe.title = parsed.title || 'Embedded content'
    iframe.loading = 'lazy'
    iframe.allowFullscreen = true
    iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin')
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation')
    wrapper.appendChild(iframe)
    return wrapper
}

function extractMediaTagSnippets(rawText: string) {
    const tagPattern = /<audio\b[^>]*>[\s\S]*?<\/audio>|<video\b[^>]*>[\s\S]*?<\/video>|<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi
    const matches = rawText.match(tagPattern)
    return matches ?? []
}

function buildMediaEmbedDecorations(state: EditorState) {
    const decorations: Decoration[] = []

    state.doc.descendants((node, pos) => {
        if (!node.isTextblock) return true

        const text = node.textContent?.trim()
        if (!text) return true

        const snippets = extractMediaTagSnippets(text)
        if (snippets.length === 0) return true

        const widget = Decoration.widget(pos + node.nodeSize, () => {
            const stack = document.createElement('div')
            stack.className = 'media-embed-preview-stack'

            snippets.forEach((snippet) => {
                const element = createEmbedPreviewElement(snippet)
                if (element) {
                    stack.appendChild(element)
                }
            })

            if (stack.childElementCount === 0) {
                const fallback = document.createElement('div')
                fallback.className = 'media-embed-preview media-embed-preview--invalid'
                fallback.textContent = 'Media preview unavailable'
                return fallback
            }
            return stack
        }, { side: 1, block: true })

        decorations.push(widget)
        return true
    })

    return DecorationSet.create(state.doc, decorations)
}

export function createMediaEmbedPlugin() {
    return new Plugin({
        key: mediaEmbedPluginKey,
        state: {
            init(_, state) {
                return buildMediaEmbedDecorations(state)
            },
            apply(tr, oldDecorations, _oldState, newState) {
                if (tr.docChanged || tr.selectionSet) {
                    return buildMediaEmbedDecorations(newState)
                }
                return oldDecorations
            }
        },
        props: {
            decorations(state) {
                return this.getState(state)
            }
        }
    })
}
