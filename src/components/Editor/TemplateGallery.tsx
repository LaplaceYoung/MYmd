import { FileText } from 'lucide-react'
import { useEditorStore } from '@/stores/editorStore'
import './TemplateGallery.css'

// -------------------------------------------------------------
// 1. 定义模板数据 (含所有 Markdown 内容)
// -------------------------------------------------------------

const TEMPLATES = [
    {
        id: 'blank',
        title: '空白文档',
        iconColor: 'var(--text-muted)',
        content: ''
    },
    {
        id: 'welcome',
        title: '欢迎使用 MYmd',
        iconColor: 'var(--accent)',
        content: `# 欢迎使用 MYmd

MYmd 是一款轻量级 Markdown 编辑器，具备所见即所得编辑体验。

## 主要功能

- **所见即所得编辑** — 直接点击编辑，无缝切换
- **分屏模式** — 左侧源码，右侧预览
- **丰富格式支持** — 代码高亮、数学公式、Mermaid 图表
- **多标签页** — 同时编辑多个文档

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| \`Ctrl+B\` | 加粗 |
| \`Ctrl+I\` | 斜体 |
| \`Ctrl+S\` | 保存 |
| \`Ctrl+N\` | 新建 |
| \`Ctrl+O\` | 打开 |
| \`Ctrl+Z\` | 撤销 |
| \`Ctrl+F\` | 查找 |

开始编写你的文档吧！ 🚀
`
    },
    {
        id: 'tech_spec',
        title: '研发核心模块设计',
        iconColor: '#e74c3c',
        content: `🛠️ [项目名称] 核心模块实现思路

> **作者：** [点击输入姓名] | **状态：** 🚧 进行中 | **版本：** v1.0.0

---

## 1. 需求背景

这里简述为什么要开发这个模块，解决了什么痛点？

- **现有问题：** [在此描述当前系统遇到的瓶颈]
- **解决方案：** 引入新的异步处理机制，降低服务器负载。
- **预期收益：** 响应时间减少 **30%**。

## 2. 核心架构设计 (Architecture)

以下是用户请求处理的流程图，展示了从客户端到数据库的交互逻辑。

\`\`\`mermaid
sequenceDiagram
    participant Client as 客户端 (Vue)
    participant Server as 服务端 (Node.js)
    participant Redis as 缓存 (Redis)
    participant DB as 数据库 (MySQL)
    
    Client->>Server: 发起 GET /api/user/123
    Server->>Redis: 查询缓存
    alt 缓存命中 (Cache Hit)
        Redis-->>Server: 返回 JSON 数据
        Server-->>Client: 200 OK (from Cache)
    else 缓存未命中 (Cache Miss)
        Redis-->>Server: null
        Server->>DB: 查询用户表
        DB-->>Server: 返回用户数据
        Server->>Redis: 写入缓存 (TTL: 3600s)
        Server-->>Client: 200 OK (from DB)
    end
\`\`\`

## 3. 关键代码片段 (Code Snippets)

我们在后端使用了 Express 框架来处理 API 请求，并在中间件中增加了鉴权逻辑。

### 3.1 路由层 (Controller)

\`\`\`javascript
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET /api/user/:id
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "用户不存在" });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
\`\`\`

### 3.2 数据库模型 (Mongoose Schema)

\`\`\`typescript
interface IUser {
    name: string;
    email: string;
    role: 'admin' | 'user';
}

const UserSchema = new Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user' }
});
\`\`\`

## 4. 待办事项 (To-Do List)

- [x] 完成数据库表结构设计
- [x] 编写基础 API 路由
- [ ] 接入 Redis 缓存 Token
- [ ] 编写单元测试用例 (Jest)
- [ ] 部署至测试环境

---

> **注意：** 修改任何数据库结构前，请务必先备份生产数据！
`
    },
    {
        id: 'invoice',
        title: '通用财务报销单',
        iconColor: '#f39c12',
        content: `# 🧾 通用财务报销单

> **单据状态：** 🔴 待审核 | **申请日期：** 2024-05-20 | **单据编号：** #EXP-20240520-01

---

## 1. 申请人信息

- **部门：** 产品研发部
- **申请人：** [点击输入姓名]
- **项目归属：** Markdown 编辑器 2.0 开发项目

## 2. 费用明细表

| 序号 | 费用类型 | 摘要说明 | 单价 (¥) | 数量 | **小计金额 (¥)** |
| :---: | :--- | :--- | ---: | :---: | ---: |
| 01 | ☁️ 服务器资源 | 阿里云 ECS 续费 (包年) | 1,200.00 | 1 | **1,200.00** |
| 02 | 🚕 差旅交通 | 加班打车报销 (附电子发票) | 45.00 | 8 | **360.00** |
| 03 | 📚 图书资料 | 技术书籍采购 | 89.50 | 4 | **358.00** |
| 04 | ☕ 团队建设 | 部门下午茶 (Coffee & Tea) | 25.00 | 12 | **300.00** |
| **合计** | | | | | **¥ 2,218.00** |

---

## 3. 收款账户信息

* **开户银行：** 招商银行 (CMB)
* **银行账号：** 6225 **** **** 8888
* **收款人：** [点击输入姓名]

## 4. 审批签字

> **部门主管：** _________________  (日期：____/____/____)
>
> **财务复核：** _________________  (日期：____/____/____)
`
    },
    {
        id: 'meeting_notes',
        title: '会议/课程笔记',
        iconColor: '#27ae60',
        content: `# 📝 [会议/课程] 笔记纪要

> **讲师/主持人：** [点击输入姓名] | **日期：** 2024-06-15 | **标签：** #团队会议 #需求评审 #学习笔记

---

## 一、 会议议程 / 课程大纲

1. 📅 回顾上周工作进度 (5 mins)
2. 🚀 新产品功能需求讨论 (20 mins)
3. 💡 头脑风暴：如何提升用户活跃度 (15 mins)
4. ❓ Q&A 问答环节 (10 mins)

---

## 二、 核心讨论记录

### 2.1 产品设计方案 A vs 方案 B

*   **方案 A (推荐)：** 采用极简设计风格，减少 50% 的 UI 元素。
    *   *优点：* 开发周期短，用户上手快。
    *   *缺点：* 可能会让部分老用户感到陌生。
*   **方案 B：** 保留现有交互，仅做颜色调整。
    *   *优点：* 对现有用户影响小。
    *   *缺点：* 无法从根本上解决操作繁琐的问题。

> **结论：** 经过投票表决，大家一致同意采用 **方案 A** 进行开发。

### 2.2 市场推广策略

> "我们不应该只盯着用户数量，而应该关注用户的质量和留存率。" —— 市场总监原话

针对这一点，提出了以下几点建议：
*   加大在技术社区的内容输出力度。
*   针对开发者用户举办黑客松比赛。
*   提供更专业的企业版服务。

---

## 三、 行动项 (Action Items)

| 责任人 | 任务描述 | 截止日期 (DDL) | 状态 |
| :---: | :--- | :---: | :---: |
| 张三 | 完成新首页的高保真 UI 设计稿 | 2024-06-20 | 🟢 进行中 |
| 李四 | 编写后端 API 接口文档 (Swagger) | 2024-06-22 | 🔴 未开始 |
| 王五 | 准备下周一的演示 Demo | 2024-06-25 | 🟡 待确认 |

---

## 四、 备注 / 灵感记录

*   可以参考 Notion 的 Database 视图设计。
*   是否需要引入 AI 辅助写作功能？(下次讨论)
*   **下次会议时间：** 下周三上午 10:00 (腾讯会议 ID: 123-456-789)
`
    },
    {
        id: 'academic_paper',
        title: '学术论文排版',
        iconColor: '#8e44ad',
        content: `# 🎓 [学术论文] 论 Markdown 在学术排版中的优势

> **作者：** [点击输入姓名] | **导师：** Prof. Alan Turing | **机构：** 计算机科学学院 (CS Dept.)

---

## 1. 摘要 (Abstract)

本文旨在探讨基于 Markdown 的轻量级标记语言在学术写作场景下的效率提升。通过对比传统的 LaTeX 编译器与现代所见即所得 (WYSIWYG) 编辑器，我们发现 Markdown 在初稿撰写阶段能提升 **45%** 的专注度。

**关键词：** 标记语言；学术写作；效率工具；LaTeX

---

## 2. 核心数学模型 (Core Methodology)

本研究提出了一种基于自然语言处理 (NLP) 的自动排版算法。假设给定输入文本序列为 $X = \\{x_1, x_2, ..., x_n\\}$，我们的目标是最大化排版美观度函数 $S(X)$：

$$
S(X) = \\sum_{i=1}^{n} \\alpha_i \\cdot \\text{Render}(x_i) + \\beta \\cdot \\int_{0}^{T} \\text{UserFeedback}(t) \\,dt
$$

其中：
- $\\alpha_i$ 表示第 $i$ 个段落的重要性权重。
- $\\beta$ 是正则化系数，用于平衡美观度与用户体验。
- $\\int_{0}^{T}$ 表示在时间 $T$ 内收集的用户反馈积分。

为了求解最优参数 $\\theta^*$，我们使用了梯度下降法 (Gradient Descent)：

$$
\\theta_{new} = \\theta_{old} - \\eta \\cdot \\nabla_{\\theta} J(\\theta)
$$

## 3. 实验数据与分析 (Analysis)

我们选取了 50 名计算机专业的博士生作为受试者，分别使用 Word、LaTeX 和本工具进行论文撰写。结果如下表所示：

| 工具名称 | 平均撰写时长 (h) | 格式调整耗时 (min) | 用户满意度 (1-10) |
| :--- | :---: | :---: | :---: |
| Microsoft Word | 12.5 | 180 | 7.2 |
| LaTeX (Overleaf) | 14.0 | **300+** | 8.5 |
| **Markdown Editor** | **9.8** | 45 | **9.1** |

> **结论：** 实验数据表明，Markdown 在保持较高排版质量的同时，显著降低了用户的认知负荷[^1]。

---

## 4. 参考文献 (References)

[^1]: Gruber, J. (2004). *Markdown: Syntax Documentation*. Daring Fireball. [Online]. Available: https://daringfireball.net/projects/markdown/
[^2]: Knuth, D. E. (1984). *The TeXbook*. Addison-Wesley Professional.
`
    }
]

// -------------------------------------------------------------
// 2. 提供 TemplateGallery 组件
// -------------------------------------------------------------

export function TemplateGallery() {
    const addTab = useEditorStore(s => s.addTab)
    const updateContent = useEditorStore(s => s.updateContent)

    // 处理新文档点击
    const handleNewDocument = (template: typeof TEMPLATES[0]) => {
        const tabId = addTab(null, template.content)
        // 如果是带内容的模板文档，默认加上未保存的脏检查状态
        if (template.content.trim() !== '') {
            // 需要一个小延迟确保 tab 在 store 中完成初始化
            setTimeout(() => {
                updateContent(tabId, template.content)
            }, 0)
        }
    }

    return (
        <div className="template-gallery">
            <h2 className="template-gallery__title">新建</h2>
            <div className="template-gallery__grid">
                {TEMPLATES.map(template => (
                    <div
                        key={template.id}
                        className="template-card"
                        onClick={() => handleNewDocument(template)}
                    >
                        {/* 缩略图区域 (模拟A4纸) */}
                        <div className="template-card__preview">
                            <div className="template-card__paper">
                                {template.id === 'blank' ? (
                                    <div className="template-card__blank-icon">
                                        <FileText size={32} color={template.iconColor} strokeWidth={1} />
                                    </div>
                                ) : (
                                    // 模拟文档内容的细带占位符
                                    <div className="template-card__mock-lines">
                                        <div className="mock-title" style={{ backgroundColor: template.iconColor }}></div>
                                        <div className="mock-line"></div>
                                        <div className="mock-line"></div>
                                        <div className="mock-line short"></div>
                                        <div className="mock-space"></div>
                                        <div className="mock-line"></div>
                                        <div className="mock-line"></div>
                                        <div className="mock-line short"></div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 标题区域 */}
                        <div className="template-card__info">
                            <span className="template-card__name">{template.title}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
