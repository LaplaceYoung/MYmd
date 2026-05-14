import { expect, test } from '@playwright/test'
import { extractTags, extractWikilinks, rewriteWikilinksForPathChange } from '../src/knowledge/parser'

test('rewrites same-directory wikilinks when a file is renamed', () => {
    const content = [
        '# Index',
        'See [[Alpha]] and [[Alpha#Plan|project plan]].',
        'Keep [[Beta]] untouched.'
    ].join('\n')

    const result = rewriteWikilinksForPathChange({
        content,
        currentFilePath: 'F:/vault/notes/Index.md',
        workspacePath: 'F:/vault',
        fromPath: 'F:/vault/notes/Alpha.md',
        toPath: 'F:/vault/notes/Product Alpha.md',
        isDirectory: false
    })

    expect(result.changed).toBeTruthy()
    expect(result.content).toContain('[[Product Alpha]]')
    expect(result.content).toContain('[[Product Alpha#Plan|project plan]]')
    expect(result.content).toContain('[[Beta]]')
})

test('extracts inline and nested tags while skipping markdown headings', () => {
    const tags = extractTags([
        '# Project Overview',
        '',
        '#project #project/roadmap #Project',
        'Keep #writing-notes and #team_1 visible.',
    ].join('\n'))

    expect(tags).toEqual(['project', 'project/roadmap', 'writing-notes', 'team_1'])
})

test('rewrites workspace-relative wikilinks when a folder is renamed', () => {
    const content = [
        '# Hub',
        'Roadmap: [[projects/alpha/Overview]]',
        'Spec: [[projects/alpha/Specs/API#Auth]]',
        'Alias: [[projects/alpha/Overview|alpha overview]]'
    ].join('\n')

    const result = rewriteWikilinksForPathChange({
        content,
        currentFilePath: 'F:/vault/Home.md',
        workspacePath: 'F:/vault',
        fromPath: 'F:/vault/projects/alpha',
        toPath: 'F:/vault/projects/platform-alpha',
        isDirectory: true
    })

    expect(result.changed).toBeTruthy()
    expect(result.content).toContain('[[projects/platform-alpha/Overview]]')
    expect(result.content).toContain('[[projects/platform-alpha/Specs/API#Auth]]')
    expect(result.content).toContain('[[projects/platform-alpha/Overview|alpha overview]]')
})

test('does not rewrite unresolved plain-title wikilinks across directories', () => {
    const content = 'Reference [[Alpha]] from another folder.'

    const result = rewriteWikilinksForPathChange({
        content,
        currentFilePath: 'F:/vault/journal/Today.md',
        workspacePath: 'F:/vault',
        fromPath: 'F:/vault/projects/Alpha.md',
        toPath: 'F:/vault/projects/Product Alpha.md',
        isDirectory: false
    })

    expect(result.changed).toBeFalsy()
    expect(result.content).toBe(content)
})

test('extracts nested relative wikilinks from notes in subfolders', () => {
    const links = extractWikilinks(
        [
            '[[../Roadmap]]',
            '[[./specs/API]]',
            '[[design/System Overview#Flow|system flow]]'
        ].join('\n'),
        'F:/vault/projects/alpha/notes/Plan.md',
        'F:/vault'
    )

    expect(links.map((link) => link.to_doc_path)).toEqual([
        'F:/vault/projects/alpha/Roadmap.md',
        'F:/vault/projects/alpha/notes/specs/API.md',
        'F:/vault/projects/alpha/notes/design/System Overview.md'
    ])
    expect(links[2]?.to_heading_slug).toBe('flow')
    expect(links[2]?.alias_text).toBe('system flow')
})

test('supports explicit workspace-root wikilinks with leading slash', () => {
    const links = extractWikilinks(
        '[[/knowledge/Hubs/Product]]',
        'F:/vault/projects/alpha/notes/Plan.md',
        'F:/vault'
    )

    expect(links).toHaveLength(1)
    expect(links[0]?.to_doc_path).toBe('F:/vault/knowledge/Hubs/Product.md')
})
