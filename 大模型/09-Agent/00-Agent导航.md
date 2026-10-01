---
tags:
  - 大模型/Agent
  - 导航
  - 多智能体
created: 2026-06-30
updated: 2026-07-12
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
  - Agent导航
  - AI Agent 导航
---

# Agent 导航

> [!summary] 概览
> 本目录用于系统整理当前主流的 Agent 框架、平台与设计思路，重点关注多 Agent 编排、工具调用、工作流控制、可观测性、工程化能力以及和 [[大模型/02-应用开发/MCP/MCP概览|MCP]]、[[大模型/02-应用开发/RAG/18种RAG技术对比测试|RAG]]、Workflow 的关系。

## 一、为什么要单独整理 Agent

`Agent` 已经不再只是“会调用工具的聊天机器人”，而是在逐步演化为一种任务执行层：

- 能做多步规划
- 能调用工具与外部系统
- 能维护短期状态和长期记忆
- 能把复杂任务拆分给多个角色协作
- 能和 `RAG`、`MCP`、数据库、浏览器自动化、代码执行环境连接

如果说 `LLM` 提供的是推理与生成能力，那么 `Agent` 更像是把这些能力接到真实工作流上的执行框架。

## 二、主流方案总览

| 类型               | 代表方案                                                                                                                                                                          | 适合场景                                | 关键词                             |       |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ------------------------------- | ----- |
| SDK / 编程框架       | [[OpenAI Agents SDK]]、[[LangGraph]]、[[AutoGen]]、[[Google ADK]]、[[CrewAI]]、[[PydanticAI]]、[[smolagents]]、[[LlamaIndex Agent]]                                                  | 自己写代码、自己控流程                         | 可编排、可扩展、可调试                     |       |
| 平台 / 运行时 / 低代码方案 | [[Dify Agent]]、[[OpenClaw]]、[[Hermes]]、[[Agent Zero]]、[[AutoGPT Platform]]、[[OpenManus]]、[[Manus]]、[[Genspark]]、[[Fellou]]、[[OpenHands]]、[[Letta]]、[[Lindy]]、[[Relevance AI]] | 快速搭建内部工具、运营型 AI 应用、个人常驻 Agent       | 工作流、可视化、长期记忆                    |       |
| Agent 工具 / 技能分发  | [[Ponytail]]                                                                                                                                                                  | 约束 AI 编程 Agent 行为、复用规则、跨工具分发 skills | YAGNI、stdlib first、skills、hooks |       |
| 协议与生态            | [[MCP概览]]、[[大模型/02-应用开发/MCP/一些优秀的MCP服务器                                                                                                                                       | MCP Server 生态]]                     | 工具接入、资源接入、跨工具互联                 | 协议标准化 |

## 三、选型的核心维度

### 1. 你到底要“Agent”还是“Workflow”

这一步最容易混淆。

- 如果任务流程相对固定，建议优先选 `Workflow` 风格框架
- 如果任务拆解、角色协作、动态决策很多，再选更强的 `Agent` 框架

> [!note] 一个很常见的误区
> 很多系统其实并不需要“自治 Agent”，而只需要“可观测的工作流 + 局部智能决策”。

### 2. 你要不要多 Agent

多 Agent 不是默认更高级，只是适合：

- 多角色分工明显
- 多数据源联动明显
- 需要 planner / executor / reviewer 等协作

可以结合 [[大模型/08-个体重构/05-案例观察/智能工作台中的多Agent工作流实践]] 一起看。

### 3. 你需要什么级别的工程能力

需要重点看：

- 状态管理
- 中断与恢复
- 观察与日志
- 人工接管
- 工具注册方式
- 模型供应商兼容性
- 部署和评测方式

## 四、建议优先关注的方案

### 第一梯队：当前最值得长期跟踪

1. [[LangGraph]]  
   适合把“Agent”做成可控工作流，工程化能力强，和 LangChain 生态联动明显。

2. [[OpenAI Agents SDK]]  
   适合围绕 OpenAI 生态做 agentic application，抽象较清晰，后续生态值得持续跟踪。

3. [[AutoGen]]  
   适合多 Agent 协作、消息驱动和研究/实验型系统，尤其适合看多角色编排。

4. [[Google ADK]]  
   适合关注 Google 体系 Agent 工程方案的人，值得持续观察其生态成熟度。

### 第二梯队：有明显风格和定位

5. [[CrewAI]]  
   角色协作表达直接，上手快，适合“团队分工型”多 Agent。

6. [[PydanticAI]]  
   更偏 Python 工程质量、类型约束、结构化输出和可维护性。

7. [[smolagents]]  
   思路轻，代码量少，适合快速验证和教学理解。

8. [[LlamaIndex Agent]]  
   适合和数据、检索、RAG 场景绑定较深的 Agent 系统。

### 平台型

9. [[Dify Agent]]  
   适合先把业务流程跑起来，再逐步补底层工程能力。

10. [[OpenClaw]] / [[Hermes]]  
   适合跟踪“个人常驻智能体 / 数字员工 / Agent OS 雏形”这一类方案。

### 个人常驻智能体 / 数字员工

这一类不完全等同于 SDK，更像“可运行的智能体产品或运行时”。建议从 [[个人常驻智能体对比]] 开始看。

- [[云玦 Yunjue]]
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

### Agent 工具 / 技能分发

这一类不是完整 Agent 运行时，而是给已有 Agent 工具增加行为约束、技能、命令或 hooks。

- [[Ponytail]]

## 五、建议阅读顺序

### 路径零：先看 2026 年技术与研究变化

1. [[2026 Agent 技术与论文追踪]]
2. [[Coding Agent 工具链对比]]
3. [[Agent框架选型对比]]

### 路径一：先建立框架视角

1. [[Agent框架选型对比]]
2. [[LangGraph]]
3. [[OpenAI Agents SDK]]
4. [[AutoGen]]

### 路径二：从你当前知识库延伸

1. [[大模型/09-Agent/AutoGen|AutoGen]]
2. [[大模型/02-应用开发/MCP/MCP概览|MCP 概览]]
3. [[大模型/08-个体重构/05-案例观察/智能工作台中的多Agent工作流实践|多Agent工作流实践]]
4. 回到 [[Agent框架选型对比]]

## 六、当前目录内容

- [[2026 Agent 技术与论文追踪]]
- [[云玦 Yunjue]]
- [[Agent框架选型对比]]
- [[个人常驻智能体对比]]
- [[OpenAI Agents SDK]]
- [[LangGraph]]
- [[AutoGen]]
- [[Google ADK]]
- [[CrewAI]]
- [[PydanticAI]]
- [[smolagents]]
- [[LlamaIndex Agent]]
- [[Dify Agent]]
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

## 七、后续可补的方向

- Browser Use / Web Agent 体系
- Semantic Kernel Agent 能力
- Haystack Agent / pipeline 体系
- Hermes / OpenClaw 这类个人常驻 Agent 运行时
- Anthropic 的 agentic workflow 方法论
- Agent 评测框架与 benchmark
- Agent memory 体系
- Agent skills / rules / plugin 分发体系

## 相关笔记

- [[大模型/02-应用开发/MCP/MCP概览|MCP 概览]]
- [[大模型/02-应用开发/RAG/18种RAG技术对比测试|RAG 技术对比]]
- [[大模型/08-个体重构/02-工作流重构/MCP、RAG 与 Agent 在个体重构中的位置]]
- [[大模型/08-个体重构/05-案例观察/智能工作台中的多Agent工作流实践]]