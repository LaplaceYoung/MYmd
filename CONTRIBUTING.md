# Contributing to MYmd

Thanks for contributing to MYmd.

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start dev server:
   ```bash
   npm run dev
   ```
3. Build check:
   ```bash
   npm run build
   ```
   Optional (known debt, currently non-blocking in CI):
   ```bash
   npm run typecheck
   ```

## Commit Convention

Use Conventional Commits:

- `feat:` new feature
- `fix:` bug fix
- `refactor:` code restructuring
- `docs:` documentation update
- `chore:` tooling/build/config work

## Pull Request Checklist

- Keep PRs focused and atomic.
- Add test evidence (logs/screenshots) for behavior changes.
- Ensure CI passes before merge.
- Describe risk and rollback plan in PR template.

## Reporting Issues

Please use the issue templates in `.github/ISSUE_TEMPLATE`.
