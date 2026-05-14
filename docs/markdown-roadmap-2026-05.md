# MYmd Markdown Product Roadmap

Baseline date: 2026-05-15

## Objective

MYmd should keep converging toward the strongest mainstream Markdown reader/editor workflows while preserving its own product center: a Windows-first, local-first Markdown editor with Word-like familiarity, low learning cost, fast file opening, and lightweight knowledge connections.

## Success Criteria

1. Every release has a visible benchmark target and a clear product reason.
2. Every benchmark gap maps to a scoped backlog item with priority and verification.
3. Core writing, reading, local files, search, backlinks, export, and release packaging stay healthy across iterations.
4. Advanced knowledge features stay discoverable through natural actions such as search, links, backlinks, and command entry.
5. Release notes, README version, installers, portable package, checksums, and smoke evidence stay aligned.

## Current MYmd Baseline

| Area | Current Strength | Health | Next Pressure |
|---|---|---:|---|
| Local editor loop | Multi-tab editing, WYSIWYG/source/split views, autosave, unsaved-close guard | High | Keep startup and close flows covered by regression tests |
| Markdown rendering | KaTeX, Mermaid, code highlighting, TOC, HTML export | High | Add footnotes, stronger table controls, export fidelity checks |
| Knowledge workflow | Workspace, global search, backlinks, graph path, local index | Medium-high | Extend wikilink completion coverage, add unlinked mentions, index progress and retry |
| File workflow | Open/save/save-as, workspace tree, CLI/file association path, rename/link rewrite coverage | High | Add batch import/export and resource folder policy |
| Interaction model | Word-like ribbon, titlebar search, side panels, responsive pass completed | Medium-high | Keep command/search semantics unified and reduce hidden entry mismatch |
| Packaging | Tauri installer, MSI, Electron portable, checksum release flow | High | Turn release smoke into a repeatable checklist |

## Mainstream Benchmark Matrix

| Product | Primary User Promise | Capability To Learn | MYmd Adoption Rule | Priority |
|---|---|---|---|---:|
| Obsidian | Local vault knowledge graph and extensible PKM | Backlinks, unlinked mentions, quick switcher, graph view, command palette, plugin ecosystem | Add natural knowledge affordances after the basic editor path is already working | P1-P2 |
| Joplin | Offline-first notes with sync, E2EE, clipping, import/export, plugins | Reliable offline storage, search, note links, notebooks, tags, clipper, sync boundary | Borrow reliability narrative and import/export discipline before sync promises | P1-P3 |
| Typora | Low-friction visual Markdown writing | Single mental model, live Markdown transformations, table toolbar, task list direct toggles | Use as the interaction simplicity benchmark for everyday writing | P0-P2 |
| iA Writer | Focused long-form writing | Focus mode, typewriter scrolling, style/syntax checks, stats, writing-first defaults | Treat as the benchmark for distraction control and writing polish | P1-P3 |
| MarkText | Simple open-source WYSIWYG editor | Clean WYSIWYG, source/focus/typewriter modes, HTML/PDF output, image paste | Treat as the lightweight desktop editor baseline | P0-P2 |
| Zettlr | Academic Markdown and research writing | Citations, Zotero, writing statistics, project support, Pandoc export | Use as a future lane for research/document production users | P2-P3 |
| Cherry Markdown | Deep editor interaction toolkit | Rich paste, table operations, bubble toolbar, media sizing, partial render, export image/PDF | Use for editor-interaction depth after command boundaries are stable | P1-P3 |
| doocs/md | Content production and publishing workflow | Themes, AI-assisted writing, multi-image-bed, import/export, local/private deployment | Use for output, automation, and distribution workflow ideas | P2-P3 |

## Capability Backlog

### P0: Release And Interaction Health

| Task | Product Reason | Acceptance Evidence |
|---|---|---|
| Keep README and release version synchronized | Users should trust the release page and repository landing page | README/README_en version matches latest GitHub release |
| Add release smoke automation to project docs | Packaging quality has direct user impact | `npm run release:smoke` covers Tauri installer, MSI, Electron portable, checksum, screenshot/DOM smoke |
| Keep search entry semantics unified | Titlebar search, command search, and global search should feel predictable | E2E covers titlebar search, modal search, keyboard result open |
| Keep CLI/file association indexing path covered | Double-click/open-with should feed the knowledge loop | `npm run release:smoke` verifies CLI open plus document, heading, and tag search recall |
| Track known build warnings | Large editor chunks need visible ownership | Release notes mention current chunk warnings and owner lane |

### P1: Natural Knowledge Workflow

| Task | Product Reason | Acceptance Evidence |
|---|---|---|
| Wikilink file/heading completion | Users should discover linking by typing naturally | Source/Split typing `[[` shows ranked file suggestions, `[[Alpha` shows heading targets, and selection inserts valid Markdown |
| Tag completion in knowledge entry points | Tags should feel searchable and reusable from everyday writing | Source/Split typing `#pro` shows indexed tag suggestions, supports nested tags, and inserts a valid tag |
| Backlink context snippets | Backlinks should answer why a document is connected | Panel groups linked/unlinked mentions, shows snippet, heading label, and jump target |
| Unlinked mentions | Knowledge network should grow from existing writing | Mention query finds candidate text and converts it into a link |
| Index progress and retry | Workspace indexing should feel reliable and explainable | UI shows idle/indexing/error/progress and retry path |
| Preview/edit isolation | Reading mode should stay stable during navigation | Regression prevents pure preview from entering edit state unexpectedly |

### P2: Editor Production Power

| Task | Product Reason | Acceptance Evidence |
|---|---|---|
| Table editing controls | Typora/Cherry-level table comfort is a daily editing win | Add/delete row/column, align, width, and valid Markdown persistence |
| Footnotes end-to-end | Long-form notes need scholarly and technical references | Editor, preview, search, and export all handle footnotes |
| Image/resource workflow | Local-first files need deterministic asset storage | Paste/drop image creates content-hashed relative asset paths and survives rename/move |
| Export matrix | Users expect HTML, PDF, image, and Docx paths | Benchmark documents export with headings, tables, KaTeX, Mermaid, images |
| Writing polish | Long-form writers need focus and quality signals | Word count, reading time, focus/typewriter regression, optional style hints |

### P3: Ecosystem And Automation

| Task | Product Reason | Acceptance Evidence |
|---|---|---|
| Read-only plugin API | Extension value grows after core workflows stabilize | Manifest, command registration, sidebar card, search provider API |
| Local render API / CLI | Automation unlocks docs pipelines and AI workflows | CLI/render API converts Markdown to export HTML deterministically |
| Graph view filter set | Graph should support sensemaking, not just decoration | Filter by folder/tag/link depth and open node target |
| Optional sync boundary design | Reliability story benefits from a future sync plan | ADR defines data ownership, conflict policy, and provider boundary |
| Research writing lane | Zettlr-style users need citation/project workflows | Zotero/citation/export ADR and benchmark document set |

## Version Iteration Cadence

| Release Type | Typical Scope | Gate |
|---|---|---|
| Hotfix | Packaging defect, startup/rendering regression, data-safety defect | Targeted fix, targeted regression, smoke build, latest release replacement decision |
| Minor slice | One product capability with tests and docs | Typecheck, build, repo hygiene, targeted E2E, release notes |
| Benchmark pass | Multiple capability reviews with backlog updates | Competitor matrix update, issue-to-task mapping, project roadmap update |
| Release candidate | Installer/portable distribution | Tauri smoke, Electron smoke, checksums, GitHub release verification |

## Source Anchors

- Obsidian core plugins: https://obsidian.md/help/plugins
- Joplin product overview: https://joplinapp.org/help/
- Joplin Markdown support: https://joplinapp.org/help/apps/markdown/
- Typora Markdown reference: https://support.typora.io/Markdown-Reference/
- iA Writer Focus Mode: https://ia.net/writer/support/editor/focus-mode
- iA Writer Style Check: https://ia.net/writer/support/editor/style-check
- MarkText README: https://github.com/marktext/marktext
- Zettlr features: https://www.zettlr.com/features
- Cherry Markdown: https://github.com/Tencent/cherry-markdown
- doocs/md: https://github.com/doocs/md
