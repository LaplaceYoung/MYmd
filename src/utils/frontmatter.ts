export interface FrontmatterProperty {
    key: string
    value: string
}

export interface FrontmatterExtraction {
    bodyMarkdown: string
    properties: FrontmatterProperty[]
}

const FRONTMATTER_PATTERN = /^\uFEFF?---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/
const PROPERTY_PATTERN = /^([A-Za-z0-9_.-]+):\s*(.*)$/

function escapeHtml(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

function normalizePropertyValue(value: string) {
    const trimmed = value.trim()
    if (!trimmed) return ''

    const unquoted = trimmed.replace(/^(['"])(.*)\1$/, '$2')
    if (unquoted.startsWith('[') && unquoted.endsWith(']')) {
        return unquoted
            .slice(1, -1)
            .split(',')
            .map(part => part.trim().replace(/^(['"])(.*)\1$/, '$2'))
            .filter(Boolean)
            .join(', ')
    }

    return unquoted
}

export function extractFrontmatter(markdown: string): FrontmatterExtraction {
    const match = markdown.match(FRONTMATTER_PATTERN)
    if (!match) {
        return {
            bodyMarkdown: markdown,
            properties: [],
        }
    }

    const rawProperties = match[1] ?? ''
    const properties = rawProperties
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'))
        .map(line => {
            const property = line.match(PROPERTY_PATTERN)
            if (!property) return null

            return {
                key: property[1],
                value: normalizePropertyValue(property[2] ?? ''),
            }
        })
        .filter((property): property is FrontmatterProperty => property !== null)

    return {
        bodyMarkdown: markdown.slice(match[0].length).replace(/^\r?\n/, ''),
        properties,
    }
}

export function renderFrontmatterPropertiesHtml(properties: FrontmatterProperty[]) {
    if (properties.length === 0) return ''

    const rows = properties
        .map(property => `
            <div class="frontmatter-properties__row">
                <dt>${escapeHtml(property.key)}</dt>
                <dd>${escapeHtml(property.value)}</dd>
            </div>
        `.trim())
        .join('')

    return `
        <aside class="frontmatter-properties" aria-label="Document properties">
            <div class="frontmatter-properties__title">Properties</div>
            <dl>${rows}</dl>
        </aside>
    `.trim()
}

export function prepareFrontmatterForRender(markdown: string) {
    const extraction = extractFrontmatter(markdown)
    return {
        bodyMarkdown: extraction.bodyMarkdown,
        frontmatterHtml: renderFrontmatterPropertiesHtml(extraction.properties),
        properties: extraction.properties,
    }
}
