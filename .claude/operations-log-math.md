## 编码后检查 - 数学公式选中编辑修复
时间：2026-02-26 11:34:00

□ 遵循了《实现计划》中关于修改 CSS 的提议。
□ 增加了针对 `.editor-wysiwyg .milkdown .math-inline > .katex`, `.editor-wysiwyg .milkdown .math-block > .katex-display` 的 `pointer-events: none;` 样式。
□ 使得内部 KaTeX 生成的 DOM 不再拦截鼠标事件，有效透传点击给外层 ProseMirror 选区节点，达成进入编辑态的效果。
□ 未改变既定 BEM 命名以及项目整体规范。
