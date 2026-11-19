---
tags:
  - Palantir
  - Ontology
  - Foundry
  - 产品化
  - 交付模式
created: 2026-11-19
updated: 2026-11-19
status: 初稿
source:
  - https://www.palantir.com/docs/foundry/devops/core-concepts
  - https://www.palantir.com/docs/foundry/object-link-types/marketplace-ontology-types
  - https://www.palantir.com/docs/foundry/ontology/overview
  - https://www.palantir.com/docs/foundry/ontologies/shared-ontologies
  - https://www.mbtmag.com/industry-4-0/news/22863962/palantir-launches-foundry-for-manufacturing-on-aws
  - https://blog.palantir.com/palantir-and-l3harris-b79b3e95dce7
  - https://www.heise.de/en/background/Missing-link-Power-center-Palantir-a-software-controls-organizations-10463503.html?seite=2
  - https://www.8vc.com/resources/the-ai-services-wave-lessons-from-palantir-in-the-new-age-of-ai
  - https://api.cmoney.tw/notes/note-detail.aspx?nid=1194503
  - https://cloud.tencent.cn/developer/article/2752026
  - https://cloud.tencent.com.cn/developer/article/2709959
  - https://www.pwc.com/gx/en/about/assets/palantir-ai-implementation-and-engineering-services.pdf
aliases:
  - Palantir 行业本体
  - 本体交付模式
  - 行业模板与定制
---

# Palantir 本体交付形态：行业模板、片段与现场定制

> [!summary] 一句话
> 不是「每个现场从零开发」，也不是「化工一套、电力一套直接通用」。实际是三层：**平台元模型（强通用）+ 行业标准本体/本体片段（可安装产品）+ 现场语义与集成（不可复用）**。行业本体确实存在，但它是「骨架 + 逻辑」，安装时必须重新绑定现场数据与权限。

## 一、问题从哪来

常见的两种误解：

- **误解 A**：Palantir 有化工、电力、制造各一套本体模板，同行业客户装完就能用。
- **误解 B**：Palantir 每个项目都在现场从白纸开始建模，没有任何复用。

两种都不对。翻官方文档里 Foundry DevOps 的 Product 定义，答案就在字面上。

## 二、官方原文：行业本体是一种「产品」

Foundry DevOps 的 Product 类型中，Ontology 一项写的是：

> **Ontology:** An instance of the Foundry Ontology, whether a **comprehensive standard industry ontology** or an **ontology fragment**.
> —— [Foundry DevOps · Core concepts](https://www.palantir.com/docs/foundry/devops/core-concepts)

同一页还明确了三件事：

- 产品可以有输出（content），但安装时**往往需要安装者映射 inputs**：*"Products may require that installers map inputs in order to produce output content."*
- 一个产品可以**安装多次**，每次绑定不同的输入数据和环境设置（发布通道、升级窗口）：*"Each product can be installed multiple times … each with their own input data and environment-specific settings."*
- Store 分本地与远端，远端例子是 **Foundry Store（由 Palantir 维护、对所有 Foundry 用户开放）**。

也就是说：**行业本体是「可安装的产品」，安装动作本身就是「绑定现场」**。

再看 Marketplace 打包能力的边界，官方写得很直白：

> "Objects themselves **cannot be packaged** with Marketplace… However, datasets and object types **can** be packaged in order to create new objects after installation."
> —— [Add Ontology types to a Marketplace product](https://www.palantir.com/docs/foundry/object-link-types/marketplace-ontology-types)

**能打包的是类型、逻辑、应用；不能打包的是对象实例。** 这一条基本决定了「模板永远需要现场落地」的性质。

## 三、三层结构：哪些通用、哪些可复现、哪些必须现场做

| 层 | 内容 | 通用性 | 交付方式 |
|---|---|---|---|
| 平台元模型 | Object / Link / Action / Function / 动态安全 / 应用层 | **强通用**，跨行业同一套 | 平台本身 |
| 行业本体与片段 | 设备层级、工单、批次、点位、供应链计划等骨架；以及 Use Case、Pipeline、Model 类产品 | **中等**，同行业可复用，跨行业只复用模式 | Foundry DevOps 打包 → Marketplace 安装 → 版本升级 |
| 现场语义与集成 | 资产编码、工艺路线、组织与权限、DCS/SCADA/MES/ERP/GIS 接口、决策规则 | **不可复用** | FDE 驻场建模 + 客户团队维护 |

官方对 Ontology 的定义也印证第一层与第三层的分工：它把数据集与模型**映射**到真实世界对应物（工厂、设备、产品、订单……），并叠加语义（对象/属性/链接）与动力（Action/Function/动态安全）——[Ontology Overview](https://www.palantir.com/docs/foundry/ontology/overview)。映射关系天然是客户专属的。

## 四、行业「加速器」确实成体系

说 Palantir「完全没有行业模板」同样不对，它的行业产品化程度比多数人以为的高：

- **制造业**：`Foundry for Manufacturing on AWS`（2023 年发布，主打 IT/OT 融合、可追溯数据模型、闭环运营应用）——[发布报道](https://www.mbtmag.com/industry-4-0/news/22863962/palantir-launches-foundry-for-manufacturing-on-aws)。
- **制造 OS**：`Warp Speed` 直接叫 "manufacturing operating system"，用在 L3Harris、Lear 的产线上——[Palantir × L3Harris](https://blog.palantir.com/palantir-and-l3harris-b79b3e95dce7)。
- **供应链**：`Foundry for Supply Chain Resiliency` 白皮书，讲跨行业可部署。
- **银行**：`Foundry for Customer-Centric Banking` 白皮书，以「客户」对象为核心的参考模型。
- **生态加速器**：PwC、Unit8、Fourth Age 等实施伙伴公开宣传 "industry accelerators"、"ontology-led problem solving"——[PwC 报告](https://www.pwc.com/gx/en/about/assets/palantir-ai-implementation-and-engineering-services.pdf)。

这些更接近「先有基础模板/加速包，再定制」。但要注意两点：

1. **行业粒度很粗。** 制造业内部，流程工业、离散制造、汽车、航空的差别，可能比「制造业 vs 电力」还大。
2. **没有公开的「化工本体 v1」清单。** 官方给的是通用机制（标准行业本体 + 片段 + 安装）和若干行业打包方案，不等于每个垂直行业都有一份成熟本体产品。

## 五、为什么必须现场做

### 1）同行业内部的差异，比跨行业还大

化工里，一家综合化工集团和一家农药中间体厂的「批次（Batch）」在语义、粒度、质量判定上完全不同；电力里，输电、配电、新能源运营商的「资产/馈线/变电站」模型和监管口径也不同。再加上多工厂、多 ERP、多 MES/historian、多编码体系——**模板能统一骨架，统一不了语义**。

### 2）定义与实例分离，决定了「装完还得接」

行业本体交付的是类型与逻辑；到了现场，要接数据源、做属性映射、配动作权限、调 UI。中文圈有一篇讲得很透：华东工厂的用例要复制到华南，华南的 ERP 连接、WMS 编码、身份组、通知目标全都不同，直接复制三个月后就变成两套无法同步的系统；正确做法是拆成「产品核心层 / 可配置业务差异层 / 环境绑定层 / 运行状态层」四层再安装——[Palantir Study 29](https://cloud.tencent.cn/developer/article/2752026)（二手解读，但与官方 Product/Installation 模型对得上）。

### 3）商业定位决定它不能卖「成品本体」

Palantir 部署策略师公开讲过「SaaS 已死」：传统 ERP/SCM 厂商给一套通用模板，结果企业只能靠 Excel 打补丁、把差异化能力让渡给标准化软件；Palantir 卖的是 Ontology 抽象层 + FDE 现场构建（[报道](https://api.cmoney.tw/notes/note-detail.aspx?nid=1194503)）。如果它自己卖「开箱即用的行业本体」，就变成了它批判的对象，也会被标准化压价——**语义建模能力正是它的竞争壁垒**。

### 4）交付事实是 FDE 先「铺土路」，产品团队再「修高速」

德国 heise 的深度报道：构建本体和初始数据集成很复杂，通常需要 IT、业务部门与 Palantir 紧密协作，客户会被分配 **Forward Deployed Engineers** 驻场做技术集成（[heise](https://www.heise.de/en/background/Missing-link-Power-center-Palantir-a-software-controls-organizations-10463503.html?seite=2)）；8VC 的复盘也强调 FDE 是「把平台配置到客户独特需求上」（[8VC](https://www.8vc.com/resources/the-ai-services-wave-lessons-from-palantir-in-the-new-age-of-ai)）。中文圈那篇《为什么不存在一个"完美的本体论产品"》把这个逻辑讲得更尖锐：**产品不是建模的起点，而是建模的终点**（[凯叔Kev · 番外六](https://cloud.tencent.com.cn/developer/article/2709959)，二手解读）。

化工的 Hexion 是个好例子：他们在 AIPCon 上讲的是「为价值链上每个角色定制一套 Iron Man 战衣」，靠 Ontology + AIP + 前线部署工程实现——**同一行业，每家的战衣都不一样**（[AIPCon 记录](https://www.investing.com/news/transcripts/palantir-at-aipcon-11-ai-shifts-from-talk-to-operations-93CH-4896825)）。

### 5）复用单元是「片段/模式/应用」，不是「整厂本体」

官方 Product 类型里，除了完整行业本体，还有 **ontology fragment**、**Use Case**（一个 Workshop 应用或组合）、**Pipeline**、**Model**。这说明真实复用发生在更小粒度上：一个「缺料处置」应用、一段「工单闭环」流程、一组「设备-点位」对象类型。**先有小颗粒的可复用产品，才有行业级本体的沉淀**，顺序不能倒。

## 六、判断框架：按「标准化程度」而不是「行业」分

| 场景类型 | 例子 | 模板化程度 | 交付形态 |
|---|---|---|---|
| 高标准化 | 财务记账、薪酬、库存台账、工单状态机 | 高，接近「装完配置即用」 | 行业本体 + 输入映射 |
| 中等 | 供应链计划、制造执行、设备维护 | 中，通常覆盖大部分骨架 | 行业参考本体 + 片段 + 现场配置 |
| 低标准化 | 定价策略、工艺配方、调度规则、风险偏好、跨域推演 | 低，必须从决策倒推范畴 | FDE 现场建模，产品仅提供模式与工具 |

一个经验判断：**离「行业标准流程」越近，越像产品；离「企业独有决策语义」越近，越像项目。**

## 七、对自研本体平台的启示

> [!tip] 可迁移的部分
> 能产品化的是元模型、工具链、行业参考片段与安装/升级机制；不能产品化的是客户独有的语义。

- **元模型要薄而稳**：对象/关系/动作/函数/权限五件套定清楚，行业差异放在模型之上，而不是改元模型。
- **复用单元先做小**：先沉淀「模板 + 片段 + 应用」三类产品，别一上来做「全行业本体」。
- **把可变部分做成配置层**：输入映射（input mapping）、环境绑定、升级通道、回滚策略，才是 Marketplace 真正的价值。
- **现场建模要可沉淀**：每个项目结束，把跑通的模式抽成片段回库，否则永远是从零开始。
- **别承诺「开箱即用」**：语义损耗（业务认知 → 系统实现）只能靠人填，工具能降低但不能消除。

## 八、证据强度说明

> [!note] 哪些是官方原文，哪些是二手
> - 官方：Product 定义、安装需映射 inputs、对象不可打包、Foundry Store、Ontology 定义、行业打包方案（制造/供应链/银行）。
> - 二手：heise、8VC、cmoney、AIPCon 记录属于媒体报道或访谈；`Palantir Study 29`、`番外六` 是中文社区的教学式解读（「恒川工业」等案例为演示性质）。
> - 本文的「三层结构」「判断框架」「自研启示」是基于上述材料的归纳，不是 Palantir 官方口径。

## 相关笔记

- [[Palantir Ontology 能力全景]]（F9 Marketplace、J4 产品化）
- [[Ontology 能力核对清单]]
- [[OSDK 与应用开发]]
- [[Palantir Ontology 核心概念]]
- [[Ontology 资源模型]]
