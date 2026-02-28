## 编码后声明 - 分屏模式增强（同步滚动与自由拖拽尺寸）
时间：2026-02-26 11:54:00

### 1. 复用了以下既有组件
- 容器结构: 在原有的 `EditorContainer` 中为 `editor-split__source` 和 `editor-split__preview` 追加了基于 `splitRatio` (默认 50) 的 Flex 渲染控制。
- 分割条: 复用了已有的类名 `editor-split__divider` 并直接追加 `onMouseDown` 开始全局的宽度拖动。

### 2. 遵循了以下项目约定
- 命名约定：新增 `isSyncingLeftRef`/`isSyncingRightRef` 等标准基于 Ref 的标志位命名以防止动画死循环。
- 代码风格：规避了直接改写 CodeMirror 与 Milkdown 内部插件的方式，使用 React DOM 层的顶层接管以保持松耦合，安全且不会产生内存泄漏。

### 3. 对比了以下相似实现
- 与 Typora 原生 Markdown 滚动对比：采用基于 DOM `.scrollHeight` 和 `.clientHeight` 的原生比例算法相较于文本行解析算法，无需 AST 分析性能更优。对于普通 Markdown 文档，段落对齐基本能够满足日常浏览所需。

### 4. 未重复造轮子的证明
- 同步双向滚动没有使用任何第三方包，仅依赖标准 Web API `.scrollTop` 和 `requestAnimationFrame` 防抖。
