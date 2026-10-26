---
title: Claude Code + Obsidian 打造AI驱动的第二大脑
created: 2026-01-11
tags:
  - AI/Claude
  - 知识管理/Obsidian
  - 工作流
  - 第二大脑
  - 大模型/个体重构
aliases:
  - Claudian
  - AI知识管理
---

# Claude Code + Obsidian 打造AI驱动的第二大脑

> [!abstract] 概述
> 将 Claude Code 与 Obsidian 结合，让 AI 帮你管理知识库，实现真正的“第二大脑”。

## 为什么这个组合如此强大？

### Obsidian 的痛点

- 📚 学习曲线陡峭
- 🗂️ 组织笔记是个力气活
- 🔗 双链很美好，手动很痛苦
- 📈 笔记库变大后更难管理

### Claude Code 的解决方案

> [!success] AI 不是来“辅助”的，是来“接管”的
> - 「把这篇会议记录整理好」—— 3 秒搞定
> - 「分析我最近的学习笔记」—— 给你详细报告
> - 「帮我把 Inbox 里的 50 篇笔记都处理了」—— 批量整理
> - 「检查笔记库健康度」—— 一键诊断

---

## 核心工具生态

### 1. obsidian-skills（官方 Skills 包）

由 Obsidian CEO Stephane Ango (kepano) 维护。

**功能：**
- 让 Claude 理解 Obsidian 风格的 Markdown
- 支持 wikilinks、callouts、frontmatter
- 支持 JSON Canvas 和 Obsidian Bases

**安装：** 放到笔记库的 `.claude/` 文件夹

**效果对比：**
```markdown
# 没有 obsidian-skills
这个概念和[某某概念](某某概念.md)有关。

# 有 obsidian-skills
这个概念和 [[某某概念]] 有关。
```

### 2. Claudian 插件

由 YishenTu 开发，直接把 Claude Code 嵌入 Obsidian 侧边栏。

**核心能力：**
- ✅ 完整的 Agent 能力（读写文件、执行命令）
- ✅ 上下文感知（自动附加当前笔记，支持 `@文件名`）
- ✅ 视觉能力（拖拽图片直接分析）
- ✅ 内联编辑（直接在笔记中编辑）
- ✅ Slash 命令（自定义提示词模板）

### 3. Claudesidian 模板

由 heyitsnoah 创建的预配置模板，开箱即用。

**包含：**
- 合理的文件夹结构
- 预设的 CLAUDE.md（系统提示词）
- 常用的 Slash 命令
- 示例工作流

---

## Noah Brier 的工作流详解

> [!quote] Noah Brier
> Alephic（AI 策略咨询公司）联合创始人

### 基础设置

在 Obsidian 中运行 Claude Code，指向根目录，让 Claude 访问所有笔记（约 1,500 条）。

### “思考模式” vs “写作模式”

以“思考模式”开始新想法：
1. 让模型放慢速度，不急于生成文本
2. 让 AI 提问，帮助澄清思路
3. 设定框架后，再提供上下文材料

### 实际案例：准备演讲

1. 给 Claude 提供要点和工作标题
2. 提供相关轶事和素材
3. 指令 Claude 搜索 Obsidian 中的相关笔记

```
"Go look through the rest of my probably 1,500 things in Obsidian
and see if there's anything else you can find that might be of
value to this talk."
```

### 文件夹结构

```
演讲项目/
├── Chats/          # 保存与 LLM 的对话
├── Daily Progress/ # AI 回顾每日进展
└── Research/       # 文章、PDF 等源材料
```

### 重视 AI 的“阅读”能力

> [!important] 核心观点
> "There's entirely too much focus on AI's ability to write and not enough focus on its ability to read… I think arguably that's much more useful on a daily basis."

---

## 私密 AI 助手的价值

### 数据隐私 + AI 能力，两者兼得

| 特性 | 云端 AI | Obsidian + Claude Code |
|------|---------|------------------------|
| **数据存储** | 上传到服务器 | 完全本地 |
| **隐私安全** | 需要信任服务商 | 数据永远在你手里 |
| **企业/敏感内容** | ❌ 不能用 | ✅ 可以用 |
| **个性化程度** | 通用回答 | 基于你的知识库 |
| **上下文理解** | 有限的对话历史 | 完整的笔记库上下文 |

### 适用场景

**场景 1：基于内部文档生成技术方案**
```
根据我们现有的系统架构（项目文档/系统架构.md），
帮我设计一个用户权限管理模块，要兼容现有的认证系统
```

**场景 2：整理敏感会议记录**
```
帮我整理这次客户会议记录，提取关键需求和 Action Items，
按优先级排序，生成一份给团队的同步邮件
```

**场景 3：分析项目进展并生成周报**
```
看看我这周的工作日志（日志/2026-01-01 到 日志/2026-01-07），
帮我生成一份周报
```

**场景 4：个性化技术博客生成**
```
根据我最近学习的 Kubernetes 笔记（技术学习/K8s/），
写一篇技术博客，风格参考我之前写的文章（博客/）
```

---

## 移动端设置

Noah Brier 的移动端方案：

1. **Termius** - 手机终端应用
2. **Tailscale** - 创建私有安全网络
3. **家中小型电脑** - 持续运行
4. **私有 GitHub repo** - 存储 Obsidian 笔记，随时同步

> [!example] 真实案例
> 收到紧急客户请求时，Brier 在散步途中坐在池塘边，用手机上的 Claude Code 完成了代码修复。

---

## 实际考量

### AI 准确率

Claude 整理笔记的准确率大概在 **85-90%**：
- 大部分时候做得很好
- 偶尔会出现理解偏差
- **你需要最后检查一遍**

> [!tip] 关键心态
> 不要把 AI 当成「完全自动化」的工具，而是「高效协作」的伙伴。

### 本地存储 + Git

- AI 改了什么，一目了然
- 不满意？随时回滚
- 数据永远在你手里

### 成本问题

Claude Code 需要订阅 Claude Pro（每月 $20）

**值不值？**
- 如果 AI 每天帮你节省 30 分钟 → 一个月 15 小时
- 你的时间值多少钱？

---

## 相关资源

- [obsidian-skills](https://github.com/kepano/obsidian-skills) - 官方 Skills 包
- [Claudian](https://github.com/YishenTu/claudian) - Obsidian 插件
- [Claudesidian](https://github.com/heyitsnoah/claudesidian) - 开箱即用模板
- [Agent Skills Marketplace](https://agent-skills.md/) - 更多 Claude Skills

## 延伸阅读

- [Using Claude Code with Obsidian - A Perfect Pairing](https://kyleygao.com/blog/2025/using-claude-code-with-obsidian/)
- [Building Your AI-Powered Second Brain](https://medium.com/vibe-coding/building-your-ai-powered-second-brain)
- [YouTube: How to Use Claude Code as a Second Brain](https://youtu.be/8V9tZwgjiRs)

## 主题关联

> [!note] 所属主题
> 这篇笔记已纳入 `[[大模型/08-个体重构/00-个体重构导航]]`，可结合下面两篇继续阅读：

- [[大模型/08-个体重构/05-案例观察/Claude Code + Obsidian 第二大脑实践]]
- [[大模型/08-个体重构/03-知识系统与第二大脑/AI时代的第二大脑设计原则]]
