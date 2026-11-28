---
tags:
  - 大模型/Agent
  - OpenClaw
  - 个人智能体
created: 2026-06-30
updated: 2026-06-30
status: seed
source:
  - https://openclaw.ai/
  - https://github.com/openclaw/openclaw
  - https://www.techradar.com/pro/how-to-automate-workflows-using-open-source-ai-agents
  - https://arxiv.org/abs/2604.04759
  - https://arxiv.org/abs/2605.25435
aliases:
  - Open Claw
  - Clawdbot
---

# OpenClaw

> [!summary] 定位
> `OpenClaw` 不是传统意义上的 Agent SDK，而更像一个“个人常驻智能体运行时”：用户通过 Telegram、WhatsApp、Discord 等聊天入口下达任务，智能体在本地或私有环境中持续运行，调用工具、维护记忆、执行自动化流程。

## 一、它和 LangGraph / AutoGen 的区别

`LangGraph`、`AutoGen`、`OpenAI Agents SDK` 更像开发框架：开发者用它们构建 Agent 应用。

`OpenClaw` 更像可运行的个人智能体产品 / 运行时：

- 有持续运行的进程
- 有聊天入口
- 有本地上下文和记忆
- 有技能系统
- 能操作邮件、日历、文件、浏览器、代码工具等外部系统

所以它应该和 [[Hermes]] 放在同一类，而不是只放在“SDK / 编程框架”里。

## 二、核心特征

- **常驻运行**：不像一次性调用 API，而是持续监听、接收任务、主动执行。
- **聊天入口**：以消息平台作为主要交互界面。
- **技能系统**：通过 skills / plugins 扩展能力。
- **本地上下文**：更强调用户自己掌握上下文、配置和历史。
- **高度自动化**：适合跨多个服务执行多步骤任务。

## 三、适合场景

- 个人助理
- 小团队自动化
- 邮件、日历、CRM、内容发布、报销、资料整理
- 代码任务触发与自动处理
- Obsidian / 第二大脑联动

## 四、风险

> [!warning] 安全风险
> 这类常驻智能体一旦接入邮箱、文件系统、支付、CRM、云服务和第三方技能，风险不再是“回答错了”，而是“执行错了”或“被恶意技能利用”。

需要特别关注：

- 技能供应链安全
- 权限分级
- 最小授权
- 操作前确认
- 本地敏感数据访问
- 记忆污染
- prompt injection

## 五、和 Hermes 的关系

如果你说的 [[Hermes]] 是类似 `OpenClaw` 的个人常驻智能体，那么它们应该归在同一类：

- 不是纯模型
- 不是纯 Agent SDK
- 是“长期运行 + 工具执行 + 记忆 + 自动化”的智能体运行时

## 六、我的判断

`OpenClaw` 代表了 Agent 的一个重要分支：从“写一个 Agent 应用”转向“运行一个持续在线的个人智能体”。

这类系统很值得跟踪，但不能只看自动化能力，也必须把安全边界作为核心设计问题。

## 相关笔记

- [[Hermes]]
- [[Agent框架选型对比]]
- [[00-Agent导航]]
- [[大模型/02-应用开发/MCP/MCP概览|MCP 概览]]
