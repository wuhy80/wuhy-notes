---
tags:
  - Palantir
  - Ontology
  - OSDK
  - 应用开发
created: 2026-06-05
updated: 2026-06-05
source:
  - https://www.palantir.com/docs/foundry/ontology-sdk/overview
  - https://www.palantir.com/docs/foundry/aip/overview/
status: 初稿
---

# OSDK 与应用开发

## OSDK 是什么

OSDK 是 Ontology Software Development Kit。它允许开发者在自己的开发环境中直接访问 Ontology 的能力。

官方支持的接入方式包括：

- TypeScript / NPM
- Python / Pip 或 Conda
- Java / Maven
- OpenAPI spec，供其他语言使用

> [!summary]
> OSDK 的核心价值是把 Foundry/Ontology 当成后端，让外部应用用类型安全、受权限控制的方式读取、查询和写回企业业务对象。

## 能做什么

OSDK 常见用途：

- 构建 React 前端应用。
- 查询 object types、objects、object sets。
- 遍历 links，获取相关对象。
- 调用 Actions 写回 Ontology。
- 调用 Functions 获取计算结果。
- 将自定义应用接入 Foundry 的安全和治理框架。
- 生成与特定 Ontology 子集相关的类型和函数。

## 和普通 API 的区别

| 维度 | 普通 REST/GraphQL API | Palantir OSDK |
|---|---|---|
| 抽象层 | endpoint / resource | Ontology object / action / function |
| 类型来源 | 手写 schema 或 API spec | 从 Ontology 元数据生成 |
| 权限 | 应用自管较多 | 结合 token scope 和用户数据权限 |
| 写回 | 调 API 改数据 | 通过 Action/Ontology edits 受控写回 |
| 业务上下文 | 需要应用自己解释 | 直接来自 Ontology |

## 开发流程

典型流程：

1. 在 Developer Console 创建应用。
2. 选择应用需要访问的 Ontology 资源范围。
3. 按语言生成或安装 SDK。
4. 在本地开发环境中使用生成的类型、查询和 action 调用。
5. 可选：把应用托管在 Foundry。

## Type-safety 的意义

OSDK 会根据应用可访问的 Ontology 子集生成类型和函数。

好处：

- 在 IDE 中直接看到对象属性和描述。
- 减少字段名拼写错误。
- Ontology 变更更容易暴露到编译期或开发期。
- 应用代码更贴近业务对象，而不是底层表结构。

## 和 AIP 的关系

AIP 中的 agent、chatbot、logic 和 automations 可以建立在 Ontology 上。OSDK 则面向开发者，把同样的业务对象、动作和函数暴露给自定义应用。

两者可以结合：

- 应用前端使用 OSDK 查询对象。
- AI 功能通过 AIP Logic 或 Functions 生成建议。
- 用户确认后通过 Action 写回。
- 结果进入 Ontology，被后续分析、AI 和工作流复用。

## 应用设计建议

- 应用页面围绕业务对象设计，而不是围绕表设计。
- 写操作优先使用 Action，不要绕过业务流程。
- 给 OSDK 应用授权最小必要的 Ontology 范围。
- 对 AI 生成内容采用 proposal-first 设计，即先建议、后确认、再写回。
- 对关键业务动作保留 action log 和 edit history。

## 参考资料

- [Ontology SDK overview](https://www.palantir.com/docs/foundry/ontology-sdk/overview)
- [AIP overview](https://www.palantir.com/docs/foundry/aip/overview/)
- [Developer Console overview](https://www.palantir.com/docs/foundry/developer-console/overview)
- [OSDK React applications](https://www.palantir.com/docs/foundry/ontology-sdk/react)
