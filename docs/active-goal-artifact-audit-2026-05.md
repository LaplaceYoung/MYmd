# Active Goal Artifact Audit

Baseline date: 2026-05-15

## Objective Restatement

MYmd is pursuing a continuous product goal: align with mainstream Markdown readers and editors, close capability gaps, and maintain a version-iteration management loop where every iteration has benchmark input, scoped requirements, implementation evidence, verification, packaging/release evidence, and retrospective notes.

This audit keeps that goal measurable. It maps the active objective to concrete repository artifacts and calls out the next missing evidence before the goal can be treated as release-complete.

## Success Criteria

1. Benchmark alignment is visible and source-backed.
2. Capability gaps become scoped backlog items with priorities and acceptance evidence.
3. Implementation work is sliced into reviewable PRs or release lanes.
4. Verification evidence is attached to each slice.
5. Packaging and release evidence exist for shipped builds.
6. Retrospective/project-management notes are updated after meaningful slices.
7. Current blockers and next actions are visible from repository docs.

## Completion Audit Refresh

Captured on 2026-05-15 after PR #14 gained Mermaid runtime lazy loading, retry hardening, SourceEditor language-budget optimization, split-preview editor sync stabilization, and PR #12 linked the latest build-health evidence.

| Deliverable | Evidence Inspected | Current State | Gap To Close |
|---|---|---|---|
| Benchmark-aligned product direction | `docs/markdown-roadmap-2026-05.md`, `docs/benchmark-source-refresh-2026-05-15.md` mainstream matrix and P0-P3 backlog | Covered | Refresh when benchmark sources change roadmap priority |
| Feature-gap closure path | PR #1-#14 plus roadmap acceptance rows | In progress | Review gates must clear before merge waves can land |
| Iteration management mechanism | `docs/release-iteration-playbook.md`, `docs/iteration-merge-queue-2026-05.md`, `docs/wave0-review-handoff-2026-05.md`, `npm run iteration:audit`, this audit | Covered | Keep queue synchronized after every PR update |
| Implementation evidence | PR #1-#14 branches and linked verification comments | In progress | Merge Wave 0 into `main`, then continue waves 1-4 |
| Verification evidence | PR comments, `npm run typecheck`, `npm run build`, targeted E2E/unit gates, repo hygiene, production preview smoke, split-preview editor sync smoke | Covered for current open slices | Re-run gates after branch sync or merge |
| Packaging and release evidence | GitHub Release `v1.4.3-hotfix8` with NSIS, MSI, Electron portable, release notes, SHA256 sums | Covered for latest shipped release | Package the next release after a wave reaches `main` |
| Runtime release quality | `npm run release:smoke` evidence in release lane v1.4.3-hotfix8 | Covered for latest shipped release | Run release smoke on the next staging folder |
| Retrospective and project memory | `docs/upgrade-execution-log.md` slices, `docs/release-retrospective-v1.4.3-hotfix8.md`, project memory notes | Covered | Add a slice entry after every meaningful implementation or queue change |

Completion decision: the active goal remains ongoing because PR #1-#14 are open and the next release packaging lane starts after a merge wave reaches `main`.

## Prompt To Artifact Checklist

| Requirement | Artifact | Current Evidence | Status | Next Action |
|---|---|---|---|---|
| Align with mainstream Markdown readers/editors | `docs/markdown-roadmap-2026-05.md`, `docs/benchmark-source-refresh-2026-05-15.md` | Benchmark matrix covers Obsidian, Joplin, Typora, iA Writer, MarkText, Zettlr, Cherry Markdown, and doocs/md with a 2026-05-15 source refresh | Covered | Refresh when a new benchmark source changes product direction |
| Verify benchmark source availability | `npm run iteration:audit -- --check-sources` | Source refresh URLs are fetchable through the iteration audit source-link mode | Covered | Run when source anchors change |
| Close MYmd feature gaps | `docs/markdown-roadmap-2026-05.md` | P0-P3 backlog maps product reasons to acceptance evidence | Covered | Pull next slice from open P1/P2/P3 backlog after current PR wave clears review |
| Build version iteration management | `docs/release-iteration-playbook.md` | Iteration loop, planning template, required gates, smoke checklist, and release asset checklist exist | Covered | Keep playbook aligned with new release automation |
| Automate active-goal evidence checks | `scripts/iteration-goal-audit.mjs`, `package.json` | `npm run iteration:audit` checks roadmap, playbook, queue, active audit, execution log, Wave 0 handoff, PR queue state, and release assets | Covered | Run after release-management evidence changes |
| Automate Wave 0 main gate | `scripts/wave-gate-check.mjs`, `package.json`, `docs/wave0-review-handoff-2026-05.md` | `npm run wave0:gate` runs iteration audit, typecheck, production build, repo hygiene, and diff check | Covered | Run on `main` after Wave 0 lands |
| Sequence current implementation work | `docs/iteration-merge-queue-2026-05.md` | PR #1-#14 have lanes, states, merge waves, triggers, and verification links | Covered | Update after any PR merge, close, replace, or rebase |
| Clear Wave 0 review path | `docs/wave0-review-handoff-2026-05.md` | PR #1, #14, and #12 have review order, reviewer checklist, main-branch gate, and packaging trigger | Covered | Use this handoff while review gates clear |
| Attach verification evidence to slices | PR comments and `docs/iteration-merge-queue-2026-05.md` | PR #1-#14 readiness rows link to verification comments | Covered | Re-run gates after main sync or branch rebase |
| Keep implementation history auditable | `docs/upgrade-execution-log.md` | Slices 12-19 and 25-32 record scope, touchpoints, baseline, and verification | Covered | Add a new dated entry for every meaningful slice |
| Package and publish release builds | GitHub release `v1.4.3-hotfix8` | Latest release has NSIS setup, MSI, Electron portable zip, release notes, and SHA256 sums | Covered for latest shipped release | Package again after a merge wave reaches `main` |
| Verify release runtime quality | `npm run release:smoke` and release notes | Hotfix8 release smoke covered asset hashes, Electron rendering, Tauri rendering, and CLI-open indexing | Covered for latest shipped release | Run smoke on the next release staging folder |
| Capture release retrospective | `docs/release-retrospective-v1.4.3-hotfix8.md` | Hotfix8 maps benchmark input, scoped requirement, implementation, verification, packaging, runtime smoke, release link, friction, and follow-ups | Covered | Add a retrospective after each published release |
| Maintain current blocker visibility | `gh pr list` output and merge queue | PR #1-#14 currently report `BLOCKED / REVIEW_REQUIRED` | Active blocker | Review gate must clear before merge and packaging |
| Track known performance warnings | `docs/markdown-roadmap-2026-05.md`, release notes, build output | Circular manual chunk warnings and SourceEditor language-data overreach are closed; large editor/diagram chunks remain tracked as current build warnings | Open risk | Assign a future editor/diagram chunk slice after current release waves |

## Current Evidence Snapshot

### Repository Docs

- `docs/markdown-roadmap-2026-05.md` defines the benchmark matrix, capability backlog, success criteria, and iteration cadence.
- `docs/benchmark-source-refresh-2026-05-15.md` records the latest benchmark source refresh and priority adjustments.
- `docs/release-iteration-playbook.md` defines slice planning, verification gates, release smoke, checksums, release evidence, and machine paths.
- `docs/iteration-merge-queue-2026-05.md` maps PR #1-#14 into merge waves and release triggers.
- `docs/upgrade-execution-log.md` records completed implementation, validation, packaging, and queue-management slices.
- `docs/release-retrospective-v1.4.3-hotfix8.md` records the latest published release retrospective and follow-ups.

### GitHub State

- Latest release: `v1.4.3-hotfix8`
- Release URL: https://github.com/LaplaceYoung/MYmd/releases/tag/v1.4.3-hotfix8
- Open PR queue: PR #1-#14
- Current PR state: all open PRs are `BLOCKED / REVIEW_REQUIRED`

### Verification Commands Used For This Audit

```bash
gh release view --json tagName,name,isDraft,isPrerelease,publishedAt,url,assets
gh pr list --state open --json number,title,headRefName,mergeStateStatus,reviewDecision,updatedAt,url --limit 25
npm run iteration:audit
npm run iteration:audit -- --check-sources
rg -n "v1.4.3-hotfix8|PR #14|vite-chunk|Mermaid|chunk|release:smoke|build:tauri|build:electron" README.md README_en.md docs/markdown-roadmap-2026-05.md docs/release-iteration-playbook.md docs/iteration-merge-queue-2026-05.md docs/upgrade-execution-log.md docs/active-goal-artifact-audit-2026-05.md
```

## Release Completion Gate

The active goal remains ongoing while the current benchmark-alignment PR queue is open. A release wave is ready for packaging only after:

1. The relevant PR wave lands on `main`.
2. The wave gate passes on `main`.
3. `npm run build:tauri` passes.
4. `npm run build:electron` passes.
5. `npm run release:smoke` passes against the staged release folder.
6. SHA256 sums and release notes are generated.
7. The GitHub release is published and verified.
8. README/README_en release references match the published release.

## Next Concrete Action

Keep PR #12 as the active release-management surface. Once review gates clear, merge Wave 0 first, re-run the main-branch gates, then package the next release candidate.
