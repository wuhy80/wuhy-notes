---
🌻日期🌻: 2025-03-25
🌙星期🌙: 星期二
⌚️时间⌚️: 15:25:07
tags: 
---

```python
import os
from typing import Dict, List, Literal, Optional, Union

from autogen import ConversableAgent, UserProxyAgent, AssistantAgent
from autogen.agentchat.contrib.capabilities.agent_capability import CapabilityBasedTrigger

# 定义一个调度Agent类
class DispatcherAgent(ConversableAgent):
    def __init__(
        self,
        name: str,
        mysql_agent: ConversableAgent,
        influx_agent: ConversableAgent,
        system_message: Optional[str] = None,
        **kwargs
    ):
        system_message = system_message or f"""你是一个调度Agent，负责将用户的请求分发给合适的数据库Agent。
        - 如果用户请求涉及MySQL数据库操作，你应该转发给MySQL Agent
        - 如果用户请求涉及InfluxDB时序数据库操作，你应该转发给InfluxDB Agent
        - 如果请求不明确或需要综合分析，你可以自己处理
        """
        
        super().__init__(name=name, system_message=system_message, **kwargs)
        self.mysql_agent = mysql_agent
        self.influx_agent = influx_agent
        
        # 注册消息处理函数 - 使用最新的CapabilityBasedTrigger语法
        self.register_reply(
            trigger=CapabilityBasedTrigger(
                capability_name="mysql_detection",
                trigger_phrases=["mysql", "关系型数据库", "表", "SQL", "查询MySQL"]
            ), 
            reply_func=self.handle_mysql_request
        )
        
        self.register_reply(
            trigger=CapabilityBasedTrigger(
                capability_name="influxdb_detection",
                trigger_phrases=["influxdb", "influx", "时序数据库", "时间序列", "metrics"]
            ), 
            reply_func=self.handle_influxdb_request
        )
    
    async def handle_mysql_request(self, messages, sender, config):
        """处理MySQL请求，转发给MySQL Agent"""
        last_message = messages[-1]
        mysql_prompt = f"用户请求: {last_message['content']}\n请作为MySQL专家处理这个请求"
        
        # 在最新版本中使用initiate_chat的推荐方式
        chat_result = await self.initiate_chat(
            recipient=self.mysql_agent,
            message=mysql_prompt,
            silent=False,
            cache=None  # 根据需要设置缓存
        )
        
        # 提取响应内容
        response_messages = chat_result.chat_history
        for msg in response_messages:
            if msg["role"] == "assistant":
                return msg["content"]
        return "MySQL专家未能提供有效回复。"
    
    async def handle_influxdb_request(self, messages, sender, config):
        """处理InfluxDB请求，转发给InfluxDB Agent"""
        last_message = messages[-1]
        influx_prompt = f"用户请求: {last_message['content']}\n请作为InfluxDB专家处理这个请求"
        
        # 使用最新版本的initiate_chat
        chat_result = await self.initiate_chat(
            recipient=self.influx_agent,
            message=influx_prompt,
            silent=False,
            cache=None
        )
        
        # 提取响应内容
        response_messages = chat_result.chat_history
        for msg in response_messages:
            if msg["role"] == "assistant":
                return msg["content"]
        return "InfluxDB专家未能提供有效回复。"

# 主程序
async def main():
    # 创建MySQL专家Agent
    mysql_agent = AssistantAgent(
        name="MySQL专家",
        system_message="""你是MySQL数据库专家，精通SQL查询和关系型数据库设计。
        当收到关于MySQL的问题时，提供详细的解决方案和示例SQL语句。
        """,
        llm_config={"config_list": [{"model": "gpt-4"}]}
    )
    
    # 创建InfluxDB专家Agent
    influx_agent = AssistantAgent(
        name="InfluxDB专家",
        system_message="""你是InfluxDB时序数据库专家，精通InfluxQL和Flux查询语言。
        当收到关于时间序列数据或InfluxDB的问题时，提供详细的解决方案和查询示例。
        """,
        llm_config={"config_list": [{"model": "gpt-4"}]}
    )
    
    # 创建调度Agent
    dispatcher = DispatcherAgent(
        name="调度器",
        mysql_agent=mysql_agent,
        influx_agent=influx_agent,
        llm_config={"config_list": [{"model": "gpt-4"}]}
    )
    
    # 创建用户代理 - 使用最新的参数配置
    user_proxy = UserProxyAgent(
        name="用户",
        human_input_mode="ALWAYS",  # 总是等待人类输入
        max_consecutive_auto_reply=0,  # 设置为0表示不自动回复
        code_execution_config={"work_dir": "coding", "use_docker": False}  # 配置代码执行环境
    )
    
    # 启动对话 - 使用最新的异步调用方式
    await user_proxy.initiate_chat(
        recipient=dispatcher, 
        message="我需要你的帮助，请问如何查询MySQL中某个表的所有用户数据？",
        summary_method="last_msg"  # 使用最后一条消息作为摘要
    )

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```