---
🌻日期🌻: 2025-03-18
🌙星期🌙: 星期二
⌚️时间⌚️: 14:42:48
tags: 
---

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

