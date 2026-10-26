---
tags:
  - 技术/软件架构
  - 编程语言
  - 插件系统
created: 2026-10-01
updated: 2026-10-01
status: 整理
aliases:
  - Cordis
  - 时空可组合性
  - Spatiotemporal Composability
source:
  - https://arxiv.org/abs/2608.25512
  - https://github.com/cordiverse/cordis
  - https://github.com/cordiverse/paper
  - https://developer.aliyun.com/article/1758090
---

# Cordis 与动态组件运行时（时空可组合性）

> [!summary] 一句话
> 有一类系统（插件系统、Agent 运行时）需要在**运行过程中**把组件装上、拆下、替换。这件事看起来简单，做对很难：拆掉一个组件时怎么把它带来的所有改动**干净地撤回**？它依赖的东西没了、或者换了，怎么**自动反应**？有一篇 92 页的论文从编程语言理论借了两个概念（effect / coeffect）来正面回答，并实现成框架 **Cordis**——**而 dsh（DeepSeek Harness）就构建在 Cordis 之上**，所以这篇论文讲的是本知识库所用工具的地基。

> [!warning] 本笔记的信息基础
> 我读的是 arXiv 官方摘要、[Cordis 官方 README](https://github.com/cordiverse/cordis)、一篇[逐节解读（阿里云开发者社区）](https://developer.aliyun.com/article/1758090)，以及我在本机 dsh 环境里的实测。**92 页 PDF 本体没有逐页读**，形式化证明部分（演算规则、元理论）我无法替你核对。

## 零、先建立直觉：三个真实的麻烦

不熟悉这个领域没关系，先看三个每个写过插件的人都遇到过的场景。

**麻烦一：卸载不干净。**
一个插件加载时注册了事件监听、开了定时器、注册了服务、写入了共享状态。卸载时你要把这些**全部**撤销。漏一个就是内存泄漏；注册和清理必须手动配对，初始化跑到一半抛异常，你还得知道“前面到底成功了几步”。

**麻烦二：依赖它的组件怎么办。**
插件 A 提供“数据库”能力，插件 B 依赖这个能力。A 被卸载时，B 应该怎么办？更麻烦的是——**B 的清理代码本身可能就是需要用数据库的**（比如把连接还回去）。如果 A 先把能力删了，B 反而清理不掉。

**麻烦三：多个组件交错。**
A 和 B 的操作交错发生：`A1 → B1 → A2 → B2`。现在只卸载 A，你需要撤掉 A1、A2，同时**保留** B1、B2 的效果。这就要求不同组件的改动彼此独立、互不干扰。

论文把麻烦一叫**时间可组合性**（temporal），麻烦二叫**空间可组合性**（spatial）。这不是工程技巧问题，而是**语义**问题：需要一个能说清楚、并且能证明的模型。

## 一、术语速查

先扫一眼，正文里会反复出现。

| 术语 | 通俗解释 | 类比 |
|---|---|---|
| **Effect（效应）** | 组件对环境的**改动** | “我往墙上钉了个钉子” |
| **Revertible Effect（可回滚效应）** | 改动**自带**一个逆操作 | “钉钉子时同时记下怎么拔” |
| **Coeffect（余效应）** | 组件对环境**的需求/依赖** | “我需要墙上有块木板” |
| **Coeffect Specification** | 依赖清单 | “我需要木板 + 锤子 + 梯子” |
| **Fiber** | 组件在运行时的一次实例 | “这次具体装上去的那块板” |
| **Accumulator** | 累积起来的逆操作链，按 LIFO 执行 | “拔钉顺序表，后钉的先拔” |
| **Provider / Consumer** | 提供能力的一方 / 依赖能力的一方 | “供电方 / 用电方” |
| **系统边界** | 能被本系统**独占修改**且能恢复的范围 | “自家院墙内 vs 马路上” |

> [!note] effect 和 coeffect 是从编程语言理论借来的
> 这两个概念原本用于**静态分析**（编译期推断“这个函数会做什么”和“它需要什么环境”）。论文的贡献是**把它们提升为运行时机制**：不再是编译期推断，而是运行时可追踪、可回滚、可响应。coefficient 的原始文献是 Petricek / Orchard / Mycroft 的 *Coeffects: A Calculus of Context-Dependent Computation*（ICFP 2014）。

## 二、这篇论文讲了什么

| 项 | 内容 |
|---|---|
| 标题 | *A Programming Paradigm for Spatiotemporal Composability* |
| 作者 | Yifan Shi（北大 + DeepSeek-AI）、Wei Zhang（北大）、Tianyi Cui（DeepSeek-AI） |
| 提交 | 2026-08-26（v1） |
| 体量 | **92 页**，1 图 2 表 |
| 分类 | cs.PL（编程语言）+ cs.SE；ACM D.2.11 软件架构 / D.3.1 形式定义与理论 / D.3.3 语言构造 |
| arXiv | [2608.25512](https://arxiv.org/abs/2608.25512) |
| 实现 | **Cordis**，论文 PDF 也放在 [deepseek-harness 仓库](https://github.com/deepseek-ai/deepseek-harness/blob/7a71ab9a92cbb36f5e5e08fe6629ee245b84ac45/docs/cordis-paper.pdf) |

### 三个核心机制

**1. 可回滚效应（Revertible Effects）——解决时间维**

一次 effect 被定义为：**接收当前上下文 → 返回新上下文 + 本次修改的逆操作**。

```
Effect A
  执行：  状态0 → 状态1
  逆操作：状态1 → 状态0
```

关键是**逆操作在执行时按当时状态生成**，而不是预先写死。多个 effect 的逆按 **LIFO** 组合：

```
执行：  A → B → C
恢复：  C⁻¹ → B⁻¹ → A⁻¹
```

（这就是为什么它和“资源释放要后进先出”是同一个道理。）运行时把这些逆操作累积成一条恢复链，论文叫 **accumulator**。

**2. 响应式余效应（Reactive Coeffects）——解决空间维**

组件写一份依赖规格。一次上下文变化相对这份规格只有三种结果：

```
不满足 → 满足      activating    （可以激活了）
满足 → 不满足      deactivating  （该停用了）
满足状态没变       neutral
```

所以**依赖不是启动时检查一次**，而是 Provider 出现、消失、被替换时重新判定，并推动组件生命周期。前面“麻烦二”的答案在这里：**Provider 退出必须等 Consumer 清理完**，且 Consumer 在清理期间仍能读到当初绑定的能力（实现里叫 committed view）。

**3. 统一上下文（Context Paradigm）**

把 effect 的上下文和 coeffect 的上下文**合成一个 context type**，所有交互都经由它中介，于是得到一个“观察等价”——不同组件的 effect 交错而互不干扰。上下文还是**递归**的：组件可以在自己上下文下创建子组件，形成树。由此得到一组很漂亮的语义：

```
加载组件  ≈ 执行组件的 effect
卸载组件  ≈ 执行累积的逆操作
父组件    ≈ 管理下一层组件产生的 effect
```

### 组件生命周期与退出顺序

组件（Component）= `d` 需要哪些依赖 + `p` 提供哪些依赖 + `e` 激活后产生哪些 effect。运行时实例叫 **fiber**，状态机：

```
Inactive → Reloading → Active → Unloading → Inactive
```

它处理三件现实的事：**分步初始化**（每步累积逆操作，中途变卦就撤前面的）、**异步执行惯性**（一步已发出就先让它完成，再按最新目标状态决定是否卸载）、**加载失败**（执行已累积的逆操作，回到带错误的状态）。

Provider 退出顺序是全文最实用的一段：

```
Provider 决定退出
   ↓ 停止接受新的依赖绑定
   ↓ 相关 Consumer 开始停用
   ↓ Consumer 仍可用原来的 committed binding 完成清理
   ↓ Consumer 全部退出
Provider 才执行自己的恢复
```

### 边界：不是所有东西都能回滚

> [!important] 系统边界
> 一项改动能不能回滚，取决于两个条件：**系统能否独占修改它** + **改完能否恢复原状**。两者都满足才纳入追踪。
> - **边界内**：只有本系统能改的内存、只有自己访问的临时文件
> - **边界外**：别的进程也能改的文件、已经发出去的网络数据
>
> 跨边界的操作分两类：**资源获取**（`open/close`、`malloc/free`、`fork/kill`）会在系统内留痕（文件描述符、内存块、进程句柄），可以建模成可回滚 effect；**对外输出**（`write`/`send`）一旦出去就收不回，只能靠**延迟提交**（等确定不回滚再发）或**补偿操作**（删掉已建文件、退款）。

## 三、在 Cordis 与 dsh 里的对应物

Cordis 是论文的实现框架。`ctx.effect(callback)` 是核心接口：callback 执行修改时可以返回（或逐步 yield）逆操作，运行时按 LIFO 组合。`ctx.set(key, value)` 提供能力本身也是一次可回滚 effect；`ctx[key]` 由 Proxy 接管并检查依赖声明（未声明 → `UNDECLARED_ACCESS`；声明了但当前无绑定 → `INACTIVE_ACCESS`）；`isolate` / `intercept` 用来给同一个 key 划不同的解析范围。

Component Loader 在上面加一层**声明式配置**：每个 Entry 是 `{id, url, isolate, intercept, config, disabled}`，组成配置树，按变化字段做**增量协调**；HMR（热更新）分三阶段：模块分类（沿 import 图分 accepted / declined）→ 陈旧 Entry 检测 → **事务式重载**（失败就回滚模块缓存和本轮新 fiber，不停在“一半新一半旧”的中间态）。

**dsh 就构建在这套东西上**。以下是我在本机环境里实际观察到的对应关系：

| 论文概念 | Cordis 实现 | 我在本机看到的 |
|---|---|---|
| fiber 生命周期 | `fiber.state` | `FiberState` 枚举：`PENDING / LOADING / ACTIVE / FAILED / DISPOSED / UNLOADING` |
| effect + 逆操作 | `ctx.effect()` | 服务注册一律返回 disposer，如 `registerProvider(...): () => Promise<void>`、`tools.register(): () => void` |
| 配置树 + 增量协调 | Component Loader | `cordis.yml`（空入口）+ `cordis.patch.yml`（补丁层）+ `package.json` 的 `dsh.profile.bundles`（bundle 层） |
| coeffect 规格 | `fiber.inject` | 服务契约里的 `access.optional` / `hardDependency.inject` / `requiresUndefinedCheck` |
| 组件级热更新 | HMR | `hmr` 服务（“Cordis-compatible module configuration and events”），以及 dsh 的 client-plugin HMR receiver |
| 递归上下文（插件加载插件） | 子上下文 | `agentPresets` 能给单个 Agent 挂载/卸载整套插件组（`mount` / `recompose` / `composeFrom`） |
| 只读探针 | Inspect Provider | `cordis_inspect_list` / `cordis_inspect_query`（本次调研就是靠它读到 live Service 契约的） |

## 四、相似技术地图

> [!note] 怎么读这张地图
> 结论先说：**每一块拼图工程界都有先例**，Cordis 新在“把两块合进同一个上下文 + 给出可证性质”。下面按“离它有多近”排。

### 4.1 工业界的动态组件运行时

| 技术 | 像在哪里 | 差在哪里 |
|---|---|---|
| **OSGi**（Java） | 最经典的祖先：bundle 完整生命周期（INSTALLED→RESOLVED→STARTING→ACTIVE→STOPPING→UNINSTALLED）、服务注册表、依赖解析、热部署 | 依赖以启动期解析为主，不是“Provider 一变就重判定”；没有形式化基础 |
| **Eclipse/Equinox、NetBeans Platform** | 插件注册表、扩展点、依赖管理 | 同上，卸载语义一向是老大难 |
| **VS Code 扩展宿主** | `activation events` 就是响应式 coeffect 的工业版：扩展声明“什么时候需要我”，宿主在事件触发时才激活 | 依赖是静态声明的字符串，缺少“没声明就不许访问”的运行时约束 |
| **Erlang/OTP 热代码加载** | 两版本代码服务器、supervision 树、release handling，几十年生产验证 | 空间维弱（supervision 是层级不是依赖图），哲学是“让它崩”而非精确回滚 |
| **Clojure 的 Component / Integrant / mount** | 最贴近“可重载系统”：显式声明依赖、start/stop 有序、REPL 里反复 reload | 顺序靠人工约定，没有“依赖变化自动推动生命周期” |

### 4.2 你已经每天都在用的

- **Vite / Webpack HMR 的 `accept` / `decline`**：论文的模块分类（accepted / declined）几乎是 Vite `import.meta.hot.accept()` / `decline()` 的学术表述——沿 import 图传播、在边界截断。论文的“事务式重载”正是 HMR 想做到但常做不到的“要么全换要么全不换”。
- **React Fast Refresh / `useEffect` 清理函数**：清理按 LIFO 执行，HMR 时重放。
- **Obsidian 插件 API**：见下一节，这个和你关系最近。

### 4.3 理论上的近亲

- **代数效应与处理器（Algebraic effects & handlers）**：Plotkin & Pretnar 起头，Koka、OCaml 5 的 effect handlers、Unison abilities、Effekt 都是这条路。Cordis 的 “effect” 直接借自这里；区别是传统 handler 是**语言内、单次、带作用域**的，Cordis 做成**运行时、跨组件、可累积、可逆**。
- **Coeffect 原始文献**：Petricek / Orchard / Mycroft, *Coeffects: A Calculus of Context-Dependent Computation*（ICFP 2014）——想深挖就读这篇。
- **Dynamic Software Updating（DSU）**：这是“运行时替换组件”在学术界的正名，起点是 Hicks & Nettles 的 *Dynamic Software Updating*（TOPLAS 2005），后续有 Ginseng、Kitsune、UpgradeJ 等。论文的“组件级热更新”属于这个领域。
- **增量计算 / 自调整计算**：Adapton、Salsa（rust-analyzer 靠它做增量）、Jane Street Incremental、differential dataflow——对应“依赖变了只重算受影响部分”。
- **models@run.time 与自适应系统**：INRIA 的 Kevoree（运行时模型驱动的动态重配置）、MAPE-K 自愈环、Milner 的 bigraphical reactive systems。
- **能力（capability）安全**：object-capability 模型、Deno 权限模型、WASI capabilities——和 `ctx[key]` 的 `UNDECLARED_ACCESS` 是同一条纪律：**没声明就不许碰**。

### 4.4 “逆操作”的工程实践（accumulator 的亲戚们）

- **Python `contextlib.ExitStack`**：几乎是 accumulator 的库实现
- **`defer`（Go/Zig）/ RAII（C++）/ `Drop`（Rust）/ `IAsyncDisposable`（C#）**
- **cats-effect 的 `Resource`**、**ZIO 的 `ZLayer` + `Scope`**：我认为 **ZLayer + Scope 是“响应式依赖 + 生命周期”最成熟的工业实现**（声明式依赖图、自动装配、Scope 统一释放）
- **pytest 的 yield fixture**：按声明依赖注入 + LIFO teardown
- **结构化并发**（Trio nursery、Kotlin、Swift TaskGroup、Python TaskGroup）：“取消 + 有序清理”是时间维的孪生兄弟

### 4.5 横向对比

| 技术 | 时间维（可回滚） | 空间维（响应式依赖） | 形式化保证 |
|---|---|---|---|
| OSGi | 部分 | 部分 | ✗ |
| Erlang/OTP | 强 | 弱 | 有（actor 语义） |
| Vite HMR | 强 | 中 | ✗ |
| Obsidian 插件 API | 强 | ✗ | ✗ |
| cats-effect `Resource` / ZIO `ZLayer` | 强 | 强 | 部分（类型层） |
| 结构化并发 | 强 | ✗ | 有 |
| **Cordis（本论文）** | **强 + 可证** | **强 + 可证** | **有（演算 + 元理论）** |

## 五、你已经用过的那个：Obsidian 插件 API

这是最接地气的对照。Obsidian 的 `Plugin` 基类提供：

```js
this.registerEvent(...)      // 注册事件，卸载时自动移除
this.registerInterval(...)   // 注册定时器，卸载时自动清除
this.registerDomEvent(...)   // 注册 DOM 监听
this.register(...)           // 任意清理函数
// onunload() 时运行时统一撤销
```

**这就是“可回滚 effect”的 API 化版本**：不是“记得在卸载时清理”，而是**注册时就把逆操作交给运行时**。我在本库 `.obsidian/plugins/` 里核实到大量真实用法：

- `auto-card-link/main.js`：`this.registerEvent(this.app.workspace.on("editor-paste", ...))`
- `dataview/main.js`：`registerEvent(metadataCache.on("resolve", ...))` + `registerInterval(window.setInterval(...))`
- `calendar/main.js`：对 vault 的 create / delete / rename / modify 四个事件全部 `registerEvent`
- `obsidian-quiet-outline/main.js`：`registerDomEvent(...)` 配 `onunload()`
- **`media-extended/main.js` 自己实现了一个 disposal 容器**（`this._disposal.add(...)`、`onDispose`）——那基本就是论文里的 accumulator

差别在于：Obsidian 这套是**约定**，靠插件作者自觉；Cordis 把它变成**运行时强制的语义 + 可证性质**。调试 Obsidian 插件问题时见 [[技术笔记/编辑器/Obsidian/如何调试遇到的Obsidian错误|如何调试 Obsidian 错误]]。

## 六、阅读顺序建议（写给不熟悉这个领域的人）

按“最容易建立直觉”排序：

1. **Vite HMR 的 accept / decline** —— 你大概率有现成直觉，先看它理解“改动如何被撤销、边界如何截断”
2. **Obsidian 插件 API** —— 就在你手边，看 `registerEvent` 为什么这样设计
3. **本篇论文的摘要**（[arXiv 2608.25512](https://arxiv.org/abs/2608.25512)）—— 只要读懂“两个维度 + effect/coeffect 提升到运行时”这层
4. **Petricek 的 coeffect 论文**（ICFP 2014）—— 想理解理论出处
5. **DSU 综述方向**（Hicks & Nettles, TOPLAS 2005）—— 理解学术正名
6. **ZIO `ZLayer` + `Scope`** —— 看最成熟的工业实现怎么组织依赖图与释放

## 七、别被标题带跑

> [!warning] 媒体框架 vs 论文自陈
> 中文报道把这篇论文包装成 DeepSeek 的**「自进化」蓝图**。但论文自己只在结尾把 **Self-Evolving Agent Harness 列为后续验证方向**，明确说**没做实验**。
> 论文的真正贡献是“给运行时动态组合提供了**可证的性质**”，而不是“Agent 能自己进化了”。

另外论文自己声明的两条局限，值得记住：

1. **案例证据是“能落地”而不是“更快”**。生产案例是 **Koishi**（基于 Cordis 的开源聊天机器人框架，四年积累 4000+ 插件），但作者把这组证据定义为 **existence-and-adoption result**——证明模型能在长期运行、作者众多的大生态里落地，**不能据此说 Cordis 比别的架构性能或效率高多少**。
2. **Koishi 现在跑的是 Cordis v3，论文描述的是 v4**，语义和 Loader 都重新设计过；而且 Cordis 官方 README 明说 **API 还不稳定**。

## 参考资料

- [论文：A Programming Paradigm for Spatiotemporal Composability (arXiv:2608.25512)](https://arxiv.org/abs/2608.25512)
- [Cordis 框架（GitHub）](https://github.com/cordiverse/cordis) · [论文仓库](https://github.com/cordiverse/paper)
- [论文 PDF（deepseek-harness 仓库内）](https://github.com/deepseek-ai/deepseek-harness/blob/7a71ab9a92cbb36f5e5e08fe6629ee245b84ac45/docs/cordis-paper.pdf)
- [解读 Cordis：dsh 一切皆插件背后的运行时设计（阿里云开发者社区，2026-08-25）](https://developer.aliyun.com/article/1758090)
- [Coeffects: A Calculus of Context-Dependent Computation (ICFP 2014)](https://acm-stag.literatumonline.com/doi/10.1145/2628136.2628160)
- [Kevoree：运行时模型驱动的动态重配置（INRIA）](https://radar.inria.fr/rapportsactivite/RA2017/diverse/uid50.html)
- [Cordis 入门文档（dsh 官方）](https://deepseek-harness.github.io/deepseek-harness/reference/cordis-primer)

---

> [!tip] 相关笔记
> [[技术笔记/技术笔记|技术笔记]] · [[技术笔记/编辑器/Obsidian/一些小技巧|Obsidian 一些小技巧]] · [[大模型/09-Agent/2026 Agent 技术与论文追踪|2026 Agent 技术与论文追踪]] · [[Home|Home]]
