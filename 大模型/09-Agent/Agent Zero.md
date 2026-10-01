---
tags:
  - 大模型/Agent
  - AgentZero
  - 个人智能体
created: 2026-06-30
updated: 2026-06-30
status: seed
source:
  - https://www.agent-zero.ai/
  - https://github.com/agent0ai/agent-zero
aliases:
  - Agent0
  - Agent Zero
---

# Agent Zero

> [!summary] 定位
> `Agent Zero` 更像一个本地智能体运行环境：它把 Agent 放进带 Linux 桌面、浏览器、插件、skills、项目隔离和子智能体能力的容器环境中运行。

## 一、核心特征

- Docker 容器运行
- 内置 Linux 桌面
- 浏览器和终端能力
- Plugin Hub
- skills 和项目上下文
- 支持子智能体协作
- 可连接主机环境

## 二、和 OpenClaw / Hermes 的关系

[[OpenClaw]] / [[Hermes]] 更像面向个人工作流的智能体助理。

`Agent Zero` 更像给智能体准备的本地工作环境：

- 能看桌面
- 能操作浏览器
- 能跑命令
- 能接插件
- 能拆分子任务

## 三、适合场景

- 本地自动化
- 代码和文档处理
- 浏览器操作
- 多工具任务
- 需要观察和介入的智能体执行

## 四、风险

> [!warning] 权限风险
> Agent Zero 一旦连接宿主机文件、浏览器、账号和插件，就需要明确隔离边界。容器不是万能安全边界，尤其是当你主动给它更多主机权限时。

## 相关笔记

- [[个人常驻智能体对比]]
- [[OpenClaw]]
- [[Hermes]]
