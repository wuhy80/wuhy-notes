---
🌻日期🌻: 2025-03-26
🌙星期🌙: 星期三
⌚️时间⌚️: 21:13:00
tags:
  - 大模型/AutoGen
  - 大模型/Agent
  - Function-Calling
  - 解决方案
aliases:
  - Function Call适配方案
  - AutoGen模型适配
---

# 如何让不支持 Function Call 的模型被 AutoGen 使用

可以让 **AutoGen** 使用**不支持原生 Function Calling 的模型**（如 LLaMA-3、QWQ-32B 等），但需要通过一些技巧适配。以下是具体方法和步骤。

## 方法概览

| 方法 | 适用场景 | 是否需要修改模型 | 实现难度 |
|------|----------|----------------|----------|
| **Prompt Engineering** | 快速测试、轻量级任务 | 否 | 中等 |
| **LangChain 中间层** | 复杂任务、多工具调用 | 否 | 较高 |
| **微调模型** | 长期稳定使用 | 是 | 高 |

---

## 方法 1：通过 Prompt Engineering 模拟 Function Calling

**原理**：通过设计特定的系统提示词（System Prompt），让模型生成结构化输出（如 JSON），再通过 AutoGen 的后处理解析并执行函数。

### 实现步骤

#### 1. 定义自定义的代理（Agent）

```python
from autogen import AssistantAgent, UserProxyAgent
import json
import re

# 自定义解析函数
def parse_function_call(response):
    # 使用正则表达式提取 JSON 结构
    pattern = r'```json\n(.*?)\n```'
    match = re.search(pattern, response, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except:
            return None
    return None

# 自定义 LLM 配置（假设你的模型不支持 function_call）
llm_config = {
    "model": "your_model",  # 如 QWQ-32B、LLaMA-3
    "messages": [],
    "functions": [  # 定义可用的函数（即使模型不支持，AutoGen 仍会检查）
        {
            "name": "get_weather",
            "description": "获取某地的天气信息",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {"type": "string", "description": "城市名称"}
                },
                "required": ["location"]
            }
        }
    ],
    "request_timeout": 600,
}

# 自定义代理，覆盖 `generate_reply` 方法
class CustomAssistantAgent(AssistantAgent):
    def generate_reply(self, messages, sender, **kwargs):
        # 1. 构造提示词，引导模型返回 JSON
        prompt = """
        你是一个支持工具调用的 AI。如果用户的问题需要调用外部工具，请按以下格式返回：
        ```json
        {"function": "函数名", "arguments": {"参数1": "值1", "参数2": "值2"}}
        ```
        当前可用工具：
        - get_weather(location: str): 查询天气
        - text2sql(query: str): 将自然语言转为 SQL

        用户问题：{user_input}
        """.format(user_input=messages[-1]["content"])

        # 2. 调用模型（假设 `your_model` 是一个 HuggingFace/本地模型）
        response = your_model.generate(prompt)  # 替换为你的模型调用方式

        # 3. 解析返回的 JSON
        function_call = parse_function_call(response)
        if function_call:
            return {
                "function_call": {
                    "name": function_call["function"],
                    "arguments": json.dumps(function_call["arguments"])
                }
            }
        else:
            return {"content": response}  # 普通回复

# 创建代理
assistant = CustomAssistantAgent("assistant", llm_config=llm_config)
user_proxy = UserProxyAgent("user_proxy", human_input_mode="ALWAYS")

# 注册可执行函数
def get_weather(location):
    return f"{location} 的天气是晴天，25°C。"

user_proxy.register_function(
    function_map={
        "get_weather": get_weather,
    }
)

# 测试
user_proxy.initiate_chat(assistant, message="查询北京的天气")
```

### 适用场景

> [!success] 优点
> - **轻量级适配**，适用于模型本身不支持 Function Calling，但能理解结构化输出（如 JSON）
> - 希望**低成本快速集成** AutoGen，而不修改模型本身

> [!warning] 局限性
> - 依赖模型的**指令遵循能力**（如果模型不按格式返回，可能失败）
> - 需要手动解析输出，**无法像 OpenAI 那样自动触发函数**

---

## 方法 2：使用 LangChain 作为中间层

**原理**：让 LangChain 处理 Function Calling 逻辑，AutoGen 仅负责对话管理。

### 实现步骤

```python
from autogen import UserProxyAgent, AssistantAgent
from langchain.agents import initialize_agent
from langchain.tools import Tool

# 1. 定义 LangChain 可调用的工具
def get_weather(location: str) -> str:
    return f"{location} 的天气是晴天，25°C。"

tools = [
    Tool(
        name="get_weather",
        func=get_weather,
        description="查询某地的天气信息，输入应为城市名称。"
    )
]

# 2. 初始化 LangChain Agent（假设你的模型是 HuggingFacePipeline）
from langchain.llms import HuggingFacePipeline
from langchain.agents import AgentType

llm = HuggingFacePipeline.from_model_id(
    model_id="your-model",  # 如 QWQ-32B
    task="text-generation"
)

agent = initialize_agent(
    tools,
    llm,
    agent=AgentType.STRUCTURED_CHAT_ZERO_SHOT_REACT_DESCRIPTION,
    verbose=True
)

# 3. 在 AutoGen 中调用 LangChain
def ask_langchain(query):
    return agent.run(query)

# 4. 创建 AutoGen 代理
assistant = AssistantAgent(
    name="assistant",
    system_message="你是一个助手，可以调用工具查询信息。",
    llm_config={"tools": ["get_weather"]},
)

user_proxy = UserProxyAgent(
    name="user_proxy",
    human_input_mode="ALWAYS",
    function_map={"ask_langchain": ask_langchain},  # 注册 LangChain 调用
)

# 5. 测试
user_proxy.initiate_chat(assistant, message="查询北京的天气")
```

### 适用场景

> [!success] 优点
> - **适用于复杂任务**，如需要多工具组合调用（如先查天气，再计算行程）
> - 希望利用 LangChain 的 **ReAct 或 Plan-and-Execute** 策略

> [!warning] 局限性
> - 需要额外依赖 LangChain，**架构更复杂**
> - **性能开销较大**（LangChain 会增加额外解析步骤）

---

## 方法 3：微调模型使其支持 Function Calling

如果长期使用，可以**微调你的模型**（如 QWQ-32B）使其直接支持 Function Calling。

### 步骤
1. **构建训练数据**（格式参考 OpenAI 的 function calling 数据）：
   ```json
   {
     "messages": [
       {"role": "user", "content": "查询北京天气"},
       {"role": "assistant", "content": null, "function_call": {"name": "get_weather", "arguments": "{\"location\": \"北京\"}"}}
     ]
   }
   ```
2. **使用 LoRA/QLoRA 微调**（节省计算资源）：
   ```python
   from peft import LoraConfig
   from transformers import Trainer

   peft_config = LoraConfig(
       r=16,
       lora_alpha=32,
       target_modules=["q_proj", "v_proj"],
       task_type="CAUSAL_LM"
   )
   trainer = Trainer(
       model=model,
       train_dataset=dataset,
       peft_config=peft_config
   )
   trainer.train()
   ```
3. **集成到 AutoGen**：
   - 微调后的模型可以直接在 `llm_config` 中使用：
     ```python
     llm_config = {
         "model": "your_finetuned_model",
         "functions": [...]  # 定义可用函数
     }
     ```

### 适用场景

> [!success] 优点
> - **最佳长期方案**，需要稳定、高效的 Function Calling
> - 你的团队**能承担微调成本**

> [!warning] 局限性
> - 需要**高质量训练数据**
> - 微调**计算成本较高**（至少需要 A100 级别的 GPU）

---

## 总结与推荐

| 方法 | 适用场景 | 是否需要修改模型 | 实现难度 |
|------|----------|----------------|----------|
| **Prompt Engineering** | 快速测试、轻量级任务 | 否 | 中等 |
| **LangChain 中间层** | 复杂任务、多工具调用 | 否 | 较高 |
| **微调模型** | 长期稳定使用 | 是 | 高 |

**推荐选择**：
- 如果是**短期测试** → **方法 1（Prompt Engineering）**
- 如果需要**复杂工具调用** → **方法 2（LangChain）**
- 如果是**企业级生产环境** → **方法 3（微调模型）**

## 相关笔记

- [[大模型/09-Agent/AutoGen|AutoGen 框架总览]]
- [[大模型/02-应用开发/AutoGen/Agent调度/AutoGen自动进行Agent调用判断|SelectorGroupChat代码示例]]