## Task Statement

- Continue the benchmark upgrade plan under `ralph`.
- Prioritize a low-visual-disturbance workspace/productivity slice after the previous table-width commit.
- Current slice: harden workspace file-tree operations and preserve wikilink/backlink closure after workspace rename actions.

## Desired Outcome

- Workspace file tree keeps nested directory expand state across refreshes.
- Users can create files, create folders, rename items, and delete items from the file explorer without breaking open tabs.
- Renaming a linked workspace note rewrites wiki links and the backlink panel remains aligned after reindex.
- The slice is verified and committed independently from unrelated AI/settings worktree changes.

## Known Facts / Evidence

- `src/components/Sidebar/FileExplorer.tsx` already contains directory caching, nested hydration, and CRUD dialog flows.
- `src/components/Sidebar/FileExplorer.css` already contains action-button and dialog styling that matches the existing theme.
- `tests/e2e_wikilink_backlink.spec.ts` was expanded into a mock-workspace regression covering rename -> reindex -> backlink continuity.
- Fresh verification passed on 2026-04-15:
  - `npx playwright test tests/e2e_wikilink_backlink.spec.ts --reporter=line`
  - `npm run build`

## Constraints

- Preserve current design language and sidebar aesthetic.
- Do not touch unrelated dirty changes in AI/settings/account files.
- Keep this as one reversible workspace/productivity slice.

## Unknowns / Open Questions

- File explorer copy-path / locate-in-tree / new-window actions are still planned separately.
- Additional regressions for create/delete flows may still be valuable after this commit.

## Likely Codebase Touchpoints

- `src/components/Sidebar/FileExplorer.tsx`
- `src/components/Sidebar/FileExplorer.css`
- `tests/e2e_wikilink_backlink.spec.ts`
- `docs/upgrade-execution-log.md`
