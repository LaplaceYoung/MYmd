## 编码后声明 - 搜索查找替换功能独立合并
时间：2026-02-26 11:10:00

### 1. 复用了以下既有组件
- store: 基于 `editorStore` 原有下发方案改写成了指令多队列。
- 组件: 使用官方 `@codemirror/search` 代替自定义的高亮方案。

### 2. 遵循了以下项目约定
- 命名约定：新增的 `registerCommand` 和 `unregisterCommand` 均符合小驼峰
- 代码风格：均严格解绑了 hooks side-effect，TypeScript 无 any 缺失。

### 3. 对比了以下相似实现
- 与现存的 ProseMirror 相似，它使用内置 `dispatch(setSearchState)`；我为 CodeMirror 设置了对应的 `dispatch({effects: setSearchQuery})`。完全对称和易于维护。

### 4. 未重复造轮子的证明
- 所有逻辑均交由 CodeMirror 以及 Milkdown 官方的 Search 模块引擎消化，未手写字符串匹配和替换。
