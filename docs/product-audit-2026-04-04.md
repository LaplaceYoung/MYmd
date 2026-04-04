# MYmd Product Audit - 2026-04-04

## This Round

- Added `Export Profile` across settings, editor canvas, status bar, and HTML export.
- Added print page guides on the editor canvas for print-oriented presets and paper sizes.
- Upgraded exported HTML with profile-aware header/footer chrome and print-safe styling.
- Productized the AI panel with task presets, streaming output, timeout handling, and automatic retry on transient failures.
- Added explicit export controls for header/footer chrome and page-break strategy, including manual page-break markers and section pagination.
- Added a mocked-Tauri E2E proving file rename -> wikilink rewrite -> reindex -> backlink visibility closure in workspace flows.
- Added contextual AI entry points from the knowledge graph panel that open the AI assistant directly into graph-enrichment mode with a prefilled instruction draft.
- Added contextual AI quick actions in the ribbon so layout, rewrite, and graph workflows can be launched from the main editing surface with document-aware defaults.
- Added AI result diff preview so layout/content generations now show change counts and compact preview blocks before replace.
- Added block-level AI apply and restore-original controls so AI-assisted editing is now partially reversible instead of being replace-only.
- Added AI session history snapshots so generated or manually curated results can be reloaded within the current editing session.
- Added persistent AI history management so session snapshots now survive reloads and can be deleted individually or cleared in bulk.
- Added AI history labels, favorites, favorite-first ordering, and inline search so snapshot recall is now usable across repeated editing loops.
- Added paper orientation and unified page margin controls so settings now drive editor canvas padding, status bar visibility, and export page geometry together.

## Current Capability Audit

### Stable and usable

- Paper size, layout profile, and export profile now form a complete visible chain.
- Paper orientation and page margin now persist and affect both the editor canvas and export HTML instead of being fixed internals.
- Export header/footer and page-break strategy now form a configurable export chain instead of being hidden in profile defaults.
- File explorer CRUD is usable for local-first editing workflows.
- Global search, in-document search, and recent-document flows are already connected.
- Image paste works in both WYSIWYG and source editor paths with local asset insertion.
- AI panel now supports a real assist loop with preset prompts, streamed results, retry, and apply-back actions.
- Knowledge graph now has a direct handoff into AI-assisted graph enrichment instead of requiring a generic AI open-first workflow.
- The main editor surface now exposes direct AI launch points for layout, content, and graph tasks instead of hiding them behind a single generic assistant toggle.
- AI history now supports document-aware labels, favorites, and filtering instead of being a flat append-only list.

### Present but not yet product-complete

- AI panel now supports diff preview, block-level apply, restore-original, persistent history reload, labels, favorites, and history filtering, but it still lacks reusable saved prompt libraries and cross-document grouping or exportable prompt/result assets.
- Paper size now supports custom width/height, orientation, and unified margin controls, but it still lacks separate editor-vs-export paper profiles and richer preset management.
- Knowledge graph is still a lightweight relationship surface, not an interactive graph workspace.
- AI graph suggestions still apply as guided drafts, not as structured graph mutations or approve-per-link actions.
- Ribbon AI entries still open draft-based workflows; they do not yet expose structured “apply headings / apply links / accept rewrite block-by-block” operations.
- Backlinks now have proven closure for file rename flows inside a workspace.

### Risks and gaps

- Folder move/rename and backlink jump semantics are still not proven by a real Tauri workspace E2E.
- Export controls are better, but true paged preview and PDF-grade layout verification are still behind Typora-level maturity.
- Paper controls still use one shared model for both editor canvas and export output, which will become a constraint once orientation and print margins diverge.
- Some older components still contain mojibake text, which is a UX and maintenance liability.
- There is now regression coverage for file rename -> wikilink/backlink consistency, but not for directory moves or source-jump behavior.
- Bundle warnings remain concentrated in Mermaid and graph-related chunks.

## External Signals

### Competitor direction

- Typora remains the clearest benchmark for print/export maturity.
- Obsidian remains the clearest benchmark for wikilink/backlink closure.
- Notion remains the clearest benchmark for light AI editing entrypoints.
- Logseq remains the clearest benchmark for local-first graph workflow.

### Open-source shortlist

- `Paged.js`: strongest next fit for true paged preview and print-focused rendering.
- `Vercel AI SDK` or OpenAI-compatible abstraction: strongest next fit for provider layer cleanup.
- `Cytoscape.js`: stronger graph visualization target after core backlink closure.
- `LangChain + Qdrant`: only after local knowledge workflows become stable enough to justify heavier retrieval.

## Next Loop

### P0

- Extend the paper system beyond size/orientation/margin into saved presets, asymmetric margins, and separate editor-vs-export paper profiles.
- Extend wikilink/backlink coverage from file rename to directory move and source-jump behavior.
- Add a true Tauri workspace E2E for move -> rewrite -> reindex -> backlink visibility -> jump behavior.
- Add paged preview or PDF-oriented verification on top of the new export controls.

### P1

- Add AI session history, restore-original, and reusable saved prompt templates.
- Add reusable saved prompt templates, history grouping by document/task, and exportable AI result assets on top of the new persistent block-by-block apply flow.
- Upgrade the knowledge graph from list-like inspection to interactive visualization.

### P2

- Split Mermaid and graph-heavy code paths to reduce oversized chunks.

## Reference Links

- Typora Export: https://support.typora.io/Export/
- Obsidian Links: https://obsidian.md/help/links
- Obsidian Backlinks: https://obsidian.md/help/plugins/backlinks
- Notion Export: https://www.notion.com/help/export-your-content
- Notion AI: https://www.notion.com/product/ai
- Logseq repository: https://github.com/logseq/logseq
- Paged.js: https://github.com/pagedjs/pagedjs
- AI SDK docs: https://ai-sdk.dev/docs/introduction
- Cytoscape.js: https://js.cytoscape.org/
- Qdrant docs: https://qdrant.tech/documentation/
