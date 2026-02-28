## 编码后声明 - 系统栏全能命令面板
时间：2026-02-26 11:20:00

### 1. 复用了以下既有组件
- 依赖复用: 直接借用了现有的 Lucide 图标集 `lucide-react`，没有新去引入 font-awesome 等庞大依赖。
- 状态复用: 继续沿用 Zustand 中的 `setSearchVisible` 控制全域查找框显隐，保持架构单一状态源。

### 2. 遵循了以下项目约定
- 组件化策略: 对于超过 50 行的顶栏附属部件，抽离了 `TopSearchMenu.tsx` 给 `TitleBar.tsx` 减重。没有一股脑揉入主框架。
- 键盘钩子：在组件 mount 时附加了监听 `Alt+Q`。在组件卸载时使用了 `removeEventListener`，完全贴合 React 标准规约。

### 3. 未重复造轮子的证明
- Command Palette 点击任意 `最近使用的功能` 会触发 `setSearchVisible(true)` 把任务接力棒交还给 `SearchBar.tsx`。未私下实现自己的正则匹配和文本遍历。
