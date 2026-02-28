## 项目上下文摘要（点击同步亮闪功能）
生成时间：2026-02-26 11:58:00

### 1. 相似实现分析
- **实现1**: `EditorContainer.tsx:156` (之前的 `onContainerClick`)
  - 模式：目前只有滚动同步。我们需要在点击源码侧时，计算其 Y 轴所在的整体比例位置。
  - 可复用：已有的 `.cm-scroller` 和 `.editor-split__preview` 的比例定位算法。
  - 需注意：CodeMirror 是虚拟列表，但其 `.scrollHeight` 是准确包含全部文本的高度的。Milkdown 里的 `.editor` 直接包含了所有的块级节点。

### 2. 项目约定
- **CSS 动画**: 统一在 `editor.css` 里增加 `@keyframes` 和对应的功能类 `.sync-flash`。
- **命名约定**: 维持原有的驼峰和小横线规范。

### 3. 可复用组件清单
- 无特殊的第三方组件，依靠直接遍历 `.editor` (Milkdown 的 ProseMirror 容器) 下的 `children` 来计算绝对坐标偏差，寻找离点击比例最相近的 DOM 节点。

### 4. 测试策略
- **测试模式**: 编译后本地点击源码的列表、标题或普通段落，观察右侧预览中的对应元素是否有背景闪动动画效果。

### 5. 依赖和集成点
- **依赖库**: 原生 DOM `element.offsetTop` 和 `element.offsetHeight`。

### 6. 技术选型理由
- **为什么用这个方案**: AST/行号精准映射在 ProseMirror 生态实现沉重甚至无法百分百贴合，且存在性能损耗；而基于视口高度比例映射（类似已有滚动同步的逻辑）寻找最贴近的视觉块，算法极其简洁，性能损耗微乎其微且足以为一般的撰写提供及时的反馈。

### 7. 关键风险点
- **边界条件**: 点击产生的 `MouseEvent` 的 `clientY` 要通过 `getBoundingClientRect().top` 转换为容器内绝对坐标，再附加 `scrollTop` 成为实际文档坐标，否则坐标失偏；二次点击需要触发 `reflow` 以重启 CSS 动画。
