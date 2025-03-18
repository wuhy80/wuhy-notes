---
🌻日期🌻: 2025-03-13
🌙星期🌙: 星期四
⌚️时间⌚️: 14:16:33
tags: 
---
# 后端实现
## 如何实现对多个 MCP Server 的管理
我有一个 MCP Client，后端接了很多个 MCP Server，那么要怎么样可以自动的判断一个问题是要使用哪个 MCP Server 并进行调用呢

## 如何自动任务拆分处理
一个查询下去，可能涉及到很多步，那么要怎么样做拆分。可能这些步里面有几个用到 A MCP Server，有几个用到 B，还有一些用到 C，怎么样让 MCP Client 依次调用 A,B,C 这些 Server 并且汇总数据进行反馈


# 前端实现
怎么样实现类似 Claude 的那种可以将中间查询的步骤都变成缩写之类的形式，要可以很直观的提示当前执行的步骤
![4c47711b0d53df0a4874e60b31ff7969_640_wx_fmt=png&from=appmsg&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1.webp](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_2/202503130923000.webp)
## MCP Server 如何支持 Stream
要让 MCP 服务器返回 OpenAI 的流式响应，需要以下步骤：

- **自定义传输层**：FastMCP 使用 aiohttp 处理 HTTP 请求，标准实现期望工具函数返回单个值。需要子类化 HTTPTransport，重写 _handle_request 方法，检查响应是否为异步生成器。如果是，则设置 SSE 流并逐个发送块。
- **工具函数作为异步生成器**：由于 OpenAI 的流式调用返回同步迭代器，在异步环境中需要使用线程处理。可以使用队列和线程，将同步迭代器放入队列，异步生成器从队列中获取块并生成。
- **性能考虑**：使用线程可能影响性能，建议使用 asyncio.to_thread 运行每个块的获取，但对于长流可能效率较低。更好的方法是使用单个线程迭代整个流并放入队列。
- **客户端兼容性**：客户端需要支持接收 SSE 事件，逐步处理块。这可能需要自定义客户端实现，标准 MCP 客户端可能不直接支持。
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
                response = web.StreamResponse(status=200)
                response.content_type = 'text/event-stream'
                await response.prepare(request)
                async for chunk in response_data:
                    await response.write(f"data: {chunk}\n\n")
            else:
                response = web.json_response(response_data)
            return response

def stream_iter_to_queue(iterable, queue):
    for item in iterable:
        queue.put(item)
    queue.put(None)

async def my_tool(prompt: str):
    queue = Queue()
    thread = Thread(target=stream_iter_to_queue,
                    args=(Completion.create(model="text-davinci-003", prompt=prompt, stream=True), queue))
    thread.start()
    while True:
        item = await asyncio.to_thread(queue.get)
        if item is None:
            break
        yield item
    thread.join()

mcp = mcp.FastMCP("My Server")
mcp.add_transport(StreamingHTTPTransport())
mcp.tool(my_tool)

if __name__ == "__main__":
    mcp.run()
```

