# Wave 0 Review Handoff

Baseline date: 2026-05-15

## Purpose

This handoff gives reviewers one compact path for clearing Wave 0 and starting the next release packaging lane. Wave 0 owns release readiness foundations: performance stability, queue management, and build-health warning ownership.

## Current Gate

| Check | Evidence |
|---|---|
| Open PR state | PR #1, #12, and #14 are `BLOCKED / REVIEW_REQUIRED` |
| Latest release | `v1.4.3-hotfix8` is published with NSIS, MSI, Electron portable, release notes, and SHA256 sums |
| Next packaging trigger | Wave 0 reaches `main`, then the Wave 0 main-branch gate passes |
| Queue authority | `docs/iteration-merge-queue-2026-05.md` |
| Completion audit | `docs/active-goal-artifact-audit-2026-05.md` |

## Review Order

| Order | PR | Branch | Review Focus | Latest Evidence |
|---:|---:|---|---|---|
| 1 | #1 | `young/review-code-health-and-performance-stability` | Main stability, performance, broad health baseline | https://github.com/LaplaceYoung/MYmd/pull/1#issuecomment-4455004862 |
| 2 | #14 | `young/vite-chunk-warning-cleanup` | Build-health cleanup, Mermaid lazy runtime recovery, SourceEditor language budget, split-preview editor sync timing | https://github.com/LaplaceYoung/MYmd/pull/14#issuecomment-4455698048 |
| 3 | #12 | `young/iteration-merge-queue` | Release sequencing, audit trail, Wave 0 handoff, packaging trigger | https://github.com/LaplaceYoung/MYmd/pull/12#issuecomment-4455710921 |

## Reviewer Checklist

### PR #1

- Confirm the performance/stability changes stay aligned with the current editor architecture.
- Confirm the linked verification covers main sync, typecheck, build, repo hygiene, diff check, Mermaid/export targeted tests, and the stated product lane.
- Confirm the PR body names the targeted tests that should be re-run after merge.

### PR #14

- Confirm manual chunk circular-edge ownership is resolved while the remaining large editor/diagram chunk warnings stay visible.
- Confirm Mermaid lazy runtime loading retries after transient import failure.
- Confirm SourceEditor uses the curated code-fence language budget for common Markdown fence languages.
- Confirm the split-preview Wysiwyg sync retry is scoped to the transient Milkdown `editorView` context timing path.
- Confirm the latest evidence comment links the current verification commands and production preview smoke.

### PR #12

- Confirm PR #1, #12, and #14 are assigned to Wave 0 with clear release triggers.
- Confirm Wave 1-4 sequencing still follows dependency order: indexing/read safety, knowledge network closure, editor production power, extension/sensemaking.
- Confirm packaging starts after Wave 0 lands on `main` and the main-branch gate passes.
- Confirm this handoff is linked from the queue and active-goal audit.

## Main-Branch Gate After Wave 0

Run these commands on `main` after Wave 0 merges:

```bash
npm run typecheck
npm run build
npm run ci:repo-hygiene
git diff --check
```

Then run the targeted tests listed in the merged PR bodies for PR #1 and PR #14.

## Packaging Trigger

Start release packaging after the main-branch gate passes:

```bash
npm run build:tauri
npm run build:electron
npm run release:smoke
npm run typecheck
npm run ci:repo-hygiene
git diff --check
```

Use `E:\EnvConfig\cargo\bin` on `PATH` and `E:\EnvConfig\rust_target` as the Rust target output path for native builds.

## Rollback Boundary

- Revert PR #14 independently if build-health changes affect editor startup or Mermaid rendering.
- Revert PR #12 independently if queue documentation needs correction.
- Treat PR #1 as the broadest Wave 0 slice and review its rollback notes before pairing it with packaging work.

## Reviewer Outcome

Wave 0 is ready for merge when PR #1, #14, and #12 each receive approval and the linked verification comments still match the branch heads.
