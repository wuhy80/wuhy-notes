---
tags:
  - Palantir
  - Ontology
  - Agent
  - 多租户
  - 架构选型
created: 2026-06-30
updated: 2026-06-30
status: 初稿
source:
  - "[[基于 Hermes 的多用户 Ontology 分析系统评估]]"
  - "[[大模型/09-Agent/LangGraph]]"
  - "[[大模型/09-Agent/OpenAI Agents SDK]]"
  - "[[大模型/09-Agent/AutoGen]]"
  - "[[大模型/09-Agent/Letta]]"
  - "[[大模型/09-Agent/OpenHands]]"
  - "[[大模型/09-Agent/Relevance AI]]"
  - https://docs.langchain.com/langsmith/deployment
  - https://openai.github.io/openai-agents-python/
  - https://learn.microsoft.com/en-us/semantic-kernel/frameworks/agent/
  - https://adk.dev/
  - https://developers.llamaindex.ai/python/llamaagents/workflows/
  - https://docs.crewai.com/
  - https://docs.haystack.deepset.ai/docs/agents
  - https://pydantic.dev/docs/ai/overview/
  - https://docs.letta.com/
  - https://docs.openhands.dev/overview/introduction
aliases:
  - Ontology Agent 平台替代方案
---

# Ontology 多用户 Agent 分析平台替代方案选型

> [!summary] 结论
> 如果不基于 [[Hermes]]，不只有 [[大模型/09-Agent/LangGraph|LangGraph]] 一条路。候选可以分成三类：工程编排底座、Agent SDK、低代码/产品平台。首选仍是 `LangGraph / LangSmith Deployment + 自研 Tool Gateway + Ontology 权限层`；如果偏微软生态，看 Semantic Kernel；偏 Google 生态，看 Google ADK；偏数据/RAG，看 LlamaIndex Workflows 或 Haystack；偏低代码交付，看 Dify / CrewAI Enterprise。

## 一、系统目标

目标系统不是普通 Chatbot，而是：

- 多用户
- 多租户 / 多项目
- 基于 Ontology 做对象、关系、动作、函数分析
- 支持权限、审计和证据链
- 支持长任务和异步执行
- 支持 Action Proposal 和受控写回

因此底座要优先满足：

- 状态管理
- human-in-the-loop
- tracing / audit
- 可恢复任务
- 工具权限控制
- 与 Ontology 权限模型组合

## 二、首选：LangGraph 作为编排层

### 适合程度

**最高。**

原因：

- 适合把 Agent 做成可控流程，而不是完全自治黑盒。
- 适合多步骤分析、对象查询、证据链、人工确认和写回 proposal。
- LangSmith Deployment 面向 agent workload，支持 durable execution、streaming、horizontal scaling、cloud / standalone / self-hosted 等部署方式。

### 推荐架构

```text
Web / Chat
  -> API Gateway
  -> Auth / Tenant / Project Policy
  -> LangGraph Workflow
      -> Ontology Query Node
      -> Metric / TimeSeries Node
      -> Reasoning Node
      -> Evidence Node
      -> Action Proposal Node
      -> Human Approval Node
  -> Tool Gateway
  -> Ontology Action / Function
```

### 优点

- 流程可控
- 易插入权限检查
- 易插入人工确认
- 适合长任务状态管理
- 比个人常驻智能体更适合企业分析

### 缺点

- 要自己实现多租户控制面
- 要自己实现 Tool Gateway
- 对团队的工程设计要求更高

## 三、次选：OpenAI Agents SDK 作为 Agent Runtime

### 适合程度

**高。**

OpenAI Agents SDK 的优势是抽象清晰：

- agents
- tools
- handoffs
- guardrails
- sessions
- MCP
- tracing
- human-in-the-loop
- sandbox agents

### 适合场景

- 团队主要使用 OpenAI 模型
- 希望少造 Agent runtime 轮子
- 需要 handoff、guardrails、tracing、sessions
- 需要 MCP 工具接入

### 推荐架构

```text
自研多用户平台
  -> OpenAI Agents SDK Runtime
      -> Agent / Handoff / Guardrail
      -> Session / Trace
      -> MCP Tool
  -> Tool Gateway
  -> Ontology
```

### 缺点

- 多租户控制面仍要自研
- 更偏 OpenAI 生态
- 对复杂工作流图的表达不如 LangGraph 直观

## 四、其他可以作为主底座的方案

### 1. Semantic Kernel Agent Framework

适合程度：**中高**。

适合团队：

- 微软 / .NET / Azure 生态较重
- 希望把现有业务函数包装成插件
- 需要 agent orchestration、multi-agent collaboration、human-agent collaboration

优点：

- 企业应用风格比较明显
- 插件模型适合接现有服务
- 支持 C# / Python / Java 生态

不足：

- 多租户控制面仍要自建
- 如果团队不是微软生态，使用收益会下降

### 2. Google ADK

适合程度：**中高**。

适合团队：

- 已经使用 Gemini / Google Cloud
- 希望有 graph workflows、collaborative agents、runtime、observability、evaluation、deployment
- 想用 Python / TypeScript / Go / Java / Kotlin 多语言生态

优点：

- 产品化方向明确
- graph workflows、agent runtime、observability、evaluation 都在官方体系内
- 部署到 Cloud Run / GKE / Agent Runtime 路径清晰

不足：

- 更偏 Google 生态
- Ontology Tool Gateway 和企业权限仍要自己设计

### 3. LlamaIndex Workflows

适合程度：**中高**。

适合团队：

- RAG / 文档 / 知识库 / 数据检索场景很重
- 希望用 event-driven、step-based workflow 控制复杂流程
- 需要 branches、loops、concurrent execution、state、human-in-the-loop、durable workflow

优点：

- 和数据检索结合自然
- Python 表达直接
- 很适合“Ontology + RAG + 分析解释”

不足：

- 企业级控制面、权限、审计仍要自建
- 如果业务写回复杂，需要额外设计 Action Proposal 层

### 4. Haystack

适合程度：**中**。

适合团队：

- 文档、搜索、RAG、问答、智能文档处理是主场景
- 更关心 pipeline 和组件化数据流

优点：

- RAG 和文档处理生态成熟
- pipeline 透明，适合可观测的数据处理流

不足：

- 不如 LangGraph / ADK 那样天然面向企业 Agent 工作流
- Ontology 写回和多用户治理需要自建

### 5. CrewAI

适合程度：**中**。

适合团队：

- 需要快速做角色协作型 Agent
- 业务上天然有 researcher / analyst / reviewer / executor 等角色
- 可以接受框架更偏“crew / task / flow”的表达

优点：

- 上手快
- role-based 多 Agent 表达清晰
- 企业版有 RBAC、生产自动化、监控等方向

不足：

- 做严肃的 Ontology 权限和审计时，仍要加自研控制面
- 如果流程很复杂，可能不如 LangGraph 可控

### 6. PydanticAI

适合程度：**中**。

适合团队：

- Python 后端强
- 更重视类型安全、结构化输出、可测试性
- Agent 逻辑不会特别复杂，但输出和工具调用要可靠

优点：

- 工程质量好
- 适合把 LLM 能力放进后端服务
- 适合做可测试的分析工具层

不足：

- 不是完整多 Agent 编排平台
- 长任务、human-in-the-loop、多租户控制面要自建

### 7. Dify / Flowise / n8n 这类低代码路线

适合程度：**中低到中高，取决于目标。**

适合：

- 快速验证
- 内部工具
- 工作流原型
- 低代码交付

不适合：

- 作为核心企业 Ontology 权限底座
- 承载复杂对象级权限、审计和 Action Proposal

## 五、组件型方案

这些不建议单独作为主底座，但很适合作为组件。

### Letta：记忆层

[[大模型/09-Agent/Letta|Letta]] 适合处理：

- 长期记忆
- stateful agents
- skills
- channels
- schedules
- permissions
- MCP tools

在本系统中的位置：

```text
Agent Orchestrator
  -> Memory Service
      -> personal memory
      -> project memory
      -> organization memory
```

注意：记忆必须强隔离，不能绕过 Ontology 权限。

### OpenHands：沙箱执行层

[[大模型/09-Agent/OpenHands|OpenHands]] 的优势在软件开发智能体：

- 代码
- 终端
- 浏览器
- SDK
- sandboxed environment
- Git 集成

适合放在：

```text
Agent Workflow
  -> Code / Notebook / Report Generation Tool
      -> OpenHands-style Sandbox
```

它不适合直接承载 Ontology 权限模型和多租户分析平台控制面。

### AutoGen：多 Agent 协作层

[[大模型/09-Agent/AutoGen|AutoGen]] 适合：

- Planner / Analyst / Reviewer / Executor 多角色协作
- 多 Agent 实验
- 任务分派和角色分工

但它不替代：

- 多租户控制面
- 权限治理
- 审计
- Tool Gateway

### Relevance AI：企业形态参考

[[大模型/09-Agent/Relevance AI|Relevance AI]] 的价值是提醒我们：企业级 Agent 平台要有治理能力。

可以借鉴：

- RBAC
- audit logs
- evals
- playbooks
- human-in-the-loop
- production monitoring
- connector governance

如果自研，不一定使用它，但要学习这种产品边界。

## 六、候选方案分层

| 方案 | 能否做主底座 | 适合位置 | 对 Ontology 分析平台的判断 |
|---|---|---|---|
| LangGraph | 可以 | 编排层 | 首选，流程最可控 |
| OpenAI Agents SDK | 可以 | Agent Runtime | OpenAI 生态下很合适 |
| Semantic Kernel | 可以 | Agent SDK / 插件编排 | 微软生态下值得考虑 |
| Google ADK | 可以 | Agent SDK / Runtime | Google 生态下值得考虑 |
| LlamaIndex Workflows | 可以 | 数据/RAG 工作流 | 数据检索和知识分析强 |
| Haystack | 勉强可以 | RAG / 文档 pipeline | 适合文档密集型，不是首选控制面 |
| CrewAI | 勉强可以 | 多角色协作 | 原型快，严肃治理要自建 |
| PydanticAI | 不建议单独做主底座 | 后端 Agent 工具层 | 类型安全和结构化输出强 |
| Letta | 不建议单独做主底座 | 记忆层 | 适合长期记忆 |
| OpenHands | 不建议单独做主底座 | 沙箱执行层 | 适合代码/终端/浏览器任务 |
| Dify / Flowise / n8n | 不建议作为核心底座 | 低代码验证 | 可做 MVP，不适合承载核心权限 |

## 七、不建议作为主底座

### Hermes / OpenClaw / Agent Zero

这些更适合：

- 个人常驻智能体
- 本地自动化
- 技能系统探索
- 单人或小范围隔离环境

不适合直接作为：

- 多租户企业分析平台
- 统一 Ontology 权限执行层
- 审计和合规控制面

### Manus / Genspark / Fellou / Lindy

这些多为产品形态或商业平台，适合观察交互模式和能力边界，但不适合做自研平台底座。

## 八、推荐最终组合

### 稳妥路线

```text
自研多用户控制面
  + LangGraph 编排层
  + Tool Gateway
  + Ontology Query / Function / Action Proposal
  + Letta-style Memory Service
  + OpenHands-style Sandbox Tool
  + Audit / Trace / Eval
```

### 微软生态路线

```text
自研多用户控制面
  + Semantic Kernel Agent Framework
  + Plugin / Tool Gateway
  + Ontology Tools
  + Azure / Microsoft 生态集成
  + Audit / Trace / Eval
```

### Google 生态路线

```text
自研多用户控制面
  + Google ADK
  + Graph Workflows
  + Agent Runtime / Cloud Run / GKE
  + Ontology Tools
  + Observability / Evaluation
```

### 数据/RAG 优先路线

```text
自研多用户控制面
  + LlamaIndex Workflows 或 Haystack
  + Ontology + RAG 检索层
  + Function 聚合分析
  + Action Proposal
```

### OpenAI 优先路线

```text
自研多用户控制面
  + OpenAI Agents SDK
  + MCP Tool Gateway
  + Ontology Tools
  + Session / Tracing / Guardrails
  + Action Proposal
```

### 不推荐路线

```text
Hermes / OpenClaw
  -> 直接改成多用户系统
```

原因：控制面、权限、审计、记忆隔离、工具隔离和任务调度都要大改，长期维护成本高。

## 九、阶段建议

### 第一阶段

- 只读分析
- Object 查询
- Function 聚合
- 证据链
- 多用户权限
- 审计日志

### 第二阶段

- Action Proposal
- 人工确认
- 受控写回

### 第三阶段

- 自动化任务
- 定时分析
- 低风险自动执行

## 最终建议

> [!summary]
> 不是只有 Hermes 和 LangGraph。可选主路线至少有：LangGraph、OpenAI Agents SDK、Semantic Kernel、Google ADK、LlamaIndex Workflows、Haystack、CrewAI。只是如果按“多用户 Ontology 分析平台”的严肃工程要求排序，LangGraph 仍是最稳的第一选择；ADK、Semantic Kernel、OpenAI Agents SDK 是生态型强备选；LlamaIndex / Haystack 更适合数据和 RAG 很重的场景。

## 相关笔记

- [[基于 Hermes 的多用户 Ontology 分析系统评估]]
- [[Ontology/04-安全治理/安全治理与权限]]
- [[Ontology/03-动作与函数/Actions、Functions 与写回机制]]
- [[大模型/09-Agent/Agent框架选型对比]]
