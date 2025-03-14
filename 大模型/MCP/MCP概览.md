---
🌻日期🌻: 2025-03-13
🌙星期🌙: 星期四
⌚️时间⌚️: 09:21:36
tags: 
---
## 这是 MCP 的架构图
![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_2/202503130921699.png)
- MCP 主机（MCP Hosts）：发起请求的 LLM 应用程序（例如 Claude Desktop、IDE 或 AI 工具）。
- MCP 客户端（MCP Clients）：在主机程序内部，与 MCP server 保持 1:1 的连接。
- MCP 服务器（MCP Servers）：为 MCP client 提供上下文、工具和 prompt 信息。
- 本地资源（Local Resources）：本地计算机中可供 MCP server 安全访问的资源（例如文件、数据库）。
- 远程资源（Remote Resources）：MCP server 可以连接到的远程资源（例如通过 API）。

**资源**，用于与 AI 模型共享数据和内容；
**提示**，用于创建可重用的模板以实现一致的 AI 交互；
**工具**，使 AI 模型能够通过外部服务执行操作；
**采样**，允许服务请求来自 AI 模型的信息；
**传输**，用于高效地连接客户端和服务器，例如通过 Stdio 或使用服务器发送事件的 HTTP

# 一些例子
## 使用 PostGreSQL 的例子
![4c47711b0d53df0a4874e60b31ff7969_640_wx_fmt=png&from=appmsg&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1.webp](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_2/202503130923000.webp)
