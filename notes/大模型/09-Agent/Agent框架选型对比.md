---
tags:
  - 大模型/Agent
  - 选型
  - 多智能体
created: 2026-06-30
updated: 2026-06-30
status: seed
source:
  - https://openai.github.io/openai-agents-python/
  - https://docs.langchain.com/oss/python/langgraph/overview
  - https://microsoft.github.io/autogen/stable/
  - https://google.github.io/adk-docs/
  - https://docs.crewai.com/
  - https://huggingface.co/docs/smolagents/index
  - https://ai.pydantic.dev/
  - https://docs.llamaindex.ai/en/stable/understanding/agent/
  - https://docs.dify.ai/
  - https://openclaw.ai/
  - https://github.com/openclaw/openclaw
  - https://www.techradar.com/pro/how-to-automate-workflows-using-open-source-ai-agents
  - https://www.agent-zero.ai/
  - https://github.com/agent0ai/agent-zero
  - https://agpt.co/docs/platform
  - https://manus.im/
  - https://www.genspark.ai/
  - https://fellou.ai/
  - https://docs.openhands.dev/overview/introduction
  - https://docs.letta.com/
  - https://www.lindy.ai/
  - https://relevanceai.com/
  - https://github.com/DietrichGebert/ponytail
aliases:
  - Agent 方案对比
---

# Agent 框架选型对比

> [!summary] 一句话判断
> 如果你更看重可控工作流，优先看 [[LangGraph]]；如果你围绕 OpenAI 生态做应用，优先看 [[OpenAI Agents SDK]]；如果你强调多 Agent 协作，优先看 [[AutoGen]]；如果你想快速让业务跑起来，优先看 [[Dify Agent]]。

## 一、总体对比

| 方案 | 主要定位 | 优势 | 风险 / 短板 | 适合你当前知识库的程度 |
|---|---|---|---|---|
| [[LangGraph]] | 有状态、可控的 agent workflow 框架 | 工程能力强，适合复杂流程 | 学习成本略高 | 很高 |
| [[OpenAI Agents SDK]] | 面向 OpenAI 生态的 agent SDK | 抽象清晰，工具与 handoff 语义自然 | 更偏 OpenAI 生态 | 很高 |
| [[AutoGen]] | 多 Agent 协作框架 | 多角色协作表达强，研究味浓 | 版本变化大，概念层次多 | 很高 |
| [[Google ADK]] | Google 体系 agent 开发框架 | 值得跟踪，适合关注 Google 工具链 | 生态成熟度仍需观察 | 中高 |
| [[CrewAI]] | 角色团队式 Agent | 上手快，角色协作直观 | 大项目可控性要仔细评估 | 中高 |
| [[PydanticAI]] | Python 工程化 Agent 框架 | 类型安全、结构化输出好 | 多 Agent 生态不如前三强 | 高 |
| [[smolagents]] | 轻量 Agent 框架 | 轻、快、易理解 | 大规模工程能力有限 | 中 |
| [[LlamaIndex Agent]] | 数据与检索驱动 Agent | 和 RAG、知识检索结合紧 | 更适合数据应用而非广义编排 | 高 |
| [[Dify Agent]] | 平台 / 低代码 | 交付快、可视化 | 深度定制受限 | 中高 |
| [[OpenClaw]] | 个人常驻智能体运行时 | 聊天入口、技能系统、长期运行、本地上下文 | 高权限执行带来明显安全风险 | 高 |
| [[Hermes]] | 个人常驻智能体 / 数字员工 | 关注任务细化、自学习、技能沉淀 | 资料和实现需要继续核验 | 中高 |
| [[Agent Zero]] | 本地智能体运行环境 | Linux 桌面、浏览器、插件、skills、子智能体 | 本地执行和主机权限风险 | 高 |
| [[AutoGPT Platform]] | continuous agents 平台 | workflow builder、blocks、marketplace、触发器 | 复杂流程调试和成本控制 | 中高 |
| [[OpenManus]] | Manus 类开源 Agent 框架 | 开源、适合学习通用 Agent 实现 | 项目成熟度需观察 | 中 |
| [[Manus]] | 通用自主 Agent 产品 | 浏览器、代码、文档、研究、设计、slides | 闭源、成本、隐私和可控性 | 中高 |
| [[Genspark]] | AI workspace / Super Agent | 多工具生产流、文档、表格、设计、网页 | 平台锁定和深度可控性 | 中 |
| [[Fellou]] | Agentic Browser | web 自动化、计划审批、agentic memory | 账号权限和网页污染风险 | 中高 |
| [[OpenHands]] | 软件开发智能体平台 | 代码、终端、浏览器、Git 集成 | 更偏开发场景 | 高 |
| [[Letta]] | 记忆优先智能体平台 | 长期记忆、skills、channels、MCP tools | 记忆治理和敏感信息管理 | 高 |
| [[Lindy]] | 工作助理 / AI assistant | 邮件、日程、会议、跟进、办公集成 | 账号权限和企业合规 | 中高 |
| [[Relevance AI]] | 企业 AI workforce 平台 | RBAC、审计、evals、MCP、playbooks | 企业平台依赖和流程治理成本 | 中高 |
| [[Ponytail]] | Agent 行为规则 / skills 分发包 | 约束 AI 编程 Agent 少造轮子、少过度设计，支持多宿主工具 | 不是 Agent 框架，不提供调度、记忆、多用户隔离 | 中高 |

## 二、按需求选

### 如果你要做“工作台式多数据源分析”

优先顺序建议：

1. [[LangGraph]]
2. [[OpenAI Agents SDK]]
3. [[AutoGen]]

原因：

- 你当前知识库里已经有明显的多步骤、多角色、多数据源思路
- 这类场景更看重流程可控、状态可观测、工具接入能力
- 不是单纯追求“能对话”，而是要“能执行工作流”

### 如果你要做“多 Agent 协作实验”

优先顺序建议：

1. [[AutoGen]]
2. [[CrewAI]]
3. [[OpenAI Agents SDK]]

### 如果你要做“RAG + Agent”

优先顺序建议：

1. [[LlamaIndex Agent]]
2. [[LangGraph]]
3. [[OpenAI Agents SDK]]

### 如果你要做“快速业务落地”

优先顺序建议：

1. [[Dify Agent]]
2. [[CrewAI]]
3. [[OpenAI Agents SDK]]

## 三、我对这些方案的判断

> [!note] 一个直接判断
> 未来几年里，真正长期有价值的不是“谁最像人在聊天”，而是谁能把 Agent 做成稳定、可调试、可接管、可评测的任务执行系统。

### 最值得长期投入学习的

- [[LangGraph]]
- [[OpenAI Agents SDK]]
- [[AutoGen]]

### 最适合保持关注的

- [[Google ADK]]
- [[PydanticAI]]
- [[LlamaIndex Agent]]

### 最适合快速试验和教学的

- [[CrewAI]]
- [[smolagents]]

### 需要单独观察的

- [[OpenClaw]]
- [[Hermes]]
- [[Agent Zero]]
- [[AutoGPT Platform]]
- [[OpenManus]]
- [[Manus]]
- [[Genspark]]
- [[Fellou]]
- [[OpenHands]]
- [[Letta]]
- [[Lindy]]
- [[Relevance AI]]
- [[Ponytail]]

### 如果你关心 AI 编程 Agent 的行为约束

可以单独看 [[Ponytail]]。它不替代 [[LangGraph]]、[[AutoGen]] 或 [[OpenAI Agents SDK]]，但适合作为 AI 编程 Agent 的默认规则包：先判断需求是否必要，再复用现有代码、标准库、平台原生能力和已安装依赖，最后才写最小可工作的代码。

### 如果你关心个人常驻智能体

先看 [[个人常驻智能体对比]]，再按场景选择：

- 本地自动化：[[OpenClaw]]、[[Agent Zero]]、[[Letta]]
- 浏览器自动化：[[Fellou]]、[[Manus]]、[[Genspark]]
- 软件开发：[[OpenHands]]、[[Agent Zero]]
- 企业数字员工：[[Relevance AI]]、[[Lindy]]、[[AutoGPT Platform]]

## 四、和 MCP 的关系

很多人会把 `MCP` 当成 Agent 框架，其实不是。

- `MCP` 更像工具与资源接入协议
- `Agent 框架` 更像任务执行与编排系统

两者是互补关系，不是替代关系。可结合 [[大模型/02-应用开发/MCP/MCP概览|MCP 概览]] 阅读。

## 五、建议你后面怎么用这个目录

1. 先用 [[Agent框架选型对比]] 做总览
2. 确定你最关心的 2-3 个框架
3. 每个框架单独补：
   - 核心抽象
   - 运行模型
   - 工具接入方式
   - 状态与记忆
   - 适用场景
   - 和你自己项目的关系

## 相关笔记

- [[00-Agent导航]]
- [[Ponytail]]
- [[大模型/09-Agent/AutoGen|AutoGen]]
- [[大模型/02-应用开发/MCP/Agent的一些思考]]
