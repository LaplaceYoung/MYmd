<div align="center">
  <img src="src/assets/logo.svg" height="120" alt="MYmd Logo" />
  <h1>MYmd</h1>
  <p>基于 Tauri 的本地优先 Markdown 桌面编辑器</p>

  <p>
    <a href="https://github.com/LaplaceYoung/MYmd/releases"><img src="https://img.shields.io/github/v/release/LaplaceYoung/MYmd?color=blue&style=flat-square" alt="Release"></a>
    <a href="https://github.com/LaplaceYoung/MYmd/stargazers"><img src="https://img.shields.io/github/stars/LaplaceYoung/MYmd?style=flat-square" alt="Stars"></a>
    <a href="https://github.com/LaplaceYoung/MYmd/blob/main/LICENSE"><img src="https://img.shields.io/github/license/LaplaceYoung/MYmd?color=green&style=flat-square" alt="License"></a>
  </p>
</div>

<br/>

[Read in English](README_en.md) | [阅读中文版](README.md)

MYmd 是一款基于 **Tauri + React + TypeScript** 的本地优先 Markdown 编辑器，支持所见即所得、源码与分屏三种视图，适用于高频写作、知识整理和结构化内容创作。

## 版本信息

- 当前版本：`v1.2.3`
- 目标平台：`Windows x64`
- 最新发布：<https://github.com/LaplaceYoung/MYmd/releases>
- 宣传页面：<https://laplaceyoung.github.io/MYmd/>
- 上线方案（对标+推流+迭代）：[docs/benchmark-launch-plan-2026Q2.md](docs/benchmark-launch-plan-2026Q2.md)

## 功能总览

### 编辑与写作体验

- 多标签编辑，支持快速切换文档上下文。
- 三种编辑视图：WYSIWYG、Source、Split。
- 支持 Focus Mode / Typewriter Mode，提升连续写作沉浸感。
- 未保存状态检测与关闭前确认，避免内容丢失。

### 文件工作流

- 支持新建、打开、保存、另存为、导出 HTML。
- 全局自动保存（仅对已落盘文件生效）。
- Workspace 文件树浏览与打开。
- 支持 `.md` / `.markdown` 文件关联打开。

### 内容增强能力

- 内置 KaTeX 数学公式渲染。
- 内置 Mermaid 图表渲染。
- 代码语法高亮（Prism/Refractor）。
- TOC 目录侧栏与全文 Search/Replace。

### 桌面集成与交互

- Tauri 原生窗口能力，自定义标题栏与窗口控制。
- 单实例运行：二次启动时将文件参数转发给当前窗口。
- 启动参数文件打开链路优化，避免“先欢迎页再打开文件”的闪跳。

## v1.2.3 重点更新

1. 修复编辑器粘贴链路：右键菜单与菜单栏粘贴可正确写入编辑区（不再仅 `Ctrl+V` 有效）。
2. 新增工程治理基线：CI、Issue/PR/Release 模板、Contributing 与 Security 文档。
3. 新增 GitHub Pages 宣传站（`apps/site`），并自动展示仓库 Star 与最新版本。
4. 新增同类项目对标与推流上线方案文档，明确 8 周执行路线。

## 技术栈

| 层级 | 技术 |
| --- | --- |
| UI | React 19, TypeScript, Tailwind CSS |
| Editor | Milkdown, ProseMirror, CodeMirror 6 |
| State | Zustand |
| Desktop Runtime | Tauri v2 |
| Native Side | Rust |
| Build | Vite, Tauri CLI |

## 快速开始

### 环境要求

- Node.js 20+
- Rust 1.77.2+
- Windows 10/11（打包使用 NSIS）

### 本地开发

```bash
git clone https://github.com/LaplaceYoung/MYmd.git
cd MYmd
npm install
npm run dev
```

### 构建桌面应用

```bash
npm run build
npm run tauri build
```

## 安装包产物

Tauri 构建后，Windows 产物位于：

- `src-tauri/target/release/bundle/nsis/MYmd_1.2.3_x64-setup.exe`
- `src-tauri/target/release/bundle/nsis/MYmd_1.2.3_x64.exe`

项目同时维护一个便于分发的 `release/` 目录（仅保留最新版本安装包）。

## 目录结构

```text
MYmd/
|- src/                 # React 前端
|- src-tauri/           # Tauri + Rust 后端
|- release/             # 发布产物目录（最新安装包）
|- tests/               # 自动化与调试脚本
|- README.md            # 中文说明
`- README_en.md         # English README
```

## 许可证

MIT License
