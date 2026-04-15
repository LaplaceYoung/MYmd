## Task Statement

- Continue the benchmark upgrade plan directly under `ralph` without brainstorming.
- Deliver the next low-visual-disturbance slice while preserving the current design language.
- Current slice: add table width controls, persist table widths in Markdown, and ensure wide tables can drive paper-width adaptation.

## Desired Outcome

- Users can widen, narrow, and reset table width from the editor flow without breaking the existing theme.
- Table width changes persist in Markdown instead of living only in transient DOM state.
- Render/export output respects persisted table widths so paper auto-sizing can react consistently.
- The slice is documented, verified, and committed independently from unrelated dirty worktree changes.

## Known Facts / Evidence

- Shared table-width utility was implemented in `src/utils/tableWidths.ts`.
- WYSIWYG command wiring and DOM application were added in `src/components/Editor/WysiwygEditor.tsx`.
- Context menu actions were added in `src/components/Editor/EditorContextMenu.tsx`.
- Render/export width application was added in `src/utils/renderApi.ts` and `src/components/Ribbon/Ribbon.tsx`.
- Store fallback for single-table documents was added in `src/stores/editorStore.ts`.
- Targeted verification already passed on 2026-04-15:
  - `npx playwright test tests/table_widths.spec.ts tests/e2e_table_width_resize.spec.ts --reporter=line`
  - `npm run build`

## Constraints

- Keep the current product theme, layout feel, and interaction style intact.
- Do not use brainstorming in this turn.
- Do not revert unrelated dirty worktree changes.
- Commit only the files and hunks that belong to this table-width slice.

## Unknowns / Open Questions

- Some touched files also contain unrelated in-progress changes for locale and media embed features.
- A stronger UI-level regression for paper-width growth may still be valuable after this slice is committed.

## Likely Codebase Touchpoints

- `src/utils/tableWidths.ts`
- `src/utils/renderApi.ts`
- `src/components/Ribbon/Ribbon.tsx`
- `src/components/Editor/WysiwygEditor.tsx`
- `src/components/Editor/EditorContextMenu.tsx`
- `src/styles/editor.css`
- `src/stores/editorStore.ts`
- `tests/table_widths.spec.ts`
- `tests/e2e_table_width_resize.spec.ts`
- `docs/upgrade-execution-log.md`
