# MYmd

[Read in English](README_en.md)

MYmd 是一款基于 Electron、React 和 Vite 构建的轻量级 Markdown 桌面阅读与编辑器。它提供了流畅的所见即所得体验和强大的源码分离模式，专为优雅、专注的写作和阅读而设计。

## 核心特性

- 双编辑模式: 支持纯粹的所见即所得编辑器 (Wysiwyg) 与代码源码分屏模式，满足不同写作场景。
- 完善的拓展支持: 内置 Mermaid 渲染、KaTeX 数学公式渲染以及 Prism 代码高亮功能。
- 高级搜索与替换: 内嵌了全文查找和替换功能，支持全局高亮显示以及快速跳转。
- 仿 Typora 语法提示: 动态 Markdown 伪元素提示，让所见即所得编辑更直观。
- 账户与设置面板: 提供高度可配置的主题、透明度和缩放级别选项，并提供本地最近文件管理结构。

## 技术栈

- 核心框架: React 19, TypeScript
- 桌面端化: Electron, Electron-Vite
- 编辑器引擎: Milkdown (WYSIWYG), Prosemirror, CodeMirror 6 (源码模式)
- 样式系统: Tailwind CSS, PostCSS 及自定义原生 CSS

## 开始使用

确保您已经安装了 Node.js。

1. 克隆本项目：
   git clone https://github.com/LaplaceYoung/MYmd.git
2. 安装依赖：
   npm install
3. 启动开发服务器：
   npm run dev
4. 构建打包程序：
   npm run build

## 许可证

MIT License
