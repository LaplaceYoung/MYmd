# MYmd Release Notes

## v1.2.3 (2026-03-03)

### Highlights

- Fixed editor paste behavior for context-menu paste and menu-bar paste.
- Added GitHub governance baseline:
  - CI workflow (`npm ci` + `npm run build`)
  - Issue/PR/Release templates
  - `CONTRIBUTING.md` and `SECURITY.md`
- Added GitHub Pages landing site under `apps/site`.
- Added benchmark and launch strategy document:
  - `docs/benchmark-launch-plan-2026Q2.md`

### Core Fixes

- Updated clipboard target resolution and editable focus fallback in `src/utils/editorClipboard.ts`.
- Ensured paste action works when focus comes from context menu or top menu actions.

### Version Alignment

- `package.json`: `1.2.3`
- `package-lock.json`: `1.2.3`
- `src-tauri/Cargo.toml`: `1.2.3`
- `src-tauri/tauri.conf.json`: `1.2.3`

### Build Outputs (Windows x64)

- `MYmd_1.2.3_x64-setup.exe`
- `MYmd_1.2.3_x64.exe`

---

## v1.2.2 (2026-03-03)

### Highlights

- Added Windows single-instance handling via `tauri-plugin-single-instance`.
- Improved file association open flow for `.md` and `.markdown`.
- Updated docs to reflect current Tauri architecture and release workflow.

### Core Fixes

- Added Rust command `read_text_file_from_path` to safely load file content from CLI args.
- Refactored `useCliFileOpener`:
  - supports quoted paths and `file://` arguments
  - filters invalid flags and duplicate args
  - listens for forwarded second-instance event `mymd://open-files`
- Updated `EditorContainer` with welcome suppression during CLI initialization to avoid startup flicker.
- Added `bundle.fileAssociations` in `tauri.conf.json` for OS-level open-with integration.

### Version Alignment

- `package.json`: `1.2.2`
- `package-lock.json`: `1.2.2`
- `src-tauri/Cargo.toml`: `1.2.2`
- `src-tauri/tauri.conf.json`: `1.2.2`

### Build Outputs (Windows x64)

- `MYmd_1.2.2_x64-setup.exe`
- `MYmd_1.2.2_x64.exe`

---

## v1.2.1

### Main Updates

- Removed remaining Electron-era file APIs and aligned to Tauri plugin-based dialogs/filesystem.
- Improved global search menu interaction behavior.
- Refined context menu operations for higher-frequency actions.

---

## v1.1.0 (Tauri Edition)

### Main Updates

- Completed architecture migration from Electron to Tauri v2.
- Added custom title bar and improved window lifecycle handling.
- Reduced runtime overhead and installer footprint.
