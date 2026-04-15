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
