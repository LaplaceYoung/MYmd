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

## Prompt To Artifact Checklist

| Requirement | Artifact | Current Evidence | Status | Next Action |
|---|---|---|---|---|
| Align with mainstream Markdown readers/editors | `docs/markdown-roadmap-2026-05.md` | Benchmark matrix covers Obsidian, Joplin, Typora, iA Writer, MarkText, Zettlr, Cherry Markdown, and doocs/md | Covered | Refresh when a new benchmark source changes product direction |
| Close MYmd feature gaps | `docs/markdown-roadmap-2026-05.md` | P0-P3 backlog maps product reasons to acceptance evidence | Covered | Pull next slice from open P1/P2/P3 backlog after current PR wave clears review |
| Build version iteration management | `docs/release-iteration-playbook.md` | Iteration loop, planning template, required gates, smoke checklist, and release asset checklist exist | Covered | Keep playbook aligned with new release automation |
| Sequence current implementation work | `docs/iteration-merge-queue-2026-05.md` | PR #1-#12 have lanes, states, merge waves, triggers, and verification links | Covered | Update after any PR merge, close, replace, or rebase |
| Attach verification evidence to slices | PR comments and `docs/iteration-merge-queue-2026-05.md` | PR #1-#12 readiness rows link to verification comments | Covered | Re-run gates after main sync or branch rebase |
| Keep implementation history auditable | `docs/upgrade-execution-log.md` | Slices 12-18 and 25-26 record scope, touchpoints, baseline, and verification | Covered | Add a new dated entry for every meaningful slice |
| Package and publish release builds | GitHub release `v1.4.3-hotfix8` | Latest release has NSIS setup, MSI, Electron portable zip, release notes, and SHA256 sums | Covered for latest shipped release | Package again after a merge wave reaches `main` |
| Verify release runtime quality | `npm run release:smoke` and release notes | Hotfix8 release smoke covered asset hashes, Electron rendering, Tauri rendering, and CLI-open indexing | Covered for latest shipped release | Run smoke on the next release staging folder |
| Maintain current blocker visibility | `gh pr list` output and merge queue | PR #1-#12 currently report `BLOCKED / REVIEW_REQUIRED` | Active blocker | Review gate must clear before merge and packaging |
| Track known performance warnings | `docs/markdown-roadmap-2026-05.md`, release notes, build output | Large editor/diagram chunks and circular vendor chunks are tracked as current build warnings | Open risk | Assign a future performance slice after current release waves |

## Current Evidence Snapshot

### Repository Docs

- `docs/markdown-roadmap-2026-05.md` defines the benchmark matrix, capability backlog, success criteria, and iteration cadence.
- `docs/release-iteration-playbook.md` defines slice planning, verification gates, release smoke, checksums, release evidence, and machine paths.
- `docs/iteration-merge-queue-2026-05.md` maps PR #1-#12 into merge waves and release triggers.
- `docs/upgrade-execution-log.md` records completed implementation, validation, packaging, and queue-management slices.

### GitHub State

- Latest release: `v1.4.3-hotfix8`
- Release URL: https://github.com/LaplaceYoung/MYmd/releases/tag/v1.4.3-hotfix8
- Open PR queue: PR #1-#12
- Current PR state: all open PRs are `BLOCKED / REVIEW_REQUIRED`

### Verification Commands Used For This Audit

```bash
gh release view --json tagName,name,isDraft,isPrerelease,publishedAt,url,assets
gh pr list --state open --json number,title,headRefName,mergeStateStatus,reviewDecision,updatedAt,url --limit 20
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
