## 项目上下文摘要（修复数学公式编辑点按问题）
生成时间：2026-02-26 11:47:00

### 1. 相似实现分析
- **实现1**: src/components/Editor/plugins/mathEditPlugin.ts:12-39
  - 模式：ProseMirror Plugin 事件监听 (`handleClick`)
  - 可复用：获取节点 `attrs.value`，使用 `view.dispatch` 更新 `value`。
  - 需注意：原方案使用 `handleClick` 和 `view.state.doc.nodeAt(pos)`，由于 KaTeX 复杂的 DOM 嵌套，`nodeAt(pos)` 返回的时常不精确，甚至可能落在相邻文本，造成弹窗不出现或者修改错位。

### 2. 项目约定
- **命名约定**: 插件名小驼峰结尾Plugin。
- **文件组织**: 统一存放在 `src/components/Editor/plugins/` 目录。
- **代码风格**: React + TS，无 any，使用严格模式。

### 3. 可复用组件清单
- 无特殊的需要外部引入的组件，全凭 `prosemirror-state/view` 原生 API。

### 4. 测试策略
- **测试模式**: 编译后本地验证，点击 KaTeX 公式应当唤起 Prompt 弹窗，并更新对应节点。

### 5. 依赖和集成点
- **依赖库**: `@milkdown/prose`, `prosemirror-view`

### 6. 技术选型理由
- **为什么用这个方案**: 选用 `handleClickOn(view, pos, node, nodePos, event, direct)` 是 ProseMirror 专门用来处理点击目标节点的钩子，直接提供 `node` 和 `nodePos`，从而完全杜绝原方案中 `nodeAt(pos)` 点击位置偏移导致的节点识别失败问题。

### 7. 关键风险点
- **边界条件**: Inline 和 Block 节点都有可能触发，需要同时校验。弹窗取消（null）时不能触发 dispatch。
