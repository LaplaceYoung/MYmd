<div align="center">
  <img src="src/assets/logo.svg" height="120" alt="MYmd Logo" />
  <h1>MYmd</h1>
  <p>A lightweight Markdown desktop reader and editor</p>

  <p>
    <a href="https://github.com/LaplaceYoung/MYmd/releases"><img src="https://img.shields.io/github/v/release/LaplaceYoung/MYmd?color=blue&style=flat-square" alt="Release"></a>
    <a href="https://github.com/LaplaceYoung/MYmd/stargazers"><img src="https://img.shields.io/github/stars/LaplaceYoung/MYmd?style=flat-square" alt="Stars"></a>
    <a href="https://github.com/LaplaceYoung/MYmd/blob/main/LICENSE"><img src="https://img.shields.io/github/license/LaplaceYoung/MYmd?color=green&style=flat-square" alt="License"></a>
  </p>
</div>

<br/>

[Read in English](README_en.md) | [阅读中文版](README.md)

MYmd is a lightweight Markdown desktop reader and editor built with Electron, React, and Vite. It provides a fluid WYSIWYG experience and a powerful source-split mode, designed for elegant and focused writing and reading.

## Core Features

- Dual Editing Modes: Supports a pure WYSIWYG editor alongside a code-source split mode, catering to various writing scenarios.
- Comprehensive Extensions: Built-in support for Mermaid diagrams, KaTeX mathematical formulas, and Prism code highlighting.
- Advanced Search and Replace: Embedded full-text search and replace capabilities with global highlighting and quick navigation.
- Typora-like Syntax Hints: Dynamic Markdown pseudo-element hints making WYSIWYG editing more intuitive.
- Account and Settings Panels: Highly configurable options for themes, transparency, and zoom levels, along with local recent file management.

## Tech Stack

- Core Framework: React 19, TypeScript
- Desktop Integration: Electron, Electron-Vite
- Editor Engines: Milkdown (WYSIWYG), Prosemirror, CodeMirror 6 (Source Mode)
- Styling: Tailwind CSS, PostCSS, and custom raw CSS

## Getting Started

Ensure you have Node.js installed.

1. Clone the repository:
   git clone https://github.com/LaplaceYoung/MYmd.git
2. Install dependencies:
   npm install
3. Start the development server:
   npm run dev
4. Build the application:
   npm run build

## License

MIT License
