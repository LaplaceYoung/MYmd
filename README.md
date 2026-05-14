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

[Read in English](README_en.md) | [阅读中文](README.md)

MYmd 是一个基于 **Tauri + React + TypeScript** 的本地优先 Markdown 编辑器，支持所见即所得、源码与分屏三种编辑视图，适用于高频写作、知识整理与结构化内容创作。

## 版本信息

- 当前版本：`v1.4.3-hotfix7`
- 目标平台：`Windows x64`
- 最新发布：<https://github.com/LaplaceYoung/MYmd/releases>
- 宣传页面：<https://laplaceyoung.github.io/MYmd/>

## 功能截图

### 欢迎页总览

![欢迎页总览](docs/screenshots/welcome-overview.png)

### 顶部搜索下拉菜单（已修复透明度问题）

![顶部搜索下拉菜单](docs/screenshots/top-search-dropdown.png)

### 全局搜索弹窗

![全局搜索弹窗](docs/screenshots/global-search-modal.png)

### 分屏编辑与实时预览（含 Mermaid）

![分屏编辑与实时预览](docs/screenshots/split-editor-preview.png)

## 功能总览

### 编辑与写作体验

- 多标签编辑，支持快速切换上下文。
- 三种视图：WYSIWYG、Source、Split。
- Focus Mode / Typewriter Mode，提升连续写作沉浸感。
- 未保存状态检测与关闭确认，避免内容丢失。

### 文件工作流

- 支持新建、打开、保存、另存为、导出 HTML。
- 全局自动保存（仅对已落盘文件生效）。
- Workspace 文件树浏览与打开。
- 支持 `.md` / `.markdown` 文件关联打开。

### 内容增强能力

- 内置 KaTeX 数学公式渲染。
- 内置 Mermaid 图表渲染。
- 代码语法高亮（Prism/Refractor）。
- TOC 侧栏与全局搜索/替换。

### 桌面集成与交互

- Tauri 原生窗口能力，自定义标题栏与窗口控制。
- 单实例运行：二次启动时将文件参数转发给当前窗口。
- 启动参数文件打开链路已优化，避免欢迎页闪跳。

## v1.4.3-hotfix7 重点更新

1. 新增 CLI/文件关联打开的知识索引 release smoke gate，覆盖文档、标题、标签召回。
2. 修复独立 hashtag 行标签解析，`#topic` 现在会进入本地知识索引。
3. 重建 Windows NSIS/MSI 安装包与 Electron 便携包，并整理 `v1.4.3-hotfix7` 发布 staging。
4. 发布前验证 Tauri 桌面窗口、Electron CDP 首页、CLI 打开文件索引与 release asset SHA256。
5. 更新 roadmap、release playbook、执行日志与项目记忆，形成可复用迭代闭环。

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
- Windows 10/11（NSIS 打包）

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

### 发布流程（自动化）

- 推送 `v*` 标签会触发 GitHub Actions 自动打包并上传安装包到 Release。
- 工作流文件：`.github/workflows/release-tag.yml`

## 安装包产物

本机本次打包产物路径：

- `E:\EnvConfig\rust_target\release\bundle\nsis\MYmd_1.4.3_x64-setup.exe`
- `E:\EnvConfig\rust_target\release\bundle\msi\MYmd_1.4.3_x64_en-US.msi`

项目内分发目录（已同步）：

- `release/MYmd_1.4.3_x64-setup.exe`

## 目录结构

```text
MYmd/
|- src/                 # React 前端
|- src-tauri/           # Tauri + Rust 后端
|- docs/                # 产品与项目文档
|- templates/           # 内置模板示例
|- release/             # 发布产物目录（最新安装包）
|- tests/               # 自动化与调试脚本
|- README.md            # 中文说明
`- README_en.md         # English README
```

## 许可证

MIT
