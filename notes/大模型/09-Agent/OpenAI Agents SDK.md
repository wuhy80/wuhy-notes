---
tags:
  - 大模型/Agent
  - OpenAI
  - SDK
created: 2026-06-30
updated: 2026-06-30
status: seed
source:
  - https://openai.github.io/openai-agents-python/
aliases:
  - OpenAI Agents
  - OpenAI Agents Python
---

# OpenAI Agents SDK

> [!summary] 定位
> `OpenAI Agents SDK` 是 OpenAI 提供的 Agent 开发 SDK，适合构建带有工具调用、Agent handoff、guardrails 和 tracing 的 agentic application。

## 一、我对它的理解

这个框架的价值，不在于“帮你快速拼一个 Demo”，而在于它试图给 Agent 系统提供一套比较统一的抽象：

- `Agent`
- `Tools`
- `Handoffs`
- `Guardrails`
- `Tracing`

这套抽象很适合做：

- 单 Agent 工具调用
- 多 Agent 角色切换
- 有边界控制的任务执行

## 二、核心特点

- 与 OpenAI 模型和生态契合度高
- 强调 Agent 之间的 `handoff`
- 内建 tracing 语义，便于观察执行过程
- 支持工具调用和运行时编排

## 三、适合场景

- 围绕 OpenAI 模型做 agentic application
- 想把工具调用、多角色协作和追踪统一到一个 SDK 中
- 希望在“生产可用”和“开发体验”之间拿到一个相对均衡的方案

## 四、可能的局限

- 生态重心天然更偏 OpenAI
- 如果你要做非常底层的图式编排，[[LangGraph]] 的表达力可能更强
- 如果你要做非常研究型的多 Agent 协作，[[AutoGen]] 的讨论度和案例会更多

## 五、和其他方案的关系

| 对比对象 | 差异 |
|---|---|
| [[LangGraph]] | LangGraph 更像工作流图执行层；OpenAI Agents SDK 更像围绕 Agent 抽象提供统一开发体验 |
| [[AutoGen]] | AutoGen 更偏多 Agent 协作与消息驱动；OpenAI Agents SDK 更偏统一 SDK 设计 |
| [[PydanticAI]] | PydanticAI 更偏 Python 工程质量与类型约束 |

## 六、值得重点跟踪的点

- `handoff` 的实际工程价值
- `guardrails` 如何落到真实业务约束
- `tracing` 是否足够支持复杂任务排查
- 后续是否会形成更完整的平台 / 生态闭环

## 七、适合放进你的哪类项目

比较适合：

- AI 工作台
- 工具型内部助手
- 需要清晰工具调用链路的智能系统

## 相关笔记

- [[Agent框架选型对比]]
- [[LangGraph]]
- [[AutoGen]]
