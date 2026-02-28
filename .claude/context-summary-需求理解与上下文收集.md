## 项目上下文摘要（修复搜索、图标、数学公式、双滑）
生成时间：2026-02-26 10:54

### 1. 相似实现与现有架构分析
- **搜索替换功能 (SearchBar.tsx, editorStore.ts, WysiwygEditor.tsx)**
  - 存在一个全局搜索条 `SearchBar.tsx`，通过 `editorCommand` 下发搜索指令。
  - `WysiwygEditor.tsx` 中的 ProseMirror 使用了 `prosemirror-search` 提供搜索能力。
  - *当前问题*：`SourceEditor` (CodeMirror) 也是基于同一个状态管理，但没有接入全局的 `SearchBar` 指令体系，且快捷键在 CodeMirror 内被原生拦截，体验割裂。
- **图标替换 (package.json, electron/main.ts)**
  - `main.ts` 中 `BrowserWindow` 实例创建时未配置 `icon` 属性。
  - `package.json` 的 `build.fileAssociations` 缺少明确的 `icon` 属性声明，导致打包安装后 `.md` 文件关联的是默认 Electron 图标。
- **数学公式编辑 (WysiwygEditor.tsx, editor.css)**
  - 使用了 `@milkdown/plugin-math` 渲染 LaTeX。
  - 在 Milkdown 中，数学块默认使用一个内嵌的 CodeMirror 或 TextArea 编辑文本。但常常因为外层渲染节点屏蔽了点击事件，或缺乏相应的 NodeView 交互导致无法唤起输入框。
- **分屏同步 (EditorContainer.tsx, SourceEditor.tsx, WysiwygEditor.tsx)**
  - 分屏模式下，Source 和 Preview 位于两边独立渲染。
  - 缺乏基于百分比或基于 AST 节点映射的滚动同步。需要监听两端的 `onScroll` 事件进行按比例同步。
  - 需要监听光标选区（`CodeMirror` 的 `onUpdate` 和 ProseMirror 的 `onSelectionChange`），对应做滚动定位。

### 2. 项目约定
- **代码规范**：React 18 + TS + Vite + Zustand + Tailwind/普通 CSS。
- **环境要求**：支持纯浏览器和 Electron 双线运行，且功能应做到优雅降级。
- **所有提交物必须采用简体中文描述**。

### 3. 未造轮子证明
并未自己发明协议或重复造包含编辑器能力的组件，方案充分利用了 CodeMirror 和 ProseMirror/Milkdown 的原生/插件 API。
