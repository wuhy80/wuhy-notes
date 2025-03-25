---
🌻日期🌻: 2025-03-25
🌙星期🌙: 星期二
⌚️时间⌚️: 09:18:35
tags: 
---
# Agent 使用的时候大模型是否必须要支持 function_tool
在使用类似下面的 Agent 的时候，调用报错，提示的是
```python
async def get_influx_agent() -> AssistantAgent:
    """
    创建并返回一个InfluxDB查询助手agent
    
    返回:
        AssistantAgent: 一个配置用于与InfluxDB时序数据库交互的agent
    """
    try:
        influx_mcp_server = StdioServerParams(
            command="python",
            args=[INFLUX_SCRIPT_PATH]
        )
        
        # Fetch MCP server tools for InfluxDB
        tools = await mcp_server_tools(influx_mcp_server)
        print("InfluxDB tools fetched successfully")  # 添加打印信息
        
        # Create InfluxDB agent
        agent = AssistantAgent(
            name="InfluxDB_Agent",
            model_client=llm_client,
            model_client_stream=True,
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
            reflect_on_tool_use=True
        )
        
        print("InfluxDB Agent created successfully")  # 添加打印信息
        return agent
    except Exception as e:
        print(f"Failed to create InfluxDB agent: {str(e)}")  # 添加打印信息
        raise
```

![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_2/202503250920690.png)
