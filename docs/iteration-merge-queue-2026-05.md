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
| #1 | `young/review-code-health-and-performance-stability` | Performance and stability | BLOCKED / REVIEW_REQUIRED | 0 | Broad gates rerun after main sync; await review |
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
| #12 | `young/iteration-merge-queue` | Release management | BLOCKED / REVIEW_REQUIRED | 0 | Merge before release packaging work so queue status stays authoritative |
| #13 | `young/graph-view-filter-set` | P3 graph sensemaking | BLOCKED / REVIEW_REQUIRED | 4 | Include after core writing/export queue stabilizes |
| #14 | `young/vite-chunk-warning-cleanup` | P0 build health | BLOCKED / REVIEW_REQUIRED | 0 | Merge before release packaging work so chunk warning ownership stays current |

## Readiness Snapshot

Captured on 2026-05-15 after PR #1-#11 rechecks, PR #12 queue refresh, PR #13 graph-filter verification, and PR #14 build-health verification.

| PR | Latest Evidence | Evidence Surface |
|---:|---|---|
| #1 | main sync plus typecheck, build, repo hygiene, diff check, Mermaid/export targeted tests | https://github.com/LaplaceYoung/MYmd/pull/1#issuecomment-4455004862 |
| #2 | typecheck, build, repo hygiene, diff check, index progress retry E2E | https://github.com/LaplaceYoung/MYmd/pull/2#issuecomment-4455029648 |
| #3 | typecheck, build, repo hygiene, diff check, preview isolation/runtime E2E | https://github.com/LaplaceYoung/MYmd/pull/3#issuecomment-4455048432 |
| #4 | typecheck, build, repo hygiene, diff check, wikilink/backlink E2E | https://github.com/LaplaceYoung/MYmd/pull/4#issuecomment-4455063473 |
| #5 | typecheck, build, repo hygiene, diff check, render API footnote tests | https://github.com/LaplaceYoung/MYmd/pull/5#issuecomment-4455073290 |
| #6 | task toggle bug fix, typecheck, build, repo hygiene, diff check, task-list E2E | https://github.com/LaplaceYoung/MYmd/pull/6#issuecomment-4455137386 |
| #7 | immersive E2E stabilization, typecheck, build, repo hygiene, diff check, immersive modes E2E | https://github.com/LaplaceYoung/MYmd/pull/7#issuecomment-4455167424 |
| #8 | typecheck, build, repo hygiene, diff check, render API frontmatter tests | https://github.com/LaplaceYoung/MYmd/pull/8#issuecomment-4455181429 |
| #9 | typecheck, build, repo hygiene, diff check, plugin API tests | https://github.com/LaplaceYoung/MYmd/pull/9#issuecomment-4455215928 |
| #10 | typecheck, build, repo hygiene, diff check, writing stats tests, benchmark link checks | https://github.com/LaplaceYoung/MYmd/pull/10#issuecomment-4455226982 |
| #11 | typecheck, build, repo hygiene, diff check, local asset tests | https://github.com/LaplaceYoung/MYmd/pull/11#issuecomment-4455248568 |
| #12 | typecheck, repo hygiene, diff check, changelog link checks | https://github.com/LaplaceYoung/MYmd/pull/12#issuecomment-4455204178 |
| #13 | typecheck, build, repo hygiene, diff check, graph panel E2E, cargo check | https://github.com/LaplaceYoung/MYmd/pull/13#issuecomment-4455401410 |
| #14 | typecheck, build, Mermaid export regression, production preview app shell smoke, repo hygiene, diff check | https://github.com/LaplaceYoung/MYmd/pull/14#issuecomment-4455512064 |

## Merge Waves

### Wave 0: Stabilize The Queue

- Goal: Keep the stability PR, build-health PR, and queue-management PR current before stacking more release packaging work.
- PRs:
  - #1 `young/review-code-health-and-performance-stability`
  - #12 `young/iteration-merge-queue`
  - #14 `young/vite-chunk-warning-cleanup`
- Gate:
  - `npm run typecheck`
  - `npm run build`
  - `npm run ci:repo-hygiene`
  - targeted tests named in the PR body
- Exit evidence:
  - PR #1 reports clean merge state and current verification evidence.
  - PR #12 records the current release-wave status before merge packaging begins.
  - PR #14 confirms circular manual chunk warning ownership and Mermaid runtime lazy loading before the next release packaging lane.

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

### Wave 4: Extension And Sensemaking

- Goal: Land the read-only plugin API and graph sensemaking filters after editor and export behavior settle.
- PRs:
  - #9 `young/readonly-plugin-api-contract`
  - #13 `young/graph-view-filter-set`
- Gate:
  - `npm run typecheck`
  - `npm run build`
  - `npm run ci:repo-hygiene`
  - `npx playwright test tests/plugin_api.spec.ts --reporter=line`
  - `npx playwright test tests/e2e_graph_panel.spec.ts --reporter=line`
  - `cargo check --manifest-path src-tauri/Cargo.toml`
- Release note focus:
  - stable read-only plugin registration ids
  - command/sidebar/search cleanup contract
  - graph folder/tag/link-depth filters

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
