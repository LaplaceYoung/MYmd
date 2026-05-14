# MYmd Iteration Merge Queue

Baseline date: 2026-05-15

## Purpose

This queue turns the current benchmark-alignment PR set into a controlled release path. It keeps product slices small while giving each release lane a clear merge order, validation gate, and packaging trigger.

## Benchmark Anchor

- Obsidian and Joplin both keep visible changelog streams where users can see what changed, when it shipped, and which product surface improved.
- Sources:
  - https://obsidian.md/changelog
  - https://joplinapp.org/help/about/changelog/desktop

## Current PR Queue

| PR | Branch | Product Lane | Current State | Merge Wave | Release Trigger |
|---:|---|---|---|---:|---|
| #1 | `young/review-code-health-and-performance-stability` | Performance and stability | BEHIND / REVIEW_REQUIRED | 0 | Rebase, rerun broad gates, then decide whether to keep or split |
| #2 | `young/index-progress-retry` | P1 index reliability | BLOCKED / REVIEW_REQUIRED | 1 | Include in next knowledge workflow release |
| #3 | `young/preview-edit-isolation` | P1 reading/editing safety | BLOCKED / REVIEW_REQUIRED | 1 | Include in next knowledge workflow release |
| #4 | `young/unlinked-mentions-closure` | P1 knowledge network | BLOCKED / REVIEW_REQUIRED | 2 | Include after index and preview safety land |
| #5 | `young/footnotes-render-export-coverage` | P2 render/export fidelity | BLOCKED / REVIEW_REQUIRED | 3 | Include in editor production power release |
| #6 | `young/task-list-direct-toggle` | P2 daily editing | BLOCKED / REVIEW_REQUIRED | 3 | Include in editor production power release |
| #7 | `young/focus-typewriter-regression` | P2 writing polish | BLOCKED / REVIEW_REQUIRED | 3 | Include in editor production power release |
| #8 | `young/frontmatter-export-properties` | P2 export/properties | BLOCKED / REVIEW_REQUIRED | 3 | Include in editor production power release |
| #9 | `young/readonly-plugin-api-contract` | P3 extension surface | BLOCKED / REVIEW_REQUIRED | 4 | Include after core writing/export queue stabilizes |
| #10 | `young/writing-stats-markdown-aware` | P2 writing polish | BLOCKED / REVIEW_REQUIRED | 3 | Include in editor production power release |
| #11 | `young/deterministic-image-assets` | P2 resource workflow | BLOCKED / REVIEW_REQUIRED | 3 | Include in editor production power release |

## Merge Waves

### Wave 0: Stabilize The Queue

- Goal: Rebase or retire the behind stability PR before stacking more release packaging work.
- Gate:
  - `npm run typecheck`
  - `npm run build`
  - `npm run ci:repo-hygiene`
  - targeted tests named in the PR body
- Exit evidence:
  - PR #1 reports clean merge state or a replacement branch exists.

### Wave 1: Knowledge Workflow Safety

- Goal: Land index progress/retry and preview/edit isolation before higher-level knowledge features.
- PRs:
  - #2 `young/index-progress-retry`
  - #3 `young/preview-edit-isolation`
- Gate:
  - `npm run typecheck`
  - `npm run build`
  - `npm run ci:repo-hygiene`
  - `npx playwright test tests/e2e_preview_isolation.spec.ts --reporter=line`
  - index progress targeted test from PR #2
- Release note focus:
  - recoverable workspace indexing
  - stable preview/read mode behavior

### Wave 2: Knowledge Network Closure

- Goal: Land unlinked mention conversion after indexing and read-mode safety are present.
- PR:
  - #4 `young/unlinked-mentions-closure`
- Gate:
  - `npm run typecheck`
  - `npm run build`
  - `npm run ci:repo-hygiene`
  - `npx playwright test tests/e2e_wikilink_backlink.spec.ts --reporter=line`
- Release note focus:
  - linked/unlinked mention loop
  - backlink context and conversion confidence

### Wave 3: Editor Production Power

- Goal: Bundle daily editing and export polish into one coherent minor release.
- PRs:
  - #5 `young/footnotes-render-export-coverage`
  - #6 `young/task-list-direct-toggle`
  - #7 `young/focus-typewriter-regression`
  - #8 `young/frontmatter-export-properties`
  - #10 `young/writing-stats-markdown-aware`
  - #11 `young/deterministic-image-assets`
- Gate:
  - `npm run typecheck`
  - `npm run build`
  - `npm run ci:repo-hygiene`
  - `npx playwright test tests/render_api.spec.ts tests/e2e_image_paste.spec.ts tests/e2e_source_image_paste.spec.ts --reporter=line`
  - targeted tests from each PR body
- Release note focus:
  - footnotes and export properties
  - direct task toggles
  - focus/typewriter parity
  - Markdown-aware writing stats
  - deterministic image assets

### Wave 4: Extension Surface

- Goal: Land the read-only plugin API after editor and export behavior settle.
- PR:
  - #9 `young/readonly-plugin-api-contract`
- Gate:
  - `npm run typecheck`
  - `npm run build`
  - `npm run ci:repo-hygiene`
  - `npx playwright test tests/plugin_api.spec.ts --reporter=line`
- Release note focus:
  - stable read-only plugin registration ids
  - command/sidebar/search cleanup contract

## Release Packaging Rule

Run release packaging after a merge wave reaches `main` and its wave gate passes on `main`.

Required packaging gate:

```bash
npm run build:tauri
npm run build:electron
npm run release:smoke
npm run typecheck
npm run ci:repo-hygiene
git diff --check
```

Release staging should follow `release/v1.4.3-hotfixN` until the project version advances.

## Queue Maintenance Rules

1. Update this file whenever a PR is merged, closed, replaced, or rebased.
2. Keep each PR assigned to one merge wave.
3. Keep release packaging tied to merged `main` evidence.
4. Record every packaged wave in `docs/upgrade-execution-log.md`.
5. Keep README version changes paired with a published GitHub release.
