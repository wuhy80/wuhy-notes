---
tags:
  - Palantir
  - Ontology
  - Foundry
  - 数据建模
created: 2026-06-05
updated: 2026-06-05
source:
  - https://www.palantir.com/docs/foundry/ontologies/ontologies-overview
  - https://www.palantir.com/docs/foundry/object-link-types/object-types-overview
  - https://www.palantir.com/docs/foundry/object-link-types/link-types-overview
status: 初稿
---

# Ontology 资源模型

## Ontology 是什么资源

在 Palantir Foundry 中，一个 ontology 是存放 ontological resources 的 artifact。官方列出的主要资源包括：

- Object types
- Link types
- Action types
- Interfaces
- Shared properties
- Object type groups

Ontology 与 Foundry 的 space 有 1:1 关系。创建 space 时会创建同名 ontology；private space 对应 private ontology，shared space 对应 shared ontology。

## Object type、object、object set

Object type 是真实世界实体或事件的 schema definition。

例子：

- `Employee`：员工类型
- `Flight`：航班类型
- `Equipment`：设备类型
- `CustomerOrder`：客户订单类型

对应关系：

| Ontology 概念 | 数据表类比 | 含义 |
|---|---|---|
| Object type | 表结构 / dataset schema | 某类业务对象的定义 |
| Object | 一行数据 | 某个具体业务对象 |
| Object set | 过滤后的行集合 | 一组满足条件的对象 |

> [!note]
> Palantir 的 object 不是独立于数据存在的抽象概念。Object type 通过 backing datasources 映射到组织的真实数据资产。

## Property

Property 是 object type 上的字段或属性。

设计时需要关注：

- 主键属性：标识对象实例。
- 展示属性：用于 UI 中识别对象。
- 状态属性：用于工作流，例如 `status`、`priority`、`owner`。
- 时间属性：用于事件、时序、审计和调度。
- 安全相关属性：可能参与动态权限判断。

好的 property 设计应该贴近业务语言，而不是直接暴露底层数据库字段名。

## Link type 与 link

Link type 是两个 object types 之间关系的 schema definition。Link 是两个具体对象之间的一条关系实例。

例子：

- `Employee -> Department`
- `Order -> Customer`
- `Flight -> Aircraft`
- `Sensor -> Equipment`

常见关系：

- 一对一
- 一对多
- 多对多
- 自关联，例如 `Employee -> Manager`

| Ontology 概念 | 数据表类比 | 含义 |
|---|---|---|
| Link type | join 关系定义 | 两类对象之间的关系 |
| Link | join 后的一条关系 | 两个具体对象之间的连接 |

## Interface

Interface 描述一类对象应具备的共同形状和能力，用于对象类型多态。

适用场景：

- 多个对象类型都有地理位置。
- 多个对象类型都可以被分配负责人。
- 多个对象类型都支持相同的 action。
- 不同业务对象需要在应用里用同一种交互方式处理。

可以把 Interface 理解成 Ontology 层的「业务能力契约」。

## Shared property

Shared property 用于多个 object types 之间复用统一属性定义。

适合抽象为 shared property 的例子：

- `status`
- `owner`
- `createdAt`
- `lastUpdatedAt`
- `geoPoint`
- `riskScore`

它的价值在于减少重复建模，并提高跨对象查询、UI 展示和权限规则的一致性。

## 设计建议

- 先从业务对象开始，而不是从数据库表开始。
- 优先建模稳定对象，例如设备、订单、客户、地点、任务、告警。
- 把高频业务动词留给 Action type，不要只靠直接编辑 property。
- 关系要表达业务含义，而不是机械复制所有 foreign key。
- 对跨类型共性使用 Interface 或 Shared property。
- 命名应贴近业务用户语言，避免只使用工程缩写。

## 参考资料

- [Ontologies overview](https://www.palantir.com/docs/foundry/ontologies/ontologies-overview)
- [Object types overview](https://www.palantir.com/docs/foundry/object-link-types/object-types-overview)
- [Link types overview](https://www.palantir.com/docs/foundry/object-link-types/link-types-overview)
- [Interfaces overview](https://www.palantir.com/docs/foundry/interfaces/overview)
