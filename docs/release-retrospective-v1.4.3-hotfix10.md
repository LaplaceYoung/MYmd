# MYmd v1.4.3-hotfix10 Release Retrospective

Baseline date: 2026-05-15

## Release Intent

`v1.4.3-hotfix10` shipped the Wave 4 knowledge-workflow queue so MYmd gains stable read-only plugin registration contracts and a more useful local knowledge graph. The release keeps the product direction anchored in low-friction local Markdown editing with lightweight Obsidian-style knowledge connections.

## Outcome Map

| Objective Requirement | Evidence |
|---|---|
| Benchmark input | Obsidian and Joplin informed extension-surface and graph-sensemaking priorities in `docs/markdown-roadmap-2026-05.md` |
| Scoped requirement | Slices 22, 66, 67, and the hotfix10 release lane in `docs/upgrade-execution-log.md` tracked plugin API, graph filters, main-sync, and release packaging |
| Implementation evidence | Wave 4 PRs #9 and #13 reached `main` |
| Verification evidence | Typecheck, plugin API tests, graph panel E2E, Rust cargo check, production build, repo hygiene, iteration audit, release gate preflight, and release smoke |
| Packaging evidence | `release/v1.4.3-hotfix10` contains NSIS setup, MSI, Electron portable zip, release notes, and SHA256 sums |
| Runtime smoke | `npm run release:smoke -- --release-dir release/v1.4.3-hotfix10 --cdp-port 9564 --cli-cdp-port 9565` verified Electron rendering, Tauri rendering, and CLI-open knowledge indexing |
| Published release | https://github.com/LaplaceYoung/MYmd/releases/tag/v1.4.3-hotfix10 |

## What Worked

- Wave 4 landed after Wave 3 shipped, so extension and graph work built on a stable editor baseline.
- The PR queue audit caught stale PR state and kept GitHub merge status aligned with docs.
- Release smoke verified the same local-first entry points that previously caused risk: Electron shell, Tauri shell, and CLI-open indexing.
- The release asset checklist stayed repeatable across NSIS, MSI, portable zip, release notes, and SHA256 sums.

## Friction

- Full release packaging still takes several minutes because Tauri and Electron builds each run a production Vite build.
- Large editor and Mermaid definition chunks remain visible in build output and release notes.
- Electron Builder metadata and dependency warnings remain part of the current packaging output.

## Follow-ups

| Follow-up | Owner Surface | Trigger |
|---|---|---|
| Assign editor/diagram chunk slice | `docs/markdown-roadmap-2026-05.md` | Next performance pass |
| Decide next local-first knowledge slice | `docs/iteration-merge-queue-2026-05.md` | New PR wave planning |
| Keep release smoke cleanup scoped | `scripts/release-smoke-check.mjs` | Future runtime smoke edits |
| Run evidence audit after queue updates | `npm run iteration:audit` | Release-management evidence changes |

## Completion Decision

`v1.4.3-hotfix10` is release-complete for Wave 4 plugin API and graph sensemaking work. The active benchmark-alignment goal continues through the next roadmap slice.
