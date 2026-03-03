# MYmd 同类项目对标与大厂化上线方案（2026-03-03）

## 1. 对标范围与数据口径

- 对标对象：GitHub 上与 `本地优先 + Markdown/知识管理 + 桌面端` 高相关项目。
- 数据时间：`2026-03-03`（GitHub REST API 快照）。
- 目标：提炼可复制的产品优势与推流策略，并转化为 MYmd 的可执行上线方案。

### 1.1 样本快照

| 项目 | Stars | 最新发布 | 关键增长信号 |
| --- | ---: | --- | --- |
| MYmd | 1 | v1.2.2（2026-03-03） | 刚完成首个发布闭环 |
| Joplin | 53,709 | v3.5.13（2026-02-25） | 插件生态 + 文档中心 + Forum/Discord/YouTube |
| Logseq | 41,294 | 0.10.15（2025-12-01） | 公开 Roadmap + Discord/Forum + Alpha 招募 |
| Zettlr | 12,579 | v4.2.0（2026-02-21） | 学术场景定位 + Docs/Forum/Discord + 多平台安装 |
| MarkText | 54,121 | v0.17.1（2022-03-07） | 历史品牌与多语 README，维护节奏放缓 |
| Notable | 23,500 | v1.8.4（2020-01-21） | 高 Star 但发布停滞，活跃度不足 |
| Obsidian Releases | 15,190 | N/A（该仓库主要托管分发清单） | 插件/主题上架规则和社区分发机制成熟 |

## 2. 同类项目优势与推流策略拆解

## 2.1 Joplin（成熟社区型）

- 优势：插件与主题能力明确，文档入口清晰，支持论坛、Discord、YouTube、赞助体系。
- 推流策略：
  - 内容层：文档与教程持续承接新用户。
  - 社区层：论坛承接问题与需求沉淀，Discord 负责实时互动。
  - 资金层：GitHub Sponsors + Patreon 保持可持续维护。
- 对 MYmd 的启示：`文档中心 + 社区分层 + 功能可扩展` 是中长期增长底座。

## 2.2 Logseq（Roadmap 驱动型）

- 优势：README 直接暴露 Blog/Docs/Roadmap；插件 API、Beta/Alpha 招募链路完整。
- 推流策略：
  - 用公开路线图和测试招募提升“参与感”。
  - 把 Discord 作为需求收集和早期验证主阵地。
- 对 MYmd 的启示：公开里程碑 + 内测机制，比单向发版本更容易形成社区势能。

## 2.3 Zettlr（垂直场景深耕型）

- 优势：明确服务学术写作；安装包覆盖多平台与多架构；文档和论坛完善。
- 推流策略：
  - 先做“特定场景最好用”，再做广泛传播。
  - 通过下载页与文档降低上手摩擦。
- 对 MYmd 的启示：先打透“高频 Markdown 生产流”这个垂直价值，再扩圈。

## 2.4 MarkText / Notable（高星但节奏停滞型）

- 观察：Star 很高，但版本与提交节奏明显放缓。
- 风险：品牌资产仍在，但用户对“可持续维护”的信任下降。
- 对 MYmd 的启示：必须保持可见迭代节奏（周更/双周更），否则流量会衰减。

## 2.5 Obsidian Releases（生态平台型）

- 优势：插件/主题提交规范明确，分发机制标准化，社区公告渠道固定。
- 推流策略：
  - 让开发者（插件作者）成为二级传播节点。
  - 新插件发布即新内容曝光，形成持续“自增长”。
- 对 MYmd 的启示：即使先做最小插件机制，也要尽早建立提交规范与审核流程。

## 3. MYmd 大厂化优化上线方案

## 3.1 工程与治理（P0，1-2 周）

已落地（本轮）：
- GitHub CI（`npm ci` + `npm run build`）
- Issue/PR 模板、Release 模板、`CONTRIBUTING.md`、`SECURITY.md`
- GitHub Pages 宣传站脚手架（`apps/site`）

待补强：
- 分支保护（`main` 仅允许 CI 通过后合并）
- `CODEOWNERS`（核心模块最少 1 名 owner）
- 自动发布草稿（Release Drafter 或语义化版本流程）

## 3.2 产品结构与功能迭代（P1，2-6 周）

优先级 P1（直接拉升留存）：
- 命令面板（`Ctrl+K`）
- 全局快速打开（文件名模糊检索）
- 会话恢复（异常退出后恢复 tabs）
- Search/Replace 匹配计数与跳转闭环
- 文件树“打开文件必加载内容”稳定性补齐

优先级 P2（差异化与扩展）：
- 模板中心（会议纪要/技术方案/论文模板）
- 插件机制 MVP（命令扩展 + 侧边栏扩展）
- 可选自动更新（用户显式开关）

## 3.3 代码审查与质量门禁（持续）

PR 最低门禁：
- `npm run build` 必过
- 手工回归脚本必过：启动/打开/保存/右键粘贴/菜单粘贴/导出
- 变更描述必须包含：风险级别 + 回滚方案

建议新增：
- 冒烟测试脚本（Playwright）覆盖核心编辑链路
- 每个版本发布前执行 `release checklist`

## 3.4 静态网页托管与品牌宣传（P0-P1）

- 托管：GitHub Pages（已接入 workflow）。
- 页面内容：价值主张、核心能力、路线图、下载 CTA、最新版本与 Star 动态数据。
- 下一步：
  - 增加“版本亮点”与 GIF 演示区
  - 增加中英文切换
  - 增加简易统计（如 Plausible/Umami）追踪访问到下载点击转化

## 3.5 推流策略（分层执行）

`层 1：GitHub 内生流量`（每周）
- 发 Release（含截图/GIF/升级说明）
- 维护 Discussions（需求收集、Roadmap 投票）
- 将高价值需求转为公开 issue（带标签与里程碑）

`层 2：开发者内容流`（每周 1-2 条）
- 主题：性能优化、编辑器交互、Tauri 工程实践
- 形式：短视频演示 + 图文 changelog
- 渠道：GitHub/X/Bilibili/掘金（同一素材多平台复用）

`层 3：社区裂变`（每月）
- 模板共创（征集模板，入选即署名）
- 小型插件挑战赛（MVP 阶段可先做“脚本扩展挑战”）

## 3.6 8 周执行节奏与 KPI

| 周期 | 重点目标 | 关键 KPI |
| --- | --- | --- |
| W1-W2 | 工程治理闭环、站点上线 | CI 稳定通过率 > 95% |
| W3-W4 | P1 核心效率功能 2-3 项上线 | 周活跃 issue/讨论数提升 |
| W5-W6 | 文档与模板中心上线 | 下载页点击率提升 |
| W7-W8 | 版本发布节奏固化 + 社区活动 | Star 与下载数持续增长 |

建议量化目标（首个 8 周）：
- GitHub Star：`1 -> 80+`
- Release 下载：累计 `300+`
- issue 首响时长：`< 24h`
- 功能类 PR 合并周期：`< 5 天`

## 4. 当前仓库对应动作清单

- [x] 规范化协作模板（Issue/PR/Release）
- [x] CI 基础门禁与 Pages 发布流
- [x] 宣传页基础版（动态展示 Star/Latest Release）
- [ ] 分支保护与 CODEOWNERS
- [ ] Discussions + 公共 Roadmap 初始化
- [ ] 冒烟自动化脚本并入 CI

## 5. 参考来源

- https://github.com/laurent22/joplin
- https://github.com/logseq/logseq
- https://github.com/Zettlr/Zettlr
- https://github.com/marktext/marktext
- https://github.com/notable/notable
- https://github.com/obsidianmd/obsidian-releases
- https://joplinapp.org/help/apps/plugins/
- https://discourse.joplinapp.org/
- https://discuss.logseq.com/t/logseq-product-roadmap/34267
- https://docs.zettlr.com/
- https://github.com/obsidianmd/obsidian-releases/blob/master/README.md
