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
