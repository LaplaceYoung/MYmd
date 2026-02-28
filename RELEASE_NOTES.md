# MYmd v1.2.1 - Release Notes

## 🛠️ 质量与性能双提升

本次更新重点修复了迁移至 Tauri 后遗留的交互与系统兼容性问题，并针对开发者环境进行了深度优化。

### 🐞 核心修复
- **文件系统全面兼容**：彻底移除遗留的 Electron API，重构了侧边栏、工具栏及插入图片弹窗的文件操作逻辑。现在已完美支持 Tauri v2 的原生文件打开与保存对话框。
- **搜索菜单深度优化**：重构了顶部全局搜索菜单 `TopSearchMenu`。修复了选项过滤失效及点击反馈不灵敏的问题，交互现在更加丝滑。
- **精简右键菜单**：根据用户反馈对编辑器右键菜单进行了重新规划，去除了低频操作，使菜单更加精炼、直观。

### ⚡ 系统与环境优化
- **C 盘空间大瘦身**：引入了全新的环境路径重定向策略。现在 Cargo 缓存、Rustup 及编译 Target 目录已默认重定向至非系统盘（如 E 盘），累计为 C 盘释放约 8GB+ 空间，并有效防止未来磁盘碎片堆积。
- **自动经验沉淀**：集成了项目级 Skill 自动生成系统，确保每一次技术突破都能沉淀为 AI 助手的长期记忆。

---

# MYmd v1.2.1 - Release Notes

## 🛠️ Quality & Performance Boost

This update focuses on fixing legacy inheritance issues from the Electron-to-Tauri migration and provides deep optimizations for the development environment.

### 🐞 Core Fixes
- **Full Filesystem Compatibility**: Completely removed legacy Electron APIs. Refactored file operations in the sidebar, Ribbon, and Image Dialog to use Tauri v2 native dialogs and FS plugins.
- **Search Menu Optimization**: Rebuilt the `TopSearchMenu` with better filtering logic and improved click response via `onMouseDown` handling.
- **Streamlined Context Menu**: Redesigned the editor's right-click menu to be more concise, retaining only high-frequency operations for a cleaner UX.

### ⚡ System & Environment
- **C-Drive Decoupling**: Implemented environment variable redirection. Cargo, Rustup, and Build Target directories are now moved to a non-system drive, reclaiming ~8GB+ of system disk space.
- **Knowledge Persistence**: Integrated an automated Skill generation system to ensure technical breakthroughs are persisted for future development.

---

# MYmd v1.1.0 (Tauri Edition) - Release Notes

## 🚀 重大更新：全面转向 Tauri 架构
本次更新标志着 MYmd 从 Electron 框架正式迁移至 **Tauri v2**。这一转变带来了本质上的性能提升与体积优化。

### 🏗️ 架构升级
- **核心引擎**：从臃肿的 Chromium 运行时转向原生 Webview 加 Rust 后端。
- **性能飞跃**：启动速度提升约 50%，内存占用显著降低。
- **体积减小**：安装包体积大幅缩减，运行更加轻量化。

### 🎨 界面与交互 (UI/UX)
- **沉浸式设计**：采用了全新的无边框（Frameless）设计，去除了系统原生标题栏，外观更现代、简洁。
- **自定义标题栏**：全新实现的自定义标题栏，支持平滑拖拽与窗口控制（最小化、最大化、关闭）。
- **图标更新**：更新了应用图标，视觉更加统一。

### 🛠️ 功能优化与修复
- **更稳健的交互逻辑**：
  - 彻底重构了**窗口关闭生命周期**。现在关闭窗口时会智能检查未保存的文档，并提供保存确认。
  - 引入了 Rust 后端原生退出指令，确保应用在关闭时能彻底结束相关进程。
- **事件处理**：修复了自定义按钮点击可能导致的页面刷新或冒泡问题。

---

## 🚀 Major Updates: Migrating to Tauri Architecture
This release marks MYmd's official transition from Electron to **Tauri v2**. This change brings fundamental improvements in performance and size optimization.

### 🏗️ Architecture Upgrade
- **Core Engine**: Switched from the heavy Chromium runtime to a native Webview with a Rust backend.
- **Performance**: ~50% faster startup and significantly lower memory footprint.
- **Lightweight**: Drastically reduced installer and installed app size.

### 🎨 UI & UX Enhancements
- **Immersive Design**: New frameless window design for a modern, clean aesthetics.
- **Custom TitleBar**: Programmatically handled dragging and window controls.
- **Refined Assets**: Updated branding and icons.

### 🛠️ Fixes & Improvements
- **Robust Window Lifecycle**: 
  - Completely refactored the close flow to correctly handle unsaved changes with sequential confirmations.
  - Native Rust-based application termination for a cleaner exit.
- **Event Management**: Fixed bubbling issues that previously caused navigation resets on click.

---
**Enjoying MYmd?** Star us on GitHub: [LaplaceYoung/MYmd](https://github.com/LaplaceYoung/MYmd)
