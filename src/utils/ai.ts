export type AiTaskMode = 'writing' | 'polish' | 'modify' | 'layout' | 'graph' | 'content'

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

export type AiOutputShape = 'full' | 'outline'

interface ChatContentPart {
    type?: string
    text?: string
}

type AiEndpointMode = 'chat_completions' | 'responses'

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

interface ResponsesApiResponse {
    output_text?: string
    output?: Array<{
        content?: Array<{
            type?: string
            text?: string
        }>
    }>
}

export interface RequestAiSuggestionInput {
    config: AiConfigInput
    taskMode: AiTaskMode
    outputShape?: AiOutputShape
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

export interface VerifyAiConnectionInput {
    config: AiConfigInput
    fetcher?: typeof fetch
    timeoutMs?: number
}

const AI_PRESETS: Record<AiTaskMode, AiPromptPreset[]> = {
    writing: [
        {
            id: 'writing-outline',
            label: 'From Outline',
            instruction: 'Expand the current outline into a complete, clear, and coherent draft with natural transitions.',
        },
        {
            id: 'writing-business',
            label: 'Business Draft',
            instruction: 'Rewrite this into a concise business-style draft with explicit objective, actions, and expected outcome.',
        },
        {
            id: 'writing-structured',
            label: 'Structured Draft',
            instruction: 'Convert this into a well-structured Markdown article with H2/H3 sections and actionable bullet points.',
        },
    ],
    polish: [
        {
            id: 'polish-tone',
            label: 'Tone Polish',
            instruction: 'Polish tone and wording to sound more professional and natural while preserving original facts.',
        },
        {
            id: 'polish-clarity',
            label: 'Clarity Polish',
            instruction: 'Improve readability, sentence rhythm, and transitions while keeping the same meaning.',
        },
        {
            id: 'polish-concise',
            label: 'Concise Polish',
            instruction: 'Tighten verbose phrases and remove repetition while keeping key information complete.',
        },
    ],
    modify: [
        {
            id: 'modify-action',
            label: 'Targeted Edit',
            instruction: 'Perform a targeted modification based on the instruction and keep all unrelated sections unchanged.',
        },
        {
            id: 'modify-audience',
            label: 'Audience Adapt',
            instruction: 'Revise content for the specified audience and keep source facts unchanged.',
        },
        {
            id: 'modify-logic',
            label: 'Logic Repair',
            instruction: 'Fix weak logic and ambiguous references, and improve argument consistency.',
        },
    ],
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
    if (mode === 'content') {
        return AI_PRESETS.writing
    }
    return AI_PRESETS[mode] ?? AI_PRESETS.writing
}

export function buildSystemPrompt(mode: AiTaskMode, outputShape: AiOutputShape = 'full') {
    const outlineSuffix = outputShape === 'outline'
        ? ' Return an outline only. Use Markdown headings and bullet points. Do not write full paragraphs.'
        : ''

    if (mode === 'writing' || mode === 'content') {
        return `You are a senior writing assistant. Draft complete, coherent Markdown content based on user instructions while preserving given facts. Return Markdown only.${outlineSuffix}`
    }
    if (mode === 'polish') {
        return `You are a senior editorial assistant. Polish language, tone, and readability while preserving meaning and factual integrity. Return Markdown only.${outlineSuffix}`
    }
    if (mode === 'modify') {
        return `You are a senior Markdown editor. Execute targeted revisions requested by the user and avoid changing unrelated parts. Return Markdown only.${outlineSuffix}`
    }
    if (mode === 'layout') {
        return `You are a senior Markdown editor. Improve document structure and formatting for print, export, and long-form readability. Return Markdown only.${outlineSuffix}`
    }
    if (mode === 'graph') {
        return `You are a local knowledge-base assistant. Improve note structure, internal links, topic clusters, and related-node suggestions. Prefer wiki links when helpful. Return Markdown only.${outlineSuffix}`
    }
    return `You are a senior writing assistant. Improve clarity, flow, tone, and structure while preserving facts. Return Markdown only.${outlineSuffix}`
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

function detectEndpointMode(endpoint: string): AiEndpointMode {
    const normalized = endpoint.toLowerCase()
    if (normalized.includes('/responses')) return 'responses'
    return 'chat_completions'
}

function buildChatMessages(input: RequestAiSuggestionInput) {
    return [
        { role: 'system', content: buildSystemPrompt(input.taskMode, input.outputShape ?? 'full') },
        {
            role: 'user',
            content: buildAiUserPrompt({
                instruction: input.instruction,
                title: input.title,
                content: input.content,
                graphContext: input.graphContext,
                outputShape: input.outputShape ?? 'full',
            }),
        },
    ]
}

function buildRequestPayload(
    input: RequestAiSuggestionInput,
    mode: AiEndpointMode,
    stream: boolean
) {
    const messages = buildChatMessages(input)

    if (mode === 'responses') {
        return {
            model: input.config.model,
            temperature: 0.4,
            stream,
            input: messages.map(message => ({
                role: message.role,
                content: [{ type: 'input_text', text: String(message.content ?? '') }],
            })),
        }
    }

    return {
        model: input.config.model,
        temperature: 0.4,
        stream,
        messages,
    }
}

export function buildAiUserPrompt(input: {
    instruction: string
    title: string
    content: string
    graphContext?: string
    outputShape?: AiOutputShape
}) {
    const graphContext = input.graphContext?.trim()
    const outputShape = input.outputShape ?? 'full'
    const graphSection = graphContext
        ? graphContext.startsWith('Knowledge graph snapshot:')
            ? graphContext
            : `Knowledge graph snapshot:\n${graphContext}`
        : ''
    const outputSection = outputShape === 'outline'
        ? [
            'Output shape: outline only',
            'Use nested Markdown headings and bullet points.',
            'Do not write full paragraphs unless the source already requires them.',
        ].join('\n')
        : 'Output shape: full draft'

    return [
        `Extra instruction: ${input.instruction.trim() || 'None. Improve based on mode.'}`,
        'Return Markdown only. Do not add explanations.',
        outputSection,
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

function normalizeUnknownText(value: unknown): string {
    if (typeof value === 'string') return value
    if (Array.isArray(value)) {
        return value
            .map(item => {
                if (typeof item === 'string') return item
                if (item && typeof item === 'object' && 'text' in item) {
                    return normalizeUnknownText((item as { text?: unknown }).text)
                }
                return ''
            })
            .join('')
    }
    if (value && typeof value === 'object' && 'text' in value) {
        return normalizeUnknownText((value as { text?: unknown }).text)
    }
    return ''
}

function extractResponsesOutputText(payload: ResponsesApiResponse | Record<string, unknown>) {
    const outputText = normalizeUnknownText(payload.output_text)
    if (outputText.trim()) {
        return outputText.trim()
    }

    const output = Array.isArray(payload.output) ? payload.output : []
    const chunks: string[] = []
    for (const item of output) {
        const content = Array.isArray(item?.content) ? item.content : []
        for (const part of content) {
            const text = normalizeUnknownText(part?.text)
            if (text) chunks.push(text)
        }
    }

    return chunks.join('\n').trim()
}

function extractAnthropicLikeText(payload: Record<string, unknown>) {
    const content = payload.content
    if (Array.isArray(content)) {
        const text = content
            .map(item => {
                if (!item || typeof item !== 'object') return ''
                return normalizeUnknownText((item as { text?: unknown }).text)
            })
            .join('\n')
            .trim()
        if (text) return text
    }
    return ''
}

function extractGeminiLikeText(payload: Record<string, unknown>) {
    const candidates = Array.isArray(payload.candidates) ? payload.candidates : []
    for (const candidate of candidates) {
        if (!candidate || typeof candidate !== 'object') continue
        const content = (candidate as { content?: { parts?: Array<{ text?: unknown }> } }).content
        const parts = Array.isArray(content?.parts) ? content.parts : []
        const text = parts.map(part => normalizeUnknownText(part?.text)).join('').trim()
        if (text) return text
    }
    return ''
}

function extractSingleResponseText(payload: Record<string, unknown>): string {
    const asChat = payload as unknown as ChatCompletionResponse
    const chatText = normalizeAssistantText(asChat.choices?.[0]?.message?.content)
    if (chatText) return chatText

    const asResponses = extractResponsesOutputText(payload)
    if (asResponses) return asResponses

    const anthropicLike = extractAnthropicLikeText(payload)
    if (anthropicLike) return anthropicLike

    const geminiLike = extractGeminiLikeText(payload)
    if (geminiLike) return geminiLike

    return ''
}

function extractStreamChunkText(payload: Record<string, unknown>) {
    const choice = (payload as ChatCompletionStreamResponse).choices?.[0]
    const chatChunk = collectAssistantText(choice?.delta?.content ?? choice?.message?.content, false)
    if (chatChunk) return chatChunk

    const type = typeof payload.type === 'string' ? payload.type : ''
    if (type.includes('output_text.delta')) {
        const delta = normalizeUnknownText((payload as { delta?: unknown }).delta)
        if (delta) return delta
    }

    if (type.includes('message.delta')) {
        const delta = normalizeUnknownText((payload as { delta?: unknown }).delta)
        if (delta) return delta
    }

    const outputTextDelta = normalizeUnknownText(
        (payload as { output_text?: { delta?: unknown } }).output_text?.delta
    )
    if (outputTextDelta) return outputTextDelta

    const deltaText = normalizeUnknownText(
        (payload as { delta?: { text?: unknown } }).delta?.text
    )
    if (deltaText) return deltaText

    return ''
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
        let payloadBuffer = ''
        for (const line of lines) {
            if (!line || line.startsWith(':')) continue
            if (!line.startsWith('data:')) continue
            const payload = line.slice(5).trim()
            if (!payload) continue
            if (payload === '[DONE]') {
                return true
            }
            payloadBuffer = payloadBuffer
                ? `${payloadBuffer}\n${payload}`
                : payload
        }

        if (!payloadBuffer) return false

        try {
            const parsed = JSON.parse(payloadBuffer) as Record<string, unknown>
            const chunk = extractStreamChunkText(parsed)
            if (chunk) {
                accumulated += chunk
                onChunk?.(chunk, accumulated)
            }
        } catch {
            // ignore malformed SSE frames from non-standard providers
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
    let streamEnabled = input.preferStreaming ?? true
    const totalAttempts = Math.max(1, (input.maxRetries ?? 1) + 1)
    const endpointMode = detectEndpointMode(input.config.endpoint)

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
                body: JSON.stringify(buildRequestPayload(input, endpointMode, streamEnabled)),
                signal: controller.signal,
            })

            if (!response.ok) {
                const message = `AI request failed: ${response.status}`
                if (
                    streamEnabled &&
                    (response.status === 400 || response.status === 404 || response.status === 405 || response.status === 422)
                ) {
                    streamEnabled = false
                    input.onStatus?.(`${message}. Falling back to non-stream mode...`)
                    continue
                }
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
                    if (streamEnabled) {
                        streamEnabled = false
                        input.onStatus?.('Streaming yielded empty content. Retrying without stream...')
                        continue
                    }
                    throw new Error('AI returned empty content')
                }
                input.onStatus?.('Streaming complete.')
                return {
                    text,
                    attempts: attempt,
                    streamed: true,
                }
            }

            const payload = (await response.json()) as Record<string, unknown>
            const text = extractSingleResponseText(payload)
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

export async function verifyAiConnection(input: VerifyAiConnectionInput): Promise<string> {
    const result = await requestAiSuggestion({
        config: input.config,
        taskMode: 'writing',
        instruction: 'Return exactly: CONNECTION_OK',
        title: 'Connection Check',
        content: 'Return exactly: CONNECTION_OK',
        timeoutMs: input.timeoutMs ?? 20_000,
        maxRetries: 0,
        preferStreaming: false,
        fetcher: input.fetcher,
    })
    return result.text.trim()
}
