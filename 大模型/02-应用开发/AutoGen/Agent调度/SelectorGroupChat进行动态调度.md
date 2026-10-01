---
🌻日期🌻: 2025-03-25
🌙星期🌙: 星期二
⌚️时间⌚️: 17:09:24
tags:
  - 大模型/AutoGen
  - 大模型/Agent
  - Agent调度
aliases:
  - SelectorGroupChat示例
---

# SelectorGroupChat 进行动态调度

本文记录使用 `SelectorGroupChat` 实现多 Agent 动态调度的运行日志，展示 Coordinator、MySQL Agent 和 InfluxDB Agent 之间的协作过程。

> [!note] 主题关联
> 这篇日志更适合作为“多 Agent 工作流的运行侧案例”阅读，可结合 [[大模型/08-个体重构/05-案例观察/智能工作台中的多Agent工作流实践]] 一起看。

## 运行环境

- **调度模式**：SelectorGroupChat
- **参与 Agent**：Coordinator、MySQL_Agent、InfluxDB_Agent
- **大模型**：通过 OpenRouter 调用 gemini-2.0-flash-exp

## 运行日志

```plaintext
05:07:11  |base| root@master-one wanxiang_mcp_server → python -m src.agent.mysql_agent1
2025-03-25 17:07:18,219 - src.config.config - INFO - Configuration loaded: {'MODEL_NAME': 'deepseek-chat', 'MODEL_ENDPOINT': 'https://api.deepseek.com', 'DEEPSEEK_API_KEY': '********', 'MYSQL_HOST': '192.0.2.201', 'MYSQL_PORT': '30002', 'MYSQL_USER': 'zeusroot', 'MYSQL_PASSWORD': '********', 'MYSQL_DATABASE': 'zhanwan_test', 'INFLUXDB_HOST': 'localhost', 'INFLUXDB_PORT': '8086', 'INFLUXDB_USER': 'user', 'INFLUXDB_PASSWORD': '********', 'INFLUXDB_DATABASE': 'my-bucket', 'DEBUG': True}
Processing user query: 从表rfid_infos里面查看最后一条记录里面的match_device_measurements是使用','分割的measurement列表。在influx里面对应measurement的值信息，根据first_rcd_time和180秒时长进行查询
[03/25/25 17:07:18] INFO     Processing request of type ListToolsRequest                                                                                                                               server.py:536
MySQL tools fetched successfully
MySQL Agent created successfully
[03/25/25 17:07:19] INFO     Processing request of type ListToolsRequest                                                                                                                               server.py:536
InfluxDB tools fetched successfully
InfluxDB Agent created successfully
Coordinator Agent created successfully
All agents created: User, Coordinator, MySQL_Agent, InfluxDB_Agent
Selected round-robin workflow (SelectorGroupChat)
Starting team task execution...
2025-03-25 17:07:20,875 - httpx - INFO - HTTP Request: POST https://openrouter.ai/api/v1/chat/completions "HTTP/1.1 200 OK"
/root/miniconda3/lib/python3.12/site-packages/autogen_agentchat/teams/_group_chat/_selector_group_chat.py:169: UserWarning: Resolved model mismatch: google/gemini-2.0-flash-exp:free != google/gemini-2.0-flash-exp. Model mapping in autogen_ext.models.openai may be incorrect. Set the model to google/gemini-2.0-flash-exp to enhance token/cost estimation and suppress this warning.
  response = await self._model_client.create(messages=select_speaker_messages)
---------- user ----------
从表rfid_infos里面查看最后一条记录里面的match_device_measurements是使用','分割的measurement列表。在influx里面对应measurement的值信息，根据first_rcd_time和180秒时长进行查询
2025-03-25 17:07:22,506 - httpx - INFO - HTTP Request: POST https://openrouter.ai/api/v1/chat/completions "HTTP/1.1 200 OK"
---------- Coordinator ----------
好的，这个查询需要结合 MySQL 和 InfluxDB。

**步骤 1: 分析查询并确定所需数据库**

*   需要从 MySQL 的 `rfid_infos` 表中获取 `match_device_measurements` 和 `first_rcd_time`。
*   需要使用从 MySQL 获取的 `match_device_measurements` 和 `first_rcd_time` 在 InfluxDB 中查询数据。

因此，需要同时使用 MySQL 和 InfluxDB。

**步骤 2: 指导 MySQL Agent**

请 MySQL Agent 执行以下操作：

1.  从 `rfid_infos` 表中检索最后一条记录。
2.  提取 `match_device_measurements` 的值，并按照 `,` 分割成 measurement 列表。
3.  提取 `first_rcd_time` 的值。
4.  将提取的 measurement 列表和 `first_rcd_time`  返回给我。

```sql
SELECT match_device_measurements, first_rcd_time FROM rfid_infos ORDER BY id DESC LIMIT 1;
```

2025-03-25 17:07:24,719 - httpx - INFO - HTTP Request: POST https://openrouter.ai/api/v1/chat/completions "HTTP/1.1 200 OK"
2025-03-25 17:07:25,680 - httpx - INFO - HTTP Request: POST https://openrouter.ai/api/v1/chat/completions "HTTP/1.1 200 OK"
---------- MySQL_Agent ----------
好的，我现在就执行 MySQL 查询，并将结果返回给你。

---------- MySQL_Agent ----------
[FunctionCall(id='tool_0_execute_query', arguments='{"input":{"query":"\\nSELECT match_device_measurements, first_rcd_time FROM rfid_infos ORDER BY id DESC LIMIT 1;\\n"}}', name='execute_query')]
[03/25/25 17:07:27] INFO     Processing request of type CallToolRequest                                                                                                                                server.py:536
                    INFO     Warning: RuntimeWarning: coroutine 'ServerSession.send_log_message' was never awaited                                                                                     server.py:526
---------- MySQL_Agent ----------
[FunctionExecutionResult(content="[TextContent(type='text', text='match_device_measurements | first_rcd_time     \\n88                        | 2025-03-19 15:03:58', annotations=None)]", name='execute_query', call_id='tool_0_execute_query', is_error=False)]
2025-03-25 17:07:28,216 - httpx - INFO - HTTP Request: POST https://openrouter.ai/api/v1/chat/completions "HTTP/1.1 200 OK"
---------- MySQL_Agent ----------
我已经从 MySQL 中获取了所需的信息。

*   `match_device_measurements`: "88" (假设这就是分割后的 measurement 列表，虽然只有一个元素)
*   `first_rcd_time`: "2025-03-19 15:03:58"

**步骤 3: 指导 InfluxDB Agent**

请 InfluxDB Agent 执行以下操作：

1.  使用 `match_device_measurements` 列表中的每个 measurement。
2.  将 `first_rcd_time` 转换为 UTC 时间。
3.  构建 InfluxQL 查询，查询从 `first_rcd_time` 开始的 180 秒内的数据。

请注意，由于 `match_device_measurements` 只有一个元素 "88"，我将只为这一个 measurement 构建查询。

**构建 InfluxQL 查询:**

由于MySQL是+8时区的,Influx是UTC时区的,所以需要将时间减去8小时
1.  将 '2025-03-19 15:03:58' 转换成时间戳 '2025-03-19 07:03:58'

```influxql
SELECT * FROM "88" WHERE time >= '2025-03-19 07:03:58' and time <= '2025-03-19 07:06:58'
```

请 InfluxDB Agent 执行此查询。

2025-03-25 17:07:30,945 - httpx - INFO - HTTP Request: POST https://openrouter.ai/api/v1/chat/completions "HTTP/1.1 200 OK"
/root/miniconda3/lib/python3.12/site-packages/autogen_agentchat/teams/_group_chat/_selector_group_chat.py:169: UserWarning: Resolved model mismatch: google/gemini-2.0-flash-exp:free != google/gemini-2.0-flash-exp. Model mapping in autogen_ext.models.openai may be incorrect. Set the model to google/gemini-2.0-flash-exp to enhance token/cost estimation and suppress this warning.
  response = await self._model_client.create(messages=select_speaker_messages)
2025-03-25 17:07:31,981 - httpx - INFO - HTTP Request: POST https://openrouter.ai/api/v1/chat/completions "HTTP/1.1 200 OK"
---------- InfluxDB_Agent ----------
[FunctionCall(id='tool_0_execute_query', arguments='{"input":{"limit":"100","query":"SELECT * FROM \\"88\\" WHERE time >= \'2025-03-19 07:03:58\' and time <= \'2025-03-19 07:06:58\'"}}', name='execute_query')]
[03/25/25 17:07:34] INFO     Processing request of type CallToolRequest                                                                                                                                server.py:536
                    INFO     Warning: RuntimeWarning: coroutine 'ServerSession.send_log_message' was never awaited                                                                                     server.py:526
---------- InfluxDB_Agent ----------
[FunctionExecutionResult(content="[TextContent(type='text', text='time | compID | operationValue | value\\n2025-03-19T07:03:59Z | 0013 | 属性1-6 | 673\\n2025-03-19T07:03:59Z | 0013 | 属性1-6关键 | 635\\n2025-03-19T07:04:01Z | 0013 | 属性1-6 | 653\\n2025-03-19T07:04:01Z | 0013 | 属性1-6关键 | 622\\n2025-03-19T07:04:03Z | 0013 | 属性1-6 | 694\\n2025-03-19T07:04:03Z | 0013 | 属性1-6关键 | 618\\n2025-03-19T07:04:05Z | 0013 | 属性1-6 | 651\\n2025-03-19T07:04:05Z | 0013 | 属性1-6关键 | 603\\n2025-03-19T07:04:07Z | 0013 | 属性1-6 | 673\\n2025-03-19T07:04:07Z | 0013 | 属性1-6关键 | 616\\n2025-03-19T07:04:09Z | 0013 | 属性1-6 | 637\\n2025-03-19T07:04:09Z | 0013 | 属性1-6关键 | 676\\n2025-03-19T07:04:11Z | 0013 | 属性1-6 | 673\\n2025-03-19T07:04:11Z | 0013 | 属性1-6关键 | 664\\n2025-03-19T07:04:13Z | 0013 | 属性1-6 | 621\\n2025-03-19T07:04:13Z | 0013 | 属性1-6关键 | 640\\n2025-03-19T07:04:15Z | 0013 | 属性1-6 | 618\\n2025-03-19T07:04:15Z | 0013 | 属性1-6关键 | 665\\n2025-03-19T07:04:17Z | 0013 | 属性1-6 | 615\\n2025-03-19T07:04:17Z | 0013 | 属性1-6关键 | 685\\n2025-03-19T07:04:19Z | 0013 | 属性1-6 | 619\\n2025-03-19T07:04:19Z | 0013 | 属性1-6关键 | 629\\n2025-03-19T07:04:21Z | 0013 | 属性1-6 | 634\\n2025-03-19T07:04:21Z | 0013 | 属性1-6关键 | 605\\n2025-03-19T07:04:23Z | 0013 | 属性1-6 | 682\\n2025-03-19T07:04:23Z | 0013 | 属性1-6关键 | 617\\n2025-03-19T07:04:25Z | 0013 | 属性1-6 | 686\\n2025-03-19T07:04:25Z | 0013 | 属性1-6关键 | 656\\n2025-03-19T07:04:27Z | 0013 | 属性1-6 | 679\\n2025-03-19T07:04:27Z | 0013 | 属性1-6关键 | 615\\n2025-03-19T07:04:29Z | 0013 | 属性1-6 | 667\\n2025-03-19T07:04:29Z | 0013 | 属性1-6关键 | 669\\n2025-03-19T07:04:31Z | 0013 | 属性1-6 | 645\\n2025-03-19T07:04:31Z | 0013 | 属性1-6关键 | 634\\n2025-03-19T07:04:33Z | 0013 | 属性1-6 | 623\\n2025-03-19T07:04:33Z | 0013 | 属性1-6关键 | 617\\n2025-03-19T07:04:35Z | 0013 | 属性1-6 | 630\\n2025-03-19T07:04:35Z | 0013 | 属性1-6关键 | 651\\n2025-03-19T07:04:37Z | 0013 | 属性1-6 | 607\\n2025-03-19T07:04:37Z | 0013 | 属性1-6关键 | 652\\n2025-03-19T07:04:39Z | 0013 | 属性1-6 | 646\\n2025-03-19T07:04:39Z | 0013 | 属性1-6关键 | 602\\n2025-03-19T07:04:41Z | 0013 | 属性1-6 | 627\\n2025-03-19T07:04:41Z | 0013 | 属性1-6关键 | 605\\n2025-03-19T07:04:43Z | 0013 | 属性1-6 | 614\\n2025-03-19T07:04:43Z | 0013 | 属性1-6关键 | 663\\n2025-03-19T07:04:45Z | 0013 | 属性1-6 | 638\\n2025-03-19T07:04:45Z | 0013 | 属性1-6关键 | 655\\n2025-03-19T07:04:47Z | 0013 | 属性1-6 | 620\\n2025-03-19T07:04:47Z | 0013 | 属性1-6关键 | 651\\n2025-03-19T07:04:49Z | 0013 | 属性1-6 | 623\\n2025-03-19T07:04:49Z | 0013 | 属性1-6关键 | 661\\n2025-03-19T07:04:51Z | 0013 | 属性1-6 | 612\\n2025-03-19T07:04:51Z | 0013 | 属性1-6关键 | 657\\n2025-03-19T07:04:53Z | 0013 | 属性1-6 | 668\\n2025-03-19T07:04:53Z | 0013 | 属性1-6关键 | 674\\n2025-03-19T07:04:55Z | 0013 | 属性1-6 | 665\\n2025-03-19T07:04:55Z | 0013 | 属性1-6关键 | 627\\n2025-03-19T07:04:57Z | 0013 | 属性1-6 | 655\\n2025-03-19T07:04:57Z | 0013 | 属性1-6关键 | 677\\n2025-03-19T07:04:59Z | 0013 | 属性1-6 | 684\\n2025-03-19T07:04:59Z | 0013 | 属性1-6关键 | 686\\n2025-03-19T07:05:01Z | 0013 | 属性1-6 | 645\\n2025-03-19T07:05:01Z | 0013 | 属性1-6关键 | 680\\n2025-03-19T07:05:03Z | 0013 | 属性1-6 | 695\\n2025-03-19T07:05:03Z | 0013 | 属性1-6关键 | 676', annotations=None)]", name='execute_query', call_id='tool_0_execute_query', is_error=False)]
2025-03-25 17:07:34,658 - httpx - INFO - HTTP Request: POST https://openrouter.ai/api/v1/chat/completions "HTTP/1.1 200 OK"
---------- InfluxDB_Agent ----------
我从 InfluxDB 获取了 `88` measurement 在 `2025-03-19 07:03:58` 和 `2025-03-19 07:06:58` 之间的数据，以下是查询结果：

```
time                | compID | operationValue | value
--------------------|--------|----------------|-------
2025-03-19T07:03:59Z | 0013   | 属性1-6          | 673
2025-03-19T07:03:59Z | 0013   | 属性1-6关键       | 635
2025-03-19T07:04:01Z | 0013   | 属性1-6          | 653
2025-03-19T07:04:01Z | 0013   | 属性1-6关键       | 622
2025-03-19T07:04:03Z | 0013   | 属性1-6          | 694
... (more data points) ...
```

结果显示了从2025-03-19 07:03:59Z开始，在指定时间范围内，measurement `88` 中 `compID` 为 `0013` 的 `属性1-6` 和 `属性1-6关键` 的 `value` 值。时间戳精确到纳秒。

TERMINATE

2025-03-25 17:07:37,816 - httpx - INFO - HTTP Request: POST https://openrouter.ai/api/v1/chat/completions "HTTP/1.1 200 OK"
/root/miniconda3/lib/python3.12/site-packages/autogen_agentchat/teams/_group_chat/_selector_group_chat.py:169: UserWarning: Resolved model mismatch: google/gemini-2.0-flash-exp:free != google/gemini-2.0-flash-exp. Model mapping in autogen_ext.models.openai may be incorrect. Set the model to google/gemini-2.0-flash-exp to enhance token/cost estimation and suppress this warning.
  response = await self._model_client.create(messages=select_speaker_messages)
2025-03-25 17:07:38,816 - httpx - INFO - HTTP Request: POST https://openrouter.ai/api/v1/chat/completions "HTTP/1.1 200 OK"
2025-03-25 17:07:39,323 - autogen_core - ERROR - Error processing publish message for Coordinator_dbe1c424-0877-4341-ae63-4f352dabbe82/dbe1c424-0877-4341-ae63-4f352dabbe82
Traceback (most recent call last):
  File "/root/miniconda3/lib/python3.12/site-packages/autogen_core/_single_threaded_agent_runtime.py", line 510, in _on_message
    return await agent.on_message(
           ^^^^^^^^^^^^^^^^^^^^^^^
  File "/root/miniconda3/lib/python3.12/site-packages/autogen_core/_base_agent.py", line 113, in on_message
    return await self.on_message_impl(message, ctx)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/root/miniconda3/lib/python3.12/site-packages/autogen_agentchat/teams/_group_chat/_sequential_routed_agent.py", line 67, in on_message_impl
    return await super().on_message_impl(message, ctx)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/root/miniconda3/lib/python3.12/site-packages/autogen_core/_routed_agent.py", line 485, in on_message_impl
    return await h(self, message, ctx)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/root/miniconda3/lib/python3.12/site-packages/autogen_core/_routed_agent.py", line 268, in wrapper
    return_value = await func(self, message, ctx)  # type: ignore
                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/root/miniconda3/lib/python3.12/site-packages/autogen_agentchat/teams/_group_chat/_chat_agent_container.py", line 69, in handle_request
    async for msg in self._agent.on_messages_stream(self._message_buffer, ctx.cancellation_token):
  File "/root/miniconda3/lib/python3.12/site-packages/autogen_agentchat/agents/_assistant_agent.py", line 748, in on_messages_stream
    async for inference_output in self._call_llm(
  File "/root/miniconda3/lib/python3.12/site-packages/autogen_agentchat/agents/_assistant_agent.py", line 857, in _call_llm
    async for chunk in model_client.create_stream(
  File "/root/miniconda3/lib/python3.12/site-packages/autogen_ext/models/openai/_openai_client.py", line 754, in create_stream
    async for chunk in chunks:
  File "/root/miniconda3/lib/python3.12/site-packages/autogen_ext/models/openai/_openai_client.py", line 921, in _create_stream_chunks
    chunk = await chunk_future
            ^^^^^^^^^^^^^^^^^^
  File "/root/miniconda3/lib/python3.12/site-packages/openai/_streaming.py", line 144, in __anext__
    return await self._iterator.__anext__()
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/root/miniconda3/lib/python3.12/site-packages/openai/_streaming.py", line 174, in __stream__
    raise APIError(
openai.APIError: Rate limit exceeded: free-models-per-min
Error processing query: Rate limit exceeded: free-models-per-min
Query failed: Failed to process query: Rate limit exceeded: free-models-per-min
05:07:39  |base|root@master-one wanxiang_mcp_server →
```

## 问题分析

本次运行遇到了 **Rate Limit** 错误，这是因为使用了 OpenRouter 的免费模型配额，请求频率超过了限制。

### 解决方案

1. **使用付费 API**：避免免费配额的限制
2. **添加请求间隔**：在多次 API 调用之间添加延时
3. **使用本地模型**：通过 Ollama 部署本地大模型

## 相关笔记

- [[大模型/02-应用开发/AutoGen/Agent调度/AutoGen自动进行Agent调用判断|AutoGen自动Agent调用判断]]
- [[大模型/09-Agent/AutoGen|AutoGen 框架总览]]
