---
🌻日期🌻: 2025-03-13
🌙星期🌙: 星期四
⌚️时间⌚️: 09:21:36
tags:
  - 大模型/MCP
  - 大模型/协议
  - 技术/架构
aliases:
  - MCP架构
  - Model Context Protocol
---

# MCP 概览

MCP（Model Context Protocol，模型上下文协议）是 Anthropic 推出的一种标准化协议，用于连接 AI 模型与外部数据源和工具。

## MCP 架构图

![MCP 架构图](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_2/202503130921699.png)

*图：MCP 整体架构，展示了主机、客户端、服务器与资源之间的关系*

## 核心组件

### 主机与客户端

- **MCP 主机（MCP Hosts）**：发起请求的 LLM 应用程序（例如 Claude Desktop、IDE 或 AI 工具）
- **MCP 客户端（MCP Clients）**：在主机程序内部，与 MCP Server 保持 1:1 的连接

### 服务器与资源

- **MCP 服务器（MCP Servers）**：为 MCP Client 提供上下文、工具和 Prompt 信息
- **本地资源（Local Resources）**：本地计算机中可供 MCP Server 安全访问的资源（例如文件、数据库）
- **远程资源（Remote Resources）**：MCP Server 可以连接到的远程资源（例如通过 API）

## 核心概念

| 概念 | 说明 |
|------|------|
| **资源（Resources）** | 用于与 AI 模型共享数据和内容 |
| **提示（Prompts）** | 用于创建可重用的模板以实现一致的 AI 交互 |
| **工具（Tools）** | 使 AI 模型能够通过外部服务执行操作 |
| **采样（Sampling）** | 允许服务请求来自 AI 模型的信息 |
| **传输（Transport）** | 用于高效地连接客户端和服务器，例如通过 Stdio 或使用 SSE 的 HTTP |

## 应用示例

### 使用 PostgreSQL 的例子

![PostgreSQL MCP 示例](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_2/202503130923000.webp)

*图：通过 MCP 连接 PostgreSQL 数据库的架构示例*

## 相关笔记

- [[MCP相关资料]] - MCP 学习资源汇总
- [[MCP使用注意事项]] - 开发 MCP 时的注意事项
- [[MCP的疑难问题]] - MCP 开发中的常见问题
- [[一些优秀的MCP服务器]] - 推荐的 MCP Server 实现
- [[Agent的一些思考]] - Agent 相关思考

## 主题关联

> [!note] 在个体重构中的位置
> 如果从“AI 如何进入个人工作流”的角度看，MCP 更像工具接入层，可结合下面几篇一起看：

- [[大模型/08-个体重构/02-工作流重构/MCP、RAG 与 Agent 在个体重构中的位置]]
- [[大模型/08-个体重构/02-工作流重构/AI时代个人工作流重构框架]]
