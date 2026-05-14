# MYmd Release Iteration Playbook

Baseline date: 2026-05-15

## Purpose

This playbook turns competitor alignment into a repeatable engineering loop. Each iteration should start with a benchmarked product gap, ship as a small verified slice, and end with release evidence that a future maintainer can trust.

## Iteration Loop

1. Pick one benchmark lane from `docs/markdown-roadmap-2026-05.md`.
2. Write the smallest user-visible outcome and the non-goals.
3. Map the outcome to owned files, tests, and rollback boundary.
4. Implement the slice with minimal dependency and layout churn.
5. Verify with targeted tests first, then broad build checks.
6. Record evidence in `docs/upgrade-execution-log.md`.
7. Update `docs/iteration-merge-queue-2026-05.md` when the slice creates or changes a PR.
8. Package and publish only after desktop smoke evidence exists.
9. Update project memory with environment, release, or debugging lessons.

## Planning Template

```md
## Slice

- Benchmark source:
- User outcome:
- Scope:
- Non-goals:
- Primary touchpoints:
- Regression targets:
- Manual smoke:
- Rollback boundary:
- Release note:
```

## Required Gates

| Gate | Command Or Evidence | Applies To |
|---|---|---|
| TypeScript health | `npm run typecheck` | All code slices |
| Repository hygiene | `npm run ci:repo-hygiene` | All release-bound slices |
| Production web build | `npm run build` | All UI/runtime slices |
| Targeted E2E | `npx playwright test <target specs> --reporter=line` | Changed behavior |
| Tauri build | `npm run build:tauri` with `E:\EnvConfig\cargo\bin` on `PATH` | Installer release |
| Electron build | `npm run build:electron` | Portable release |
| Tauri smoke | Run `E:\EnvConfig\rust_target\release\app.exe` and capture UI evidence | Installer release |
| Electron smoke | Run portable EXE with CDP screenshot and DOM text evidence | Portable release |
| Release smoke automation | `npm run release:smoke` | Local release verification |
| CLI indexing smoke | Included in `npm run release:smoke` | File association / CLI release verification |
| Checksums | `Get-FileHash -Algorithm SHA256` for each release asset | GitHub release |
| Release verification | `gh release view <tag> --json tagName,name,isDraft,isPrerelease,publishedAt,url,assets` | GitHub release |

## Desktop Smoke Checklist

The preferred local path is:

```bash
npm run release:smoke
```

Use the manual steps below when debugging one runtime in isolation.

### Tauri

1. Start `E:\EnvConfig\rust_target\release\app.exe`.
2. Wait for a real window title and visible MYmd UI.
3. Capture screenshot into `test-results/`.
4. Confirm editor or welcome content is visible.
5. Stop the app process.

### Electron

1. Start `release\electron\win-unpacked\MYmd.exe --remote-debugging-port=<port>`.
2. Query `http://127.0.0.1:<port>/json/list`.
3. Attach to the page websocket.
4. Verify `document.body.innerText` contains expected MYmd UI text.
5. Capture `Page.captureScreenshot`.
6. Confirm `Runtime.exceptionThrown` and `Log.entryAdded` have no blocking errors.
7. Stop the app process.

## Release Smoke Script

`scripts/release-smoke-check.mjs` performs these checks without adding package dependencies:

- Finds the newest `release/v*` staging folder by default.
- Validates `SHA256SUMS.txt` and all referenced release assets.
- Confirms the NSIS installer, MSI installer, and Electron portable zip are present.
- Starts Electron portable with a CDP port, checks DOM text markers, captures a screenshot, and fails on renderer errors.
- Starts the Tauri release executable, captures a Windows `PrintWindow` screenshot, and validates window title plus image contrast.
- Starts the Tauri release executable with a temporary Markdown path argument, confirms the file renders, then verifies document, heading, and tag search through the knowledge DB.
- Writes `test-results/release-smoke-summary.json`.

Useful options:

```bash
npm run release:smoke -- --skip-tauri
npm run release:smoke -- --skip-electron
npm run release:smoke -- --skip-cli-indexing
npm run release:smoke -- --release-dir release/v1.4.3-hotfix7
npm run release:smoke -- --tauri-exe E:\EnvConfig\rust_target\release\app.exe
```

## Release Asset Checklist

| Asset | Source | Expected |
|---|---|---|
| `MYmd_<version>_x64-setup.exe` | `E:\EnvConfig\rust_target\release\bundle\nsis` | NSIS installer |
| `MYmd_<version>_x64_en-US.msi` | `E:\EnvConfig\rust_target\release\bundle\msi` | MSI installer |
| `MYmd-Electron-<version>-x64-portable.zip` | `release\electron\win-unpacked` | Root contains `MYmd.exe` |
| `SHA256SUMS.txt` | release folder | One SHA256 line per asset |
| `RELEASE_NOTES.md` | release folder | Verification evidence and known warnings |

## Release Notes Template

```md
## MYmd <tag>

### Product focus
-

### Changes
-

### Verification
- `npm run typecheck`:
- `npm run ci:repo-hygiene`:
- `npm run build`:
- Targeted E2E:
- Tauri smoke:
- Electron smoke:

### Known warnings
-
```

## Project Management Rules

1. Keep benchmark analysis, implementation evidence, and release evidence in separate sections.
2. Update README version after a latest release is published.
3. Keep installer assets out of Git unless the repository release policy changes.
4. Keep user/unrelated untracked files untouched during release and roadmap work.
5. Add a dated execution-log entry for every meaningful slice.
6. Record machine-specific build paths in project memory after they affect a release.
7. Use `docs/iteration-merge-queue-2026-05.md` as the active PR-to-release sequencing surface.
8. Use `docs/active-goal-artifact-audit-2026-05.md` to map the long-running benchmark goal to current evidence and blockers.

## Current Machine Notes

- Cargo and Rust tooling path: `E:\EnvConfig\cargo\bin`
- Tauri release target path: `E:\EnvConfig\rust_target`
- Electron portable output: `release\electron\win-unpacked`
- Release staging folder pattern: `release\vX.Y.Z-hotfixN`
