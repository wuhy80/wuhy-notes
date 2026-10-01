---
🌻日期🌻: 2025-03-18
🌙星期🌙: 星期二
⌚️时间⌚️: 14:42:48
tags:
  - 大模型/AutoGen
  - 大模型/Agent
  - 代码示例
aliases:
  - AutoGen流式输出
---

# Agent 如何支持调用 Stream 模式的客户端

本文展示如何在 AutoGen 中启用流式输出（Streaming）模式，实现实时响应。

## 关键配置

启用流式模式需要在 `model_info` 中设置 `stream: True`，并在创建 Agent 时设置 `model_client_stream=True`。

## 代码示例

```python
import asyncio
from autogen_agentchat.agents import AssistantAgent
from autogen_ext.models.openai import OpenAIChatCompletionClient
from src.config.config import config
from autogen_core.models import ModelFamily

model_name = config.get('MODEL_NAME', 'deepseek-chat')
model_endpoint = config.get('MODEL_ENDPOINT', 'https://api.deepseek.com')
api_key = config.get('DEEPSEEK_API_KEY', '')
model_info={
    "vision": False,
    "function_calling": True,
    "json_output": False,
    "family": ModelFamily.R1,
    "structured_output": True,
    "stream": True  # 关键参数，启用流式模式
}

async def main() -> None:
    model_client = OpenAIChatCompletionClient(model=model_name, api_key=api_key, base_url=model_endpoint, model_info=model_info)
    agent = AssistantAgent("assistant", model_client=model_client, model_client_stream=True)
    # print(await agent.run_stream(task="Say 'Hello World!'"))

    async for token in agent.run_stream(task="Say 'Hello World!'"):
        print(token, end="", flush=True)  # 实时刷新输出

    await model_client.close()

asyncio.run(main())
```

## 关键点说明

1. **model_info 配置**：设置 `"stream": True` 启用流式能力
2. **Agent 创建**：设置 `model_client_stream=True` 启用流式模式
3. **流式输出**：使用 `async for` 遍历 `run_stream()` 返回的 token

## 相关笔记

- [[大模型/09-Agent/AutoGen|AutoGen 框架总览]]
- [[大模型/02-应用开发/AutoGen/Agent调度/AutoGen自动进行Agent调用判断|SelectorGroupChat代码示例]]