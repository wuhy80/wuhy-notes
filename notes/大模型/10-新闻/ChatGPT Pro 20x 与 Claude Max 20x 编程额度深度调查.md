---
title: ChatGPT Pro 20x 与 Claude Max 20x 编程额度深度调查
created: 2026-08-01
updated: 2026-08-02
tags:
  - 大模型/订阅
  - 大模型/Agent
  - 编程工具
source:
  - https://help.openai.com/en/articles/11369540-codex-in-chatgpt
  - https://help.openai.com/en/articles/9793128-what-is-chatgpt-pro
  - https://help.openai.com/en/articles/20001106-codex-rate-card
  - https://claude.com/pricing
  - https://www.anthropic.com/news/higher-limits-spacex
status: active
---

# ChatGPT Pro 20x 与 Claude Max 20x 编程额度深度调查

> [!warning] 时效与结论边界
> 本文调查截止 **2026-08-02**，并在第二轮证据审计后修正。订阅额度是服务端动态策略，不是固定 API token 包；官方可能按模型、负载、地区、推广活动和账户状态调整限制。文中 `API-equivalent` 是社区按 API 价格估算的等值，不是厂商承诺，也不是可提取余额。

## 结论先行

| 维度 | ChatGPT Pro 20x / Codex | Claude Max 20x / Claude Code |
|---|---|---|
| 月价 | 官方 Pro `$200` 档；相对 Plus 为 20x usage allowance | Max 20x Web 订阅 `$200/月`；移动端可能不同 |
| 额度形态 | Codex、ChatGPT Work、Excel、Workspace Agents 共享 agentic usage/credit pool | Web、desktop、mobile 与 Claude Code 共享 pool；rolling 5h 外另有 weekly limits |
| 官方公布的绝对 token | 未公布固定 token 包 | 未公布固定 token 包 |
| 官方计量规则 | 2026-04 起主要按 input/cached input/output token 映射为 credits | 官方不公开套餐换算公式；超限可按 standard API rates 使用 usage credits |
| 社区单账户估算 | 有用户报告约 `$2,200/week` API-equivalent，但无 raw logs 和计算过程 | alpha meter 曾估约 `$1,300-$1,900/week`，但 weekly 只有约一个完整观测 |
| 计量可审计性 | dashboard、credits 与 token rate card；included credits 总额仍不公开 | transcript 可记录 input/output/cache creation/cache read/requestId，但必须去重 |

**稳健判断**：公开资料无法给出两个套餐可泛化的“正常周容量”，也无法证明谁稳定领先。`$2,200/week` 与 `$1,300-$1,900/week` 都是真实社区原话，但来自不同时间、模型、计量体系和单一账户，只能说明套餐在特定重度工作流下可能产生远高于月费的 API 标价等值使用量。

## 1. 先统一产品定义

这里的“GPT 20x”按 **ChatGPT Pro `$200` 档中的 Codex 编程使用**理解，而不是 API 账户，也不是普通 ChatGPT 对话额度。

- OpenAI 官方帮助文档称 Codex 包含在 ChatGPT 各计划中，额度随计划变化。
- OpenAI 现行 Pro 帮助文档明确：Pro `$100` 为 Plus 的 5x usage，Pro `$200` 为 Plus 的 20x usage。这里是 usage allowance 倍率，不是价格倍率，也不表示每个模型 bucket 都严格 20x。
- ChatGPT 普通模型、图片、上传、普通 Voice 等限制不能直接当成 Codex 限制。
- Claude 侧比较的是 **Claude Max 20x `$200/月` Web 订阅 + Claude Code**，不是 Claude API 充值，也不是 Max 5x。

### 1.1 两个“20x”不是同一个单位

| 产品 | 20x 的基准 | 官方明确的时间口径 | 能否直接互换 |
|---|---|---|---|
| ChatGPT Pro `$200` | ChatGPT Plus 的 usage allowance | 当前可访问 Pro 页面未把 20x 明确拆成统一 5h/weekly 绝对额度 | 不能 |
| Claude Max 20x | Claude Pro 的 usage | 明确为每个 rolling 5-hour session 相对 Pro 20x，另有 weekly limits | 不能 |

因此，“两边都叫 20x”只代表各自相对基础套餐的产品分层，不代表 token、credits、消息数、任务数或每周容量相等。

## 2. 官方事实

### 2.1 OpenAI / Codex

官方页面：[Using Codex with your ChatGPT plan](https://help.openai.com/en/articles/11369540-codex-in-chatgpt)，访问于 2026-08-02。

已确认：

- Codex 可通过 desktop app、CLI、IDE extension 和 web 使用。
- Codex、ChatGPT Work、ChatGPT for Excel、Workspace Agents 在计划支持时共享同一个 agentic usage and credit pool。
- 单个 Codex task 的消耗取决于工作大小、复杂度、模型和运行位置；小脚本可能只消耗 allowance 的一小部分，大型代码库、长任务和 extended session 会消耗更多。
- 接近或触达限制时，应查看 Settings 中的详细 usage 或 limit banner；部分 Plus/Pro 用户可以加购 credits，或者等待 reset。
- 页面明确说线程上的 estimated dollar conversion 是 planning estimate，不是 invoice。
- 达到限制时，正在执行的 active turn 可能继续完成，但后续需要 credits、reset、升级或等待重置。

官方 Pro 页面：[About ChatGPT Pro tiers](https://help.openai.com/en/articles/9793128-what-is-chatgpt-pro)。

- Pro `$100` 和 Pro `$200` 的核心能力相同，主要差异是 usage allowance。
- Pro `$200` 是 Plus 的 20x usage tier；Plus 为 `$20/月`，所以订阅价格实际是 10 倍。
- 不同模型可能拥有 separate usage allowances；触达某模型 allowance 后，需等待页面显示的 reset，不能通过设置强行绕过。

#### 当前 Codex token-based rate card

[Codex rate card](https://help.openai.com/en/articles/20001106-codex-rate-card) 说明，2026-04-02 起 Plus、Pro、Business 和新 Enterprise 从平均 per-message 估算迁移到 token-based credits；2026-04-23 扩展至其余相关 Enterprise 计划。

| 模型 | 1M input | 1M cached input | 1M output |
|---|---:|---:|---:|
| GPT-5.6 Sol | 125 credits | 12.5 credits | 750 credits |
| GPT-5.6 Terra | 50 credits | 5 credits | 300 credits |
| GPT-5.6 Luna | 5 credits | 0.5 credits | 30 credits |

- Codex 不对 cache writes 收取 credits。
- 官方称典型 GPT-5.6 Sol task 可能消耗 `5-40 credits`，但实际取决于 token mix、模型、Fast Mode、任务和附加 agents。
- Fast Mode 通常消耗更多 credits；Code review 使用单独指定模型。
- [Using Credits for Flexible Usage](https://help.openai.com/en/articles/12642688) 明确先用套餐 included usage，触限后才消耗购买的 credits；credits 有效期 12 个月且不是 API credits。

**仍不能从官方页面确认**：Pro 20x 的 included credits 总额、固定 raw-token 上限、5h/weekly 绝对额度、普通 reset 的统一时间、1 credit 的固定购买美元价。Developer pricing 页面在本次环境受 Vercel mitigation 返回 `403`，这不代表页面不存在。

### 2.2 Anthropic / Claude Code

[Claude Pricing](https://claude.com/pricing) 与 [What is the Max plan?](https://support.claude.com/en/articles/11049741-what-is-the-max-plan) 可确认：

- Max 20x Web 订阅为 `$200/月`，移动端价格可能不同。
- Max 20x 是相对 Pro **每个 5-hour session 的 20x usage**，不是固定 token 数。
- 所有计划使用 rolling five-hour session window；付费计划在此之上另有 weekly limits。
- Web、desktop、mobile 与 Claude Code 从同一个 usage pool 扣除。
- 官方明确说没有 fixed message count，消耗取决于对话长度、复杂度、模型和功能。
- Claude Code 包含在付费计划中，并与聊天共享 limits。

[Manage usage credits for paid Claude plans](https://support.claude.com/en/articles/12429409-manage-usage-credits-for-paid-claude-plans) 可确认：included usage 用完后可切换为 usage credits，按 standard API rates 另行收费；usage credits 不改变正常 5h reset 时间。若 Claude Code 通过 `ANTHROPIC_API_KEY` 认证，则走独立 API 账单，不消耗订阅 included usage。

官方公告：[Higher usage limits for Claude and a compute deal with SpaceX](https://www.anthropic.com/news/higher-limits-spacex)，发布日期 **2026-05-06**。

已确认：

- Anthropic 当天宣布将 Pro、Max、Team 和 seat-based Enterprise 的 Claude Code **five-hour rate limits 翻倍**。
- 同时取消 Pro 和 Max 账户在 peak hours 的 limit reduction。
- 公告说明这些变化与新增 compute capacity 有关。

**关键边界**：公告只说 five-hour rate limits 翻倍，没有公布 Max 20x 的绝对 token 数、美元等值或 weekly limit；不能把“5 小时翻倍”推导为“周额度也翻倍”。

Anthropic 不同官方页面对 weekly model buckets 的描述曾存在不一致，因此本文只确认“有 weekly limits”，不确认所有账户统一采用哪种模型 bucket 或绝对额度。实际账户以 `Settings > Usage` 和 Claude Code `/usage` 为准。

## 3. “量”到底有多少

### 3.1 可参考但不可泛化的社区估算

| 侧 | 社区原话 | 证据等级 | 严格解释 |
|---|---:|---|---|
| Codex Pro 20x | 约 `$2,200/week` API-equivalent | C：低 | HN 单用户自报，使用 GPT-5.6 Sol；无 raw logs、公式、截图和稳定 reset 基线 |
| Claude Max 20x | 约 `$1,300-$1,900/week` API-equivalent | C：低 | `claude-meter` 作者早期单账户估算；11 个样本是 5h windows，weekly 仅约一个完整观测 |
| Claude Max 20x | weekly 91% 约 `$1,500` | D：很低 | HN 二手项目描述，无计算方法，不能作为独立交叉验证 |

不能用这些数据计算套餐胜负。它们分属不同日期、模型、任务、cache 结构和服务端政策；观察期还受到 reset、promotion、升级 entitlement 错配和计量回归污染。目前没有同 repo、同 commit、同任务、同 effort 的公开 head-to-head 容量测试。

### 3.2 官方数字能算到哪一步

OpenAI 已公布 Codex 的 token 到 credits 映射，因此单次任务可以复算。例如 GPT-5.6 Sol 的某任务若使用 `1M input + 5M cached input + 100k output`，按当前 rate card 计算：

```text
125 + 5 * 12.5 + 0.1 * 750 = 262.5 credits
```

但因为 Pro 20x 的 included credits 总额未公开，仍不能据此算出套餐能完成多少个此类任务。官方给出的典型 GPT-5.6 Sol task 为 `5-40 credits`，也只是 task 级经验区间。

Claude 官方连套餐内部的 token-to-usage 换算表也未公开，因此只能从登录后的 usage 百分比观察消耗，不能仅凭 transcript token 精确反推出剩余套餐额度。

### 3.3 折算为工作时间时不要线性外推

社区样本只能支持以下体验判断，而不是容量承诺：

- 普通短任务：消耗通常低于大型 agent workflow，但不能可靠换算为固定可用小时或消息数。
- 中型 feature：一次任务可能消耗几分钟到数小时的 allowance；“一条 prompt”不等于一次低成本请求，Agent 会产生大量 tool calls、上下文重送和补丁验证。
- 大型 repo/多 agent：可能在一个 5 小时窗口内明显消耗额度，甚至因 cache miss、compaction 或错误重试导致异常加速。
- 周容量不能简单除以“每小时成本”，因为 session window 和 weekly cap 是不同约束。

## 4. Claude 的 token 与 cache 计量陷阱

Claude Code transcript 通常能区分：

- `input_tokens`
- `output_tokens`
- `cache_creation_input_tokens`
- `cache_read_input_tokens`

GitHub 用户审计报告中，cache read 可能占绝大多数，但对额度的影响与 fresh input、cache creation 不同。另有 issue 报告 full-prefix cache rewrite 会短时间写入几十万 token，快速消耗 5 小时窗口；这是异常案例，不代表所有账户的正常规则。

分析 Claude transcript 时必须：

1. 按 `requestId` 去重，同一 usage object 可能在多个 assistant records 中重复。
2. 分别统计 fresh input、cache write、cache read、output。
3. 记录 cache TTL、context size、idle gap、model、effort 和 subagent 数量。
4. 把主 agent、subagent、重试和工具输出分开。

在该 issue 的 transcript 结构中，不按 `requestId` 去重会高估约 2 倍。该结论适用于所审计样本，不应无条件外推到所有版本。

## 5. Codex 的计量陷阱

Codex 的官方描述比 Claude 更黑盒：

- dashboard 通常显示 allowance 百分比与 reset 信息，而不是公开 raw token 账单。
- local、cloud、CLI、IDE、desktop 与 ChatGPT Work 等入口可能共享 agentic pool，但任务成本不同。
- 模型、reasoning level、代码库大小、扩展上下文、并发 subagent、测试日志和重复修复都会影响消耗。
- 线程级美元数字是估算，不能作为 API invoice。
- GitHub 用户曾报告 dashboard 百分比与本地 telemetry 不一致、类似任务在不同时间消耗速度不同；社区 tracker 也记录了多次 reset/promotion。这些报告未全部获得厂商确认。

因此“weekly 剩余 91%”只能说明该账户仪表盘当时的状态，不能反推准确 token 数。

## 6. 统一比较模型

设一次 coding session 的工作量为：

```text
等值成本 = fresh_input / 1M * P_input
         + cache_write / 1M * P_cache_write
         + cache_read / 1M * P_cache_read
         + output / 1M * P_output
```

实际比较时还要记录：

- 完成任务的成功率、测试通过率和人工返工时间。
- 首次响应延迟、工具调用次数和总 wall-clock time。
- context size、是否 compaction、cache 命中率、是否并发 subagent。
- 5 小时窗口消耗、weekly 消耗、reset 时间和是否出现异常计量。

建议将 workload 固定为三档：

| 档位 | 典型任务 | 必测指标 |
|---|---|---|
| S | 单文件 bug、短函数、少量测试 | prompt 数、tool calls、token、耗时、通过率 |
| M | 中型 feature、跨 3-10 个文件、完整测试 | fresh/cache token、重试、上下文、session/weekly 消耗 |
| L | 大型 repo 重构、多 agent、长时间测试 | 并发数、cache rewrite、compaction、总成本、最终质量 |

**不得用“消息数量”直接比较**。Claude 一条消息可能触发许多 tool calls；Codex 的一个 task 也可能长时间运行。

## 7. 采购建议

### 选择 Codex Pro 20x 的合理条件

- 主要工作是普通日常 coding、代码 review、测试修复。
- 希望用官方 token-based credits 清楚区分 input、cached input 和 output。
- 能接受 included credits 总量和 5h/weekly 绝对额度不公开。
- 已经使用 OpenAI/Codex 的 CLI、IDE 或 desktop 工作流。

### 选择 Claude Max 20x 的合理条件

- 主要工作是超长上下文、大型跨文件理解和持续型 Claude Code workflow。
- 需要从 transcript 审计 input/output/cache/requestId。
- 愿意主动控制 context、compact、cache TTL、subagent 和并发。
- 接受 Claude Chat 与 Claude Code 共享同一 pool，并主动管理 weekly/5h 限制。

### 最稳妥的组合

对每天连续使用 coding agent 的个人，双供应商通常比单押一侧更稳：

- Codex 负责短任务、代码 review 和常规修复。
- Claude Code 负责长上下文分析、复杂重构和需要可审计 transcript 的任务。
- 任何一侧出现 server-side regression、限流或服务故障时，另一侧作为 fallback。

## 8. 最终判定

> **如果只问“套餐给的量大概多少”：官方答案是两边都没有公开固定 token 或消息总量。社区有人分别报告约 `$2,200/week` 和 `$1,300-$1,900/week` 的 API 标价等值，但证据不足以把它们当作中心值、正常区间或采购保证。**

> **如果只问“哪个更值”：现有公开容量数据无法判定。应按模型任务完成质量、个人工作流适配、5h/weekly 实际消耗和超限付费成本做 1-4 周账户实测；若要求稳定满负荷，双供应商比单押更抗限流和策略波动。**

## 9. 证据与来源

### 官方来源

- [OpenAI：Using Codex with your ChatGPT plan](https://help.openai.com/en/articles/11369540-codex-in-chatgpt)：共享 agentic pool、任务成本变量、credits、reset、线程估算与入口。
- [OpenAI：About ChatGPT Pro tiers](https://help.openai.com/en/articles/9793128-what-is-chatgpt-pro)：Pro `$100` 为 Plus 5x，Pro `$200` 为 Plus 20x，模型可能有独立 allowance。
- [OpenAI：Codex rate card](https://help.openai.com/en/articles/20001106-codex-rate-card)：当前 token-based credit rates、典型 task credits 和 legacy rate card。
- [OpenAI：Using Credits for Flexible Usage](https://help.openai.com/en/articles/12642688)：included usage 优先、共享 credits、有效期和超限续用。
- [Anthropic：Higher usage limits for Claude and a compute deal with SpaceX](https://www.anthropic.com/news/higher-limits-spacex)：2026-05-06，Claude Code 五小时 rate limit 翻倍、取消 Pro/Max peak-hours reduction。
- [Claude Pricing](https://claude.com/pricing)：Max 相对 Pro 的 5h usage、rolling 5h、weekly limits、共享 pool 和无固定消息数。
- [Anthropic：What is the Max plan?](https://support.claude.com/en/articles/11049741-what-is-the-max-plan)：Max 5x/20x Web 订阅价格。
- [Anthropic：Manage usage credits](https://support.claude.com/en/articles/12429409-manage-usage-credits-for-paid-claude-plans)：超限后 standard API rates、独立收费与 reset 规则。

### 社区与实测来源

- [openai/codex issue #36468](https://github.com/openai/codex/issues/36468)：Pro 20x、指定模型、长会话和 dashboard/local meter 不一致样本。
- [Hacker News item 48963639](https://news.ycombinator.com/item?id=48963639)：约 `$2,200 API-equivalent/week` 的 Codex 单用户估算，无公开计算方法。
- [Hacker News item 47536527](https://news.ycombinator.com/item?id=47536527)：Claude Max 20x 单账户 alpha meter 讨论，早期估约 `$1,300-$1,900/week`。
- [Hacker News item 48510142](https://news.ycombinator.com/item?id=48510142)：weekly 91% 约 `$1,500` 的二手社区说法，无计算方法。
- [claude-meter](https://github.com/abhishekray07/claude-meter)：Claude transcript/usage meter 的开源测量工具与讨论入口。
- [FreeCAD in browser](https://magik.net/freecad/)：Claude Code/Fable 大型真实工程案例，含公开 transcript。
- [anthropics/claude-code issue #82563](https://github.com/anthropics/claude-code/issues/82563)：cache rewrite、requestId 去重和异常消耗审计。
- [Codex Resets](https://codex-resets.com/)：reset、promotion 和计量回归的社区追踪，非官方来源。

## 10. 第二轮审计修正

2026-08-02 对所有关键数字逐条回查后作出以下修正：

- 撤回“Codex 正常容量比 Claude 高 15%-70%”，基础样本不可比。
- 删除 `$13k-$15k/month`，列出的来源没有直接给出该数字。
- 将 `$2,200/week` 与 `$1,300-$1,900/week` 从“正常容量”降级为低可信度单账户估算。
- 明确 `claude-meter` 的 11 个样本是 5h windows，不是 11 个 weekly cycles；weekly 观测约为一个周期。
- 将 Claude cache rewrite、Codex meter mismatch 等内容限定为用户 issue 报告，而不是厂商确认的通用规则。
- 新增 OpenAI 官方 token-based rate card，以及 Anthropic 官方 shared pool、rolling 5h、weekly limits 和 usage credits 规则。

## 11. 后续复核清单

- [ ] OpenAI developer pricing 页面恢复后，补录 Pro 20x 当前 included credits 和 5h/weekly 绝对额度；若仍未公开则保持 unknown。
- [ ] 持续复核 Anthropic weekly model bucket 描述冲突，具体账号以 `Settings > Usage` 为准。
- [ ] 用同一 commit、同一任务、同一模型 effort 做 Codex/Claude Code head-to-head 测试。
- [ ] 对 Claude transcript 按 `requestId` 去重并单列 cache read/write。
- [ ] 连续记录至少 4 周 dashboard 的 5h、weekly、reset 和任务类型，形成个人真实基线。
