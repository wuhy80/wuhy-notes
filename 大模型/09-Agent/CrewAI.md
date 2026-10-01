---
tags:
  - 大模型/Agent
  - CrewAI
  - 多智能体
created: 2026-06-30
updated: 2026-06-30
status: seed
source:
  - https://docs.crewai.com/
aliases:
  - Crew AI
---

# CrewAI

> [!summary] 定位
> `CrewAI` 是一个强调角色分工和团队协作的多 Agent 框架，适合快速表达“谁负责什么”的协作流程。

## 一、它的特点

CrewAI 的优势在于语义直观。

你很容易把一个任务表达成：

- 一个 planner
- 一个 researcher
- 一个 writer
- 一个 reviewer

这种“团队分工感”很强。

## 二、适合场景

- 角色边界清晰的多 Agent 协作
- 快速原型验证
- 教学、展示、业务讨论

## 三、潜在问题

- 当系统复杂度继续上升时，要重点评估可控性、状态管理和调试能力
- 对真实生产系统而言，不能只看 demo 表达是否顺手

## 四、我的判断

它适合作为“思维表达和快速原型”的工具，但如果你要做复杂工作台，还是需要和 [[LangGraph]]、[[OpenAI Agents SDK]]、[[AutoGen]] 一起比较。

## 相关笔记

- [[Agent框架选型对比]]
- [[AutoGen]]
