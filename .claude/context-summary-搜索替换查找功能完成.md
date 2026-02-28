## 项目上下文摘要（搜索替换功能实现）
生成时间：2026-02-26 11:08:00

### 1. 相似实现分析
- **实现1**: `src/components/Editor/SearchBar.tsx:1-150`
  - 模式：Float全局浮窗挂载，监听了 `Ctrl+F` 和 `Ctrl+H` 快捷键，统一使用 `useEditorStore` 中的 `editorCommand` 下发搜索指令。
  - 需注意：CodeMirror 原生地屏蔽了这些快捷键事件，导致源码模式下不响应弹窗，且指令下发模型不支持多实例共存。
- **实现2**: `src/components/Editor/WysiwygEditor.tsx:280-330`
  - 模式：使用 ProseMirror 自带的 SearchQuery，并通过 `editorCommand` 进行了方法桥接映射。
- **实现3**: `src/components/Editor/SourceEditor.tsx:40-80`
  - 模式：基础的 `CodeMirror` 的封装，依赖 `@codemirror/search` 但被禁用了原生 `searchKeymap` 以防止默认行为污染。目前缺少对 store 内指令的订阅与分发。

### 2. 项目约定
- **命名约定**: store 内置指令全部使用 `camelCase`，事件触发使用 React Hooks 以及 `useEffect` 做副作用回收。
- **文件组织**: 全部集中在 `src/components/Editor/`，业务解耦在 `src/stores/` 中。
- **代码风格**: Hooks 实现组件，严禁 `Any` 类型，必须在组件卸载时移除副作用（监听器）。

### 3. 可复用组件清单
- `src/stores/editorStore.ts`: 可扩展现有的 store `setEditorCommand` 作为多发单收的 `registerCommand` 事件队列方案。
- `@codemirror/search` 的原生 API `findNext`, `findPrevious`, `setSearchQuery` 等等可以无需重新构造算法。

### 4. 测试策略
- **测试框架**: 无显式测试框架，采用功能验证日志+tsc编译自检。
- **覆盖要求**: 需要兼顾全局快捷键、源文件模式（`isCodeMirrorTarget` 不再拦截）并测试替换文本正确替换。

### 5. 依赖和集成点
- **外部依赖**: `@codemirror/search` 已验证在 `package-lock.json` 中存在
- **核心组件**: `editorStore.ts` 必须从单播改为广播，支持多个 Editor (Wysiwyg + Source) 各自按需执行/同时挂载。

### 6. 技术选型理由
- **选型**: 重构 `editorStore`的单命令为 `editorCommands: Record<string, CommandExecutor>`。
- **优势**: 低入侵性变更，可以使得之后扩充多屏（三栏等）均无缝兼容，`SearchBar` 唯一发送指令，多个 Editor 按自己内部逻辑消化指令。

### 7. 关键风险点
- 多遍重复注册：`useEffect` 每次重渲染可能多次绑定，注意 `unregisterCommand`。
- 多组件光标竞争：CodeMirror 接受搜索时必须先判别是否有内容。
