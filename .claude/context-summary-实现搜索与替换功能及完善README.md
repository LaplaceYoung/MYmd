## 项目上下文摘要（实现搜索与替换功能及完善README）
生成时间：2026-02-26 08:45:00

### 1. 相似实现分析
- **实现1**: `src/components/Editor/plugins/syntaxHintPlugin.ts`
  - 模式：ProseMirror Plugin API 接入
  - 可复用：编辑器的扩展模式，插件注册方法 `view.state.reconfigure` 等。
  - 需注意：更新 activeMarks 与焦点管理。
- **实现2**: `src/components/Editor/WysiwygEditor.tsx`
  - 模式：Zustand store (editorCommand) 指令路由
  - 可复用：`executeCommand` 用于派发动作。

### 2. 项目约定
- **命名约定**: React UI `.tsx` 且使用大驼峰；Hooks/Stores 使用小驼峰；逻辑插件存放在 `plugins` 文件夹下。
- **文件组织**: CSS 在同名 `.css`，或存放在 `styles` 全局目录下。
- **强制约束**: 遵守中文文档规范，代码注释全部使用中文。

### 3. 可复用组件清单
- `editorStore.ts`: 管理全局 `editorCommand` 及其调用。
- `prosemirror-search`: 已在依赖中，可直接引入。

### 4. 测试策略
- **本地启动编译验证**: `npm run dev` / `tsc --noEmit`。
- **覆盖要求**: `SearchBar` 点击测试、正常搜索匹配、替换及边界用例。

### 5. 依赖和集成点
- **外部依赖**: `prosemirror-search`, `@codemirror/search`
- **内部通信**: 通过 `useEditorStore` -> `editorCommand`。

### 6. 关键风险点
- **依赖缺失/兼容**: `prosemirror-search` 版本是否符合 Milkdown 中捆绑的 `prosemirror-state` 等。
- **源编辑器光标跳动**: 查找替换后光标对齐的问题。
