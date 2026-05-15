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
| #1 | `young/review-code-health-and-performance-stability` | Performance and stability | MERGED / REVIEW_REQUIRED | 0 | Wave 0 merged to main |
| #2 | `young/index-progress-retry` | P1 index reliability | MERGED / REVIEW_REQUIRED | 1 | Wave 1 merged to main |
| #3 | `young/preview-edit-isolation` | P1 reading/editing safety | MERGED / REVIEW_REQUIRED | 1 | Wave 1 merged to main |
| #4 | `young/unlinked-mentions-closure` | P1 knowledge network | MERGED / REVIEW_REQUIRED | 2 | Wave 2 merged to main |
| #5 | `young/footnotes-render-export-coverage` | P2 render/export fidelity | MERGED / REVIEW_REQUIRED | 3 | Wave 3 PR #5 merged to main |
| #6 | `young/task-list-direct-toggle` | P2 daily editing | MERGED / REVIEW_REQUIRED | 3 | Wave 3 PR #6 merged to main |
| #7 | `young/focus-typewriter-regression` | P2 writing polish | MERGED / REVIEW_REQUIRED | 3 | Wave 3 PR #7 merged to main |
| #8 | `young/frontmatter-export-properties` | P2 export/properties | DIRTY / REVIEW_REQUIRED | 3 | Re-sync after Wave 0 main changes before merge |
| #9 | `young/readonly-plugin-api-contract` | P3 extension surface | DIRTY / REVIEW_REQUIRED | 4 | Re-sync after Wave 0 main changes before merge |
| #10 | `young/writing-stats-markdown-aware` | P2 writing polish | DIRTY / REVIEW_REQUIRED | 3 | Re-sync after Wave 0 main changes before merge |
| #11 | `young/deterministic-image-assets` | P2 resource workflow | DIRTY / REVIEW_REQUIRED | 3 | Re-sync after Wave 0 main changes before merge |
| #12 | `young/iteration-merge-queue` | Release management | MERGED / REVIEW_REQUIRED | 0 | Wave 0 merged to main |
| #13 | `young/graph-view-filter-set` | P3 graph sensemaking | DIRTY / REVIEW_REQUIRED | 4 | Re-sync after Wave 0 main changes before merge |
| #14 | `young/vite-chunk-warning-cleanup` | P0 build health | MERGED / REVIEW_REQUIRED | 0 | Wave 0 merged to main |

## Readiness Snapshot

Captured on 2026-05-15 after PR #1 fresh Wave 0 readiness verification, PR #7 immersive-writing verification, PR #8 frontmatter/export verification, PR #9 plugin API verification, PR #10 writing-stats verification, PR #11 deterministic-asset verification, PR #12 current-branch Wave 0 gate verification, PR #13 graph-filter verification, and PR #14 build-health verification that cleared circular chunk warnings.

| PR | Latest Evidence | Evidence Surface |
|---:|---|---|
| #1 | current head typecheck, build, repo hygiene, diff check, and Mermaid/export targeted tests | https://github.com/LaplaceYoung/MYmd/pull/1#issuecomment-4456205710 |
| #2 | current head typecheck, build, repo hygiene, diff check, and index progress retry E2E | https://github.com/LaplaceYoung/MYmd/pull/2#issuecomment-4456261433 |
| #3 | current head typecheck, build, repo hygiene, diff check, and preview isolation/runtime E2E | https://github.com/LaplaceYoung/MYmd/pull/3#issuecomment-4456303598 |
| #4 | current head typecheck, build, repo hygiene, diff check, wikilink completion/backlink/unlinked mention E2E, and wikilink rename parser coverage | https://github.com/LaplaceYoung/MYmd/pull/4#issuecomment-4456336694 |
| #5 | current head statusbar custom-paper fix, typecheck, build, repo hygiene, diff check, render API, export HTML, and export profile E2E | https://github.com/LaplaceYoung/MYmd/pull/5#issuecomment-4456385556 |
| #6 | current head typecheck, build, repo hygiene, diff check, and task-list direct-toggle E2E | https://github.com/LaplaceYoung/MYmd/pull/6#issuecomment-4456428484 |
| #7 | current head typecheck, build, repo hygiene, diff check, immersive modes E2E, and layout profile status-bar regression | https://github.com/LaplaceYoung/MYmd/pull/7#issuecomment-4456478062 |
| #8 | current head typecheck, build, repo hygiene, diff check, and render API frontmatter/export document tests | https://github.com/LaplaceYoung/MYmd/pull/8#issuecomment-4456517835 |
| #9 | current head typecheck, build, repo hygiene, diff check, and plugin API registration/cleanup tests | https://github.com/LaplaceYoung/MYmd/pull/9#issuecomment-4456606348 |
| #10 | current head typecheck, build, repo hygiene, diff check, writing stats tests, and benchmark link checks | https://github.com/LaplaceYoung/MYmd/pull/10#issuecomment-4456544884 |
| #11 | current head typecheck, build, repo hygiene, diff check, and local asset deterministic naming tests | https://github.com/LaplaceYoung/MYmd/pull/11#issuecomment-4456575580 |
| #12 | current head Wave 0 gate passed, release gate automation, Cargo environment preflight, gate self-audit coverage, and current build-warning handoff | https://github.com/LaplaceYoung/MYmd/pull/12#issuecomment-4456170849 |
| #13 | typecheck, build, repo hygiene, diff check, graph panel E2E, cargo check | https://github.com/LaplaceYoung/MYmd/pull/13#issuecomment-4455401410 |
| #14 | current head build clears circular chunk warnings, typecheck, repo hygiene, diff check, and remaining large chunk ownership | https://github.com/LaplaceYoung/MYmd/pull/14#issuecomment-4456181691 |

## Merge Waves

### Wave 0: Stabilize The Queue

- Goal: Keep the stability PR, build-health PR, and queue-management PR current before stacking more release packaging work.
- Reviewer handoff: `docs/wave0-review-handoff-2026-05.md`
- PRs:
  - #1 `young/review-code-health-and-performance-stability`
  - #12 `young/iteration-merge-queue`
  - #14 `young/vite-chunk-warning-cleanup`
- Gate:
  - `npm run wave0:gate`
  - PR-specific targeted checks named in the latest evidence comments
- Exit evidence:
  - PR #1 reports clean merge state and current verification evidence.
  - PR #12 records the current release-wave status before merge packaging begins.
  - PR #14 confirms circular manual chunk warning ownership, retryable Mermaid runtime lazy loading, SourceEditor language loading budget, and split-preview editor sync timing before the next release packaging lane.

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
npm run release:gate -- --check-env-only
npm run release:gate
```

The expanded gate checks Windows Cargo availability, then runs Tauri packaging, Electron packaging, release smoke, typecheck, repo hygiene, and `git diff --check`.

Release staging should follow `release/v1.4.3-hotfixN` until the project version advances.

## Queue Maintenance Rules

1. Update this file whenever a PR is merged, closed, replaced, or rebased.
2. Keep each PR assigned to one merge wave.
3. Keep release packaging tied to merged `main` evidence.
4. Record every packaged wave in `docs/upgrade-execution-log.md`.
5. Keep README version changes paired with a published GitHub release.
