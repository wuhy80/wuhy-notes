---
tags:
  - 大模型/Agent
  - LangGraph
  - Workflow
created: 2026-06-30
updated: 2026-06-30
status: seed
source:
  - https://docs.langchain.com/oss/python/langgraph/overview
aliases:
  - LangGraph 工作流
---

# LangGraph

> [!summary] 定位
> `LangGraph` 是 LangChain 生态中的有状态工作流编排框架，适合构建可控、可中断、可恢复、可观察的 agent workflow。

## 一、为什么它现在很重要

很多团队嘴上说在做 `Agent`，实际真正需要的是：

- 多步任务流程
- 有状态执行
- 中间结果可见
- 可中断、可恢复
- 人工接管点

`LangGraph` 基本就是在解决这类问题。

## 二、核心特点

- 图结构表达流程
- 节点负责处理任务步骤
- 状态在图执行过程中持续流转
- 更容易做 checkpoint、resume、human-in-the-loop

## 三、它和“普通 Agent 框架”的差别

`LangGraph` 的重点不是模拟一个“人格化 agent”，而是把复杂智能任务做成一个能被工程化管理的图执行系统。

这点很关键。

> [!note] 一个更准确的理解
> LangGraph 不是在强调“AI 多聪明”，而是在强调“流程多可控”。

## 四、适合场景

- 多步任务编排
- 复杂工具调用
- RAG + 工具 + 人工审核
- 有明确执行步骤但局部需要模型决策的系统

## 五、它为什么适合你的知识库方向

你现有笔记里已经有：

- 多数据源查询
- 多角色分工
- 工作流拆解
- Agent + MCP + RAG 的组合思路

这类场景天然适合 `LangGraph`。

尤其是当你不想把所有逻辑都丢给“自治 Agent”时，LangGraph 会更稳。

## 六、和其他框架的关系

| 对比对象 | 差异 |
|---|---|
| [[OpenAI Agents SDK]] | OpenAI Agents SDK 更强调 Agent 抽象；LangGraph 更强调图式工作流 |
| [[AutoGen]] | AutoGen 更偏多 Agent 协作范式；LangGraph 更偏流程与状态管理 |
| [[LlamaIndex Agent]] | LlamaIndex Agent 更偏数据/检索驱动场景 |

## 七、我的判断

如果你后面要认真做“AI 工作台”或者“多工具工作流系统”，`LangGraph` 应该是最值得重点投入的方案之一。

## 相关笔记

- [[Agent框架选型对比]]
- [[OpenAI Agents SDK]]
- [[大模型/08-个体重构/05-案例观察/智能工作台中的多Agent工作流实践]]
