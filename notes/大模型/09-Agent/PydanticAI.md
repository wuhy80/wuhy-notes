---
tags:
  - 大模型/Agent
  - PydanticAI
  - Python
created: 2026-06-30
updated: 2026-06-30
status: seed
source:
  - https://ai.pydantic.dev/
aliases:
  - Pydantic AI
---

# PydanticAI

> [!summary] 定位
> `PydanticAI` 是偏 Python 工程化风格的 Agent / LLM application 框架，强调类型安全、结构化输出、可维护性与生产可用性。

## 一、它为什么特别

很多 Agent 框架的重点是“怎么让模型更会干活”，而 `PydanticAI` 的重心更偏：

- 类型约束
- 结构化输出
- Python 工程质量
- 生产环境可维护性

这对长期项目很重要。

## 二、适合场景

- 结构化输出要求高
- Python 后端系统集成
- 希望减少 prompt 拼接式脆弱逻辑
- 关注可测试性和类型定义

## 三、我的判断

如果你后面做的是“后端服务型 AI 系统”，而不是只做聊天式原型，那么 `PydanticAI` 值得重点看。

它不一定是最像“多 Agent 平台”的方案，但它很可能是更像“能长期维护的 Python 工程方案”。

## 四、和其他方案对比

| 对比对象 | 差异 |
|---|---|
| [[OpenAI Agents SDK]] | OpenAI Agents SDK 更偏 Agent 抽象；PydanticAI 更偏 Python 工程质量 |
| [[CrewAI]] | CrewAI 更偏协作表达；PydanticAI 更偏可维护后端实现 |
| [[LangGraph]] | LangGraph 更偏工作流状态机；PydanticAI 更偏结构化应用开发 |

## 相关笔记

- [[Agent框架选型对比]]
- [[OpenAI Agents SDK]]
