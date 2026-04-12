# MYmd

本地优先的桌面 Markdown 编辑器，技术栈：**React 19 + TypeScript + Tauri + Milkdown + CodeMirror + Zustand**。  
支持 WYSIWYG 与分屏源码预览，面向结构化写作、知识管理与 AI 辅助编辑。

[English](./README_en.md)

## 主要能力

- 多标签编辑、打开/保存/另存为/导出 HTML、自动保存
- 未保存关闭确认、工作区文件树、TOC 侧栏、搜索替换
- KaTeX、Mermaid、语法高亮、主题/字号/排版参数
- Focus Mode、Typewriter Mode、自定义标题栏

## AI 助手（本次增强）

- 接入 SiliconFlow OpenAI 兼容接口（默认）  
  - Endpoint: `https://api.siliconflow.cn/v1/chat/completions`
  - Model: `deepseek-ai/DeepSeek-R1-Distill-Qwen-7B`
- AI 五种任务模式：
  - 写作（Writing）
  - 润色（Polish）
  - 修改（Modify）
  - 排版（Layout）
  - 智能图谱（Graph）
- 设置页新增：
  - 一键应用 SiliconFlow 预设
  - AI 连接测试（Test AI Connection）

> 提示：API Key 仅本地使用，不应提交到仓库。

## 竞品对比与补强

已整理 Obsidian / Typora / Joplin / Cherry Markdown 的差距与补强方案：  
`docs/competitive-gap-analysis-2026-04.md`

## 开发与验证

```bash
npm install
npm run typecheck
npx playwright test tests/ai_runtime.spec.ts
npm run build
```

## 双版本打包

### Tauri

```bash
npm run build:tauri
```

产物示例（Windows）：
- `E:\EnvConfig\rust_target\release\bundle\nsis\MYmd_1.4.3_x64-setup.exe`
- `E:\EnvConfig\rust_target\release\bundle\msi\MYmd_1.4.3_x64_en-US.msi`

### Electron

```bash
npm run build:electron
```

产物目录（Windows）：
- `release/electron/win-unpacked/`

## License

[MIT](./LICENSE)

## 最新发布（v1.4.3-hotfix5）

发布资产目录：`release/v1.4.3-hotfix5/`

- `MYmd_1.4.3_x64-setup.exe`（Tauri NSIS 安装包）
- `MYmd_1.4.3_x64_en-US.msi`（Tauri MSI 安装包）
- `MYmd-Electron-1.4.3-x64-portable.zip`（Electron 便携版）
