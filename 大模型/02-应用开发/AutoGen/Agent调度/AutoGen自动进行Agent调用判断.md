---
🌻日期🌻: 2025-03-25
🌙星期🌙: 星期二
⌚️时间⌚️: 15:41:26
tags:
  - 大模型/AutoGen
  - 大模型/Agent
  - Agent调度
  - 代码示例
aliases:
  - SelectorGroupChat代码示例
---

# AutoGen 自动进行 Agent 调用判断

本文展示使用 `SelectorGroupChat` 实现多 Agent 自动调度的完整代码示例，包括 Coordinator、MySQL Agent 和 InfluxDB Agent 的协作。

> [!note] 主题关联
> 如果从“AI 如何进入真实工作流”的角度看，这篇笔记可以和 [[大模型/08-个体重构/05-案例观察/智能工作台中的多Agent工作流实践]]、[[大模型/08-个体重构/02-工作流重构/MCP、RAG 与 Agent 在个体重构中的位置]] 一起阅读。

## 代码说明

主要使用 `SelectorGroupChat` 进行调度。下面的例子包含：
- **Coordinator Agent**：协调整体工作流
- **MySQL Agent**：处理 MySQL 数据库查询
- **InfluxDB Agent**：处理 InfluxDB 时序数据库查询

在选择合适的大模型的情况下，可以很好地完成跨数据库查询任务。

## 完整代码

```python
# -*- coding: utf-8 -*-
import asyncio

# 导入日志模块
from typing import Annotated, Dict, Any, Optional

from autogen_agentchat.agents import AssistantAgent, UserProxyAgent
from autogen_agentchat.base import TaskResult
from autogen_agentchat.conditions import ExternalTermination, TextMentionTermination
from autogen_agentchat.teams import RoundRobinGroupChat, SelectorGroupChat
from autogen_core import CancellationToken
from autogen_ext.tools.mcp import StdioServerParams, SseServerParams, mcp_server_tools
from autogen_agentchat.ui import Console
from src.agent.llm_model import get_model_client_OpenRouter

import logging

logging.getLogger("autogen_core").setLevel(logging.WARNING)
logging.getLogger("autogen_core.events").setLevel(logging.WARNING)

MCP_SERVER_PATH = "/root/code/llmcode/wanxiang_mcp_server/mcp_server"
MYSQL_SCRIPT_PATH = f"{MCP_SERVER_PATH}/mysql/mysql_mcp.py"
INFLUX_SCRIPT_PATH = f"{MCP_SERVER_PATH}/influx/influx_mcp.py"

llm_client = get_model_client_OpenRouter()
is_stream = True


async def get_mysql_agent() -> AssistantAgent:
    """
    创建并返回一个MySQL查询助手agent

    返回:
        AssistantAgent: 一个配置用于与MySQL数据库交互的agent
    """
    try:
        mysql_mcp_server = StdioServerParams(command="python", args=[MYSQL_SCRIPT_PATH])

        # Fetch MCP server tools for MySQL
        tools = await mcp_server_tools(mysql_mcp_server)
        print("MySQL tools fetched successfully")  # 添加打印信息

        # Create MySQL agent
        agent = AssistantAgent(
            name="MySQL_Agent",
            model_client=llm_client,
            model_client_stream=is_stream,
            system_message="""你是一个熟练的MySQL数据库助手
            
你的职责：
1. 理解并分析自然语言查询
2. 将其转换为合适的SQL查询
3. 使用工具在MySQL数据库上执行查询
4. 清晰地返回并解释结果
5. 如果需要与InfluxDB agent共享信息，请明确指出相关数据点
6. 使用InfluxQL InfluxQL语法处理时序数据查询,不要使用Flux语法
7. 注意Mysql是+8时区的,Influx是UTC时区的,需要考虑时区的转换

以下是数据库表结构：
---
CREATE TABLE `rfid_infos`  (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `measurement` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `rfid` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `timestamp` datetime(3) NULL DEFAULT NULL,
  `org_id` bigint(20) NULL DEFAULT NULL,
  `device_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `first_rcd_time` datetime(3) NULL DEFAULT NULL,
  `count` bigint(20) NULL DEFAULT 1,
  `status` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `part_num` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `is_invalid` tinyint(1) NULL DEFAULT 0,
  `match_device_measurements` text CHARACTER SET utf8 COLLATE utf8_general_ci NULL,
  `empty_data_measurements` text CHARACTER SET utf8 COLLATE utf8_general_ci NULL,
  `is_data_filled` tinyint(1) NULL DEFAULT NULL,
  `created_at` datetime(3) NULL DEFAULT NULL,
  `updated_at` datetime(3) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `idx_measurement_rfid_timestamp`(`measurement`, `rfid`, `timestamp`) USING BTREE,
  INDEX `idx_rfid_infos_updated_at`(`updated_at`) USING BTREE,
  INDEX `idx_rfid_infos_created_at`(`created_at`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 360 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;
---
如果用户输入不明确，在生成查询前请先询问澄清问题。
当你完成部分任务时，总结你发现的内容以及还需要完成的工作。

""",
            tools=tools,
            reflect_on_tool_use=True,
        )

        print("MySQL Agent created successfully")  # 添加打印信息
        return agent
    except Exception as e:
        print(f"Failed to create MySQL agent: {str(e)}")  # 添加打印信息
        raise


async def get_influx_agent() -> AssistantAgent:
    """
    创建并返回一个InfluxDB查询助手agent

    返回:
        AssistantAgent: 一个配置用于与InfluxDB时序数据库交互的agent
    """
    try:
        influx_mcp_server = StdioServerParams(
            command="python", args=[INFLUX_SCRIPT_PATH]
        )

        # Fetch MCP server tools for InfluxDB
        tools = await mcp_server_tools(influx_mcp_server)
        print("InfluxDB tools fetched successfully")  # 添加打印信息

        # Create InfluxDB agent
        agent = AssistantAgent(
            name="InfluxDB_Agent",
            model_client=llm_client,
            model_client_stream=is_stream,
            system_message="""你是一个专业的InfluxDB 1.x时序数据库助手
            
你的职责：
1. 使用InfluxQL InfluxQL语法处理时序数据查询,不要使用Flux语法
2. 在对话中查找有关测量值、时间范围和查询参数的信息
3. 如果需要，使用来自MySQL查询的数据进行查询
4. 使用工具在InfluxDB数据库上执行查询
5. 以清晰易懂的格式呈现时序数据
6. 注意Mysql是+8时区的,Influx是UTC时区的,需要考虑时区的转换

如果需要更多信息来形成完整查询，请提出具体问题。
当你完成分析时，总结发现并添加"TERMINATE"以表示任务完成。
""",
            tools=tools,
            reflect_on_tool_use=True,
        )

        print("InfluxDB Agent created successfully")  # 添加打印信息
        return agent
    except Exception as e:
        print(f"Failed to create InfluxDB agent: {str(e)}")  # 添加打印信息
        raise


async def get_coordinator_agent() -> AssistantAgent:
    """
    创建一个协调器agent来管理MySQL和InfluxDB agent之间的工作流

    返回:
        AssistantAgent: 一个协调多数据库工作流的agent
    """
    agent = AssistantAgent(
        name="Coordinator",
        model_client=llm_client,
        model_client_stream=is_stream,
        system_message="""你是一个数据库查询工作流协调器
        
你的工作是：
1. 分析用户查询以确定是否需要MySQL、InfluxDB或两者
2. 将查询定向到适当的agent
3. 确保在需要时将MySQL中找到的数据正确传递给InfluxDB
4. 为用户总结整体结果
5. 当完整工作流完成时添加"TERMINATE"
6. 一定要是已经查询过MysqlAgent和InfluxAgent获得数据后才可以结束,不能够只是分析了下要分别调用这两个Agent就结束
7. 注意Mysql是+8时区的,Influx是UTC时区的,需要考虑时区的转换

对于需要两个数据库的工作流：
- 首先指导MySQL_Agent检索必要信息
- 然后帮助InfluxDB_Agent理解需要哪些来自MySQL的数据进行查询
- 最后将结果编译成连贯的响应
""",
    )
    print("Coordinator Agent created successfully")  # 添加打印信息
    return agent


async def process_user_query(
    user_input: Annotated[str, "用户的自然语言查询"],
) -> Dict[str, Any]:
    """
    使用数据库agent处理用户的自然语言查询

    参数:
        user_input: 来自用户的自然语言查询

    返回:
        包含查询结果和状态信息的字典
    """
    if not user_input.strip():
        print("Empty query provided")  # 添加打印信息
        return {"status": "error", "message": "Empty query provided"}

    try:
        # Create agents
        mysql_agent = await get_mysql_agent()
        influx_agent = await get_influx_agent()
        coordinator = await get_coordinator_agent()
        # user_proxy = UserProxyAgent(name="User")
        print(
            "All agents created: User, Coordinator, MySQL_Agent, InfluxDB_Agent"
        )  # 添加打印信息

        team = SelectorGroupChat(
            participants=[coordinator, mysql_agent, influx_agent],
            model_client=llm_client,
            max_turns=6,
            # termination_condition=TextMentionTermination("TERMINATE"),
        )
        print("Selected round-robin workflow (SelectorGroupChat)")  # 添加打印信息

        # Execute the query workflow
        print("Starting team task execution...")  # 添加打印信息
        if is_stream:
            await Console(
                team.run_stream(task=user_input, cancellation_token=CancellationToken())
            )
        else:
            await team.run(task=user_input, cancellation_token=CancellationToken())
        print("Team task execution completed")  # 添加打印信息

        return {
            "status": "success",
            "message": "Query completed successfully",
        }

    except Exception as e:
        print(f"Error processing query: {str(e)}")  # 添加打印信息
        return {
            "status": "error",
            "message": f"Failed to process query: {str(e)}",
            "result": None,
        }


async def main():
    """示例函数，展示如何使用查询处理器"""
    # Example user input that requires both MySQL and InfluxDB
    # user_query = "从表rfid_infos里面查看最后一条记录里面的measurement在influx里面对应Measurement的值信息，根据first_rcd_time和60秒时长进行查询"
    user_query = "从mysql的表rfid_infos里面查看最后一条记录里面的match_device_measurements是使用','分割的measurement列表。在influx里面对应measurement的值信息，根据first_rcd_time和180秒时长进行查询"

    print(f"Processing user query: {user_query}")

    # Process the query and get results
    result = await process_user_query(user_query)

    # Display the results
    if result["status"] == "success":
        print("Query completed successfully:")
    else:
        print(f"Query failed: {result['message']}")


if __name__ == "__main__":
    asyncio.run(main())

```

## 运行结果

以下是使用 `gemini-2.0-flash-exp` 模型运行的日志：

```plaintext
2025-03-26 09:49:28,316 - src.config.config - INFO - Configuration loaded: {'MODEL_NAME': 'deepseek-chat', 'MODEL_ENDPOINT': 'https://api.deepseek.com', 'DEEPSEEK_API_KEY': '********', 'MYSQL_HOST': '192.0.2.201', 'MYSQL_PORT': '30002', 'MYSQL_USER': 'zeusroot', 'MYSQL_PASSWORD': '********', 'MYSQL_DATABASE': 'zhanwan_test', 'INFLUXDB_HOST': 'localhost', 'INFLUXDB_PORT': '8086', 'INFLUXDB_USER': 'user', 'INFLUXDB_PASSWORD': '********', 'INFLUXDB_DATABASE': 'my-bucket', 'DEBUG': True}
Processing user query: 从mysql的表rfid_infos里面查看最后一条记录里面的match_device_measurements是使用','分割的measurement列表。在influx里面对应measurement的值信息，根据first_rcd_time和180秒时长进行查询
[03/26/25 09:49:29] INFO     Processing request of type ListToolsRequest                                                                                                                               server.py:536
MySQL tools fetched successfully
MySQL Agent created successfully
[03/26/25 09:49:30] INFO     Processing request of type ListToolsRequest                                                                                                                               server.py:536
InfluxDB tools fetched successfully
InfluxDB Agent created successfully
Coordinator Agent created successfully
All agents created: User, Coordinator, MySQL_Agent, InfluxDB_Agent
Selected round-robin workflow (SelectorGroupChat)
Starting team task execution...
2025-03-26 09:49:31,577 - httpx - INFO - HTTP Request: POST https://openrouter.ai/api/v1/chat/completions "HTTP/1.1 200 OK"
---------- user ----------
从mysql的表rfid_infos里面查看最后一条记录里面的match_device_measurements是使用','分割的measurement列表。在influx里面对应measurement的值信息，根据first_rcd_time和180秒时长进行查询
2025-03-26 09:49:32,491 - httpx - INFO - HTTP Request: POST https://openrouter.ai/api/v1/chat/completions "HTTP/1.1 200 OK"
---------- Coordinator ----------
好的，这个任务需要同时查询 MySQL 和 InfluxDB 数据库。我会按照以下步骤进行协调：

**1. 分析用户查询：**

*   需要从 MySQL 的 `rfid_infos` 表中获取最后一条记录的 `match_device_measurements` 字段。
*   `match_device_measurements` 字段是一个以逗号分隔的 measurement 列表。
*   需要使用从 MySQL 获取的 measurement 列表和 `first_rcd_time`，以及 180 秒的时长，在 InfluxDB 中进行查询。
*   需要注意 MySQL 和 InfluxDB 的时区差异（MySQL 是 +8 时区，InfluxDB 是 UTC 时区），做好时区转换。

**2. 确定查询代理：**

*   首先，需要使用 `MySQL_Agent` 查询 MySQL 数据库。
*   然后，需要使用 `InfluxDB_Agent` 查询 InfluxDB 数据库。

**3. 工作流协调：**

1.  **查询 MySQL：** 指示 `MySQL_Agent` 查询 `rfid_infos` 表的最后一条记录，并提取 `match_device_measurements` 和 `first_rcd_time` 字段。
2.  **转换数据格式：**  将 `match_device_measurements` 字符串分割成 measurement 列表。将 `first_rcd_time` 从 `+8` 时区转换为 UTC 时区。
3.  **查询 InfluxDB：**  指示 `InfluxDB_Agent` 使用从 MySQL 获取的 measurement 列表和转换后的 `first_rcd_time`，以及 180 秒的时长，在 InfluxDB 中进行查询。
4.  **整理结果：**  将从 MySQL 和 InfluxDB 获取的结果整理成易于理解的格式。
5.  **总结并返回结果：**  向用户总结整体结果，并添加 "TERMINATE"。

**4. 工作流开始：**

首先，我将调用 `MySQL_Agent` 查询 MySQL 数据库。

```tool_code
mysql_agent.query("SELECT match_device_measurements, first_rcd_time FROM rfid_infos ORDER BY id DESC LIMIT 1;")
```

2025-03-26 09:49:35,483 - httpx - INFO - HTTP Request: POST https://openrouter.ai/api/v1/chat/completions "HTTP/1.1 200 OK"
2025-03-26 09:49:36,362 - httpx - INFO - HTTP Request: POST https://openrouter.ai/api/v1/chat/completions "HTTP/1.1 200 OK"
---------- MySQL_Agent ----------
在执行查询前，我需要明确`limit`参数的具体值。请问你想查看多少行数据？
2025-03-26 09:49:37,355 - httpx - INFO - HTTP Request: POST https://openrouter.ai/api/v1/chat/completions "HTTP/1.1 200 OK"
2025-03-26 09:49:38,189 - httpx - INFO - HTTP Request: POST https://openrouter.ai/api/v1/chat/completions "HTTP/1.1 200 OK"
---------- Coordinator ----------
根据用户的原始查询，目标是获取 *最后一条记录* 的 `match_device_measurements`，因此 `LIMIT 1` 是符合要求的。 确认了`limit`参数的具体值是1
```tool_code
mysql_agent.query("SELECT match_device_measurements, first_rcd_time FROM rfid_infos ORDER BY id DESC LIMIT 1;")
```
2025-03-26 09:49:39,372 - httpx - INFO - HTTP Request: POST https://openrouter.ai/api/v1/chat/completions "HTTP/1.1 200 OK"
2025-03-26 09:49:40,209 - httpx - INFO - HTTP Request: POST https://openrouter.ai/api/v1/chat/completions "HTTP/1.1 200 OK"
---------- MySQL_Agent ----------
为了执行你的请求，我需要将你的自然语言请求转化为SQL查询。 你的请求是"从mysql的表rfid\_infos里面查看最后一条记录里面的match\_device\_measurements是使用','分割的measurement列表。在influx里面对应measurement的值信息，根据first\_rcd\_time和180秒时长进行查询"。

我将执行以下操作：
1. 使用SQL查询从`rfid_infos`表中检索最后一条记录的`match_device_measurements`和`first_rcd_time`。
2. 提取`match_device_measurements`的值，这是一个以逗号分隔的字符串，代表InfluxDB中的measurement列表。
3. 提取`first_rcd_time`的值,这是起始时间，InfluxDB查询需要用到。
4. 构造InfluxDB查询语句，查询在`first_rcd_time`之后的180秒内，所有在`match_device_measurements`列表中指定的measurement的数据。

请注意，因为我无法直接与InfluxDB交互，我需要你提供一个可以执行InfluxDB查询的工具或接口。我会把构造好的measurement列表和带有时区信息的起始、结束时间提供给你，让你去查询InfluxDB。



---------- MySQL_Agent ----------
[FunctionCall(id='tool_0_execute_query', arguments='{"input":{"limit":"1","query":"SELECT match_device_measurements, first_rcd_time FROM rfid_infos ORDER BY id DESC LIMIT 1"}}', name='execute_query')]
[03/26/25 09:49:43] INFO     Processing request of type CallToolRequest                                                                                                                                server.py:536
                    INFO     Warning: RuntimeWarning: coroutine 'ServerSession.send_log_message' was never awaited                                                                                     server.py:526
---------- MySQL_Agent ----------
[FunctionExecutionResult(content="[TextContent(type='text', text='match_device_measurements | first_rcd_time     \\n88                        | 2025-03-19 15:03:58', annotations=None)]", name='execute_query', call_id='tool_0_execute_query', is_error=False)]
2025-03-26 09:49:43,762 - httpx - INFO - HTTP Request: POST https://openrouter.ai/api/v1/chat/completions "HTTP/1.1 200 OK"
---------- MySQL_Agent ----------
从MySQL查询的结果如下：

*   `match_device_measurements`: 88
*   `first_rcd_time`: 2025-03-19 15:03:58

下一步，我需要进行以下操作：

1.  将 `match_device_measurements` 转换为 measurement 列表。  由于当前只有一个 "88"，所以 measurement 列表为 `["88"]`。
2.  将 `first_rcd_time` (2025-03-19 15:03:58 +08:00) 转换为 UTC 时间。 转换后的 UTC 时间为 2025-03-19 07:03:58。
3.  计算结束时间。 结束时间 = `first_rcd_time` (UTC) + 180 秒 = 2025-03-19 07:06:58。
4.  构造 InfluxQL 查询语句。

现在我将构造 InfluxQL 查询语句并提供查询指导。

```tool_code
print(default_api.execute_query(input = {"measurements": "['88']", "start_time": "2025-03-19 07:03:58", "end_time": "2025-03-19 07:06:58"}))
```
2025-03-26 09:49:46,081 - httpx - INFO - HTTP Request: POST https://openrouter.ai/api/v1/chat/completions "HTTP/1.1 200 OK"
2025-03-26 09:49:46,943 - httpx - INFO - HTTP Request: POST https://openrouter.ai/api/v1/chat/completions "HTTP/1.1 200 OK"
---------- InfluxDB_Agent ----------
我无法直接使用`measurements`，`start_time`和`end_time`作为参数。 我需要构造一个InfluxQL查询。请提供limit参数的值

---------- InfluxDB_Agent ----------
[FunctionCall(id='tool_0_execute_query', arguments='{"input":{"limit":"10","query":"SELECT * FROM \\"88\\" WHERE time >= \'2025-03-19T07:03:58Z\' AND time <= \'2025-03-19T07:06:58Z\'"}}', name='execute_query')]
[03/26/25 09:49:49] INFO     Processing request of type CallToolRequest                                                                                                                                server.py:536
                    INFO     Warning: RuntimeWarning: coroutine 'ServerSession.send_log_message' was never awaited                                                                                     server.py:526
---------- InfluxDB_Agent ----------
[FunctionExecutionResult(content="[TextContent(type='text', text='time | compID | operationValue | value\\n2025-03-19T07:03:59Z | 0013 | 属性1-6 | 673\\n2025-03-19T07:03:59Z | 0013 | 属性1-6关键 | 635\\n2025-03-19T07:04:01Z | 0013 | 属性1-6 | 653\\n2025-03-19T07:04:01Z | 0013 | 属性1-6关键 | 622\\n2025-03-19T07:04:03Z | 0013 | 属性1-6 | 694\\n2025-03-19T07:04:03Z | 0013 | 属性1-6关键 | 618\\n2025-03-19T07:04:05Z | 0013 | 属性1-6 | 651\\n2025-03-19T07:04:05Z | 0013 | 属性1-6关键 | 603\\n2025-03-19T07:04:07Z | 0013 | 属性1-6 | 673\\n2025-03-19T07:04:07Z | 0013 | 属性1-6关键 | 616', annotations=None)]", name='execute_query', call_id='tool_0_execute_query', is_error=False)]
2025-03-26 09:49:49,685 - httpx - INFO - HTTP Request: POST https://openrouter.ai/api/v1/chat/completions "HTTP/1.1 200 OK"
---------- InfluxDB_Agent ----------
从 MySQL 获取的 measurement 是 "88"，对应 InfluxDB 中的 measurement 名称为 "88"。
从 MySQL 获取的 `first_rcd_time` 是 2025-03-19 15:03:58 (+08:00)，转换为 UTC 时间是 2025-03-19 07:03:58。
查询时间范围为 `first_rcd_time` (UTC) 到 `first_rcd_time` (UTC) + 180 秒，即 2025-03-19 07:03:58 到 2025-03-19 07:06:58。

在 InfluxDB 的 "88" measurement 中，查询了时间在 2025-03-19 07:03:58 到 2025-03-19 07:06:58 之间的数据,返回前10条数据。
查询结果显示了每个数据点的时间、`compID`、`operationValue` 和 `value`。

TERMINATE

2025-03-26 09:49:51,683 - httpx - INFO - HTTP Request: POST https://openrouter.ai/api/v1/chat/completions "HTTP/1.1 200 OK"
2025-03-26 09:49:52,667 - httpx - INFO - HTTP Request: POST https://openrouter.ai/api/v1/chat/completions "HTTP/1.1 200 OK"
---------- Coordinator ----------
好的，非常清晰。你已经完成了以下步骤：

1.  从 MySQL 获取了数据，包括 `match_device_measurements` 和 `first_rcd_time`。
2.  转换了数据格式，包括将 `match_device_measurements` 转换为 measurement 列表，并将 `first_rcd_time` 转换为 UTC 时间。
3.  构建了 InfluxQL 查询语句。
4.  使用查询语句查询了 InfluxDB。
5.  总结了查询结果。

由于你已经完成了整个工作流程，我现在添加 "TERMINATE"。

TERMINATE

Team task execution completed
Query completed successfully:
09:49:54  |base|root@master-one wanxiang_mcp_server →
```

## 运行分析

从日志可以看出 `SelectorGroupChat` 的工作流程：

1. **Coordinator 分析任务**：识别需要同时查询 MySQL 和 InfluxDB
2. **MySQL Agent 执行查询**：获取 `match_device_measurements` 和 `first_rcd_time`
3. **时区转换**：将 MySQL 的 +8 时区时间转换为 InfluxDB 的 UTC 时间
4. **InfluxDB Agent 执行查询**：根据转换后的时间范围查询数据
5. **Coordinator 总结结果**：整合两个数据库的查询结果

## 关键配置

```python
team = SelectorGroupChat(
    participants=[coordinator, mysql_agent, influx_agent],
    model_client=llm_client,
    max_turns=6,  # 最大轮次限制
)
```

## 相关笔记

- [[大模型/02-应用开发/AutoGen/Agent调度/SelectorGroupChat进行动态调度|SelectorGroupChat运行日志]]
- [[大模型/09-Agent/AutoGen|AutoGen 框架总览]]
