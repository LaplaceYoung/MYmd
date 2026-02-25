## 项目上下文摘要（Word_Fluent_UI_彻底重构）
生成时间：2026-02-25 21:00:00

### 1. 相似实现分析
- **实现1**: `src/components/TitleBar/TitleBar.tsx`
  - 模式：使用无边框窗口 (`-webkit-app-region: drag`) 和自定义控制按钮。
  - 需要改造：添加快速访问工具栏（保存、撤销、重做）并在中间加入 Fluent 风格的带底色搜索框。右侧增加用户头像。
- **实现2**: `src/components/Editor/EditorContainer.tsx`
  - 模式：条件渲染“欢迎页”和“Markdown编辑器”。
  - 需要改造：欢迎页（Backstage）需加入上下分离的侧边栏、卡片式模板画廊和具有多列信息的最近文件表格。核心编辑器需从“全屏铺满”改为“深色背景 + 居中固定宽度白纸（带阴影）”的物理纸张隐喻，并去掉现有 TabBar。
- **实现3**: `src/components/Toolbar/Toolbar.tsx` 及 `TabBar.tsx`
  - 模式：现存为简单的单行工具栏和标签栏。
  - 需要改造：废弃原有设计，引入拥有双层结构、且划分了竖线分组（剪贴板、字体、段落）的现代 Ribbon 菜单。

### 2. 项目约定
- **命名约定**: BEM CSS 规范，React Hooks 组件形式。
- **技术栈**: React + TypeScript + CSS Variables。由于用户提出不增加大量依赖，将优先采用“手写严格符合 WinUI 3 规范的 CSS”以控制项目体积和复杂度，结合原有 `lucide-react` 提供图标。

### 3. 可复用组件清单
- `editorStore.ts`: 维持现有的文件加载与保存逻辑。
- `TitleBar`, `EditorContainer`, `StatusBar`: 在现有文件骨架内大幅度调整 DOM 和 CSS 结构。

### 4. 测试策略
- 构建验证：`npm run build`。
- 本地调试验证：`npm run dev` 在浏览器中直接手工验收界面布局和 Fluent Design 阴影、间距。

### 5. 关键风险点
- **物理纸张隐喻**: Markdown 编辑器 (如 `milkdown` 或其他) 默认可能是流动拉伸的，需要用外层级容器包裹并约束其宽度为常见的 800px 或 A4 比例（例如 `max-width: 794px`，带上 padding 和 shadow），且需保证滚动条在外层容器而非内部。
- **Ribbon 菜单状态**: 传统的 Markdown 编辑器功能有限，排版 Ribbon 的视觉表现需要准备很多无实际功能或仅做样式展示的占位按钮（如居中、加粗、颜色），需小心处理回调或留空。
