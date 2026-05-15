# MYmd v1.4.3-hotfix8 Release Retrospective

Baseline date: 2026-05-15

## Release Intent

`v1.4.3-hotfix8` shipped the Source/Split tag completion lane so tags become reusable from everyday Markdown typing. The release also preserved the local-first knowledge workflow loop with installer, portable package, checksum, release notes, and runtime smoke evidence.

## Outcome Map

| Objective Requirement | Evidence |
|---|---|
| Benchmark input | Obsidian-style tag organization informed the P1 tag completion lane in `docs/markdown-roadmap-2026-05.md` |
| Scoped requirement | Slice 18 in `docs/upgrade-execution-log.md` defined Source/Split tag completion, nested tag parsing, and verification targets |
| Implementation evidence | Source/Split typing `#pro` opens indexed tag suggestions and inserts nested tags such as `#project/roadmap` |
| Verification evidence | `tests/e2e_tag_completion.spec.ts`, `tests/knowledge_wikilink_rename.spec.ts`, browser preview smoke, build, typecheck, repo hygiene, and diff check |
| Packaging evidence | `release/v1.4.3-hotfix8` contains NSIS setup, MSI, Electron portable zip, release notes, and SHA256 sums |
| Runtime smoke | `npm run release:smoke -- --release-dir release/v1.4.3-hotfix8` verified Electron rendering, Tauri rendering, and CLI-open knowledge indexing |
| Published release | https://github.com/LaplaceYoung/MYmd/releases/tag/v1.4.3-hotfix8 |

## What Worked

- The release smoke script turned previous desktop runtime risk into a repeatable gate.
- CLI-open indexing smoke covered the file-association path that matters for a local-first Markdown reader/editor.
- Tag completion gave users a natural knowledge entry point through normal Markdown typing.
- README, English README, roadmap, execution log, release notes, checksums, and GitHub release state stayed aligned.

## Friction

- Large editor and Mermaid definition chunks remain visible in build output and release notes.
- Electron Builder metadata/dependency warnings remain part of the current packaging output.
- Wave 0 PRs now concentrate the release-readiness review load across #1, #14, and #12.

## Follow-ups

| Follow-up | Owner Surface | Trigger |
|---|---|---|
| Clear Wave 0 review | `docs/wave0-review-handoff-2026-05.md` | PR #1, #14, and #12 approvals |
| Re-run main-branch gate | `docs/iteration-merge-queue-2026-05.md` | Wave 0 lands on `main` |
| Package next release candidate | `docs/release-iteration-playbook.md` | Main-branch gate passes |
| Assign editor/diagram chunk slice | `docs/markdown-roadmap-2026-05.md` | Current release waves stabilize |
| Run evidence audit after queue updates | `npm run iteration:audit` | Release-management evidence changes |

## Completion Decision

`v1.4.3-hotfix8` is release-complete for the tag completion lane. The active benchmark-alignment goal continues through the open PR queue and the next release wave.
