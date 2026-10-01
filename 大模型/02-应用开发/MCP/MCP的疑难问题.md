---
🌻日期🌻: 2025-03-13
🌙星期🌙: 星期四
⌚️时间⌚️: 14:16:33
tags:
  - 大模型/MCP
  - 大模型/开发
  - 问题解决
aliases:
  - MCP问题
  - MCP疑难杂症
---

# MCP 的疑难问题

本文档记录了在 MCP 开发过程中遇到的疑难问题及解决方案。

## 后端实现

### 如何实现对多个 MCP Server 的管理

**问题描述**：我有一个 MCP Client，后端接了很多个 MCP Server，那么要怎么样可以自动判断一个问题是要使用哪个 MCP Server 并进行调用呢？

**可能的解决方案**：

1. **工具描述匹配**：让 LLM 根据各个 Server 提供的工具描述自动选择
2. **路由层**：在 Client 和 Server 之间增加一个路由层，根据意图分发请求
3. **统一注册**：将所有 Server 的工具统一注册到 Client，由 LLM 统一调度

### 如何自动任务拆分处理

**问题描述**：一个查询下去，可能涉及到很多步，那么要怎么样做拆分？可能这些步里面有几个用到 A MCP Server，有几个用到 B，还有一些用到 C，怎么样让 MCP Client 依次调用 A、B、C 这些 Server 并且汇总数据进行反馈？

**可能的解决方案**：

1. **ReAct 模式**：使用 Reasoning + Acting 的方式，让 LLM 逐步推理和执行
2. **任务编排**：预定义任务流程，按顺序调用不同的 Server
3. **Agent 框架**：结合 [[大模型/09-Agent/AutoGen|AutoGen]] 等 Agent 框架实现复杂任务编排

---

## 前端实现

### 执行步骤可视化

**问题描述**：怎么样实现类似 Claude 的那种可以将中间查询的步骤都变成缩写之类的形式，要可以很直观的提示当前执行的步骤？

![Claude 执行步骤示例](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_2/202503130923000.webp)

*图：Claude Desktop 中的执行步骤展示效果*

**实现思路**：

1. 使用可折叠的 UI 组件展示每个步骤
2. 实时更新当前执行状态
3. 支持展开查看详细信息

---

## MCP Server 如何支持 Stream

要让 MCP 服务器返回 OpenAI 的流式响应，需要以下步骤：

### 实现要点

1. **自定义传输层**：FastMCP 使用 aiohttp 处理 HTTP 请求，标准实现期望工具函数返回单个值。需要子类化 `HTTPTransport`，重写 `_handle_request` 方法，检查响应是否为异步生成器。如果是，则设置 SSE 流并逐个发送块。

2. **工具函数作为异步生成器**：由于 OpenAI 的流式调用返回同步迭代器，在异步环境中需要使用线程处理。可以使用队列和线程，将同步迭代器放入队列，异步生成器从队列中获取块并生成。

3. **性能考虑**：使用线程可能影响性能，建议使用 `asyncio.to_thread` 运行每个块的获取，但对于长流可能效率较低。更好的方法是使用单个线程迭代整个流并放入队列。

4. **客户端兼容性**：客户端需要支持接收 SSE 事件，逐步处理块。这可能需要自定义客户端实现，标准 MCP 客户端可能不直接支持。

### 示例代码

```python
import asyncio
import types
from fastmcp import mcp
from fastmcp.transports import http
from aiohttp import web
from openai import Completion
from queue import Queue
from threading import Thread

class StreamingHTTPTransport(http.HTTPTransport):
    """自定义传输层，支持流式响应"""

    async def _handle_request(self, request: web.Request) -> web.StreamResponse:
        handler_name = request.match_info['handler_name']
        args = await request.json()
        try:
            handler = self._handlers[handler_name]
        except KeyError:
            return web.json_response({"error": "Handler not found"}, status=404)

        try:
            response_data = await handler(*args)
        except Exception as e:
            return web.json_response({"error": str(e)}, status=500)
        else:
            if isinstance(response_data, types.AsyncGeneratorType):
                # 流式响应处理
                response = web.StreamResponse(status=200)
                response.content_type = 'text/event-stream'
                await response.prepare(request)
                async for chunk in response_data:
                    await response.write(f"data: {chunk}\n\n")
            else:
                response = web.json_response(response_data)
            return response

def stream_iter_to_queue(iterable, queue):
    """将同步迭代器转换为队列"""
    for item in iterable:
        queue.put(item)
    queue.put(None)  # 结束标记

async def my_tool(prompt: str):
    """支持流式输出的工具函数"""
    queue = Queue()
    thread = Thread(
        target=stream_iter_to_queue,
        args=(
            Completion.create(
                model="text-davinci-003",
                prompt=prompt,
                stream=True
            ),
            queue
        )
    )
    thread.start()

    while True:
        item = await asyncio.to_thread(queue.get)
        if item is None:
            break
        yield item

    thread.join()

# 创建 MCP Server
mcp = mcp.FastMCP("My Server")
mcp.add_transport(StreamingHTTPTransport())
mcp.tool(my_tool)

if __name__ == "__main__":
    mcp.run()
```

## 相关笔记

- [[MCP概览]] - MCP 架构和核心概念
- [[MCP使用注意事项]] - 开发 MCP 时的注意事项
- [[MCP相关资料]] - MCP 学习资源汇总
- [[一些优秀的MCP服务器]] - 推荐的 MCP Server 实现
