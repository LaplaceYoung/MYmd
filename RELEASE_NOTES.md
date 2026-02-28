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
