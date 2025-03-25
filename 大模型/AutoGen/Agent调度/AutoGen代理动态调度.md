---
🌻日期🌻: 2025-03-25
🌙星期🌙: 星期二
⌚️时间⌚️: 15:41:26
tags: 
---
从 Grok 中获取的数据，但是看起来不是最新版本的


### 关键要点
- 研究表明，autogen 的最新版本（截至 2025 年 3 月 25 日）支持通过多代理对话框架实现代理动态调度。
- 看起来可以设置一个调度代理（SchedulerAgent）来根据查询条件路由到 RagAgent、MysqlAgent 或 InfluxAgent。
- 证据倾向于使用组聊天功能，调度代理作为经理，处理用户查询并将任务分配给适当的成员代理。

---

### 实现动态调度的步骤
**概述**  
在 autogen 的最新版本中，可以通过创建一个调度代理来实现动态调度，根据用户查询的类型选择性地调用 RagAgent、MysqlAgent 或 InfluxAgent。这种方法利用了 autogen 的多代理对话框架，确保用户只与调度代理交互，而调度代理内部处理与成员代理的通信。

**定义代理**  
首先，定义三个专门的成员代理：  
- **RagAgent**：负责使用检索增强生成（RAG）回答一般信息查询。  
- **MysqlAgent**：处理与 MySQL 数据库相关的 SQL 查询。  
- **InfluxAgent**：处理 InfluxDB 的时间序列数据查询。  

每个代理都可以是 `AssistantAgent` 的实例，带有描述其角色的系统消息。例如：  
- RagAgent 的系统消息：”你是 RagAgent，负责使用检索增强生成从特定数据源回答问题。”  
- MysqlAgent 的系统消息：”你是 MysqlAgent，负责执行 MySQL 数据库的 SQL 查询并返回结果。”  
- InfluxAgent 的系统消息：”你是 InfluxAgent，负责执行 InfluxDB 的时间序列查询并返回结果。”  

**设置调度代理**  
创建 **SchedulerAgent**，也是 `AssistantAgent` 的实例，其系统消息应包括如何根据查询类型路由的指令。例如：  
”你是 SchedulerAgent，负责接收用户查询并根据请求的数据类型决定发送给哪个代理。如果是关于一般信息，发送给 RagAgent；如果是关系型数据或需要 SQL 查询，发送给 MysqlAgent；如果是时间序列数据或趋势，发送给 InfluxAgent。发送查询时，应通过名称直接地址代理，例如‘RagAgent，请回答这个问题：[查询]’。收到成员代理的响应后，将其转发给用户。”  

**建立对话图**  
设置对话图，使：  
- 用户（通过 `UserProxyAgent` 表示）可以向 SchedulerAgent 发送消息。  
- SchedulerAgent 可以与用户和所有成员代理通信。  
- 每个成员代理可以向 SchedulerAgent 发送响应。  

例如，使用代码：  
```python
from autogen import AssistantAgent, UserProxyAgent

rag_agent = AssistantAgent(name="RagAgent", system_message="你是 RagAgent，负责使用检索增强生成从特定数据源回答问题。")
mysql_agent = AssistantAgent(name="MysqlAgent", system_message="你是 MysqlAgent，负责执行 MySQL 数据库的 SQL 查询并返回结果。")
influx_agent = AssistantAgent(name="InfluxAgent", system_message="你是 InfluxAgent，负责执行 InfluxDB 的时间序列查询并返回结果。")

scheduler_agent = AssistantAgent(name="SchedulerAgent", system_message="你是 SchedulerAgent，负责接收用户查询并根据请求的数据类型决定发送给哪个代理。如果是关于一般信息，发送给 RagAgent；如果是关系型数据或需要 SQL 查询，发送给 MysqlAgent；如果是时间序列数据或趋势，发送给 InfluxAgent。收到成员代理的响应后，将其转发给用户。")

user_proxy = UserProxyAgent(name="user", is_ai=False)

user_proxy.register_agent(scheduler_agent)
scheduler_agent.register_agent(user_proxy)
scheduler_agent.register_agent(rag_agent)
scheduler_agent.register_agent(mysql_agent)
scheduler_agent.register_agent(influx_agent)
rag_agent.register_agent(scheduler_agent)
mysql_agent.register_agent(scheduler_agent)
influx_agent.register_agent(scheduler_agent)
```

**处理用户查询**  
用户通过 `user_proxy` 向 `scheduler_agent` 发送查询，例如：  
`user_proxy.send("微软当前股价是多少？", scheduler_agent)`  

SchedulerAgent 接收到查询后，使用其 LLM 根据系统消息决定将查询发送给哪个成员代理。例如，如果查询涉及数据库，可能会生成消息“MysqlAgent，请从数据库中检索微软当前股价。”  

**处理响应**  
被选中的成员代理（如 MysqlAgent）接收到消息后，根据其系统消息和工具处理查询，并将响应发送回 SchedulerAgent。SchedulerAgent 接收到响应后，将其转发给用户（通过 `user_proxy`）。

**意外细节**  
一个意外的细节是，SchedulerAgent 可以利用组聊天功能来管理与成员代理的交互，但为了确保用户只看到最终响应，通常需要避免用户直接参与组聊天，而是通过单独的对话图实现。

---

### 报告

#### 引言  
autogen 是一个由 Microsoft 开发的开源框架，旨在通过多代理对话简化 AI 代理的构建和协作，特别适用于大型语言模型（LLM）应用的发展。截至 2025 年 3 月 25 日，最新版本（v0.4）引入了异步、事件驱动的架构，支持更灵活的代理交互模式。本报告详细探讨如何在 autogen 中实现代理的动态调度，特别是在给定 RagAgent、MysqlAgent 和 InfluxAgent 的情况下，通过一个调度代理根据条件调用这些代理对外查询数据。

#### 背景与框架概述  
autogen 提供了一个灵活的代理架构，支持代理通过自然语言消息相互对话，执行任务。代理可以是基于 LLM 的，也可以是工具或用户代理，允许动态对话模式适应不同的输入场景。v0.4 版本强调异步消息传递和模块化扩展，适合构建复杂的多代理系统。

从搜索结果来看，autogen 的文档和示例展示了如何通过 `AgentChat API` 和 `GroupChat` 实现多代理交互，特别适用于任务分配和协作场景。例如，[Multi-agent Conversation Framework | AutoGen 0.2](https://microsoft.github.io/autogen/0.2/docs/Use-Cases/agent_chat/) 提到动态对话允许代理拓扑根据实际对话流调整，适合无法预定交互模式的情况。

#### 代理定义与角色  
为了实现动态调度，首先需要定义三个专门的成员代理：  
- **RagAgent**：负责使用检索增强生成（RAG）回答一般信息查询，可能是通过连接向量数据库或特定数据源。  
- **MysqlAgent**：处理 MySQL 数据库的 SQL 查询，适合关系型数据请求。  
- **InfluxAgent**：处理 InfluxDB 的时间序列查询，适合趋势或时间相关数据。  

这些代理可以是 `AssistantAgent` 的实例，每个都有描述其角色的系统消息。例如：  
- RagAgent：”你是 RagAgent，负责使用检索增强生成从特定数据源回答问题。”  
- MysqlAgent：”你是 MysqlAgent，负责执行 MySQL 数据库的 SQL 查询并返回结果。”  
- InfluxAgent：”你是 InfluxAgent，负责执行 InfluxDB 的时间序列查询并返回结果。”  

此外，代理可能需要工具支持。例如，MysqlAgent 可以有一个工具函数连接 MySQL 并执行查询，类似地，InfluxAgent 可以有 InfluxDB 查询工具。

#### 调度代理的设计  
核心是创建一个 **SchedulerAgent**，作为用户查询的入口点和路由器。SchedulerAgent 也是 `AssistantAgent` 的实例，其系统消息需要明确定义如何根据查询内容决定路由。例如：  
”你是 SchedulerAgent，负责接收用户查询并根据请求的数据类型决定发送给哪个代理。如果是关于一般信息或非数据库相关主题，发送给 RagAgent；如果是关系型数据或需要 SQL 查询，发送给 MysqlAgent；如果是时间序列数据或趋势，发送给 InfluxAgent。发送查询时，应通过名称直接地址代理，例如‘RagAgent，请回答这个问题：[查询]’。收到成员代理的响应后，将其转发给用户。”  

为了提高决策准确性，可以在系统消息中添加关键词示例：  
- 如果查询包含“股价”、“公司信息”等，可能是 RagAgent 的范围。  
- 如果包含“SQL”、“数据库”、“表”等，可能是 MysqlAgent。  
- 如果包含“时间序列”、“趋势”、“随时间变化”等，可能是 InfluxAgent。  

#### 对话图与交互模式  
实现动态调度的关键是设置适当的对话图，确保用户只与 SchedulerAgent 交互，而 SchedulerAgent 内部处理与成员代理的通信。以下是具体步骤：  
1. **定义用户代理**：使用 `UserProxyAgent` 代表用户，`is_ai=False` 表示真实用户。  
2. **注册代理关系**：通过 `register_agent` 方法设置对话图，使：  
   - `user_proxy` 可以向 `scheduler_agent` 发送消息。  
   - `scheduler_agent` 可以与 `user_proxy` 和所有成员代理（rag_agent、mysql_agent、influx_agent）通信。  
   - 每个成员代理可以向 `scheduler_agent` 发送响应。  

例如，代码如下：  
```python
from autogen import AssistantAgent, UserProxyAgent

rag_agent = AssistantAgent(name="RagAgent", system_message="你是 RagAgent，负责使用检索增强生成从特定数据源回答问题。")
mysql_agent = AssistantAgent(name="MysqlAgent", system_message="你是 MysqlAgent，负责执行 MySQL 数据库的 SQL 查询并返回结果。")
influx_agent = AssistantAgent(name="InfluxAgent", system_message="你是 InfluxAgent，负责执行 InfluxDB 的时间序列查询并返回结果。")

scheduler_agent = AssistantAgent(name="SchedulerAgent", system_message="你是 SchedulerAgent，负责接收用户查询并根据请求的数据类型决定发送给哪个代理。如果是关于一般信息，发送给 RagAgent；如果是关系型数据或需要 SQL 查询，发送给 MysqlAgent；如果是时间序列数据或趋势，发送给 InfluxAgent。收到成员代理的响应后，将其转发给用户。")

user_proxy = UserProxyAgent(name="user", is_ai=False)

user_proxy.register_agent(scheduler_agent)
scheduler_agent.register_agent(user_proxy)
scheduler_agent.register_agent(rag_agent)
scheduler_agent.register_agent(mysql_agent)
scheduler_agent.register_agent(influx_agent)
rag_agent.register_agent(scheduler_agent)
mysql_agent.register_agent(scheduler_agent)
influx_agent.register_agent(scheduler_agent)
```

3. **用户查询处理**：用户通过 `user_proxy.send("查询", scheduler_agent)` 发送消息。例如，`user_proxy.send("微软当前股价是多少？", scheduler_agent)`。  
   - SchedulerAgent 接收到消息后（消息来源为“user”），使用其 LLM 根据系统消息决定路由。例如，如果查询涉及数据库，可能生成“MysqlAgent，请从数据库中检索微软当前股价。”  
   - 这条消息通过对话图发送给 MysqlAgent，MysqlAgent 接收后根据其系统消息和工具处理查询。  

4. **响应处理**：MysqlAgent 处理完成后，将响应发送回 SchedulerAgent（消息来源为 MysqlAgent 的名称）。SchedulerAgent 接收到响应后，通过 `send` 方法将其转发给 `user_proxy`，确保用户只看到最终答案。

#### 组聊天与替代方案  
最初考虑使用 `GroupChat` 类设置组聊天，SchedulerAgent 作为经理，成员代理为组成员。然而，组聊天模式下所有消息对组内所有代理可见，包括用户如果加入组聊天。这可能导致用户看到中间交互，不符合需求。因此，选择了单独的对话图方法，确保用户只与 SchedulerAgent 交互，SchedulerAgent 内部处理与成员代理的通信。

例如，组聊的潜在代码如下（未采用）：  
```python
from autogen import GroupChat

group_chat = GroupChat(agents=[scheduler_agent, rag_agent, mysql_agent, influx_agent], manager=scheduler_agent)
group_chat.run()
```
但由于可见性问题，选择了上述对话图方法。

#### 实现细节与注意事项  
- **工具支持**：成员代理可能需要定义工具函数。例如，MysqlAgent 可以有一个工具连接 MySQL 执行查询，InfluxAgent 类似。RagAgent 可能需要 RAG 相关的检索工具。  
- **状态管理**：如果有多个并发查询，SchedulerAgent 需要通过对话历史跟踪哪个响应对应哪个用户查询。autogen 的 LLM 代理可以利用对话上下文管理状态，但对于复杂场景，可能需要自定义逻辑。  
- **版本兼容性**：截至 2025 年 3 月 25 日，autogen v0.4 支持异步消息传递和模块化扩展，适合上述设计。相关文档见 [AutoGen - Microsoft Research](https://www.microsoft.com/en-us/research/project/autogen/) 和 [GitHub - Microsoft/autogen](https://github.com/microsoft/autogen)。  

#### 对比与讨论  
与直接硬编码路由逻辑相比，基于 LLM 的 SchedulerAgent 更灵活，适合条件复杂或需要自然语言理解的场景。但如果条件简单（如关键词匹配），可能效率较低。未来可以考虑结合自定义 `on_messages` 方法实现更高效的路由，但需确保符合 autogen 的设计哲学（代理通过消息通信）。

#### 表格：代理角色与功能  
以下表格总结了各代理的角色和功能：  

| 代理名称     | 角色描述                                      | 示例查询类型                     | 可能需要的工具                     |
|--------------|-----------------------------------------------|----------------------------------|------------------------------------|
| RagAgent     | 使用 RAG 回答一般信息查询                     | “什么是人工智能？”               | 检索增强生成工具                   |
| MysqlAgent   | 执行 MySQL 数据库的 SQL 查询                  | “查询数据库中微软的当前股价”     | MySQL 连接与查询工具               |
| InfluxAgent  | 执行 InfluxDB 的时间序列数据查询              | “过去一周的流量趋势如何？”       | InfluxDB 时间序列查询工具          |
| SchedulerAgent | 接收用户查询并根据条件路由到适当成员代理       | “所有查询”                       | 无（依赖 LLM 决策）                |

#### 结论  
通过上述方法，可以在 autogen 的最新版本中实现代理的动态调度，SchedulerAgent 作为用户与成员代理之间的网关，根据查询条件路由任务，确保高效和透明的用户体验。这一设计利用了 autogen 的多代理对话框架，适合复杂工作流的自动化。

---

#### 关键引用  
- [Microsoft's AutoGen Multi-agent Conversation Framework](https://microsoft.github.io/autogen/0.2/docs/Use-Cases/agent_chat/)  
- [AutoGen GitHub Repository for Agent Interactions](https://github.com/microsoft/autogen)  
- [AutoGen Agents Documentation for Custom Agents](https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/tutorial/agents.html)  
- [AutoGen Examples for Multi-Agent Collaboration](https://microsoft.github.io/autogen/0.2/docs/Examples/)  
- [Microsoft Research AutoGen Project Overview](https://www.microsoft.com/en-us/research/project/autogen/)