## 编码后声明 - 修复数学公式编辑点按问题
时间：2026-02-26 11:51:00

### 1. 复用了以下既有组件
- 插件机制: 继续完全保留 `mathEditPluginKey` 和 Milkdown 的 `$prose` 封装方案，复用原版弹窗编辑形式 (`window.prompt`)。
- 获取定位: 沿用了 `getPos` / `posObj` 结合 `view.dispatch(tr.setNodeMarkup)` 这种 ProseMirror 原生方案。

### 2. 遵循了以下项目约定
- 命名约定：新增的变量均采用小驼峰（`targetPos`, `testPos`, `testNode`）。
- 代码规范：规避了 any 类型，所有变量均能被推导。使用 Strict 结构。

### 3. 对比了以下相似实现
- 与原有 `nodeAt(pos)` 实现差异：原有方案在 KaTeX 复杂 DOM 树中被浏览器强行给到一个偏离其实际 Prosemirror Node 的 pos。新方案采用 `view.posAtCoords` 直接反求物理坐标，成功命中 `math_inline` / `math_block` 原子节点，准确性大幅提升。

### 4. 未重复造轮子的证明
- 未手写复杂逻辑探测光标，直接使用 ProseMirror 自带的高级坐标反求 API (`posAtCoords`) 解决定位漂移问题。
