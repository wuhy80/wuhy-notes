---
tags:
  - 大模型/Agent
  - AutoGen
  - 多智能体
created: 2026-06-30
updated: 2026-06-30
status: seed
source:
  - https://microsoft.github.io/autogen/stable/
aliases:
  - Microsoft AutoGen
---

# AutoGen

> [!summary] 定位
> `AutoGen` 是 Microsoft 推出的多 Agent 框架，强调消息驱动、多角色协作和从底层 Core 到上层 AgentChat 的分层设计。

## 一、它的优势在哪里

`AutoGen` 最大的识别度，不是工具调用，而是多 Agent 协作表达。

它适合描述：

- Coordinator / Planner / Reviewer / Executor 分工
- 多个专业 Agent 协作
- 基于消息和角色的交互模式

## 二、当前需要重点看的版本

重点看 `0.4` 体系。

从你现有笔记看，已经有比较好的材料：

- [[大模型/02-应用开发/AutoGen/Agent调度/AutoGen自动进行Agent调用判断]]
- [[大模型/02-应用开发/AutoGen/Agent调度/SelectorGroupChat进行动态调度]]

## 三、核心印象

- 多 Agent 场景表达自然
- 分层结构比较清晰
- 很适合做研究、实验和复杂协作原型
- 对“角色协作”这件事的建模比很多框架更直接

## 四、适合场景

- 多 Agent 工作流
- 多角色任务拆解
- 要试验调度模式、角色协同模式的系统
- 需要更强消息驱动范式的项目

## 五、潜在问题

- 版本演进变化大，要注意资料时效性
- 从 Demo 到稳定工程落地，中间还有不少设计工作
- 如果你要的是“严格可控的生产工作流”，有时 [[LangGraph]] 会更稳

## 六、你当前知识库和它的契合点

你现在关于 Agent 的很多实践线索，其实就是 `AutoGen` 风格问题：

- 不同数据库 Agent 分工
- Coordinator 调度
- 多 Agent 任务转发
- 和 [[MCP概览]] 的组合

所以 `AutoGen` 在你库里不只是一个框架条目，而是已经进入“工作流实践层”了。

## 相关笔记

- [[大模型/02-应用开发/AutoGen/function call/如何让不支持function call的模型可以被autogen使用|让不支持 function call 的模型接入 AutoGen]]
- [[大模型/02-应用开发/AutoGen/Agent如何支持调用stream模式的客户端|Agent 如何支持 stream 模式]]
- [[大模型/08-个体重构/05-案例观察/智能工作台中的多Agent工作流实践]]
