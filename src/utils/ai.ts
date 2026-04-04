export type AiTaskMode = 'layout' | 'content' | 'graph'

export interface AiConfigInput {
    endpoint: string
    apiKey: string
    model: string
}

export interface AiPromptPreset {
    id: string
    label: string
    instruction: string
}

interface ChatContentPart {
    type?: string
    text?: string
}

interface ChatCompletionResponse {
    choices?: Array<{
        message?: {
            content?: string | ChatContentPart[]
        }
    }>
}

interface ChatCompletionStreamResponse {
    choices?: Array<{
        delta?: {
            content?: string | ChatContentPart[]
        }
        message?: {
            content?: string | ChatContentPart[]
        }
    }>
}

export interface RequestAiSuggestionInput {
    config: AiConfigInput
    taskMode: AiTaskMode
    instruction: string
    title: string
    content: string
    graphContext?: string
    timeoutMs?: number
    maxRetries?: number
    preferStreaming?: boolean
    fetcher?: typeof fetch
    onStatus?: (message: string) => void
    onChunk?: (chunk: string, accumulated: string) => void
}

export interface RequestAiSuggestionResult {
    text: string
    attempts: number
    streamed: boolean
}

const AI_PRESETS: Record<AiTaskMode, AiPromptPreset[]> = {
    layout: [
        {
            id: 'layout-resume',
            label: 'Resume Polish',
            instruction: 'Reformat this into a sharper resume-style layout with stronger heading hierarchy, tighter bullet spacing, and print-safe section balance.',
        },
        {
            id: 'layout-print',
            label: 'Print Cleanup',
            instruction: 'Optimize heading breaks, list rhythm, paragraph spacing, and page flow for A4 or Letter export.',
        },
        {
            id: 'layout-brief',
            label: 'Briefing Mode',
            instruction: 'Turn this into an executive briefing layout with clear sections, callouts, and scannable structure.',
        },
    ],
    content: [
        {
            id: 'content-tighten',
            label: 'Tighten Copy',
            instruction: 'Tighten the language, reduce redundancy, and keep the meaning unchanged.',
        },
        {
            id: 'content-product',
            label: 'Product Narrative',
            instruction: 'Rewrite this as a stronger product-facing narrative with clearer user value and sharper positioning.',
        },
        {
            id: 'content-clarify',
            label: 'Clarify Logic',
            instruction: 'Improve flow, transitions, and argument structure without adding new facts.',
        },
    ],
    graph: [
        {
            id: 'graph-hub',
            label: 'Build Hub',
            instruction: 'Suggest a hub note structure, missing wiki links, and better cross-note navigation.',
        },
        {
            id: 'graph-cluster',
            label: 'Topic Cluster',
            instruction: 'Identify topic clusters, related notes, and candidate backlinks that should exist.',
        },
        {
            id: 'graph-map',
            label: 'Knowledge Map',
            instruction: 'Restructure this note to fit a clearer knowledge map with stronger links, note splits, and reference paths.',
        },
    ],
}

export function getAiTaskPresets(mode: AiTaskMode): AiPromptPreset[] {
    return AI_PRESETS[mode] ?? AI_PRESETS.content
}

export function buildSystemPrompt(mode: AiTaskMode) {
    if (mode === 'layout') {
        return 'You are a senior Markdown editor. Improve document structure and formatting for print, export, and long-form readability. Return Markdown only.'
    }
    if (mode === 'graph') {
        return 'You are a local knowledge-base assistant. Improve note structure, internal links, topic clusters, and related-node suggestions. Prefer wiki links when helpful. Return Markdown only.'
    }
    return 'You are a senior writing assistant. Improve clarity, flow, tone, and structure while preserving facts. Return Markdown only.'
}

function collectAssistantText(content?: string | ChatContentPart[], trim = true) {
    if (typeof content === 'string') return trim ? content.trim() : content
    if (!Array.isArray(content)) return ''
    const text = content
        .map(item => (item?.type === 'text' || !item?.type ? item.text ?? '' : ''))
        .join('\n')
    return trim ? text.trim() : text
}

export function normalizeAssistantText(content?: string | ChatContentPart[]) {
    return collectAssistantText(content, true)
}

export function buildAiUserPrompt(input: {
    instruction: string
    title: string
    content: string
    graphContext?: string
}) {
    const graphContext = input.graphContext?.trim()
    const graphSection = graphContext
        ? graphContext.startsWith('Knowledge graph snapshot:')
            ? graphContext
            : `Knowledge graph snapshot:\n${graphContext}`
        : ''

    return [
        `Extra instruction: ${input.instruction.trim() || 'None. Improve based on mode.'}`,
        'Return Markdown only. Do not add explanations.',
        '',
        `Document title: ${input.title}`,
        '',
        'Markdown content:',
        input.content,
        graphSection,
    ]
        .filter(Boolean)
        .join('\n')
}

function isRetryableStatus(status: number) {
    return status === 408 || status === 429 || status >= 500
}

function isAbortError(error: unknown) {
    return (
        (error instanceof DOMException && error.name === 'AbortError') ||
        (error instanceof Error && error.name === 'AbortError')
    )
}

function sleep(ms: number) {
    return new Promise(resolve => globalThis.setTimeout(resolve, ms))
}

function extractStreamChunkText(payload: ChatCompletionStreamResponse) {
    const choice = payload.choices?.[0]
    return collectAssistantText(choice?.delta?.content ?? choice?.message?.content, false)
}

async function readEventStream(
    response: Response,
    onChunk?: (chunk: string, accumulated: string) => void
) {
    const reader = response.body?.getReader()
    if (!reader) {
        throw new Error('AI streaming response body is unavailable')
    }

    const decoder = new TextDecoder()
    let buffer = ''
    let accumulated = ''

    const processEvent = (rawEvent: string) => {
        const lines = rawEvent.split(/\r?\n/)
        for (const line of lines) {
            if (!line.startsWith('data:')) continue
            const payload = line.slice(5).trim()
            if (!payload) continue
            if (payload === '[DONE]') {
                return true
            }
            const parsed = JSON.parse(payload) as ChatCompletionStreamResponse
            const chunk = extractStreamChunkText(parsed)
            if (!chunk) continue
            accumulated += chunk
            onChunk?.(chunk, accumulated)
        }
        return false
    }

    while (true) {
        const { done, value } = await reader.read()
        buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done })

        let boundary = buffer.indexOf('\n\n')
        while (boundary >= 0) {
            const event = buffer.slice(0, boundary)
            buffer = buffer.slice(boundary + 2)
            if (processEvent(event)) {
                return accumulated.trim()
            }
            boundary = buffer.indexOf('\n\n')
        }

        if (done) {
            if (buffer.trim()) {
                processEvent(buffer)
            }
            return accumulated.trim()
        }
    }
}

function getFetcher(fetcher?: typeof fetch) {
    if (fetcher) return fetcher
    if (typeof fetch === 'function') return fetch
    throw new Error('Fetch is not available in this environment')
}

export async function requestAiSuggestion(
    input: RequestAiSuggestionInput
): Promise<RequestAiSuggestionResult> {
    const fetcher = getFetcher(input.fetcher)
    const timeoutMs = Math.max(5_000, input.timeoutMs ?? 45_000)
    const preferStreaming = input.preferStreaming ?? true
    const totalAttempts = Math.max(1, (input.maxRetries ?? 1) + 1)

    for (let attempt = 1; attempt <= totalAttempts; attempt += 1) {
        input.onStatus?.(
            attempt === 1
                ? 'Sending request...'
                : `Retrying request (${attempt}/${totalAttempts})...`
        )

        const controller = new AbortController()
        const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs)

        try {
            const response = await fetcher(input.config.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${input.config.apiKey.trim()}`,
                },
                body: JSON.stringify({
                    model: input.config.model,
                    temperature: 0.4,
                    stream: preferStreaming,
                    messages: [
                        { role: 'system', content: buildSystemPrompt(input.taskMode) },
                        {
                            role: 'user',
                            content: buildAiUserPrompt({
                                instruction: input.instruction,
                                title: input.title,
                                content: input.content,
                                graphContext: input.graphContext,
                            }),
                        },
                    ],
                }),
                signal: controller.signal,
            })

            if (!response.ok) {
                const message = `AI request failed: ${response.status}`
                if (attempt < totalAttempts && isRetryableStatus(response.status)) {
                    input.onStatus?.(`${message}. Retrying...`)
                    await sleep(300 * attempt)
                    continue
                }
                throw new Error(message)
            }

            const contentType = response.headers.get('content-type') ?? ''
            if (contentType.includes('text/event-stream')) {
                input.onStatus?.('Streaming response...')
                const text = await readEventStream(response, input.onChunk)
                if (!text) {
                    throw new Error('AI returned empty content')
                }
                input.onStatus?.('Streaming complete.')
                return {
                    text,
                    attempts: attempt,
                    streamed: true,
                }
            }

            const payload = (await response.json()) as ChatCompletionResponse
            const text = normalizeAssistantText(payload.choices?.[0]?.message?.content)
            if (!text) {
                throw new Error('AI returned empty content')
            }

            input.onStatus?.('Generation complete.')
            return {
                text,
                attempts: attempt,
                streamed: false,
            }
        } catch (error) {
            const isTimeout = isAbortError(error)
            const message = isTimeout
                ? `AI request timed out after ${Math.round(timeoutMs / 1000)}s`
                : error instanceof Error
                    ? error.message
                    : 'AI request failed'

            if (attempt < totalAttempts) {
                input.onStatus?.(`${message}. Retrying...`)
                await sleep(300 * attempt)
                continue
            }

            throw new Error(message)
        } finally {
            globalThis.clearTimeout(timeoutId)
        }
    }

    throw new Error('AI request failed')
}
