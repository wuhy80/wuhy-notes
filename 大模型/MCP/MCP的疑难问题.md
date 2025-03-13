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