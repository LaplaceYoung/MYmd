# MYmd v1.4.3-hotfix9 Release Retrospective

Baseline date: 2026-05-15

## Release Intent

`v1.4.3-hotfix9` shipped the Wave 3 editor production queue so daily Markdown writing gains footnote/export fidelity, direct checklist editing, writing stats, frontmatter properties, immersive-mode regression coverage, and deterministic image assets. The release also strengthened Windows release smoke cleanup so packaging validation exits predictably.

## Outcome Map

| Objective Requirement | Evidence |
|---|---|
| Benchmark input | Typora, iA Writer, MarkText, Obsidian, and Zettlr informed the Wave 3 editor production lane in `docs/markdown-roadmap-2026-05.md` |
| Scoped requirement | Slices 21-24 and 60-65 in `docs/upgrade-execution-log.md` tracked frontmatter, footnotes, task toggles, writing stats, deterministic images, and queue closure |
| Implementation evidence | Wave 3 PRs #5, #6, #7, #8, #10, and #11 reached `main` |
| Verification evidence | Typecheck, production build, render/export tests, task-list E2E, immersive-mode E2E, writing-stats tests, local asset tests, image paste E2E, repo hygiene, and diff checks |
| Packaging evidence | `release/v1.4.3-hotfix9` contains NSIS setup, MSI, Electron portable zip, release notes, and SHA256 sums |
| Runtime smoke | `npm run release:smoke -- --release-dir release/v1.4.3-hotfix9 --cdp-port 9554 --cli-cdp-port 9555` verified Electron rendering, Tauri rendering, and CLI-open knowledge indexing |
| Published release | https://github.com/LaplaceYoung/MYmd/releases/tag/v1.4.3-hotfix9 |

## What Worked

- Wave-based PR sequencing kept editor production work reviewable while still moving a full user-visible bundle to release.
- Release smoke caught a Windows cleanup reliability issue before publishing and converted it into PR #26.
- CLI-open indexing smoke continued to protect file association and local-first knowledge search behavior.
- README, English README, release notes, checksums, GitHub assets, and execution log stayed aligned with the shipped release.

## Friction

- Full release gate with packaging exceeds short terminal timeouts because Tauri build, Electron build, and runtime smoke together take several minutes.
- Large editor and Mermaid definition chunks remain visible in build output and release notes.
- Electron Builder metadata/dependency warnings remain part of the current packaging output.

## Follow-ups

| Follow-up | Owner Surface | Trigger |
|---|---|---|
| Re-sync readonly plugin API | PR #9 | Wave 4 start |
| Re-sync graph filter set | PR #13 | After PR #9 is current |
| Assign editor/diagram chunk slice | `docs/markdown-roadmap-2026-05.md` | Next performance pass |
| Keep release smoke cleanup scoped | `scripts/release-smoke-check.mjs` | Future runtime smoke edits |
| Run evidence audit after queue updates | `npm run iteration:audit` | Release-management evidence changes |

## Completion Decision

`v1.4.3-hotfix9` is release-complete for Wave 3 editor production. The active benchmark-alignment goal continues through Wave 4 plugin API and graph sensemaking work.
