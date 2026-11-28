---
tags:
  - 大模型/Agent
  - LlamaIndex
  - RAG
created: 2026-06-30
updated: 2026-06-30
status: seed
source:
  - https://docs.llamaindex.ai/en/stable/understanding/agent/
aliases:
  - LlamaIndex Agents
---

# LlamaIndex Agent

> [!summary] 定位
> `LlamaIndex Agent` 更适合和数据、知识库、检索、RAG 场景结合来构建 Agent 系统。

## 一、它为什么值得单独看

`LlamaIndex` 本来就不是从“聊天壳子”出发，而是从“数据和知识怎么接入模型”出发。

所以它做 Agent 时，天然更适合：

- 检索增强
- 文档问答
- 数据密集型任务
- 工具和知识库联合决策

## 二、适合场景

- RAG + Agent
- 企业知识库助手
- 文档与数据驱动型工作流
- 需要把检索链路和 Agent 行为结合起来

## 三、我的判断

如果你要做的是“知识增强型 Agent”，它会比一些纯协作框架更贴近问题本身。

但如果你要的是复杂流程编排，还是要和 [[LangGraph]] 搭配看。

## 四、和你当前知识库的关系

你已经有很多：

- 大模型学习资料
- 笔记库
- RAG 相关资料

所以 `LlamaIndex Agent` 是比较自然的延伸方向。

## 相关笔记

- [[大模型/02-应用开发/RAG/18种RAG技术对比测试]]
- [[Agent框架选型对比]]
- [[LangGraph]]
