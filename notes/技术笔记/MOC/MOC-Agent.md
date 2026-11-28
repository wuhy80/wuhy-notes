---
tags:
  - MOC
  - 大模型/Agent
  - 智能体
created: 2026-11-08
updated: 2026-11-08
type: MOC
---

# MOC-Agent

> [!abstract] 概述
> Agent（智能体）是本库第二大实体：约 280 篇笔记提及，核心阵地是 `大模型/09-Agent/`（28 篇框架与产品笔记）与 `大模型/02-应用开发/AutoGen/`（调度与工具调用实战），另有 `大模型/08-个体重构/05-案例观察/` 的 4 篇工作流实践、`Golang编程/大模型开发/` 的 Go 视角实现，以及新闻日报中的高频主题（2026-07 以来每月 25-30 篇早报提及）。逐篇导航见 [[00-Agent导航]]，本 MOC 补跨目录视角与待补链。

## 笔记索引

### 门户与选型

- [[00-Agent导航]] —— `大模型/09-Agent/` 目录中心索引
- [[Agent框架选型对比]] —— 多框架横评
- [[个人常驻智能体对比]] —— 个人助手型 Agent 选型
- [[Coding Agent 工具链对比]]（`大模型/10-新闻/`）—— 编程 Agent 工具链横评
- [[2026 Agent 技术与论文追踪]] —— 年度技术脉络

### 单框架笔记（`大模型/09-Agent/`）

- [[AutoGen]]、[[LangGraph]]、[[OpenAI Agents SDK]]、[[Google ADK]]、[[CrewAI]]
- [[PydanticAI]]、[[smolagents]]、[[LlamaIndex Agent]]、[[Dify Agent]]

### 产品型 Agent（`大模型/09-Agent/`）

- [[Manus]]、[[Genspark]]、[[Fellou]]、[[OpenClaw]]、[[OpenHands]]
- [[Letta]]、[[Lindy]]、[[Agent Zero]]、[[AutoGPT Platform]]、[[OpenManus]]
- [[Relevance AI]]、[[Ponytail]]（Agent 工具与 Skills）

### AutoGen 深入（`大模型/02-应用开发/AutoGen/`）

- 调度：[[AutoGen自动进行Agent调用判断]]、[[SelectorGroupChat进行动态调度]]
- 工具调用：[[如何让不支持function call的模型可以被autogen使用]]、[[Agent如何支持调用stream模式的客户端]]
- 网关：[[使用cloudflare作为网关去访问]]

### 工作流实践（`大模型/08-个体重构/05-案例观察/`）

- [[智能工作台中的多Agent工作流实践]]
- [[PPT Agent 工作流：从需求调研到 SVG 设计稿]]
- [[AI工作台路线图与知识层设计]]
- [[云玦 Yunjue Agent Tech Report 全文提取]]（`大模型/09-Agent/`）

### Go 视角（`Golang编程/大模型开发/`）

- [[如何实现Function Call]] —— 不依赖 Python 生态的 Agent 工具调用实现

### 论文与行业报告侧

- [[OpenAI Shift to Agentic AI (Codex) 全文提取]]（`大模型/06-论文与报告/行业报告/`）
- [[METR Task-Completion Time Horizons 全文提取]] —— Agent 任务时长边界

## 待补链建议

> [!note] 口径说明
> 以下文件正文提到 Agent/智能体/框架名，但没有出链指向 [[00-Agent导航]]、[[AutoGen]] 等核心笔记。仅建议，不代改。

- 大模型/09-Agent/云玦 Yunjue Agent Tech Report 全文提取.md —— 未链 [[00-Agent导航]] 或 [[Agent框架选型对比]]
- 大模型/06-论文与报告/行业报告/Stanford AI Index Report 2026 全文提取.md —— 未链任意 Agent 笔记
- 大模型/06-论文与报告/行业报告/International AI Safety Report 2026 全文提取.md —— 同上
- 大模型/06-论文与报告/行业报告/2026 Work Trend Index 2026 全文提取.md —— 同上
- 大模型/07-教程与课程/B站学习/姚顺宇四小时访谈：在Anthropic和Gemini训模型.md —— 可链 [[00-Agent导航]]
- 技术笔记/硬件/廖恒五小时访谈：昇腾史、18层宝塔与芯片三十年.md —— 访谈中涉 Agent 生态，可链 [[00-Agent导航]]
- 英语学习/外刊看世界/Simon Willison 2026 LLM 盘点：双语精读.md —— 可链 [[2026 Agent 技术与论文追踪]]
- 大模型/10-新闻/日报 各月早报 —— 实体词（Claude Code、Codex、Manus 等）全部无出链，可由月索引页按实体聚合（见 [[MOC-大模型]] 待补链）

## 相关实体

- [[MOC-MCP]]、[[MOC-Prompt工程]]、[[MOC-大模型]]、[[MOC-RAG与向量检索]]
- [[MOC-Golang]]（Function Calling 的 Go 实现）、[[MOC-Palantir-Ontology]]（Ontology 多用户 Agent 分析平台）
