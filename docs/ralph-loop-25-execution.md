# Ralph Loop x25 执行日志（2026-03-05）

说明：按 `ralph-loop` 执行了 25 个连续小循环，覆盖功能稳定性、宣传页重构、动效优化、仓库治理与验证闭环。

## Baseline
- `git status --short`：存在既有未提交改动，未回滚。
- `npm run lint`：脚本不存在。
- `npm run test`：脚本不存在。
- `npm run build`：基线通过。

## 25 Cycles

1. Cycle objective: 建立优化队列与落地顺序。  
   Implemented changes: 梳理页面、功能、仓库三条线任务池。  
   Verification: `rg --files` / `git status --short`。  
   Next tasks: 先处理 landing 文案和结构。

2. Cycle objective: 修复官网乱码与元信息。  
   Implemented changes: 重写 `apps/site/index.html` 的 title/description/OG 文案。  
   Verification: 静态检查页面文本。  
   Next tasks: 重构 Hero 区块。

3. Cycle objective: 强化首屏价值表达。  
   Implemented changes: Hero 新增价值主张、双 CTA、核心指标卡。  
   Verification: DOM 节点检查（`#latest-version`、`#release-cta`）。  
   Next tasks: 加入产品预览窗。

4. Cycle objective: 增加产品演示区。  
   Implemented changes: 新增模式演示窗（WYSIWYG/Split/Source）。  
   Verification: `#demo-body` 与 `data-demo-mode` 按钮存在。  
   Next tasks: 设计工作流版块。

5. Cycle objective: 搭建交付闭环叙事。  
   Implemented changes: 新增 `#workflow` 四步流程区。  
   Verification: 页面结构检查。  
   Next tasks: 功能卡片重排。

6. Cycle objective: 输出可扫描的能力矩阵。  
   Implemented changes: 新增 `#features` 四张核心能力卡。  
   Verification: 页面结构检查。  
   Next tasks: 增加证明区与切换组件。

7. Cycle objective: 加强信任层与差异化表达。  
   Implemented changes: 新增 `#proof` tabs + testimonial。  
   Verification: `data-highlight` 按钮与 `#proof-panel` 存在。  
   Next tasks: 完成下载区收口。

8. Cycle objective: 清晰收敛下载路径。  
   Implemented changes: 重做 `#release` 卡片与版本占位。  
   Verification: `#release-version-inline` 存在。  
   Next tasks: 移动端 CTA 固定。

9. Cycle objective: 提升移动端转化。  
   Implemented changes: 新增 `.mobile-cta` 浮动下载按钮。  
   Verification: CSS 媒体查询检查。  
   Next tasks: 系统化重构样式。

10. Cycle objective: 统一视觉语言。  
    Implemented changes: 重写 `apps/site/styles.css` 变量、布局、卡片、响应式。  
    Verification: CSS 结构检查。  
    Next tasks: 接入动效体系。

11. Cycle objective: 页面 reveal 与滚动反馈。  
    Implemented changes: `main.js` 新增 reveal observer + scroll progress。  
    Verification: `initReveal/initScrollProgress` 函数检查。  
    Next tasks: 导航联动与移动菜单。

12. Cycle objective: 提升导航可达性。  
    Implemented changes: `main.js` 新增 section spy + mobile nav toggle。  
    Verification: `#nav-toggle` / `#site-nav` 行为绑定。  
    Next tasks: 加入亮点 tab 交互。

13. Cycle objective: 证明区交互化。  
    Implemented changes: `initHighlightSwitch` 动态更新标题/描述/列表。  
    Verification: `highlightContent` 映射完整。  
    Next tasks: 模式演示自动轮播。

14. Cycle objective: 增强产品演示动态感。  
    Implemented changes: `initHeroModes` 自动轮播 + 手动切换重置定时。  
    Verification: `#window-badge` 状态同步。  
    Next tasks: 增加可见动效触发器。

15. Cycle objective: 增加可感知动画行为。  
    Implemented changes: 新增 `#celebrate-btn` + `#burst-layer` 粒子动效。  
    Verification: `initCelebrateBurst` 生成 `.burst` 元素。  
    Next tasks: 接入实时仓库数据。

16. Cycle objective: 加入社会证明数据。  
    Implemented changes: 接入 GitHub stars 与 release API。  
    Verification: `loadRepoStats/loadLatestRelease`。  
    Next tasks: 低 star 降噪策略。

17. Cycle objective: 避免负向社会证明。  
    Implemented changes: stars < 100 时自动隐藏 `#stars-wrap`。  
    Verification: 逻辑条件检查。  
    Next tasks: 优化文件浏览器稳定性。

18. Cycle objective: 提高工作区文件读取可靠性。  
    Implemented changes: 重写 `FileExplorer.tsx`，加入错误状态与用户可见反馈。  
    Verification: `loadError` 状态、error banner 渲染。  
    Next tasks: 补齐样式支持。

19. Cycle objective: 文件侧栏错误可视化。  
    Implemented changes: `FileExplorer.css` 新增 `.file-explorer__error`。  
    Verification: 样式检查。  
    Next tasks: 优化 CLI 文件参数解析。

20. Cycle objective: 解决 CLI 参数噪音导致的打开失败风险。  
    Implemented changes: `useCliFileOpener.ts` 增加扩展名白名单、去重、参数过滤。  
    Verification: `collectCliFilePaths` 逻辑检查。  
    Next tasks: 仓库元信息清理。

21. Cycle objective: 修复仓库描述与编码一致性。  
    Implemented changes: 重写 `package.json` 描述。  
    Verification: 首次 `npm run build` 失败（BOM 导致 JSON 解析错误），随后修复。  
    Next tasks: 追加仓库必要配置文件。

22. Cycle objective: 统一团队编辑规则。  
    Implemented changes: 新增 `.editorconfig`。  
    Verification: 文件存在性检查。  
    Next tasks: 统一 git 文本策略。

23. Cycle objective: 降低跨平台换行与二进制误判风险。  
    Implemented changes: 新增 `.gitattributes`。  
    Verification: 文件存在性检查。  
    Next tasks: 执行质量门禁。

24. Cycle objective: 通过工程质量门禁。  
    Implemented changes: 修复 `DirEntry.path` 类型问题与 package BOM。  
    Verification: `npm run typecheck` 通过。  
    Next tasks: 构建与仓库卫生复核。

25. Cycle objective: 完成收口验证并形成可提交状态。  
    Implemented changes: 全量重跑构建与 hygiene。  
    Verification: `npm run build` 通过；`npm run ci:repo-hygiene` 通过。  
    Next tasks: 提交到 git（stage/commit/push）。

## Final Verification
- `npm run typecheck` ✅
- `npm run build` ✅
- `npm run ci:repo-hygiene` ✅
- `tests/pages_smoke.mjs`：尝试通过本地 preview 进程执行，受当前命令策略限制未完成。
