---
tags:
  - Palantir
  - Ontology
  - Foundry
created: 2026-06-05
updated: 2026-06-05
source:
  - https://www.palantir.com/docs/foundry/ontology/overview/
  - https://www.palantir.com/docs/foundry/platform-overview/overview/
status: 初稿
---

# Palantir Ontology 核心概念

## 定义

Palantir 官方把 Ontology 描述为组织的 operational layer。它位于 Foundry 集成的数据资产之上，包括 datasets、virtual tables、models，并把这些资产连接到真实世界里的业务对象，例如工厂、设备、产品、客户订单、金融交易等。

更直观地说：

> [!summary]
> Ontology 是「企业业务世界的可操作数字模型」。它既有语义层，也有动作层；既能给人看，也能给应用和 AI 调用。

## 和普通数据模型的区别

传统数据模型常常关注表、字段、主键、外键和存储结构。Palantir Ontology 更关注业务对象、业务关系、动作、权限和决策流程。

| 维度 | 传统数据模型 | Palantir Ontology |
|---|---|---|
| 主要对象 | 表、列、行 | Object type、object、property、link |
| 关系表达 | join / foreign key | Link type / link |
| 业务动作 | 应用代码里实现 | Action type / Function |
| 权限控制 | 数据库、应用、报表分散实现 | Ontology 资源和对象层统一控制 |
| 面向对象 | 数据工程师、开发者 | 分析师、业务用户、应用、AI agent |
| 目标 | 数据存储与查询 | 决策、协同、写回、审计、自动化 |

## 语义元素和动力元素

Palantir 文档里有一个关键区分：Ontology 同时包含 semantic elements 和 kinetic elements。

语义元素回答「世界是什么」：

- Object types：业务对象类型，例如 Employee、Flight、Order、Asset。
- Properties：对象属性，例如状态、位置、负责人、时间戳。
- Link types：对象关系，例如 Employee 属于 Department，Order 包含 Product。
- Interfaces：多个对象类型共享的形状和能力。

动力元素回答「世界如何改变」：

- Action types：用户或系统可以执行的业务动作。
- Functions：服务端逻辑，可查询、计算、聚合或编辑 Ontology。
- Dynamic security：随上下文变化的权限与访问控制。
- Writeback：把用户或系统决策沉淀为数据变更。

## 为什么 Palantir 强调 Ontology

Palantir 的核心叙事是：企业 AI 不能只接入文档和数据库，还要理解业务对象、决策动作和权限边界。Ontology 承担这个中间层。

它解决的不是「让 AI 读更多数据」这么简单，而是：

- 把分散系统中的实体映射成统一业务对象。
- 让分析和应用围绕对象工作，而不是围绕表工作。
- 让人和 AI 通过 Actions 进行受控写回。
- 让决策结果留下审计记录和反馈闭环。
- 让应用、agent、自动化共享同一套业务语义。

## Foundry、AIP、Apollo 中的位置

- Foundry：数据操作平台，负责数据集成、逻辑编写、Ontology 构建、分析和工作流。
- AIP：生成式 AI 平台，把 LLM、agent、自动化和 Evals 接到 Ontology 和开发工具链上。
- Apollo：持续交付平台，负责底层部署和服务升级。

> [!note]
> 可以把 Foundry 理解为数据和业务建模底座，AIP 是 AI 能力层，Ontology 是两者之间最关键的业务语义与动作接口。

## 一句话记忆

> [!summary]
> Palantir Ontology = 企业对象模型 + 业务动作模型 + 权限治理模型 + AI/应用开发接口。

## 参考资料

- [Ontology building overview](https://www.palantir.com/docs/foundry/ontology/overview/)
- [Platform overview: The Ontology](https://www.palantir.com/docs/foundry/platform-overview/overview/)
- [AIP overview](https://www.palantir.com/docs/foundry/aip/overview/)
