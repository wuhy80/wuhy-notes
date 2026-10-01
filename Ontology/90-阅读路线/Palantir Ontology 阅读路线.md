---
tags:
  - Palantir
  - Ontology
  - 阅读路线
created: 2026-06-05
updated: 2026-06-05
status: 整理中
---

# Palantir Ontology 阅读路线

## 第一阶段：先理解定位

目标：搞清楚 Ontology 为什么是 Palantir 的核心，而不是普通数据目录。

阅读：

- [Ontology building overview](https://www.palantir.com/docs/foundry/ontology/overview/)
- [Platform overview](https://www.palantir.com/docs/foundry/platform-overview/overview/)
- [AIP, Foundry, and Apollo](https://www.palantir.com/docs/foundry/architecture-center/platforms)
- [[01 Palantir Ontology 核心概念]]

重点问题：

- Ontology 为什么被称为 operational layer？
- 它和数据层、应用层、AI 层分别是什么关系？
- 为什么 Palantir 强调 Ontology 表示 decisions，而不只是 data？

## 第二阶段：掌握资源模型

目标：能看懂 Ontology 的基本构件。

阅读：

- [Ontologies overview](https://www.palantir.com/docs/foundry/ontologies/ontologies-overview)
- [Object types overview](https://www.palantir.com/docs/foundry/object-link-types/object-types-overview)
- [Link types overview](https://www.palantir.com/docs/foundry/object-link-types/link-types-overview)
- [Interfaces overview](https://www.palantir.com/docs/foundry/interfaces/overview)
- [[02 Ontology 资源模型]]

重点问题：

- Object type 和 dataset schema 如何类比？
- Object 和 object set 分别是什么？
- Link type 与数据库 join 有什么相似和不同？
- Interface 解决什么建模问题？

## 第三阶段：理解动作和写回

目标：理解 Palantir 如何把业务决策变成可控变更。

阅读：

- [Action types overview](https://www.palantir.com/docs/foundry/action-types/overview)
- [Action type rules](https://www.palantir.com/docs/foundry/action-types/rules)
- [Action log](https://www.palantir.com/docs/foundry/action-types/action-log)
- [Functions overview](https://www.palantir.com/docs/foundry/functions/overview)
- [[03 Actions、Functions 与写回机制]]

重点问题：

- 为什么 Action 是企业里的「动词」？
- Function-backed Action 适合什么场景？
- Action log 如何把决策沉淀为数据？
- AI agent 应该如何通过 Action 受控写回？

## 第四阶段：安全治理

目标：理解为什么 Ontology 可以承载企业级 AI 操作。

阅读：

- [Object permissioning overview](https://www.palantir.com/docs/foundry/object-permissioning/overview)
- [Ontology permissions](https://www.palantir.com/docs/foundry/object-permissioning/ontology-permissions)
- [Action permissions](https://www.palantir.com/docs/foundry/action-types/permissions)
- [[04 安全治理与权限]]

重点问题：

- Ontology resources 和 objects/links 的权限有什么区别？
- AI agent 的工具权限应该如何限制？
- Link 是否可能泄露间接信息？
- Action 权限和对象权限如何共同生效？

## 第五阶段：应用开发与 AI

目标：理解自定义应用和 AI workflow 如何接入 Ontology。

阅读：

- [Ontology SDK overview](https://www.palantir.com/docs/foundry/ontology-sdk/overview)
- [AIP overview](https://www.palantir.com/docs/foundry/aip/overview/)
- [AIP architecture overview](https://www.palantir.com/docs/foundry/architecture-center/aip-architecture/)
- [[05 OSDK 与应用开发]]

重点问题：

- OSDK 如何把 Ontology 变成开发者可用的后端？
- TypeScript/Python/Java OSDK 的适用场景是什么？
- AIP agent 如何基于 Ontology 获取上下文和执行动作？
- 如何设计 proposal-first 的 AI 应用？

## 后续待补主题

- [ ] Palantir Ontology 与传统知识图谱对比
- [ ] Palantir Ontology 与数据中台/主数据管理对比
- [ ] Palantir AIP 的 agent 工具调用模式
- [ ] Ontology 建模案例：制造业设备维护
- [ ] Ontology 建模案例：订单履约与供应链
- [ ] Ontology 建模案例：告警处置流程
