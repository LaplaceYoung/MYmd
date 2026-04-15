## Task Statement

- Continue the benchmark upgrade plan under `ralph`.
- Land a low-risk regression-only slice after the workspace explorer commit.
- Current slice: align media embed and image-paste E2E tests with the current welcome-to-editor entry flow.

## Desired Outcome

- Media embed regressions are checked by committed Playwright coverage.
- WYSIWYG image paste and split-source image paste tests no longer depend on an outdated startup button flow.
- The slice ships as tests-only plus docs/context, with no runtime behavior changes.

## Known Facts / Evidence

- `tests/e2e_media_embed.spec.ts` already passed against the current runtime.
- `tests/e2e_image_paste.spec.ts` initially failed because it still expected the old `新建` entry button.
- `tests/e2e_source_image_paste.spec.ts` shared the same outdated startup assumption.
- Fresh verification passed on 2026-04-15:
  - `npx playwright test tests/e2e_media_embed.spec.ts tests/e2e_image_paste.spec.ts tests/e2e_source_image_paste.spec.ts --reporter=line`
  - `npm run build`

## Constraints

- Do not change runtime editor/media behavior in this slice.
- Keep the scope to regression coverage and current-flow test alignment.
- Avoid staging unrelated dirty AI/settings worktree changes.

## Unknowns / Open Questions

- Additional source-paste asset persistence cases may still deserve targeted coverage later.
- Media toolbar labels currently work in tests, but broader i18n cleanup remains separate work.

## Likely Codebase Touchpoints

- `tests/e2e_media_embed.spec.ts`
- `tests/e2e_image_paste.spec.ts`
- `tests/e2e_source_image_paste.spec.ts`
- `docs/upgrade-execution-log.md`
