---
🌻日期🌻: 2025-03-25
🌙星期🌙: 星期二
⌚️时间⌚️: 14:48:31
tags: 
---

完全无法去调用 tools 从而实现对外部的 MCP 调用功能
![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_2/202503251448276.png)



02:47:37  |base| root@master-one wanxiang_mcp_server → python -m src.agent.mysql_agent1
2025-03-25 14:47:44,958 - src.config.config - INFO - Configuration loaded: {'MODEL_NAME': 'deepseek-chat', 'MODEL_ENDPOINT': 'https://api.deepseek.com', 'DEEPSEEK_API_KEY': '********', 'MYSQL_HOST': '192.0.2.201', 'MYSQL_PORT': '30002', 'MYSQL_USER': 'zeusroot', 'MYSQL_PASSWORD': '********', 'MYSQL_DATABASE': 'zhanwan_test', 'INFLUXDB_HOST': 'localhost', 'INFLUXDB_PORT': '8086', 'INFLUXDB_USER': 'user', 'INFLUXDB_PASSWORD': '********', 'INFLUXDB_DATABASE': 'my-bucket', 'DEBUG': True}
Processing user query: 从表rfid_infos里面查看最后一条记录里面的match_device_measurements,这个使用','分割的measurement列表。在influx里面对应measurement的值信息，根据first_rcd_time和180秒时长进行查询
[03/25/25 14:47:46] INFO     Processing request of type ListToolsRequest                                                                                                                               server.py:536
MySQL tools fetched successfully
MySQL Agent created successfully
[03/25/25 14:47:50] INFO     Processing request of type ListToolsRequest                                                                                                                               server.py:536
InfluxDB tools fetched successfully
InfluxDB Agent created successfully
Coordinator Agent created successfully
All agents created: User, Coordinator, MySQL_Agent, InfluxDB_Agent
Selected round-robin workflow (RoundRobinGroupChat)
Starting team task execution...
---------- user ----------
从表rfid_infos里面查看最后一条记录里面的match_device_measurements,这个使用','分割的measurement列表。在influx里面对应measurement的值信息，根据first_rcd_time和180秒时长进行查询
2025-03-25 14:47:51,600 - httpx - INFO - HTTP Request: POST https://openrouter.ai/api/v1/chat/completions "HTTP/1.1 200 OK"
/root/miniconda3/lib/python3.12/site-packages/autogen_core/_routed_agent.py:268: UserWarning: No text content or tool calls are available. Model returned empty result.
  return_value = await func(self, message, ctx)  # type: ignore
---------- Coordinator ----------

2025-03-25 14:47:54,503 - httpx - INFO - HTTP Request: POST https://openrouter.ai/api/v1/chat/completions "HTTP/1.1 200 OK"
---------- MySQL_Agent ----------

2025-03-25 14:47:57,341 - httpx - INFO - HTTP Request: POST https://openrouter.ai/api/v1/chat/completions "HTTP/1.1 200 OK"
---------- InfluxDB_Agent ----------

2025-03-25 14:48:00,132 - httpx - INFO - HTTP Request: POST https://openrouter.ai/api/v1/chat/completions "HTTP/1.1 200 OK"
---------- Coordinator ----------

2025-03-25 14:48:03,147 - httpx - INFO - HTTP Request: POST https://openrouter.ai/api/v1/chat/completions "HTTP/1.1 200 OK"
---------- MySQL_Agent ----------

2025-03-25 14:48:06,266 - httpx - INFO - HTTP Request: POST https://openrouter.ai/api/v1/chat/completions "HTTP/1.1 200 OK"
---------- InfluxDB_Agent ----------

Team task execution completed
Query completed successfully: