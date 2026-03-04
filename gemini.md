# Recent Work Summary
- enforced repo hygiene: deleted operational/temporary docs (`docs/benchmark-launch-plan-2026Q2.md`, `tasks.md`, `progress.txt`, `tauri-help.txt`, audit outputs) plus test artifacts; moved PRD and templates into `docs/`/`templates/`; updated README(s), RELEASE_NOTES, and `.gitignore` references to reflect new structure.
- added proactive hygiene guard: created `scripts/repo-hygiene-check.mjs`, npm `ci:repo-hygiene` script, and CI now runs `npm run ci:check` (guard + build) so blocked files/secrets fail early.
- validated iterations with `npm run typecheck`, `npm run build`, and `npm run ci:check`, then pushed both cleanup and hygiene commits to `origin/main` (retrying via HTTP/1.1 when TLS failed).

# Next Steps
- keep README/install docs aligned with latest installers and Pages stats, tidy `apps/site` copy and release notes, and track outstanding template/feature doc updates.
- continue feature work (clipboard/menu fix, search UI, Markdown editor polish) per the ongoing optimization queue, running lint/build, staging only relevant files, and letting the hygiene check guard the repo before pushing.
