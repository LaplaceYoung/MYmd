# MYmd

Local-first desktop Markdown editor built with **React 19 + TypeScript + Tauri + Milkdown + CodeMirror + Zustand**.

[中文说明](./README.md)

## Core Features

- Multi-tab editing, open/save/save-as/export HTML, auto-save
- Unsaved-close confirmation, workspace explorer, TOC, search/replace
- KaTeX, Mermaid, syntax highlighting, theme/font/layout settings
- Focus mode, typewriter mode, custom title bar controls

## AI Assistant (Upgraded)

- Default SiliconFlow OpenAI-compatible endpoint:
  - `https://api.siliconflow.cn/v1/chat/completions`
  - `deepseek-ai/DeepSeek-R1-Distill-Qwen-7B`
- Five AI task modes:
  - Writing
  - Polish
  - Modify
  - Layout
  - Smart Graph
- New settings actions:
  - One-click SiliconFlow preset
  - AI connection probe

> API keys stay local and should never be committed.

## Competitive Gap Analysis

Comparison against Obsidian / Typora / Joplin / Cherry Markdown:
`docs/competitive-gap-analysis-2026-04.md`

## Build & Verification

```bash
npm install
npm run typecheck
npx playwright test tests/ai_runtime.spec.ts
npm run build
```

## Desktop Packaging

### Tauri

```bash
npm run build:tauri
```

### Electron

```bash
npm run build:electron
```

Output (Windows):
- `release/electron/win-unpacked/`

## License

[MIT](./LICENSE)
