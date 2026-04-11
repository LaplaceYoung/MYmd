import { expect, test } from '@playwright/test'
import {
    buildAiUserPrompt,
    getAiTaskPresets,
    requestAiSuggestion,
    verifyAiConnection,
} from '../src/utils/ai'

test('builds an AI user prompt with instruction, markdown, and graph context', () => {
    const prompt = buildAiUserPrompt({
        instruction: 'Turn this into a tighter resume-style document.',
        title: 'Candidate Notes',
        content: '# Draft\n\nAlpha beta',
        graphContext: 'Nodes: Resume, Experience\nEdges:\nResume -> Experience',
    })

    expect(prompt).toContain('Extra instruction: Turn this into a tighter resume-style document.')
    expect(prompt).toContain('Document title: Candidate Notes')
    expect(prompt).toContain('Markdown content:')
    expect(prompt).toContain('# Draft')
    expect(prompt).toContain('Knowledge graph snapshot:')
    expect(prompt).toContain('Resume -> Experience')
})

test('returns mode-specific prompt presets', () => {
    const writingPresets = getAiTaskPresets('writing')
    const polishPresets = getAiTaskPresets('polish')
    const modifyPresets = getAiTaskPresets('modify')
    const layoutPresets = getAiTaskPresets('layout')
    const graphPresets = getAiTaskPresets('graph')

    expect(writingPresets.length).toBeGreaterThan(1)
    expect(polishPresets.some((preset) => /polish|clarity|tone/i.test(preset.label))).toBeTruthy()
    expect(modifyPresets.some((preset) => /edit|adapt|logic/i.test(preset.label))).toBeTruthy()
    expect(layoutPresets.length).toBeGreaterThan(1)
    expect(layoutPresets.some((preset) => /resume/i.test(preset.label))).toBeTruthy()
    expect(graphPresets.some((preset) => /cluster|hub|map/i.test(preset.label))).toBeTruthy()
})

test('verifies AI connection with exact CONNECTION_OK response', async () => {
    const probe = await verifyAiConnection({
        config: {
            endpoint: 'https://example.com/v1/chat/completions',
            apiKey: 'sk-test',
            model: 'probe-model',
        },
        fetcher: async () =>
            new Response(
                JSON.stringify({
                    choices: [{ message: { content: 'CONNECTION_OK' } }],
                }),
                {
                    status: 200,
                    headers: { 'content-type': 'application/json' },
                }
            ),
    })

    expect(probe).toBe('CONNECTION_OK')
})

test('retries once on transient HTTP errors and falls back to JSON response parsing', async () => {
    const responses = [
        new Response('temporary failure', {
            status: 502,
            headers: { 'content-type': 'text/plain' },
        }),
        new Response(
            JSON.stringify({
                choices: [
                    {
                        message: {
                            content: 'Improved markdown output',
                        },
                    },
                ],
            }),
            {
                status: 200,
                headers: { 'content-type': 'application/json' },
            }
        ),
    ]

    let callCount = 0
    const updates: string[] = []

    const result = await requestAiSuggestion({
        config: {
            endpoint: 'https://example.com/v1/chat/completions',
            apiKey: 'sk-test',
            model: 'gpt-test',
        },
        taskMode: 'content',
        instruction: 'Tighten the language.',
        title: 'Draft',
        content: 'Original',
        maxRetries: 1,
        fetcher: async () => {
            const response = responses[callCount]
            callCount += 1
            return response
        },
        onStatus: (message) => updates.push(message),
    })

    expect(callCount).toBe(2)
    expect(result.text).toBe('Improved markdown output')
    expect(result.attempts).toBe(2)
    expect(result.streamed).toBeFalsy()
    expect(updates.some((message) => /retry/i.test(message))).toBeTruthy()
})

test('parses streamed SSE chat completion output into markdown text', async () => {
    const encoder = new TextEncoder()
    const stream = new ReadableStream<Uint8Array>({
        start(controller) {
            controller.enqueue(
                encoder.encode('data: {"choices":[{"delta":{"content":"# Heading\\n"}}]}\n\n')
            )
            controller.enqueue(
                encoder.encode('data: {"choices":[{"delta":{"content":"- bullet"}}]}\n\n')
            )
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
        },
    })

    const chunks: string[] = []

    const result = await requestAiSuggestion({
        config: {
            endpoint: 'https://example.com/v1/chat/completions',
            apiKey: 'sk-test',
            model: 'gpt-test',
        },
        taskMode: 'layout',
        instruction: 'Make it print-ready.',
        title: 'Outline',
        content: 'Alpha',
        fetcher: async () =>
            new Response(stream, {
                status: 200,
                headers: { 'content-type': 'text/event-stream' },
            }),
        onChunk: (chunk) => chunks.push(chunk),
    })

    expect(result.streamed).toBeTruthy()
    expect(result.text).toBe('# Heading\n- bullet')
    expect(chunks).toEqual(['# Heading\n', '- bullet'])
})

test('parses Responses API JSON output_text payload', async () => {
    const result = await requestAiSuggestion({
        config: {
            endpoint: 'https://example.com/v1/responses',
            apiKey: 'sk-test',
            model: 'gpt-test',
        },
        taskMode: 'content',
        instruction: 'Rewrite this.',
        title: 'Draft',
        content: 'Original',
        fetcher: async () =>
            new Response(
                JSON.stringify({
                    output_text: 'Responses API final markdown',
                }),
                {
                    status: 200,
                    headers: { 'content-type': 'application/json' },
                }
            ),
    })

    expect(result.streamed).toBeFalsy()
    expect(result.text).toBe('Responses API final markdown')
})

test('parses Responses API SSE output_text delta events', async () => {
    const encoder = new TextEncoder()
    const stream = new ReadableStream<Uint8Array>({
        start(controller) {
            controller.enqueue(
                encoder.encode('data: {"type":"response.output_text.delta","delta":"Line A\\n"}\n\n')
            )
            controller.enqueue(
                encoder.encode('data: {"type":"response.output_text.delta","delta":"Line B"}\n\n')
            )
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
        },
    })

    const chunks: string[] = []
    const result = await requestAiSuggestion({
        config: {
            endpoint: 'https://example.com/v1/responses',
            apiKey: 'sk-test',
            model: 'gpt-test',
        },
        taskMode: 'layout',
        instruction: 'format',
        title: 'Doc',
        content: 'Body',
        fetcher: async () =>
            new Response(stream, {
                status: 200,
                headers: { 'content-type': 'text/event-stream' },
            }),
        onChunk: (chunk) => chunks.push(chunk),
    })

    expect(result.streamed).toBeTruthy()
    expect(result.text).toBe('Line A\nLine B')
    expect(chunks).toEqual(['Line A\n', 'Line B'])
})
