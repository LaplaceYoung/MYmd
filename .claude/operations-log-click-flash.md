## 编码后声明 - 点击同步亮显动画功能 (Click to Sync Flash)
时间：2026-02-26 12:00:00

### 1. 复用了以下既有组件
- 监听与坐标系: 复用了 `EditorContainer` 中 `syncScroll` 的原生 DOM 监听。
- 获取比例: 借用了滚动同步已写好的视口比例映射算法（即利用 `scrollHeight` 与 `clientY` / `scrollTop` 计算相对整体位置）。

### 2. 遵循了以下项目约定
- 命名与动画系统: `.sync-flash` 作为通用工具 class，符合既有 CSS 规范。在 TS 逻辑中移除后 `void offsetWidth` 再添加的手法是最稳健的跨端重置动画惯用手法。

### 3. 对比了以下相似实现
- 不用 ProseMirror `posAtCoords`：因为此处是为了双向同步跨编辑器生态寻找大致行号，而不是在同一个编辑器中。此处在 Milkdown 容器中按顺序查表寻找 `offsetTop` 最匹配的元素（即在整体高度占比最相近的块级元素），开销小且容错率极高。

### 4. 未重复造轮子的证明
- 无第三方实现，原生事件 + CSS Animation 解决，将体积影响控至 0 依赖增加。
