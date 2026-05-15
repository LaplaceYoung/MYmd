# Benchmark Source Refresh

Baseline date: 2026-05-15

## Purpose

This refresh keeps the MYmd benchmark matrix grounded in current upstream product evidence. It supports the active goal by turning mainstream Markdown reader/editor changes into roadmap pressure.

## Source Snapshot

| Product | Current Evidence | MYmd Pressure |
|---|---|---|
| Obsidian | Core plugins include backlinks, unlinked mentions, graph view, command palette, quick switcher, search, tags, templates, workspaces, Sync, Publish, and Web viewer. The March 23, 2026 desktop changelog highlights faster CLI interactions and editor paste fixes. | Keep natural knowledge affordances and CLI/open-with reliability visible in P0/P1 gates. |
| Joplin | Product docs emphasize offline-first notes, notebooks, tags, search, sync/E2EE, plugins, and Web Clipper. Markdown docs emphasize CommonMark plus toggleable Markdown plugins. The May 2026 desktop changelog highlights front matter wrapping, startup crash fixes, table editing commands, startup speed, sync fixes, and import reliability. | Keep local reliability, import/export discipline, startup quality, and table editing in the backlog. |
| Typora | Markdown reference updated April 4, 2026 and covers live Markdown transformations, task lists, fenced code, math, tables, footnotes, YAML front matter, TOC, callouts, links, and images. | Keep low-friction writing, tables, footnotes, frontmatter, TOC, and image workflows as P0-P2 editing benchmarks. |
| iA Writer | Focus Mode and Style Check emphasize distraction control, stats, custom patterns, and local/private writing assistance. | Keep focus/typewriter, writing stats, and privacy-preserving style aids in the writing polish lane. |
| MarkText | README positions it as a simple open-source editor focused on speed and usability, with WYSIWYG preview, GFM/CommonMark, KaTeX, front matter, themes, source/typewriter/focus modes, HTML/PDF export, and image paste. | Keep MYmd's lightweight desktop editor baseline measurable through startup, paste, focus, source/split, and export checks. |
| Zettlr | Feature comparison highlights Zotero/citation support, preview citations, project support, writing statistics, search, split view, export via Pandoc, tags, templates, and graph view. | Keep research-writing capability as a P3 lane with citation/project/export ADR work. |
| Cherry Markdown | README highlights streaming rendering, rich paste, image sizing, Mermaid sizing/alignment, table editing, table-to-chart, image/PDF export, toolbars, TOC, autocomplete, partial rendering/update, security hook, and themes. | Keep editor-interaction depth, table/media controls, partial rendering, and security hooks in P1-P3 backlog pressure. |
| doocs/md | README highlights WeChat content production, theme customization, local content management, Mermaid, PlantUML, image beds, file import/export, AI integrations, and private deployment paths. | Keep publishing/export, deterministic resource workflow, and optional automation/AI boundaries as P2/P3 opportunities. |

## Roadmap Decision

The current MYmd positioning remains stable:

- Primary path: local-first Markdown editor with Word-like familiarity and low learning cost.
- Knowledge layer: natural links, backlinks, tags, search, graph filters, and unlinked mentions.
- Reliability layer: release smoke, CLI/open-with indexing, startup quality, import/export discipline, and reproducible release evidence.
- Future lanes: table/media editing depth, writing polish, plugin/read-only extension API, graph sensemaking, and research-writing workflows.

## Priority Adjustments

| Priority | Adjustment | Reason |
|---|---|---|
| P0 | Keep CLI/open-with indexing and startup smoke as release-bound gates. | Obsidian and Joplin both show active investment in CLI/startup reliability. |
| P1 | Keep table editing and index/retry reliability near the front of the queue. | Joplin and Cherry both reinforce table editing and reliability pressure. |
| P2 | Keep frontmatter/export/resource workflow as one coherent production-power lane. | Typora, Joplin, MarkText, and doocs/md all reinforce export and metadata workflows. |
| P3 | Keep research writing and plugin surfaces staged behind core workflow stability. | Zettlr and Obsidian show durable value in citations, graph, templates, and extensibility. |

## Sources

- Obsidian core plugins: https://obsidian.md/help/plugins
- Obsidian changelog: https://obsidian.md/changelog/
- Joplin product overview: https://joplinapp.org/help/
- Joplin Markdown guide: https://joplinapp.org/help/apps/markdown/
- Joplin desktop changelog: https://joplinapp.org/help/about/changelog/desktop/
- Typora Markdown reference: https://support.typora.io/Markdown-Reference/
- iA Writer Focus Mode: https://ia.net/writer/support/editor/focus-mode
- iA Writer Style Check: https://ia.net/writer/support/editor/style-check
- MarkText README: https://github.com/marktext/marktext
- Zettlr features: https://www.zettlr.com/features
- Cherry Markdown README: https://github.com/Tencent/cherry-markdown
- doocs/md README: https://github.com/doocs/md
