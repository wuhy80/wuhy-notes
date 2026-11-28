---
tags:
  - 大模型/Agent
  - Letta
  - 记忆
created: 2026-06-30
updated: 2026-06-30
status: seed
source:
  - https://docs.letta.com/
  - https://github.com/letta-ai/letta
aliases:
  - Letta Code
  - MemGPT
---

# Letta

> [!summary] 定位
> `Letta` 是偏记忆优先的智能体平台。它既有 Letta Code，也有 Agent SDK，重点是让 Agent 具备长期记忆、状态管理和可持续学习能力。

## 一、核心特征

- Memory and dreaming
- Skills
- Slack / Telegram / Discord / WhatsApp / Signal channels
- schedules
- remote environments
- secrets
- subagents
- permissions
- MCP tools
- stateful agents

## 二、和 Hermes / OpenClaw 的关系

[[Hermes]] / [[OpenClaw]] 更偏个人智能体运行时。

`Letta` 更偏“记忆和状态层”：

- 让 Agent 记住长期信息
- 管理状态和上下文层级
- 提供 SDK 与服务端能力

## 三、适合场景

- 需要长期记忆的个人助理
- 需要跨会话状态的 Agent
- 需要聊天渠道接入的智能体
- 需要 memory governance 的系统

## 四、风险

> [!warning] 记忆治理
> 长期记忆会提升 Agent 个性化能力，也会带来隐私、遗忘、污染、权限和审计问题。

## 相关笔记

- [[个人常驻智能体对比]]
- [[Hermes]]
- [[OpenClaw]]
