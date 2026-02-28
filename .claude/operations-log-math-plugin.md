## 编码后检查 - Click-to-Edit 数学公式交互插件补充
时间：2026-02-26 11:38:00

□ 发现问题根源：Milkdown v7 的 math_block 和 math_inline 并发不会根据光标落入而自动变为可编辑源码模式，这属于库原生缺漏（缺少 `@milkdown/plugin-tooltip` 及 React NodeView 支持）。
□ 解决方案：采用 ProseMirror 原生 Plugin 接口编写了 `mathEditPlugin.ts`。
□ 实现细节：在 `handleClick` 函数中捕获了来自带有 `math-inline` / `math-block` 类元素的点击，截断默认的不可选行为，弹出 `window.prompt` 对话框，由用户直接修改 `value` 属性，并透过 `view.dispatch` 即时触发组件重新渲染。
□ 已通过静态类型校验并入 `WysiwygEditor` 配置链。
