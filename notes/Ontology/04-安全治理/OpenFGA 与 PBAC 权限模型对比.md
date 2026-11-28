---
tags:
  - Ontology
  - 权限
  - OpenFGA
  - PBAC
  - ReBAC
  - 多租户
created: 2026-07-11
updated: 2026-07-11
status: 初稿
source:
  - https://openfga.dev/docs
  - https://github.com/openfga/openfga
aliases:
  - Ontology 权限替代方案
  - OpenFGA PBAC 对比
---

# OpenFGA 与 PBAC 权限模型对比

## 核心结论

OpenFGA 和 PBAC 解决的是不同类型的授权问题，不宜简单二选一：

- **OpenFGA** 主要回答“用户与某个具体资源是什么授权关系”，适合组织、团队、项目、对象层级、分享和权限继承。
- **PBAC（Policy-Based Access Control）** 主要回答“在当前业务和环境条件下是否允许操作”，适合金额、状态、时间、网络、风险等级和数据密级等动态规则。
- 对类似 [[Palantir Ontology 核心概念|Ontology]] 的多租户系统，推荐结合数据库强隔离、OpenFGA 关系权限与 PBAC 动态策略，而不是让一个组件承担全部职责。

>[!note] 术语边界
>PBAC 有时也指 Purpose-Based Access Control（基于目的的访问控制）。本文沿用当前系统语境，将 PBAC 解释为 Policy-Based Access Control。若现有 PBAC 实际表示其他含义，需要重新核对模型。

## OpenFGA 是什么

OpenFGA 是开源的细粒度授权系统，实现了以 Google Zanzibar 思路为代表的关系授权模型（ReBAC）。它不负责登录，也不保存订单、文档等业务数据，而是根据授权模型和关系元组判断：

```text
某个主体 user
是否具有某种关系 relation
作用于某个对象 object
```

例如：

```text
user:zhangsan member team:engineering
team:engineering editor project:alpha
project:alpha parent document:design
```

检查请求：

```json
{
  "user": "user:zhangsan",
  "relation": "viewer",
  "object": "document:design"
}
```

OpenFGA 根据模型展开团队成员、项目权限和父子资源关系，返回 `allowed: true/false`。

## PBAC 是什么

PBAC 根据策略对用户、资源、动作和环境属性进行判断：

```json
{
  "subject": {
    "id": "zhangsan",
    "department": "finance",
    "clearance": 3
  },
  "resource": {
    "type": "purchase_order",
    "amount": 80000,
    "status": "pending",
    "classification": 2
  },
  "action": "approve",
  "environment": {
    "network": "corporate",
    "hour": 14
  }
}
```

策略可以表达：

```text
部门为 finance
AND 采购金额小于 100000
AND 状态为 pending
AND 使用公司网络
AND 用户 clearance 不低于资源 classification
```

OPA、Cedar、Casbin 或自研策略引擎都可以承担 PBAC 的一部分能力，具体表达力和执行模型不同。

## 核心区别

| 维度 | PBAC | OpenFGA |
| --- | --- | --- |
| 核心模型 | 策略、属性与条件 | 主体、关系与对象 |
| 主要问题 | 当前条件下能否执行 | 主体和资源之间是否存在授权关系 |
| 典型输入 | 用户属性、资源属性、动作、环境 | `user + relation + object` |
| 擅长规则 | 金额、时间、IP、状态、风险、密级 | owner、member、viewer、parent、分享 |
| 资源层级与继承 | 需要策略和业务查询配合 | 原生适合关系展开 |
| 动态环境条件 | 强 | 弱，不适合数值和环境计算 |
| 对象级分享 | 需要额外授权数据 | 写入关系元组即可 |
| 字段脱敏 | 可参与决策 | 不直接处理响应字段 |
| 可解释性 | 取决于策略引擎和规则复杂度 | 关系链通常较直观 |
| 主要风险 | 策略冲突、属性不可信、规则膨胀 | 关系元组错误、继承过宽、检查遗漏 |

## 同一业务问题如何分工

需求：

> 张三是项目 Alpha 的采购审批人，只能在公司网络内审批处于待审批状态且金额不超过 10 万元的采购单。

OpenFGA 判断稳定的关系：

```text
user:zhangsan approver purchase_order:PO-001
```

PBAC 判断动态条件：

```text
amount <= 100000
AND status == pending
AND network == corporate
```

业务服务负责将两者合并，并确保操作事务和审计：

```text
OpenFGA relation check
        ↓ true
PBAC policy evaluation
        ↓ true
业务参数与版本校验
        ↓
执行 Action / 进入审批工作流
        ↓
写入业务数据和审计事件
```

## 与 RBAC 的关系

RBAC 适合少量稳定的全局角色：

```text
admin
operator
viewer
```

当同一用户在不同资源上拥有不同角色时，纯 RBAC 容易产生角色爆炸：

```text
project-alpha-editor
project-beta-viewer
document-123-owner
```

OpenFGA 将角色转化为用户与具体对象之间的关系；PBAC 则进一步加入运行时条件。因此三者可以共存：

| 模型 | 更适合 |
| --- | --- |
| RBAC | 全局角色与粗粒度功能菜单 |
| OpenFGA/ReBAC | 具体资源、团队继承、分享和对象关系 |
| PBAC | 动态业务、环境和属性条件 |

## 在 Ontology 系统中的权限分层

推荐将权限拆成多个相互独立的控制点：

```text
OIDC / Keycloak
  └── 认证：确认用户是谁

PostgreSQL RLS
  └── tenant_id：阻止跨租户访问

OpenFGA
  └── 用户、团队、项目与 Ontology Object 的关系权限

PBAC
  └── 数据密级、对象状态、金额、时间、网络与风险策略

应用服务
  └── 字段脱敏、业务不变量、Action 参数与版本校验

Temporal / 工作流
  └── 审批、重试、补偿和长事务状态

Audit Log
  └── 记录谁基于什么权限和策略执行了什么操作
```

### 为什么需要 tenant_id 与 RLS

`tenant_id` 表示组织或客户空间，不等于 `user_id`。一个租户通常包含多个用户、团队和共享资源。

```text
tenant:company-a
├── team:engineering
├── team:sales
├── user:zhangsan
└── user:lisi
```

所有对象、关系、搜索索引、向量、附件和任务都应携带租户范围。RLS 负责数据库层强制隔离，OpenFGA 负责租户内部的对象关系授权。

>[!warning]
>不能仅依赖客户端传入 `tenant_id` 或 `source_id`。服务端必须从已验证身份计算有效租户和资源范围，并在数据库查询、缓存、搜索、图遍历、附件和后台任务中持续传递。

## Ontology 查询流程

读取对象：

```text
1. 认证系统解析 user_id 与 tenant_id
2. PostgreSQL RLS 限制 tenant_id
3. OpenFGA 检查 viewer of object
4. PBAC 检查数据密级、网络和上下文条件
5. 应用层执行属性级过滤与脱敏
6. 返回对象并记录访问审计
```

关系遍历必须对每个目标对象继续执行授权过滤，不能只检查起始对象，否则链接可能暴露无权限实体。

## Ontology Action 流程

执行 [[Actions、Functions 与写回机制|Action]]：

```text
1. OpenFGA：用户是否是该对象的 approver/operator
2. PBAC：金额、状态、时间、风险和环境是否满足规则
3. 业务服务：参数、对象版本和业务不变量是否成立
4. 工作流：是否需要人工审批、重试或补偿
5. 数据库/业务系统：事务性写回
6. 审计：记录主体、策略版本、关系依据、输入和结果
```

Agent 应使用独立主体，例如 `agent:procurement-assistant`，并同时受用户委托范围和 Agent 自身权限上限约束，不能因为用户有权限就让所有 Agent 自动继承全部权限。

## 当前使用 PBAC 时是否需要引入 OpenFGA

### 继续只用 PBAC

满足以下情况时，没有必要为了技术栈完整而引入 OpenFGA：

- 当前策略稳定且容易理解。
- 资源层级简单。
- 很少发生具体对象分享。
- 权限主要由用户、资源和环境属性决定。
- 用户—团队—项目—对象关系没有大量散落在业务代码中。

### 值得引入 OpenFGA

出现以下情况时，说明系统正在自行实现关系授权：

- 用户同时属于多个组织、团队和项目。
- 项目权限需要向任务、文档或 Ontology Object 继承。
- 资源存在 owner/editor/viewer 等对象级角色。
- 需要向某个用户或团队分享具体资源。
- 同一用户在不同项目中拥有不同权限。
- Agent 只能访问被明确授权的一组对象。
- 数据库中逐渐出现多套 `user_resource_permission`、`team_permission`、`resource_parent` 和 `resource_share` 表。

## 渐进式迁移建议

不建议一次性替换现有 PBAC：

1. 保留 PBAC 处理金额、状态、密级、时间和环境条件。
2. 选择一种层级清晰的资源，例如 Project → Document，建立 OpenFGA 模型。
3. 将 owner/member/viewer/share 等关系从业务策略中迁出。
4. 在一段时间内并行执行旧判断和 OpenFGA Check，只记录差异，不影响生产结果。
5. 补充继承、撤权、跨租户和批量检查测试。
6. 差异归零后，由 OpenFGA 接管关系判断，PBAC 继续负责动态条件。
7. 对 Ontology 查询、图遍历、搜索和 Action 分别做越权测试。

## 最终建议

>[!summary]
>如果当前 PBAC 已经稳定解决所有业务需求，不应为了引入 OpenFGA 而重构。只有当团队、项目、分享、父子资源和对象级权限让策略越来越复杂时，才把关系部分交给 OpenFGA。最终形成“RLS 保底隔离、OpenFGA 管关系、PBAC 管条件、业务服务管不变量、工作流管执行、审计管追溯”的分层架构。

## 关联笔记

- [[安全治理与权限]]
- [[Palantir Ontology 核心概念]]
- [[Ontology 资源模型]]
- [[Actions、Functions 与写回机制]]
- [[Ontology 多用户 Agent 分析平台替代方案选型]]

