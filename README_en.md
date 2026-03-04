<div align="center">
  <img src="src/assets/logo.svg" height="120" alt="MYmd Logo" />
  <h1>MYmd</h1>
  <p>Local-first Markdown desktop editor built with Tauri</p>

  <p>
    <a href="https://github.com/LaplaceYoung/MYmd/releases"><img src="https://img.shields.io/github/v/release/LaplaceYoung/MYmd?color=blue&style=flat-square" alt="Release"></a>
    <a href="https://github.com/LaplaceYoung/MYmd/stargazers"><img src="https://img.shields.io/github/stars/LaplaceYoung/MYmd?style=flat-square" alt="Stars"></a>
    <a href="https://github.com/LaplaceYoung/MYmd/blob/main/LICENSE"><img src="https://img.shields.io/github/license/LaplaceYoung/MYmd?color=green&style=flat-square" alt="License"></a>
  </p>
</div>

<br/>

[Read in English](README_en.md) | [阅读中文版](README.md)

MYmd is a **Tauri + React + TypeScript** local-first Markdown desktop editor with WYSIWYG, source, and split views, designed for high-frequency writing and structured content workflows.

## Version

- Current version: `v1.2.3`
- Target platform: `Windows x64`
- Latest releases: <https://github.com/LaplaceYoung/MYmd/releases>
- Landing page: <https://laplaceyoung.github.io/MYmd/>

## Feature Overview

### Editing Experience

- Multi-tab editing for fast context switching.
- Three editing views: WYSIWYG, Source, and Split.
- Focus Mode and Typewriter Mode for distraction-reduced writing.
- Unsaved-change detection with close confirmation.

### File Workflow

- New, open, save, save-as, and HTML export.
- Global auto-save (only for files already persisted to disk).
- Workspace file explorer for navigation and open actions.
- File association support for `.md` and `.markdown`.

### Content Capabilities

- Built-in KaTeX math rendering.
- Built-in Mermaid diagram rendering.
- Syntax highlighting powered by Prism/Refractor.
- TOC sidebar and global search/replace.

### Desktop Integration

- Native Tauri window runtime with custom title bar controls.
- Single-instance behavior: file args from second launches are forwarded to the running window.
- Startup open-file flow avoids welcome-page flicker before CLI file loading finishes.

## v1.2.3 Highlights

1. Fixed editor paste flow: context-menu and menu-bar paste now work reliably (not only `Ctrl+V`).
2. Added governance baseline: CI, Issue/PR/Release templates, Contributing, and Security docs.
3. Added GitHub Pages landing site (`apps/site`) with dynamic Star and latest release metadata.

## Tech Stack

| Layer | Technology |
| --- | --- |
| UI | React 19, TypeScript, Tailwind CSS |
| Editor | Milkdown, ProseMirror, CodeMirror 6 |
| State | Zustand |
| Desktop Runtime | Tauri v2 |
| Native Side | Rust |
| Build | Vite, Tauri CLI |

## Quick Start

### Requirements

- Node.js 20+
- Rust 1.77.2+
- Windows 10/11 (NSIS packaging)

### Local Development

```bash
git clone https://github.com/LaplaceYoung/MYmd.git
cd MYmd
npm install
npm run dev
```

### Desktop Build

```bash
npm run build
npm run tauri build
```

### Release Automation

- Pushing a `v*` tag triggers GitHub Actions to build and upload installers to GitHub Releases.
- Workflow file: `.github/workflows/release-tag.yml`

## Installer Artifacts

After a Tauri build on Windows, artifacts are generated in:

- `src-tauri/target/release/bundle/nsis/MYmd_1.2.3_x64-setup.exe`
- `src-tauri/target/release/bundle/nsis/MYmd_1.2.3_x64.exe`

The repository also keeps a `release/` folder for latest distribution-ready installers.

## Project Structure

```text
MYmd/
|- src/                 # React frontend
|- src-tauri/           # Tauri + Rust backend
|- docs/                # Product and project docs
|- templates/           # Built-in template examples
|- release/             # Release artifacts (latest installer only)
|- tests/               # Automation and debug scripts
|- README.md            # Chinese README
`- README_en.md         # English README
```

## License

MIT License
