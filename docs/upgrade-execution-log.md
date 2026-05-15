# Upgrade Execution Log

## 2026-04-15

### Slice 1

- Scope:
  - Phase 0 guardrails bootstrap
  - Phase P0 preview/edit isolation regression coverage
- Planned touchpoints:
  - `docs/upgrade-execution-log.md`
  - `.omx/context/ralph-benchmark-execution-20260415T132838Z.md`
  - `tests/e2e_preview_isolation.spec.ts`
  - `src/components/Editor/WysiwygEditor.tsx`
  - `src/styles/editor.css`
- Verification target:
  - targeted Playwright regression for split preview
  - `npm run build`
- Evidence:
  - Added `tests/e2e_preview_isolation.spec.ts` and confirmed it failed first on missing preview readonly semantics.
  - Added explicit readonly semantics plus mutation-event guardrails in `src/components/Editor/WysiwygEditor.tsx`.
  - Added reactive `readOnly` enforcement so split-preview protection survives mode changes on the same tab instance.
  - Expanded the regression to cover both typing and paste attempts inside split preview.
  - Re-ran `npx playwright test tests/e2e_preview_isolation.spec.ts --reporter=line` and it passed on 2026-04-15.
  - Re-ran `npm run build` and it passed on 2026-04-15.
  - Architect verification approved the slice on the condition that only readonly/test/docs hunks are committed, excluding unrelated editor feature work.

### Slice 2

- Scope:
  - Phase P1 TOC hierarchy enhancement
  - per-tab TOC collapse/active-state persistence
- Planned touchpoints:
  - `src/components/Sidebar/TOCPanel.tsx`
  - `src/components/Sidebar/TOCPanel.css`
  - `tests/e2e_toc_hierarchy.spec.ts`
- Evidence:
  - Added a TDD regression for nested heading collapse plus tab-switch persistence in `tests/e2e_toc_hierarchy.spec.ts`.
  - Added a second regression covering `filter -> edit headings -> filter and active highlight still hold` in the same tab.
  - Upgraded the TOC from flat rows to a tree-aware structure with collapsible parent sections.
  - Added per-tab persisted TOC state for collapsed sections and active heading selection.
  - Added a hydration guard so tab switches restore TOC state before any persistence write-back.
  - Re-ran `npx playwright test tests/e2e_search_unified.spec.ts tests/e2e_toc_hierarchy.spec.ts --reporter=line` and it passed on 2026-04-15.
  - Re-ran `npm run build` and it passed on 2026-04-15.
  - Architect verification approved the slice after hydration was limited to tab switches and same-tab heading recompute stopped clearing TOC filter state.

### Slice 3

- Scope:
  - Phase P1 Mermaid fallback and export path hardening
  - shared Mermaid render/fallback utilities for editor and export preprocessing
- Planned touchpoints:
  - `src/utils/mermaid.ts`
  - `src/utils/paper.ts`
  - `src/components/Editor/plugins/diagramPlugin.ts`
  - `src/components/Ribbon/Ribbon.tsx`
  - `src/styles/editor.css`
  - `tests/e2e_mermaid_export_fallback.spec.ts`
- Verification target:
  - targeted Playwright regression for Mermaid export preprocessing fallback
  - `npm run build`
- Evidence:
  - Added shared Mermaid rendering helpers in `src/utils/mermaid.ts` so editor preview and export preprocessing use the same render/error surface.
  - Hardened the Mermaid node view to preserve a stable empty state and show a source-preserving fallback when rendering fails.
  - Added export preprocessing so fenced Mermaid blocks render to inline SVG for HTML export, and invalid diagrams fall back to a readable source block instead of silently failing.
  - Added `tests/e2e_mermaid_export_fallback.spec.ts` to cover both rendered and fallback export output.
  - Re-ran `npx playwright test tests/e2e_mermaid_export_fallback.spec.ts --reporter=line` and it passed on 2026-04-15.
  - Re-ran `npm run build` and it passed on 2026-04-15.

### Slice 4

- Scope:
  - Phase P1 shared rich-text / HTML paste to Markdown pipeline
  - align Source and WYSIWYG paste behavior without changing the current visual design
- Planned touchpoints:
  - `src/utils/htmlPaste.ts`
  - `src/components/Editor/SourceEditor.tsx`
  - `src/components/Editor/WysiwygEditor.tsx`
  - `tests/e2e_source_html_paste.spec.ts`
  - `tests/e2e_wysiwyg_html_paste.spec.ts`
- Verification target:
  - targeted Playwright regressions for source and WYSIWYG HTML paste
  - `npm run build`
- Evidence:
  - Added `src/utils/htmlPaste.ts` as a shared HTML-to-Markdown conversion lane for rich-text paste handling.
  - Wired Source editor HTML paste through the shared conversion utility before insertion so rich text lands as Markdown instead of mixed HTML/plain-text artifacts.
  - Wired WYSIWYG HTML paste through Milkdown's parsed Markdown insertion path and added an explicit markdown sync so split/source views stay consistent after paste.
  - Added `tests/e2e_source_html_paste.spec.ts` and `tests/e2e_wysiwyg_html_paste.spec.ts` to cover both editor surfaces with the same conversion expectations.
  - Re-ran `npx playwright test tests/e2e_source_html_paste.spec.ts tests/e2e_wysiwyg_html_paste.spec.ts --reporter=line` and it passed on 2026-04-15.
  - Re-ran `npm run build` and it passed on 2026-04-15.

### Slice 5

- Scope:
  - Phase P1 editor runtime mode/state query API
  - expose a stable state snapshot for plugins, AI flows, and automation without changing the visual design
- Planned touchpoints:
  - `src/utils/editorRuntime.ts`
  - `tests/e2e_editor_runtime_state.spec.ts`
- Verification target:
  - targeted Playwright regression for runtime state in WYSIWYG and split mode
  - `npm run build`
- Evidence:
  - Added `src/utils/editorRuntime.ts` to provide a shared snapshot/query surface for active tab, mode, panel visibility, registered command ids, and preview/editability state.
  - Kept the new API read-only and store-driven so it does not alter the existing theme, layout, or interaction flow.
  - Added `tests/e2e_editor_runtime_state.spec.ts` to verify runtime state snapshots across WYSIWYG and split mode transitions.

### Slice 6

- Scope:
  - Phase P3 local automation render surface
  - expose a reusable Markdown-to-export-HTML API without changing the current visual design
- Planned touchpoints:
  - `src/utils/renderApi.ts`
  - `tests/render_api.spec.ts`
- Verification target:
  - targeted render API tests
  - `npm run build`
- Evidence:
  - Added `src/utils/renderApi.ts` to expose a shared automation-facing rendering lane from raw Markdown input to prepared body HTML and full export HTML output.
  - Reused the existing export preparation path so page-break preprocessing and Mermaid export handling stay consistent with the product runtime.
  - Added `tests/render_api.spec.ts` to verify both body-html rendering and full export-document generation from raw Markdown input.

### Slice 7

- Scope:
  - Phase P1 table width persistence and low-disturbance editing controls
  - keep wide-table behavior aligned between editor rendering and export output
- Planned touchpoints:
  - `.omx/context/ralph-table-width-controls-20260415T120000Z.md`
  - `src/utils/tableWidths.ts`
  - `src/utils/renderApi.ts`
  - `src/components/Ribbon/Ribbon.tsx`
  - `src/components/Editor/WysiwygEditor.tsx`
  - `src/components/Editor/EditorContextMenu.tsx`
  - `src/styles/editor.css`
  - `src/stores/editorStore.ts`
  - `tests/table_widths.spec.ts`
  - `tests/e2e_table_width_resize.spec.ts`
- Verification target:
  - targeted table-width unit and Playwright regression coverage
  - `npm run build`
- Evidence:
  - Added `src/utils/tableWidths.ts` with shared helpers to clamp widths, locate Markdown tables, persist `<!-- mymd:table-width=... -->` directives, and project those directives into rendered HTML.
  - Wired WYSIWYG table-width commands to persist width directives back into Markdown and re-apply explicit widths onto rendered table nodes after editor mutations.
  - Added context-menu actions to widen, narrow, and reset table width without changing the surrounding editor aesthetic.
  - Applied persisted table widths in `src/utils/renderApi.ts` and the HTML export path so downstream paper sizing and export output respect the same table width state.
  - Added a single-table store fallback so width commands still persist when the active selection context is unavailable.
  - Added `tests/table_widths.spec.ts` and `tests/e2e_table_width_resize.spec.ts` to cover directive persistence and width-aware render output.
  - Re-ran `npx playwright test tests/table_widths.spec.ts tests/e2e_table_width_resize.spec.ts --reporter=line` and it passed on 2026-04-15.
  - Re-ran `npm run build` and it passed on 2026-04-15.

### Slice 8

- Scope:
  - Phase P0 workspace tree consistency and file-operation closure
  - keep wiki-link/backlink continuity aligned after workspace rename actions
- Planned touchpoints:
  - `.omx/context/ralph-workspace-explorer-ops-20260415T133500Z.md`
  - `src/components/Sidebar/FileExplorer.tsx`
  - `src/components/Sidebar/FileExplorer.css`
  - `tests/e2e_wikilink_backlink.spec.ts`
- Verification target:
  - targeted Playwright regression for workspace rename/backlink continuity
  - `npm run build`
- Evidence:
  - Added directory-cache and open-folder hydration logic so nested workspace tree state survives refreshes instead of collapsing on every reload.
  - Added file-explorer action flows for create file, create folder, rename, and delete with dialog-based confirmation that preserves the current sidebar aesthetic.
  - Guarded destructive operations by checking open dirty tabs before delete and refreshing the workspace plus knowledge index after successful actions.
  - Expanded `tests/e2e_wikilink_backlink.spec.ts` into a mock-workspace regression that verifies `rename -> wikilink rewrite -> reindex -> backlink panel continuity`.
  - Re-ran `npx playwright test tests/e2e_wikilink_backlink.spec.ts --reporter=line` and it passed on 2026-04-15.
  - Re-ran `npm run build` and it passed on 2026-04-15.

### Slice 9

- Scope:
  - Phase P2 media workflow regression coverage
  - align image-paste tests with the current welcome-to-editor startup flow
- Planned touchpoints:
  - `.omx/context/ralph-media-regressions-20260415T151500Z.md`
  - `tests/e2e_media_embed.spec.ts`
  - `tests/e2e_image_paste.spec.ts`
  - `tests/e2e_source_image_paste.spec.ts`
- Verification target:
  - targeted Playwright regressions for media embed and image paste
  - `npm run build`
- Evidence:
  - Kept the slice test-only and avoided runtime editor changes.
  - Updated image-paste regressions so they enter the editor through the current welcome/sidebar flow instead of the outdated `新建` button path.
  - Preserved coverage for WYSIWYG paste, split-source paste, trusted media embed rendering, and blocked untrusted embeds.
  - Re-ran `npx playwright test tests/e2e_media_embed.spec.ts tests/e2e_image_paste.spec.ts tests/e2e_source_image_paste.spec.ts --reporter=line` and it passed on 2026-04-15.
  - Re-ran `npm run build` and it passed on 2026-04-15.

### Slice 10

- Scope:
  - product health and performance pass
  - restore strict typecheck health, reduce startup bundle pressure, and keep E2E selectors locale-tolerant
- Planned touchpoints:
  - `src/App.tsx`
  - `src/components/Editor/EditorContainer.tsx`
  - `src/components/Editor/GlobalSearchModal.tsx`
  - `src/components/Editor/SourceEditor.tsx`
  - `src/components/Editor/TemplateGallery.tsx`
  - `src/components/Editor/WysiwygEditor.tsx`
  - `src/components/Sidebar/TOCPanel.tsx`
  - `src/styles/editor.css`
  - `vite.config.ts`
  - `tests/e2e_unsaved_close.spec.ts`
  - `tests/e2e_layout_profile.spec.ts`
- Functional health:
  - Core local editor workflow is healthy: welcome/new document, WYSIWYG editor loading, settings-to-editor status path, unsaved close interception, and production build are verified.
  - Knowledge workflow health is medium-high: global search has stale-result cancellation and keyboard selection, backlinks/graph paths are present, and remaining risk sits in larger workspace indexing and graph-heavy documents.
  - Performance health improved: the startup route now defers editor-heavy and hidden sidebar code, and the production build uses minified, cacheable vendor chunks.
  - Repository hygiene is healthy: tracked generated artifacts and secret patterns passed the repo hygiene script.
- Evidence:
  - Fixed strict TypeScript failures in CodeMirror search decoration typing, WYSIWYG DOM narrowing, and TOC mutation observer setup.
  - Converted WYSIWYG/source editors and conditional sidebars to lazy chunks so the welcome/startup route avoids loading hidden advanced surfaces.
  - Enabled Vite esbuild minification and split React, Milkdown, CodeMirror, KaTeX, icons, Mermaid, and misc vendor chunks.
  - Reduced the main production JS chunk from about 2,046.98 kB to about 465.79 kB in the local Vite build output.
  - Removed the duplicate template-content store update; `addTab(null, content)` already initializes new tab content.
  - Made global search async queries cancellable and stabilized result-opening callbacks.
  - Re-ran `npm run typecheck`, `npm run build`, `npm run ci:repo-hygiene`, `npx playwright test tests/ai_runtime.spec.ts tests/ai_draft_entry.spec.ts`, and `npx playwright test tests/e2e_unsaved_close.spec.ts tests/e2e_layout_profile.spec.ts --workers=1` on 2026-05-14.

### Slice 11

- Scope:
  - UI layout, responsive behavior, accessibility, and perceived performance pass
  - competitor-informed interaction health review for local-first Markdown workflows
  - landing-page smoke coverage alignment with current promotional page structure
- Planned touchpoints:
  - `src/App.tsx`
  - `src/styles/index.css`
  - `src/styles/editor.css`
  - `src/components/Editor/EditorContainer.tsx`
  - `src/components/Editor/GlobalSearchModal.tsx`
  - `src/components/Editor/GlobalSearchModal.css`
  - `src/components/Editor/TemplateGallery.tsx`
  - `src/components/Editor/TemplateGallery.css`
  - `src/components/Editor/WelcomeView.tsx`
  - `src/components/Ribbon/Ribbon.css`
  - `src/components/Settings/SettingsPanel.css`
  - `src/components/Sidebar/*.css`
  - `src/components/StatusBar/StatusBar.css`
  - `src/components/TitleBar/TitleBar.css`
  - `apps/site/index.html`
  - `apps/site/main.js`
  - `tests/pages_smoke.mjs`
- Competitor research:
  - Obsidian, Joplin, Typora, iA Writer, MarkText, and Zettlr all point toward a stronger default loop for MYmd: local folder entry, visual Markdown editing, collapsible three-column layout, quick command/search, long-form writing support, and lightweight frontmatter views.
  - The best MYmd positioning remains a Word-like local-first editor with natural knowledge enhancements surfaced through search, links, backlinks, and context panels.
- Functional health:
  - Core desktop shell health improved through fixed responsive shell classes, tokenized side-panel widths, mobile overlay panels, titlebar/ribbon/statusbar breakpoints, and welcome-page mobile reflow.
  - Search health improved through dialog semantics, keyboard result activation, responsive result previews, stable hover activation using a result-id map, and clear-query loading reset.
  - Editing performance health improved by throttling wide-table measurement and avoiding state writes when the measured width is unchanged.
  - Welcome and template entry health improved through keyboard-accessible recent rows and template cards implemented as native buttons.
  - Landing-page health improved through current version wording, logo smoke validation, and mobile menu coverage.
- Evidence:
  - Re-ran `npm run typecheck` on 2026-05-14 and it passed.
  - Re-ran `npx playwright test tests/e2e_layout_profile.spec.ts tests/e2e_search_unified.spec.ts tests/e2e_unsaved_close.spec.ts --workers=1 --reporter=line` on 2026-05-14 and all 6 tests passed.
  - Re-ran `npm run ci:repo-hygiene` on 2026-05-14 and it passed.
  - Re-ran `npm run build` on 2026-05-14 and it passed.
  - Re-ran `node tests/pages_smoke.mjs http://127.0.0.1:4173` against a local Vite static server on 2026-05-14 and it passed with title, logo, mobile menu, release version, and zero console errors verified.
- Known risk:
  - The production build still reports large chunks for `WysiwygEditor`, `SourceEditor`, `mindmap-definition`, and `flowchart-elk-definition`; the warning reflects the current heavy editor and diagram stack.

## 2026-05-15

### Slice 12

- Scope:
  - long-running Markdown benchmark alignment goal
  - project management baseline for version iteration and release governance
- Planned touchpoints:
  - `docs/markdown-roadmap-2026-05.md`
  - `docs/release-iteration-playbook.md`
  - `README.md`
  - `README_en.md`
  - `docs/upgrade-execution-log.md`
- Product management baseline:
  - Added a mainstream Markdown product matrix covering Obsidian, Joplin, Typora, iA Writer, MarkText, Zettlr, Cherry Markdown, and doocs/md.
  - Converted benchmark gaps into P0-P3 backlog lanes with acceptance evidence.
  - Added a repeatable release iteration playbook covering slice planning, verification gates, desktop smoke checks, checksums, and GitHub release verification.
  - Updated README version and release highlights to `v1.4.3-hotfix6`.
- Verification target:
  - `npm run typecheck`
  - `npm run ci:repo-hygiene`
  - documentation link/reference inspection

### Slice 13

- Scope:
  - P0 release smoke automation
  - make release readiness checks repeatable after Tauri/Electron packaging
- Planned touchpoints:
  - `scripts/release-smoke-check.mjs`
  - `package.json`
  - `docs/release-iteration-playbook.md`
  - `docs/markdown-roadmap-2026-05.md`
  - `docs/upgrade-execution-log.md`
- Product management baseline:
  - Added `npm run release:smoke` as the release verification entry point.
  - Automated release asset and SHA256 validation for the latest `release/v*` staging folder.
  - Automated Electron portable smoke through Chrome DevTools Protocol DOM markers, screenshot capture, and renderer error checks.
  - Automated Tauri runtime smoke through Windows `PrintWindow` screenshot capture, window title verification, and image contrast checks.
- Verification target:
  - `npm run release:smoke`
  - `npm run typecheck`
  - `npm run ci:repo-hygiene`
  - `git diff --check`

### Slice 14

- Scope:
  - P0 CLI/file-association knowledge indexing smoke
  - fold the open-file indexing gate into release verification
- Planned touchpoints:
  - `scripts/release-smoke-check.mjs`
  - `src/knowledge/parser.ts`
  - `docs/release-iteration-playbook.md`
  - `docs/markdown-roadmap-2026-05.md`
  - `docs/upgrade-execution-log.md`
- Product management baseline:
  - Extended `npm run release:smoke` with a Tauri CLI-open test using `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS` for CDP access.
  - The smoke creates a temporary Markdown file, launches the release `app.exe` with that file as a path argument, confirms the opened document renders, and queries the native knowledge DB for document, heading, and tag hits.
  - Fixed standalone hashtag parsing so `#topic` lines are indexed as tags while Markdown headings stay excluded from tag extraction.
  - This turns the previous skipped `e2e_cli_indexing` placeholder into a release-bound runtime gate.
- Verification target:
  - `npm run release:smoke`
  - `node --check scripts/release-smoke-check.mjs`
  - `npm run typecheck`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
- Verification completed:
  - `npm run typecheck`
  - `npm run build:tauri`
  - `npm run release:smoke` with CLI indexing `documentHits: 1`, `headingHits: 2`, `tagHits: 1`, `blockingEventCount: 0`
  - `node --check scripts/release-smoke-check.mjs`
  - `npm run ci:repo-hygiene`
  - `git diff --check`

### Slice 15

- Scope:
  - package and publish the CLI indexing smoke + standalone hashtag indexing release
  - keep README, staging assets, checksums, release notes, and GitHub release state aligned
- Planned touchpoints:
  - `README.md`
  - `README_en.md`
  - `docs/release-iteration-playbook.md`
  - `docs/upgrade-execution-log.md`
  - `release/v1.4.3-hotfix7` staging assets
- Product management baseline:
  - Rebuilt Tauri NSIS/MSI installers from the latest `main` source with Cargo on `E:\EnvConfig\cargo\bin`.
  - Rebuilt Electron portable runtime from the latest `main` source.
  - Created `v1.4.3-hotfix7` staging with installer assets, Electron portable zip, SHA256 checksums, and release notes.
  - Promoted the iteration from implementation evidence to release evidence.
- Verification target:
  - `npm run build:electron`
  - `npm run build:tauri`
  - `npm run release:smoke -- --release-dir release/v1.4.3-hotfix7`
  - `npm run typecheck`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
- Verification completed:
  - `npm run build:electron`
  - `npm run build:tauri`
  - `npm run release:smoke -- --release-dir release/v1.4.3-hotfix7`
  - `npm run typecheck`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
  - Electron portable zip root contains `MYmd.exe`

### Slice 16

- Scope:
  - P1 Source/Split wikilink completion
  - make lightweight knowledge linking discoverable through natural `[[` typing
- Planned touchpoints:
  - `src/components/Editor/SourceEditor.tsx`
  - `tests/e2e_wikilink_completion.spec.ts`
  - `docs/markdown-roadmap-2026-05.md`
  - `docs/upgrade-execution-log.md`
- Product management baseline:
  - Typing `[[` in the Source/Split editor now opens note suggestions from the local graph, including empty-query recent note discovery.
  - Typing a query such as `[[Alpha` combines graph documents, knowledge search documents, and heading hits into one ranked completion list.
  - Selected completion items insert valid wikilink Markdown with same-folder, workspace-relative, and fallback path targets.
  - The roadmap now tracks Source/Split file/heading completion as shipped scope and keeps tag completion as a follow-up knowledge entry task.
- Verification target:
  - `npm run typecheck`
  - `npx playwright test tests/e2e_wikilink_completion.spec.ts --reporter=line`
  - `npm run build`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
- Verification completed:
  - `npm run typecheck`
  - `npx playwright test tests/e2e_wikilink_completion.spec.ts --reporter=line` with 2 tests passed
  - `npm run build`
  - `npm run ci:repo-hygiene`
  - `git diff --check`

### Slice 17

- Scope:
  - P1 backlink context readability polish
  - align the backlinks panel with linked/unlinked mention mental models
- Planned touchpoints:
  - `src/components/Sidebar/BacklinksPanel.tsx`
  - `src/components/Sidebar/BacklinksPanel.css`
  - `tests/e2e_wikilink_backlink.spec.ts`
  - `docs/markdown-roadmap-2026-05.md`
  - `docs/upgrade-execution-log.md`
- Benchmark anchor:
  - Obsidian Backlinks separates `Linked mentions` and `Unlinked mentions`; MYmd now mirrors that vocabulary in the panel while preserving snippet and heading context.
  - Source: https://help.obsidian.md/plugins/backlinks
- Product management baseline:
  - Replaced the broken heading marker text with a readable `Heading: ...` label.
  - Added linked/unlinked section headings and counts so backlinks explain document context at a glance.
  - Added keyboard-visible focus states, preserved visible card text for assistive tech, and labeled close/conversion actions.
  - Updated the P1 roadmap acceptance wording for backlink context snippets.
- Verification target:
  - `npm run typecheck`
  - `npx playwright test tests/e2e_wikilink_backlink.spec.ts --reporter=line`
  - `npm run build`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
- Verification completed:
  - `npm run typecheck`
  - `npx playwright test tests/e2e_wikilink_backlink.spec.ts --reporter=line` with 2 tests passed
  - `npm run build`
  - `npm run ci:repo-hygiene`
  - `git diff --check`

### Slice 18

- Scope:
  - P1 Source/Split tag completion
  - make tags reusable from everyday typing instead of search-only recall
- Planned touchpoints:
  - `src/components/Editor/SourceEditor.tsx`
  - `src/knowledge/parser.ts`
  - `tests/e2e_tag_completion.spec.ts`
  - `tests/knowledge_wikilink_rename.spec.ts`
  - `docs/markdown-roadmap-2026-05.md`
  - `docs/upgrade-execution-log.md`
- Benchmark anchor:
  - Obsidian supports tags as first-class note organization and nested tags with `/`; MYmd now accepts nested tag parsing and suggests indexed tags while typing.
  - Source: https://help.obsidian.md/tags
- Product management baseline:
  - Typing a tag prefix such as `#pro` in Source/Split now opens indexed tag suggestions from the local knowledge query path.
  - Selecting a tag suggestion inserts a valid Markdown tag such as `#project/roadmap`.
  - Tag parsing now accepts nested tags while keeping Markdown headings excluded from tag extraction.
  - The roadmap now tracks Source/Split tag completion as shipped scope for this P1 lane.
- Verification target:
  - `npm run typecheck`
  - `npx playwright test tests/e2e_tag_completion.spec.ts tests/knowledge_wikilink_rename.spec.ts --reporter=line`
  - `npm run build`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
- Verification completed:
  - `npm run typecheck`
  - `npx playwright test tests/e2e_tag_completion.spec.ts tests/knowledge_wikilink_rename.spec.ts --reporter=line` with 7 tests passed
  - Browser preview on `http://127.0.0.1:1420/` with mocked Tauri APIs confirmed `#pro` opens tag suggestions and selecting `#project/roadmap` inserts the nested tag
  - Browser console check reported zero warnings/errors during the tag completion smoke run
  - `npm run build`
  - `npm run ci:repo-hygiene`
  - `git diff --check`

### Release lane v1.4.3-hotfix8

- Scope:
  - package the Slice 18 tag completion iteration into a Windows release
  - keep the local-first Markdown knowledge workflow release loop complete
- Release staging:
  - `release/v1.4.3-hotfix8`
  - `MYmd_1.4.3_x64-setup.exe`
  - `MYmd_1.4.3_x64_en-US.msi`
  - `MYmd-Electron-1.4.3-x64-portable.zip`
  - `SHA256SUMS.txt`
  - `RELEASE_NOTES.md`
- Verification completed:
  - `npm run build:tauri`
  - `npm run build:electron`
  - `npm run release:smoke -- --release-dir release/v1.4.3-hotfix8`
  - release smoke verified asset hashes, Electron rendering, Tauri window rendering, and CLI-open knowledge indexing
  - CLI indexing smoke reported `documentHits: 1`, `headingHits: 4`, `tagHits: 3`, `blockingEventCount: 0`
- SHA256:
  - `MYmd_1.4.3_x64-setup.exe`: `B7D5FA58C169E143A306B5CF05DAA1C70BADF727A6264BD9CCAF1BB665DBC50B`
  - `MYmd_1.4.3_x64_en-US.msi`: `C9202B842BEE4C0C9E2A0D5C6A3D8776E3CA4F8EACE8A2C745E9004306724D43`
  - `MYmd-Electron-1.4.3-x64-portable.zip`: `9CC2F6FAA7D824C0918D3959BE5207E3BFBA0EFF1B250F3E9DE32196D3E79835`

### Slice 23

- Scope:
  - P2 writing statistics polish
  - make the status bar count visible Markdown text and mixed Chinese/Latin prose more accurately
- Planned touchpoints:
  - `src/utils/writingStats.ts`
  - `src/components/StatusBar/StatusBar.tsx`
  - `tests/writing_stats.spec.ts`
  - `docs/markdown-roadmap-2026-05.md`
  - `docs/upgrade-execution-log.md`
- Benchmark anchor:
  - Typora treats word count as a writing aid and excludes Markdown syntax markers from the count.
  - iA Writer surfaces Stats as lightweight writing progress feedback in the editor chrome.
  - Sources: https://support.typora.io/Word-Count/ and https://ia.net/writer/support/editor/stats
- Product management baseline:
  - Status bar statistics now use a shared Markdown-aware writing stats utility.
  - Headings, links, wikilinks, inline code, tables, comments, and frontmatter are normalized toward visible writing text before counting.
  - Mixed CJK and Latin prose gets CJK-aware word units and reading-time estimation.
  - Empty documents show zero reading time, keeping the status feedback literal at startup.
- Verification target:
  - `npm run typecheck`
  - `npx playwright test tests/writing_stats.spec.ts --reporter=line`
  - `npm run build`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
- Verification completed:
  - `npm run typecheck`
  - `npx playwright test tests/writing_stats.spec.ts --reporter=line` with 4 tests passed
  - `npm run build`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
- Known risk:
  - Production build still reports existing circular chunk and over-500 kB chunk warnings for the heavy editor and diagram vendor stack.

### Slice 21

- Scope:
  - P1 frontmatter properties export readability
  - keep Obsidian/Zettlr-style YAML metadata readable during local HTML export and render API use
- Planned touchpoints:
  - `src/utils/frontmatter.ts`
  - `src/utils/renderApi.ts`
  - `src/utils/paper.ts`
  - `src/components/Ribbon/Ribbon.tsx`
  - `tests/render_api.spec.ts`
  - `docs/markdown-roadmap-2026-05.md`
  - `docs/upgrade-execution-log.md`
- Benchmark anchor:
  - Obsidian stores properties in YAML frontmatter at the top of Markdown files; MYmd now turns that metadata into a readable export properties card while keeping the body focused on document content.
  - Source: https://obsidian.md/help/properties
- Product management baseline:
  - Shared frontmatter parsing extracts simple `key: value` and inline array values from leading YAML blocks.
  - Render API body HTML prepends a properties card and renders the remaining Markdown body.
  - Ribbon HTML export uses the same frontmatter render path as the automation render API.
  - Export CSS gives properties a Word-like document metadata card with light and dark-mode support.
- Verification target:
  - `npm run typecheck`
  - `npx playwright test tests/render_api.spec.ts --reporter=line`
  - `npm run build`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
- Verification completed:
  - `npm run typecheck`
  - `npx playwright test tests/render_api.spec.ts --reporter=line` with 3 tests passed
  - `npm run build`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
  - Build keeps the existing vendor chunk size and circular chunk warnings for the current editor/diagram dependency stack.

### Slice 21

- Scope:
  - P1 unlinked mention conversion closure
  - turn the backlinks panel `Unlinked mentions` path into a verified knowledge-network loop
- Planned touchpoints:
  - `tests/e2e_wikilink_backlink.spec.ts`
  - `docs/markdown-roadmap-2026-05.md`
  - `docs/upgrade-execution-log.md`
- Benchmark anchor:
  - Obsidian surfaces unlinked mentions inside Backlinks so existing writing can become an explicit note connection.
  - Source: https://help.obsidian.md/plugins/backlinks
- Product management baseline:
  - The mocked Tauri knowledge layer now returns unlinked mention candidates and applies `knowledge_link_unlinked_mention` writes in E2E.
  - The regression verifies candidate display, `转为链接`, source-file Markdown update, source-note reindexing, unlinked-section removal, and linked backlink refresh.
  - The roadmap acceptance wording now requires conversion plus reindex and panel refresh evidence.
- Verification target:
  - `npm run typecheck`
  - `npx playwright test tests/e2e_wikilink_backlink.spec.ts --reporter=line`
  - `npm run build`
  - `npm run ci:repo-hygiene`
  - `git diff --check`

- Verification completed:
  - `npm run typecheck`
  - `npx playwright test tests/e2e_wikilink_backlink.spec.ts --reporter=line` with 3 tests passed
  - `npm run build`
  - `npm run ci:repo-hygiene`
  - `git diff --check`

### Slice 20

- Scope:
  - P1 preview/edit isolation
  - keep split preview a rendering surface while source editing remains the write surface
- Planned touchpoints:
  - `src/components/Editor/WysiwygEditor.tsx`
  - `tests/e2e_preview_isolation.spec.ts`
  - `tests/e2e_editor_runtime_state.spec.ts`
  - `docs/markdown-roadmap-2026-05.md`
  - `docs/upgrade-execution-log.md`
- Benchmark anchor:
  - Typora's low-friction editing depends on a single clear editing surface; MYmd split mode now preserves the same mental model by keeping preview read-only and source writable.
  - Obsidian reading/editing workflows reinforce the same boundary: navigation and preview surfaces should not unexpectedly write document state.
- Product management baseline:
  - Read-only WYSIWYG preview no longer writes `markdownUpdated` events back into the editor store.
  - Read-only preview guards paste-sync and table-width write helpers.
  - E2E now verifies that switching to split preview keeps a clean tab clean.
  - Runtime-state E2E now waits for lazy command registration and confirms split mode owns source commands while preview registers no editing command.
- Verification target:
  - `npm run typecheck`
  - `npx playwright test tests/e2e_preview_isolation.spec.ts tests/e2e_editor_runtime_state.spec.ts --reporter=line`
  - `npm run build`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
- Verification completed:
  - `npm run typecheck`
  - `npx playwright test tests/e2e_preview_isolation.spec.ts tests/e2e_editor_runtime_state.spec.ts --reporter=line` with 3 tests passed
  - `npm run build`
  - `npm run ci:repo-hygiene`
  - `git diff --check`

### Slice 19

- Scope:
  - P1 index progress and retry
  - make workspace search/indexing status visible, trustworthy, and recoverable
- Planned touchpoints:
  - `src/knowledge/service.ts`
  - `src/stores/editorStore.ts`
  - `src/components/StatusBar/StatusBar.tsx`
  - `src/components/Sidebar/FileExplorer.tsx`
  - `src/utils/editorRuntime.ts`
  - `tests/e2e_index_progress_retry.spec.ts`
  - `docs/markdown-roadmap-2026-05.md`
  - `docs/upgrade-execution-log.md`
- Benchmark anchor:
  - Joplin exposes progress counts and retry flows around sync/index reliability; MYmd applies the same trust pattern to local workspace indexing.
  - Obsidian-style status affordances informed the compact status-bar entry and details path.
  - Sources checked by research agent: Joplin search/help/changelog and Obsidian search/sync/file-recovery docs.
- Product management baseline:
  - Workspace indexing now records skipped file count and per-file diagnostics while keeping the successful index usable.
  - The status bar shows indexing progress, full indexed state, and partial-index retry state.
  - The file explorer shows an indexing status card, skipped-file details, and a retry action that clears warnings after successful rebuild.
  - Runtime state snapshots expose processed, total, and skipped counts for smoke/debug checks.
- Verification target:
  - `npm run typecheck`
  - `npx playwright test tests/e2e_index_progress_retry.spec.ts --reporter=line`
  - `npm run build`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
- Verification completed:
  - `npm run typecheck`
  - `npx playwright test tests/e2e_index_progress_retry.spec.ts --reporter=line` with 1 test passed
  - `npm run build`
  - `npm run ci:repo-hygiene`
  - `git diff --check`

### Slice 19

- Scope:
  - P0 build-health cleanup
  - reduce noisy Vite manual chunk warnings while preserving lazy editor/sidebar entrypoints
- Planned touchpoints:
  - `vite.config.ts`
  - `docs/markdown-roadmap-2026-05.md`
  - `docs/upgrade-execution-log.md`
- Product management baseline:
  - Replaced broad vendor chunk buckets with stable low-risk package buckets for React, KaTeX, icons, Tauri, and state helpers.
  - Let Rollup place editor, diagram, and Markdown runtime packages with their lazy entrypoints so the production build has a clearer chunk graph.
  - Switched the Mermaid renderer to first-render dynamic loading so routine startup and non-diagram editing paths avoid eager Mermaid core execution.
  - Reduced the production `index` JavaScript chunk from about 483.57 kB to about 224.14 kB in the local Vite build output.
  - Closed the circular manual chunk warning lane in the current Vite build.
  - Kept remaining large chunks visible for the next performance lane: `WysiwygEditor`, `SourceEditor`, `mindmap-definition`, and `flowchart-elk-definition`.
- Verification target:
  - `npm run typecheck`
  - `npm run build`
  - `npx playwright test tests/e2e_mermaid_export_fallback.spec.ts tests/render_api.spec.ts --reporter=line`
  - production preview app shell smoke on `http://127.0.0.1:4173`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
- Verification completed:
  - `npm run typecheck`
  - `npm run build` with the circular manual chunk warning lane closed
  - `npx playwright test tests/e2e_mermaid_export_fallback.spec.ts tests/render_api.spec.ts --reporter=line` with 3 tests passed
  - production preview app shell smoke on `http://127.0.0.1:4173` rendered `.app-main-shell` with title `MYmd - Markdown Editor` and screenshot `test-results/app-production-smoke.png`

### Slice 25

- Scope:
  - project management merge queue
  - turn open benchmark-alignment PRs into release waves with explicit gates
- Planned touchpoints:
  - `docs/iteration-merge-queue-2026-05.md`
  - `docs/release-iteration-playbook.md`
  - `docs/upgrade-execution-log.md`
- Benchmark anchor:
  - Obsidian and Joplin both publish visible changelog streams that connect version history to user-facing product improvements.
  - Sources: https://obsidian.md/changelog and https://joplinapp.org/help/about/changelog/desktop
- Product management baseline:
  - Open PRs #1-#11 now have a merge wave, product lane, current state, and release trigger.
  - The release playbook now points to the merge queue as the active PR-to-release sequencing surface.
  - Release packaging remains tied to merged `main` evidence and the existing smoke gate.
- Verification target:
  - `git diff --check`
  - `npm run ci:repo-hygiene`
  - `npm run typecheck`
  - official changelog link checks
- Verification completed:
  - `git diff --check`
  - `npm run ci:repo-hygiene`
  - `npm run typecheck`
  - Obsidian changelog HEAD request returned 200
  - Joplin desktop changelog HEAD request returned 200

### Slice 26

- Scope:
  - release readiness queue refresh
  - capture PR #1-#12 gate state after the latest review-pass updates
- Planned touchpoints:
  - `docs/iteration-merge-queue-2026-05.md`
  - `docs/upgrade-execution-log.md`
- Product management baseline:
  - PR #1 now shows `BLOCKED / REVIEW_REQUIRED` after the main-sync verification pass.
  - PR #12 is now represented in the queue as the release-management PR for Wave 0.
  - The queue records a dated readiness snapshot linking PR #1-#12 verification comments.
  - PR #9, #10, and #11 now point to concrete verification comments for plugin API, writing stats, and deterministic local asset gates.
  - Release packaging remains tied to merged `main` evidence and the desktop smoke gate.
- Verification target:
  - `git diff --check`
  - `npm run ci:repo-hygiene`
  - `npm run typecheck`
- Verification completed:
  - `git diff --check`
  - `npm run ci:repo-hygiene`
  - `npm run typecheck`
  - `gh pr list --state open --json number,title,headRefName,mergeStateStatus,reviewDecision,updatedAt,url --limit 20`

### Slice 27

- Scope:
  - active goal artifact audit
  - map the long-running Markdown benchmark alignment objective to repository evidence and current blockers
- Planned touchpoints:
  - `docs/active-goal-artifact-audit-2026-05.md`
  - `docs/release-iteration-playbook.md`
  - `docs/upgrade-execution-log.md`
- Product management baseline:
  - Added a prompt-to-artifact checklist covering benchmark alignment, gap backlog, implementation slices, verification evidence, release packaging, runtime smoke, retrospective logs, and current blockers.
  - Recorded the latest published release evidence for `v1.4.3-hotfix8`.
  - Recorded the current open PR state as `BLOCKED / REVIEW_REQUIRED` for PR #1-#12.
  - Linked the release playbook to the active goal audit so future iteration work has one evidence checklist.
- Verification target:
  - `npm run typecheck`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
  - `gh release view --json tagName,name,isDraft,isPrerelease,publishedAt,url,assets`
  - `gh pr list --state open --json number,title,headRefName,mergeStateStatus,reviewDecision,updatedAt,url --limit 20`
- Verification completed:
  - `npm run typecheck`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
  - `gh release view --json tagName,name,isDraft,isPrerelease,publishedAt,url,assets`
  - `gh pr list --state open --json number,title,headRefName,mergeStateStatus,reviewDecision,updatedAt,url --limit 20`

### Slice 28

- Scope:
  - merge queue refresh for graph view filter slice
  - keep release waves aligned after PR #13 creation
- Planned touchpoints:
  - `docs/iteration-merge-queue-2026-05.md`
  - `docs/active-goal-artifact-audit-2026-05.md`
  - `docs/upgrade-execution-log.md`
- Product management baseline:
  - Added PR #13 `young/graph-view-filter-set` to Wave 4 as P3 graph sensemaking scope.
  - Linked PR #13 verification evidence covering typecheck, graph panel E2E, build, repo hygiene, diff check, and cargo check.
  - Updated the active-goal audit from PR #1-#12 to PR #1-#13.
- Verification target:
  - `npm run typecheck`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
  - `gh pr list --state open --json number,title,headRefName,mergeStateStatus,reviewDecision,updatedAt,url --limit 20`
- Verification completed:
  - `npm run typecheck`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
  - `gh pr list --state open --json number,title,headRefName,mergeStateStatus,reviewDecision,updatedAt,url --limit 25`

### Slice 29

- Scope:
  - merge queue refresh for build-health slice
  - keep release waves aligned after PR #14 creation
- Planned touchpoints:
  - `docs/iteration-merge-queue-2026-05.md`
  - `docs/active-goal-artifact-audit-2026-05.md`
  - `docs/upgrade-execution-log.md`
- Product management baseline:
  - Added PR #14 `young/vite-chunk-warning-cleanup` to Wave 0 as P0 build-health scope.
  - Linked PR #14 verification evidence covering typecheck, build, Mermaid export regression, production preview smoke, repo hygiene, and diff check.
  - Updated the active-goal audit from PR #1-#13 to PR #1-#14.
  - Marked the circular manual chunk warning lane as closed while keeping large editor/diagram chunks visible for a future performance slice.
- Verification target:
  - `npm run typecheck`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
  - `gh pr list --state open --json number,title,headRefName,mergeStateStatus,reviewDecision,updatedAt,url --limit 25`
- Verification completed:
  - `npm run typecheck`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
  - `gh pr list --state open --json number,title,headRefName,mergeStateStatus,reviewDecision,updatedAt,url --limit 25`

### Slice 30

- Scope:
  - active goal completion audit refresh
  - keep the long-running benchmark alignment goal tied to real repository and GitHub evidence
- Planned touchpoints:
  - `docs/active-goal-artifact-audit-2026-05.md`
  - `docs/markdown-roadmap-2026-05.md`
  - `docs/upgrade-execution-log.md`
- Product management baseline:
  - Added a deliverable-to-evidence completion audit table for benchmark alignment, gap closure, iteration management, implementation evidence, verification evidence, packaging, runtime smoke, and retrospective notes.
  - Recorded the current completion decision as ongoing because PR #1-#14 are open and next packaging starts after a merge wave reaches `main`.
  - Synchronized the roadmap build-warning row with PR #14: circular manual chunk warnings are closed, while WYSIWYG/source editor and Mermaid definition chunks remain tracked.
- Verification target:
  - `npm run typecheck`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
  - `gh release view v1.4.3-hotfix8 --json tagName,name,isDraft,isPrerelease,publishedAt,url,assets`
  - `gh pr list --state open --json number,title,headRefName,mergeStateStatus,reviewDecision,updatedAt,url --limit 25`
- Verification completed:
  - `npm run typecheck`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
  - `gh release view v1.4.3-hotfix8 --json tagName,name,isDraft,isPrerelease,publishedAt,url,assets`
  - `gh pr list --state open --json number,title,headRefName,mergeStateStatus,reviewDecision,updatedAt,url --limit 25`

### Slice 31

- Scope:
  - PR #14 Mermaid runtime loader retry hardening
  - merge queue evidence refresh for the latest build-health verification
- Planned touchpoints:
  - `src/utils/mermaid.ts`
  - `docs/iteration-merge-queue-2026-05.md`
  - `docs/active-goal-artifact-audit-2026-05.md`
  - `docs/upgrade-execution-log.md`
- Product management baseline:
  - Hardened the lazy Mermaid loader so transient dynamic import failures clear the cached loader promise and the next render/export attempt can retry.
  - Updated PR #14 readiness evidence to the latest verification comment covering typecheck, build, targeted Mermaid/export regression, production preview smoke, repo hygiene, and diff check.
  - Refreshed the active-goal audit history reference so the release-management trail includes this build-health hardening slice.
- Verification target:
  - `npm run typecheck`
  - `npm run build`
  - `npx playwright test tests/e2e_mermaid_export_fallback.spec.ts tests/render_api.spec.ts --reporter=line`
  - production preview smoke on `http://127.0.0.1:4173`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
  - `gh pr list --state open --json number,title,headRefName,mergeStateStatus,reviewDecision,updatedAt,url --limit 25`
- Verification completed:
  - `npm run typecheck`
  - `npm run build`
  - `npx playwright test tests/e2e_mermaid_export_fallback.spec.ts tests/render_api.spec.ts --reporter=line`
  - production preview smoke on `http://127.0.0.1:4173`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
  - `gh pr list --state open --json number,title,headRefName,mergeStateStatus,reviewDecision,updatedAt,url --limit 25`

### Slice 32

- Scope:
  - PR #14 SourceEditor code-fence language loading budget
  - build-health queue evidence refresh after SourceEditor chunk reduction
- Planned touchpoints:
  - `src/components/Editor/SourceEditor.tsx`
  - `src/components/Editor/commonMarkdownCodeLanguages.ts`
  - `package.json`
  - `package-lock.json`
  - `docs/iteration-merge-queue-2026-05.md`
  - `docs/active-goal-artifact-audit-2026-05.md`
  - `docs/markdown-roadmap-2026-05.md`
  - `docs/upgrade-execution-log.md`
- Product management baseline:
  - Replaced the full `@codemirror/language-data` catalog in SourceEditor with a curated Markdown code-fence language budget covering JS/TS/JSX/TSX, JSON, HTML, CSS, Python, SQL, XML, and YAML.
  - Removed rare CodeMirror language packages pulled only by `@codemirror/language-data` from the lockfile.
  - Reduced the PR #14 build graph from 3745 to 3632 transformed modules and reduced the SourceEditor production chunk from about 650.43 kB / 220.21 kB gzip to about 619.98 kB / 212.27 kB gzip.
  - Updated the merge queue and active-goal audit to point at the latest PR #14 verification comment.
- Verification target:
  - `npm run typecheck`
  - `npm run build`
  - `npx playwright test tests/e2e_document_search_recent.spec.ts tests/e2e_source_html_paste.spec.ts --reporter=line`
  - production preview SourceEditor smoke on `http://127.0.0.1:4173`
  - `rg` language-data reference check across `package.json`, `package-lock.json`, and `src`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
- Verification completed:
  - `npm run typecheck`
  - `npm run build`
  - `npx playwright test tests/e2e_document_search_recent.spec.ts tests/e2e_source_html_paste.spec.ts --reporter=line`
  - production preview SourceEditor smoke on `http://127.0.0.1:4173`
  - `rg` language-data reference check across `package.json`, `package-lock.json`, and `src`
  - `npm run ci:repo-hygiene`
  - `git diff --check`

### Slice 33

- Scope:
  - PR #14 split-preview editor sync timing stabilization
  - build-health queue evidence refresh after Wysiwyg startup smoke
- Planned touchpoints:
  - `src/components/Editor/WysiwygEditor.tsx`
  - `docs/iteration-merge-queue-2026-05.md`
  - `docs/active-goal-artifact-audit-2026-05.md`
  - `docs/upgrade-execution-log.md`
- Product management baseline:
  - Added a guarded retry around external Markdown sync when Milkdown exposes content changes before the `editorView` context is ready during split preview startup.
  - Cleared the retry timer during component cleanup so editor sync remains bounded to the active Wysiwyg instance.
  - Updated PR #14 readiness evidence to the latest verification comment covering typecheck, build, repo hygiene, diff check, and the production preview smoke evidence for the previous console-noise regression.
- Verification target:
  - `npm run typecheck`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
  - `npm run build`
  - `gh pr list --state open --json number,title,headRefName,mergeStateStatus,reviewDecision,updatedAt,url --limit 25`
- Verification completed:
  - `npm run typecheck`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
  - `npm run build`
  - `gh pr list --state open --json number,title,headRefName,mergeStateStatus,reviewDecision,updatedAt,url --limit 25`

### Slice 34

- Scope:
  - Wave 0 review handoff for release readiness
  - reduce review friction before the next packaging lane
- Planned touchpoints:
  - `docs/wave0-review-handoff-2026-05.md`
  - `docs/iteration-merge-queue-2026-05.md`
  - `docs/active-goal-artifact-audit-2026-05.md`
  - `docs/upgrade-execution-log.md`
- Product management baseline:
  - Added a reviewer handoff for PR #1, #14, and #12 with review order, focus areas, evidence links, main-branch gates, packaging trigger, and rollback boundaries.
  - Linked the handoff from the merge queue and active-goal audit so Wave 0 review has one current execution surface.
- Verification target:
  - `npm run typecheck`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
  - `gh pr list --state open --json number,title,headRefName,mergeStateStatus,reviewDecision,updatedAt,url --limit 25`
- Verification completed:
  - `npm run typecheck`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
  - `gh pr list --state open --json number,title,headRefName,mergeStateStatus,reviewDecision,updatedAt,url --limit 25`

### Slice 35

- Scope:
  - active-goal evidence audit automation
  - make release-management checks repeatable from `npm`
- Planned touchpoints:
  - `scripts/iteration-goal-audit.mjs`
  - `package.json`
  - `docs/release-iteration-playbook.md`
  - `docs/active-goal-artifact-audit-2026-05.md`
  - `docs/upgrade-execution-log.md`
- Product management baseline:
  - Added `npm run iteration:audit` to verify the roadmap, release playbook, merge queue, active-goal audit, execution log, Wave 0 handoff, open PR queue state, and latest release assets.
  - Added an `--offline` option for docs-only checks and `--json` output for machine-readable audit reports.
- Verification target:
  - `npm run iteration:audit`
  - `npm run iteration:audit -- --offline`
  - `node --check scripts/iteration-goal-audit.mjs`
  - `npm run typecheck`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
- Verification completed:
  - `npm run iteration:audit`
  - `npm run iteration:audit -- --offline`
  - `node --check scripts/iteration-goal-audit.mjs`
  - `npm run typecheck`
  - `npm run ci:repo-hygiene`
  - `git diff --check`

### Slice 36

- Scope:
  - `v1.4.3-hotfix8` release retrospective
  - close the review loop for the latest shipped tag-completion release lane
- Planned touchpoints:
  - `docs/release-retrospective-v1.4.3-hotfix8.md`
  - `scripts/iteration-goal-audit.mjs`
  - `docs/release-iteration-playbook.md`
  - `docs/active-goal-artifact-audit-2026-05.md`
  - `docs/upgrade-execution-log.md`
- Product management baseline:
  - Added a release retrospective mapping benchmark input, requirement scope, implementation evidence, verification, packaging, runtime smoke, published release link, friction, and follow-ups.
  - Added the retrospective to the repeatable iteration audit so future goal checks cover the release review loop.
- Verification target:
  - `npm run iteration:audit`
  - `npm run iteration:audit -- --offline`
  - `node --check scripts/iteration-goal-audit.mjs`
  - `npm run typecheck`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
- Verification completed:
  - `npm run iteration:audit`
  - `npm run iteration:audit -- --offline`
  - `node --check scripts/iteration-goal-audit.mjs`
  - `npm run typecheck`
  - `npm run ci:repo-hygiene`
  - `git diff --check`

### Slice 37

- Scope:
  - mainstream Markdown benchmark source refresh
  - keep roadmap priority pressure grounded in current upstream evidence
- Planned touchpoints:
  - `docs/benchmark-source-refresh-2026-05-15.md`
  - `docs/markdown-roadmap-2026-05.md`
  - `scripts/iteration-goal-audit.mjs`
  - `docs/active-goal-artifact-audit-2026-05.md`
  - `docs/upgrade-execution-log.md`
- Product management baseline:
  - Refreshed source-backed observations for Obsidian, Joplin, Typora, iA Writer, MarkText, Zettlr, Cherry Markdown, and doocs/md.
  - Preserved the current MYmd positioning around local-first editing, natural knowledge affordances, release reliability, and staged advanced lanes.
  - Added the source refresh artifact to `npm run iteration:audit`.
  - Hardened the GitHub-backed audit command with bounded retries after a transient `gh release view` EOF surfaced during verification.
- Verification target:
  - `npm run iteration:audit`
  - `npm run iteration:audit -- --check-sources`
  - `npm run iteration:audit -- --offline`
  - `node --check scripts/iteration-goal-audit.mjs`
  - `npm run typecheck`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
- Verification completed:
  - `npm run iteration:audit`
  - `npm run iteration:audit -- --check-sources`
  - `npm run iteration:audit -- --offline`
  - `node --check scripts/iteration-goal-audit.mjs`
  - `npm run typecheck`
  - `npm run ci:repo-hygiene`
  - `git diff --check`

### Slice 38

- Scope:
  - Wave 0 main-branch gate automation
  - make the post-review validation path executable
- Planned touchpoints:
  - `scripts/wave-gate-check.mjs`
  - `package.json`
  - `docs/wave0-review-handoff-2026-05.md`
  - `docs/release-iteration-playbook.md`
  - `docs/active-goal-artifact-audit-2026-05.md`
  - `docs/upgrade-execution-log.md`
- Product management baseline:
  - Added `npm run wave0:gate` to run the post-merge Wave 0 validation sequence from one command.
  - The gate runs iteration audit, TypeScript health, production build, repo hygiene, and whitespace diff checks.
  - Added `--dry-run` and `--skip-build` options for command preview and faster local diagnosis.
  - Unsupported wave values fail fast so later release waves can add explicit gates instead of silently reusing Wave 0 behavior.
  - Hardened Windows command execution and spawn-error reporting after the first full gate run exposed a `spawnSync npm.cmd EINVAL` failure.
- Verification target:
  - `npm run wave0:gate -- --dry-run`
  - `npm run wave0:gate`
  - `node --check scripts/wave-gate-check.mjs`
  - `npm run iteration:audit`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
- Verification completed:
  - `node --check scripts/wave-gate-check.mjs`
  - `npm run wave0:gate -- --dry-run`
  - `npm run wave0:gate -- --wave 1 --dry-run` exits with the expected unsupported-wave failure.
  - `npm run iteration:audit`
  - `npm run wave0:gate`
  - Gate output passed iteration audit, TypeScript health, production web build, repo hygiene, and whitespace diff check.

### Slice 39

- Scope:
  - Wave 0 gate audit coverage
  - keep release-management automation self-checking
- Planned touchpoints:
  - `scripts/iteration-goal-audit.mjs`
  - `docs/active-goal-artifact-audit-2026-05.md`
  - `docs/upgrade-execution-log.md`
- Product management baseline:
  - Extended `npm run iteration:audit` so it verifies the `wave0:gate` package command.
  - Added script-marker checks for the Wave 0 gate sequence, including iteration audit, typecheck, build, repo hygiene, diff check, dry-run, and skip-build support.
  - Updated the active-goal audit evidence row so Wave 0 gate wiring is part of the durable project-management checklist.
- Verification target:
  - `node --check scripts/iteration-goal-audit.mjs`
  - `npm run iteration:audit -- --offline`
  - `npm run iteration:audit`
  - `npm run wave0:gate -- --dry-run`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
- Verification completed:
  - `node --check scripts/iteration-goal-audit.mjs`
  - `npm run iteration:audit -- --offline` with 12 checks passed.
  - `npm run wave0:gate -- --dry-run`
  - `npm run wave0:gate` with 40 iteration-audit checks and all 5 gate steps passed.

### Slice 40

- Scope:
  - active-goal audit freshness
  - keep the completion audit aligned with the latest release-management slices
- Planned touchpoints:
  - `scripts/iteration-goal-audit.mjs`
  - `docs/active-goal-artifact-audit-2026-05.md`
  - `docs/upgrade-execution-log.md`
- Product management baseline:
  - Updated the active-goal audit refresh note to include Wave 0 gate automation and self-audit coverage.
  - Updated implementation-history evidence from slices 12-19 and 25-32 to slices 12-19 and 25-39.
  - Extended `npm run iteration:audit` document markers so the execution log must include `### Slice 39`.
- Verification target:
  - `node --check scripts/iteration-goal-audit.mjs`
  - `npm run iteration:audit -- --offline`
  - `npm run iteration:audit`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
- Verification completed:
  - `node --check scripts/iteration-goal-audit.mjs`
  - `npm run iteration:audit -- --offline` with 14 checks passed.
  - `npm run iteration:audit` with 42 checks passed.
  - `npm run ci:repo-hygiene`
  - `git diff --check`

### Slice 43

- Scope:
  - release packaging gate automation
  - make post-merge installer packaging validation executable from one command
- Planned touchpoints:
  - `scripts/release-gate-check.mjs`
  - `scripts/iteration-goal-audit.mjs`
  - `package.json`
  - `docs/release-iteration-playbook.md`
  - `docs/iteration-merge-queue-2026-05.md`
  - `docs/active-goal-artifact-audit-2026-05.md`
  - `docs/upgrade-execution-log.md`
- Product management baseline:
  - Added `npm run release:gate` for the post-merge packaging lane.
  - The gate runs Tauri packaging, Electron packaging, release smoke, typecheck, repo hygiene, and whitespace diff checks.
  - Added dry-run and skip options so the command can be previewed while Wave 0 is still review-gated.
  - The gate prepends `E:\EnvConfig\cargo\bin` to `PATH` on Windows before native packaging.
  - Extended `npm run iteration:audit` so it verifies the release gate package command, script markers, and docs markers.
- Verification target:
  - `node --check scripts/release-gate-check.mjs`
  - `node --check scripts/iteration-goal-audit.mjs`
  - `npm run release:gate -- --dry-run`
  - `npm run release:gate -- --skip-packaging --skip-smoke`
  - `npm run iteration:audit -- --offline`
  - `npm run iteration:audit`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
- Verification completed:
  - `node --check scripts/release-gate-check.mjs`
  - `node --check scripts/iteration-goal-audit.mjs`
  - `npm run release:gate -- --dry-run`
  - `npm run release:gate -- --skip-packaging --skip-smoke` with typecheck, repo hygiene, and diff check passed.
  - `npm run iteration:audit -- --offline` with 16 checks passed.
  - `npm run iteration:audit` with 44 checks passed.
  - `npm run ci:repo-hygiene`
  - `git diff --check`
- Verification completed:
  - `node --check scripts/iteration-goal-audit.mjs`
  - `npm run iteration:audit -- --offline` with 12 checks passed.
  - `npm run iteration:audit` with 40 checks passed.
  - `npm run ci:repo-hygiene`
  - `git diff --check`

### Slice 42

- Scope:
  - README release alignment audit
  - make landing-page release references part of the active-goal evidence loop
- Planned touchpoints:
  - `scripts/iteration-goal-audit.mjs`
  - `docs/active-goal-artifact-audit-2026-05.md`
  - `docs/upgrade-execution-log.md`
- Product management baseline:
  - Added README/README_en release-marker checks to `npm run iteration:audit`.
  - The audit now checks the latest release tag, Tauri NSIS/MSI asset names, and local release staging path in both README files.
  - Updated the active-goal audit checklist so README release references are part of release evidence.
- Verification target:
  - `node --check scripts/iteration-goal-audit.mjs`
  - `npm run iteration:audit -- --offline`
  - `npm run iteration:audit`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
- Verification completed:
  - `node --check scripts/iteration-goal-audit.mjs`
  - `npm run iteration:audit -- --offline` with 12 checks passed.
  - `npm run iteration:audit` with 40 checks passed.
  - `npm run ci:repo-hygiene`
  - `git diff --check`

### Slice 41

- Scope:
  - Wave 0 evidence link refresh
  - keep review handoff and merge queue aligned with the latest PR #12 validation comments
- Planned touchpoints:
  - `docs/wave0-review-handoff-2026-05.md`
  - `docs/iteration-merge-queue-2026-05.md`
  - `scripts/iteration-goal-audit.mjs`
  - `docs/upgrade-execution-log.md`
- Product management baseline:
  - Updated PR #12 evidence links to the latest active-goal audit freshness comment.
  - Updated the Wave 0 gate description in the merge queue to use `npm run wave0:gate`.
  - Extended `npm run iteration:audit` document markers so the merge queue must mention `npm run wave0:gate`.
- Verification target:
  - `node --check scripts/iteration-goal-audit.mjs`
  - `npm run iteration:audit -- --offline`
  - `npm run iteration:audit`
  - `npm run ci:repo-hygiene`
  - `git diff --check`

### Slice 44

- Scope:
  - release gate environment preflight
  - verify Windows Cargo availability before native packaging starts
- Planned touchpoints:
  - `scripts/release-gate-check.mjs`
  - `scripts/iteration-goal-audit.mjs`
  - `docs/release-iteration-playbook.md`
  - `docs/active-goal-artifact-audit-2026-05.md`
  - `docs/upgrade-execution-log.md`
- Product management baseline:
  - Added `npm run release:gate -- --check-env-only` as a fast packaging-readiness check.
  - The release gate now checks `E:\EnvConfig\cargo\bin\cargo.exe` before Tauri packaging and prints the resolved Cargo executable path.
  - Extended `npm run iteration:audit` so the playbook, active-goal audit, execution log, and release-gate script markers cover the environment preflight.
- Verification target:
  - `node --check scripts/release-gate-check.mjs`
  - `node --check scripts/iteration-goal-audit.mjs`
  - `npm run release:gate -- --check-env-only`
  - `npm run release:gate -- --dry-run`
  - `npm run release:gate -- --skip-packaging --skip-smoke`
  - `npm run iteration:audit -- --offline`
  - `npm run iteration:audit`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
- Verification completed:
  - `node --check scripts/release-gate-check.mjs`
  - `node --check scripts/iteration-goal-audit.mjs`
  - `npm run release:gate -- --check-env-only` with Cargo available at `E:\EnvConfig\cargo\bin\cargo.exe`.
  - `npm run release:gate -- --dry-run` with all 6 release gate steps listed.
  - `npm run release:gate -- --skip-packaging --skip-smoke` with typecheck, repo hygiene, and diff check passed.
  - `npm run iteration:audit -- --offline` with 16 checks passed.
  - `npm run iteration:audit` with 44 checks passed.
  - `npm run ci:repo-hygiene`
  - `git diff --check`

### Slice 45

- Scope:
  - Wave 0 review handoff refresh
  - align reviewer-facing merge and packaging steps with the release gate preflight
- Planned touchpoints:
  - `docs/iteration-merge-queue-2026-05.md`
  - `docs/wave0-review-handoff-2026-05.md`
  - `docs/active-goal-artifact-audit-2026-05.md`
  - `scripts/iteration-goal-audit.mjs`
  - `docs/upgrade-execution-log.md`
- Product management baseline:
  - Updated PR #12 readiness evidence to the latest release gate preflight verification comment.
  - Updated the Wave 0 reviewer handoff so the main-branch gate includes `npm run iteration:audit`.
  - Updated the packaging trigger to run `npm run release:gate -- --check-env-only` before `npm run release:gate`.
  - Extended `npm run iteration:audit` so the merge queue and Wave 0 handoff must keep the preflight command visible.
- Verification target:
  - `node --check scripts/iteration-goal-audit.mjs`
  - `npm run iteration:audit -- --offline`
  - `npm run iteration:audit`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
- Verification completed:
  - `node --check scripts/iteration-goal-audit.mjs`
  - `npm run iteration:audit -- --offline` with 16 checks passed.
  - `npm run iteration:audit` with 44 checks passed.
  - `npm run ci:repo-hygiene`
  - `git diff --check`

### Slice 47

- Scope:
  - Wave 1 index reliability evidence refresh
  - keep PR #2 merge-queue evidence aligned with current branch verification
- Planned touchpoints:
  - `docs/iteration-merge-queue-2026-05.md`
  - `scripts/iteration-goal-audit.mjs`
  - `docs/upgrade-execution-log.md`
- Product management baseline:
  - Verified PR #2 current head with typecheck, production build, repo hygiene, diff check, and index progress/retry E2E.
  - Updated the merge queue PR #2 evidence link to the latest validation comment.
  - Extended `npm run iteration:audit` document markers so the execution log tracks the Wave 1 evidence refresh.
- Verification target:
  - `node --check scripts/iteration-goal-audit.mjs`
  - `npm run iteration:audit -- --offline`
  - `npm run iteration:audit`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
- Verification completed:
  - `node --check scripts/iteration-goal-audit.mjs`
  - `npm run iteration:audit -- --offline` with 16 checks passed.
  - `npm run iteration:audit` with 44 checks passed.
  - `npm run ci:repo-hygiene`
  - `git diff --check`

### Slice 48

- Scope:
  - Wave 1 preview/edit isolation evidence refresh
  - keep PR #3 merge-queue evidence aligned with current branch verification
- Planned touchpoints:
  - `docs/iteration-merge-queue-2026-05.md`
  - `scripts/iteration-goal-audit.mjs`
  - `docs/upgrade-execution-log.md`
- Product management baseline:
  - Verified PR #3 current head with typecheck, production build, repo hygiene, diff check, and preview isolation/runtime E2E.
  - Confirmed split preview readonly behavior and editor runtime state isolation through targeted Playwright coverage.
  - Updated the merge queue PR #3 evidence link to the latest validation comment.
  - Extended `npm run iteration:audit` document markers so the execution log tracks the Wave 1 preview/edit safety evidence refresh.
- Verification target:
  - `node --check scripts/iteration-goal-audit.mjs`
  - `npm run iteration:audit -- --offline`
  - `npm run iteration:audit`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
- Verification completed:
  - `node --check scripts/iteration-goal-audit.mjs`
  - `npm run iteration:audit -- --offline` with 16 checks passed.
  - `npm run iteration:audit` with 44 checks passed.
  - `npm run ci:repo-hygiene`
  - `git diff --check`

### Slice 49

- Scope:
  - Wave 2 knowledge network evidence refresh
  - keep PR #4 merge-queue evidence aligned with current branch verification
- Planned touchpoints:
  - `docs/iteration-merge-queue-2026-05.md`
  - `scripts/iteration-goal-audit.mjs`
  - `docs/upgrade-execution-log.md`
- Product management baseline:
  - Verified PR #4 current head with typecheck, production build, repo hygiene, diff check, and targeted Playwright coverage.
  - Confirmed wikilink completion, backlink alignment, unlinked mention conversion, rename parsing, and file action behavior through 11 tests.
  - Updated the merge queue PR #4 evidence link to the latest validation comment.
  - Extended `npm run iteration:audit` document markers so the execution log tracks the Wave 2 knowledge network evidence refresh.
- Verification target:
  - `node --check scripts/iteration-goal-audit.mjs`
  - `npm run iteration:audit -- --offline`
  - `npm run iteration:audit`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
- Verification completed:
  - `node --check scripts/iteration-goal-audit.mjs`
  - `npm run iteration:audit -- --offline` with 16 checks passed.
  - `npm run iteration:audit` with 44 checks passed.
  - `npm run ci:repo-hygiene`
  - `git diff --check`

### Slice 50

- Scope:
  - Wave 3 render/export fidelity evidence refresh
  - keep PR #5 merge-queue evidence aligned with current branch verification and follow-up fix
- Planned touchpoints:
  - `docs/iteration-merge-queue-2026-05.md`
  - `scripts/iteration-goal-audit.mjs`
  - `docs/upgrade-execution-log.md`
- Product management baseline:
  - Verified PR #5 current head with typecheck, production build, repo hygiene, diff check, and targeted Playwright coverage.
  - Fixed custom paper status feedback so the status bar exposes resolved dimensions alongside the persisted export canvas settings.
  - Confirmed render API footnotes, export HTML document fidelity, and export profile interactions through 13 tests.
  - Updated the merge queue PR #5 evidence link to the latest validation comment.
  - Extended `npm run iteration:audit` document markers so the execution log tracks the Wave 3 render/export fidelity evidence refresh.
- Verification target:
  - `node --check scripts/iteration-goal-audit.mjs`
  - `npm run iteration:audit -- --offline`
  - `npm run iteration:audit`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
- Verification completed:
  - `node --check scripts/iteration-goal-audit.mjs`
  - `npm run iteration:audit -- --offline` with 16 checks passed.
  - `npm run iteration:audit` with 44 checks passed.
  - `npm run ci:repo-hygiene`
  - `git diff --check`

### Slice 51

- Scope:
  - Wave 3 daily editing evidence refresh
  - keep PR #6 merge-queue evidence aligned with current branch verification
- Planned touchpoints:
  - `docs/iteration-merge-queue-2026-05.md`
  - `scripts/iteration-goal-audit.mjs`
  - `docs/upgrade-execution-log.md`
- Product management baseline:
  - Verified PR #6 current head with typecheck, production build, repo hygiene, diff check, and task-list direct-toggle E2E.
  - Confirmed WYSIWYG task checkboxes update Markdown source directly, split source reflects the toggled state, and split preview checkboxes stay readonly.
  - Updated the merge queue PR #6 evidence link to the latest validation comment.
  - Extended `npm run iteration:audit` document markers so the execution log tracks the Wave 3 daily editing evidence refresh.
- Verification target:
  - `node --check scripts/iteration-goal-audit.mjs`
  - `npm run iteration:audit -- --offline`
  - `npm run iteration:audit`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
- Verification completed:
  - `node --check scripts/iteration-goal-audit.mjs`
  - `npm run iteration:audit -- --offline` with 16 checks passed.
  - `npm run iteration:audit` with 44 checks passed.
  - `npm run ci:repo-hygiene`
  - `git diff --check`

### Slice 52

- Scope:
  - Wave 3 writing polish evidence refresh
  - keep PR #7 merge-queue evidence aligned with current branch verification
- Planned touchpoints:
  - `docs/iteration-merge-queue-2026-05.md`
  - `scripts/iteration-goal-audit.mjs`
  - `docs/upgrade-execution-log.md`
- Product management baseline:
  - Verified PR #7 current head with typecheck, production build, repo hygiene, diff check, immersive modes E2E, and layout profile status-bar regression coverage.
  - Confirmed focus and typewriter behavior stays aligned across WYSIWYG, split source, and split preview editing surfaces.
  - Updated the merge queue PR #7 evidence link to the latest validation comment.
  - Extended `npm run iteration:audit` document markers so the execution log tracks the Wave 3 writing polish evidence refresh.
- Verification target:
  - `node --check scripts/iteration-goal-audit.mjs`
  - `npm run iteration:audit -- --offline`
  - `npm run iteration:audit`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
- Verification completed:
  - `node --check scripts/iteration-goal-audit.mjs`
  - `npm run iteration:audit -- --offline`
  - `npm run iteration:audit`
  - `npm run ci:repo-hygiene`
  - `git diff --check`

### Slice 53

- Scope:
  - Wave 3 export/properties evidence refresh
  - keep PR #8 merge-queue evidence aligned with current branch verification
- Planned touchpoints:
  - `docs/iteration-merge-queue-2026-05.md`
  - `scripts/iteration-goal-audit.mjs`
  - `docs/upgrade-execution-log.md`
- Product management baseline:
  - Verified PR #8 current head with typecheck, render API frontmatter/export document tests, production build, repo hygiene, and diff check.
  - Confirmed leading YAML renders as an export properties card and the full HTML export document path stays covered through the shared render API.
  - Updated the merge queue PR #8 evidence link to the latest validation comment.
  - Extended `npm run iteration:audit` document markers so the execution log tracks the Wave 3 export/properties evidence refresh.
- Verification target:
  - `node --check scripts/iteration-goal-audit.mjs`
  - `npm run iteration:audit -- --offline`
  - `npm run iteration:audit`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
- Verification completed:
  - `node --check scripts/iteration-goal-audit.mjs`
  - `npm run iteration:audit -- --offline`
  - `npm run iteration:audit`
  - `npm run ci:repo-hygiene`
  - `git diff --check`

### Slice 54

- Scope:
  - Wave 3 writing stats evidence refresh
  - keep PR #10 merge-queue evidence aligned with current branch verification
- Planned touchpoints:
  - `docs/iteration-merge-queue-2026-05.md`
  - `scripts/iteration-goal-audit.mjs`
  - `docs/upgrade-execution-log.md`
- Product management baseline:
  - Verified PR #10 current head with typecheck, Markdown-aware writing stats tests, benchmark source link checks, production build, repo hygiene, and diff check.
  - Confirmed writing stats count visible Markdown text across syntax stripping, frontmatter/comment/table handling, mixed CJK and Latin prose, and empty documents.
  - Updated the merge queue PR #10 evidence link to the latest validation comment.
  - Extended `npm run iteration:audit` document markers so the execution log tracks the Wave 3 writing stats evidence refresh.
- Verification target:
  - `node --check scripts/iteration-goal-audit.mjs`
  - `npm run iteration:audit -- --offline`
  - `npm run iteration:audit`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
- Verification completed:
  - `node --check scripts/iteration-goal-audit.mjs`
  - `npm run iteration:audit -- --offline`
  - `npm run iteration:audit`
  - `npm run ci:repo-hygiene`
  - `git diff --check`

### Slice 55

- Scope:
  - Wave 3 deterministic local asset evidence refresh
  - keep PR #11 merge-queue evidence aligned with current branch verification
- Planned touchpoints:
  - `docs/iteration-merge-queue-2026-05.md`
  - `scripts/iteration-goal-audit.mjs`
  - `docs/upgrade-execution-log.md`
- Product management baseline:
  - Verified PR #11 current head with typecheck, deterministic local asset tests, production build, repo hygiene, and diff check.
  - Confirmed local image asset names stay stable for identical bytes, separate changed bytes by hash, sanitize unsafe path and extension input, and infer image extensions from MIME types.
  - Updated the merge queue PR #11 evidence link to the latest validation comment.
  - Extended `npm run iteration:audit` document markers so the execution log tracks the Wave 3 deterministic local asset evidence refresh.
- Verification target:
  - `node --check scripts/iteration-goal-audit.mjs`
  - `npm run iteration:audit -- --offline`
  - `npm run iteration:audit`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
- Verification completed:
  - `node --check scripts/iteration-goal-audit.mjs`
  - `npm run iteration:audit -- --offline`
  - `npm run iteration:audit`
  - `npm run ci:repo-hygiene`
  - `git diff --check`

### Slice 56

- Scope:
  - Wave 4 readonly plugin API evidence refresh
  - keep PR #9 merge-queue evidence aligned with current branch verification
- Planned touchpoints:
  - `docs/iteration-merge-queue-2026-05.md`
  - `scripts/iteration-goal-audit.mjs`
  - `docs/upgrade-execution-log.md`
- Product management baseline:
  - Verified PR #9 current head with typecheck, plugin API registration/cleanup tests, production build, repo hygiene, and diff check.
  - Confirmed readonly plugin commands use stable namespaced ids, title fallback ids remain available, and sidebar cards plus search providers clean up safely.
  - Updated the merge queue PR #9 evidence link to the latest validation comment.
  - Extended `npm run iteration:audit` document markers so the execution log tracks the Wave 4 readonly plugin API evidence refresh.
- Verification target:
  - `node --check scripts/iteration-goal-audit.mjs`
  - `npm run iteration:audit -- --offline`
  - `npm run iteration:audit`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
- Verification completed:
  - `node --check scripts/iteration-goal-audit.mjs`
  - `npm run iteration:audit -- --offline`
  - `npm run iteration:audit`
  - `npm run ci:repo-hygiene`
  - `git diff --check`

### Slice 57

- Scope:
  - post-Wave 0 merge queue state refresh
  - make iteration audit understand merged PRs as first-class queue states
- Planned touchpoints:
  - `docs/iteration-merge-queue-2026-05.md`
  - `scripts/iteration-goal-audit.mjs`
  - `docs/upgrade-execution-log.md`
- Product management baseline:
  - Marked PR #1, #12, and #14 as merged after the Wave 0 main integration.
  - Marked the remaining open PRs as dirty after Wave 0 main changes so the next merge work starts with explicit branch re-sync.
  - Updated `npm run iteration:audit` to inspect each tracked PR directly and accept merged lifecycle states alongside open PR states.
- Verification target:
  - `node --check scripts/iteration-goal-audit.mjs`
  - `npm run iteration:audit -- --offline`
  - `npm run iteration:audit`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
- Verification completed:
  - `node --check scripts/iteration-goal-audit.mjs`
  - `npm run iteration:audit -- --offline`
  - `npm run iteration:audit`
  - `npm run ci:repo-hygiene`
  - `git diff --check`

### Slice 46

- Scope:
  - Wave 0 evidence link refresh
  - keep reviewer-facing queue links aligned with the latest PR #1, #12, and #14 validation comments
- Planned touchpoints:
  - `docs/iteration-merge-queue-2026-05.md`
  - `docs/wave0-review-handoff-2026-05.md`
  - `docs/active-goal-artifact-audit-2026-05.md`
  - `scripts/iteration-goal-audit.mjs`
  - `docs/upgrade-execution-log.md`
- Product management baseline:
  - Updated PR #1 evidence to the latest stability, build, and Mermaid/export regression comment.
  - Updated PR #12 evidence to the latest current-branch Wave 0 gate comment.
  - Updated PR #14 evidence to the latest build-health comment confirming circular chunk warnings are cleared on that branch.
  - Extended `npm run iteration:audit` document markers so the execution log tracks this evidence refresh.
- Verification target:
  - `node --check scripts/iteration-goal-audit.mjs`
  - `npm run iteration:audit -- --offline`
  - `npm run iteration:audit`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
- Verification completed:
  - `node --check scripts/iteration-goal-audit.mjs`
  - `npm run iteration:audit -- --offline` with 16 checks passed.
  - `npm run iteration:audit` with 44 checks passed.
  - `npm run ci:repo-hygiene`
  - `git diff --check`

### Slice 58

- Scope:
  - post-Wave 1 merge queue state refresh
  - keep merged index reliability and preview isolation PR states auditable
- Planned touchpoints:
  - `docs/iteration-merge-queue-2026-05.md`
  - `docs/upgrade-execution-log.md`
- Product management baseline:
  - Marked PR #2 and PR #3 as merged after the Wave 1 main integration.
  - Kept the remaining open PRs in the dirty review queue for the next wave-specific re-sync.
  - Preserved the current release-management rule that packaging starts from merged main evidence.
- Verification target:
  - `npm run iteration:audit -- --offline`
  - `npm run iteration:audit`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
- Verification completed:
  - `npm run iteration:audit -- --offline` with 16 checks passed.
  - `npm run iteration:audit` with 44 checks passed.
  - `npm run ci:repo-hygiene`
  - `git diff --check`

### Slice 59

- Scope:
  - post-Wave 2 merge queue state refresh
  - keep merged unlinked mention conversion state auditable
- Planned touchpoints:
  - `docs/iteration-merge-queue-2026-05.md`
  - `docs/upgrade-execution-log.md`
- Product management baseline:
  - Marked PR #4 as merged after the Wave 2 main integration.
  - Kept Wave 3 editor production PRs in the dirty review queue for targeted re-sync.
  - Preserved the staged release rule that installer packaging starts after merged main evidence is current.
- Verification target:
  - `npm run iteration:audit -- --offline`
  - `npm run iteration:audit`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
- Verification completed:
  - `npm run iteration:audit -- --offline` with 16 checks passed.
  - `npm run iteration:audit` with 44 checks passed.
  - `npm run ci:repo-hygiene`
  - `git diff --check`

### Slice 60

- Scope:
  - post-Wave 3 PR #5 merge queue state refresh
  - keep merged footnote export rendering state auditable before the next Wave 3 PR
- Planned touchpoints:
  - `docs/iteration-merge-queue-2026-05.md`
  - `docs/upgrade-execution-log.md`
- Product management baseline:
  - Marked PR #5 as merged after the footnote render/export fidelity lane reached main.
  - Kept the remaining Wave 3 editor production PRs in the dirty review queue for targeted re-sync.
  - Preserved the staged release rule that installer packaging starts after merged main evidence is current.
- Verification target:
  - `npm run iteration:audit -- --offline`
  - `npm run iteration:audit`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
- Verification completed:
  - `npm run iteration:audit -- --offline` with 16 checks passed.
  - `npm run iteration:audit` with 44 checks passed.
  - `npm run ci:repo-hygiene`
  - `git diff --check`

### Slice 61

- Scope:
  - post-Wave 3 PR #6 merge queue state refresh
  - keep merged task-list direct toggle state auditable before the next Wave 3 PR
- Planned touchpoints:
  - `docs/iteration-merge-queue-2026-05.md`
  - `docs/upgrade-execution-log.md`
- Product management baseline:
  - Marked PR #6 as merged after the daily editing checklist toggle lane reached main.
  - Kept the remaining Wave 3 editor production PRs in the dirty review queue for targeted re-sync.
  - Preserved the staged release rule that installer packaging starts after merged main evidence is current.
- Verification target:
  - `npm run iteration:audit -- --offline`
  - `npm run iteration:audit`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
- Verification completed:
  - `npm run iteration:audit -- --offline` with 16 checks passed.
  - `npm run iteration:audit` with 44 checks passed.
  - `npm run ci:repo-hygiene`
  - `git diff --check`

### Slice 62

- Scope:
  - post-Wave 3 PR #7 merge queue state refresh
  - keep merged immersive writing mode regression state auditable before the next Wave 3 PR
- Planned touchpoints:
  - `docs/iteration-merge-queue-2026-05.md`
  - `docs/upgrade-execution-log.md`
- Product management baseline:
  - Marked PR #7 as merged after the focus/typewriter writing-polish lane reached main.
  - Kept the remaining Wave 3 editor production PRs in the dirty review queue for targeted re-sync.
  - Preserved the staged release rule that installer packaging starts after merged main evidence is current.
- Verification target:
  - `npm run iteration:audit -- --offline`
  - `npm run iteration:audit`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
- Verification completed:
  - `npm run iteration:audit -- --offline` with 16 checks passed.
  - `npm run iteration:audit` with 44 checks passed.
  - `npm run ci:repo-hygiene`
  - `git diff --check`

### Slice 63

- Scope:
  - post-Wave 3 PR #8 merge queue state refresh
  - keep merged frontmatter export properties state auditable before the remaining Wave 3 PRs
- Planned touchpoints:
  - `docs/iteration-merge-queue-2026-05.md`
  - `docs/upgrade-execution-log.md`
- Product management baseline:
  - Marked PR #8 as merged after the export/properties lane reached main.
  - Kept PR #10 and PR #11 in the dirty review queue for targeted re-sync.
  - Preserved the staged release rule that installer packaging starts after merged main evidence is current.
- Verification target:
  - `npm run iteration:audit -- --offline`
  - `npm run iteration:audit`
  - `npm run ci:repo-hygiene`
  - `git diff --check`
- Verification completed:
  - `npm run iteration:audit -- --offline` with 16 checks passed.
  - `npm run iteration:audit` with 44 checks passed.
  - `npm run ci:repo-hygiene`
  - `git diff --check`
