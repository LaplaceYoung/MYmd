## 项目上下文摘要（UI重构）
生成时间：2026-02-25 20:25:00

### 1. 相似实现分析
- **实现1**: `src/components/TitleBar/TitleBar.tsx` (1-69行)
  - 模式：使用 React hooks (useState, useEffect) 监听 Electron 窗口状态并渲染窗口控制按钮，拖拽区域通过 css `-webkit-app-region: drag` 控制。
  - 可复用：处理最大化/最小化/关闭的逻辑。
  - 需注意：拖拽区不能遮挡交互按钮，控制按钮无拖拽区。

- **实现2**: `src/components/TabBar/TabBar.tsx` (1-44行)
  - 模式：订阅 `editorStore` 获取标签页数据进行遍历渲染。
  - 可复用：标签切换和增删触发器。
  - 需注意：Tab 处于激活时有不同样式，与 TitleBar 分离。

- **实现3**: `src/App.tsx` (1-22行)
  - 模式：组合组件 (`TitleBar`, `TabBar`, `Toolbar`, `EditorContainer`, `StatusBar`)。
  - 可复用：整体布局骨架。
  - 需注意：当没有激活的标签时不显示 TabBar 和 Toolbar。

### 2. 项目约定
- **命名约定**: 驼峰与帕斯卡命名 (如 `TitleBar.tsx`, `useEditorStore`)，CSS 使用 BEM 规范 (`titlebar__logo`)。
- **文件组织**: 按照组件文件夹聚合 (`src/components/TitleBar/TitleBar.tsx` 及 `TitleBar.css`)。
- **导入顺序**: vendor 组件 -> 内部组件 -> CSS 文件。
- **代码风格**: React functional components。

### 3. 可复用组件清单
- `src/components/TitleBar`: 提供窗口拖拽和状态控制。
- `src/stores/editorStore.ts`: 提供 UI 状态流转支撑。

### 4. 测试策略
- **测试框架**: 由于本项目未配置常规单元测试，将依赖开发构建及手工校验。
- **测试模式**: 冒烟开发验证测试。
- **覆盖要求**: 确保构建成功、窗口操作可响应、渲染样式无断裂。

### 5. 依赖和集成点
- **外部依赖**: `lucide-react` 用于图标组件。
- **内部依赖**: Zustand (`useEditorStore`)。

### 6. 技术选型理由
- **为什么用这个方案**: 在原组件结构上修正在 CSS 和少量 DOM 中即可完成视觉风格的 Windows 11 Word 化，减少业务逻辑破坏。
- **优势**: 降低由于改动导致核心应用崩溃的风险。
- **劣势和风险**: 可能存在新旧 CSS 变量使用不一致的情况，需谨慎覆盖基础变量。

### 7. 关键风险点
- **界面撕裂**: 新旧 CSS 变量混用。
- **可拖拽区域失效**: 修改 `TitleBar` 时未保留 `-webkit-app-region: drag` 属性。
