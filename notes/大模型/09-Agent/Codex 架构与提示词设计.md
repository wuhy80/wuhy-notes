---
tags:
  - 大模型/Agent
  - Codex
  - CodingAgent
  - 提示词工程
  - 架构
created: 2026-11-19
updated: 2026-11-19
status: seed
source:
  - https://github.com/openai/codex
  - https://github.com/openai/codex/blob/main/codex-rs/docs/protocol_v1.md
  - https://github.com/openai/codex/blob/main/codex-rs/core/gpt-5.2-codex_prompt.md
  - https://github.com/openai/codex/blob/main/codex-rs/models-manager/prompt.md
aliases:
  - Codex
  - Codex CLI
  - codex-rs
---

# Codex 架构与提示词设计

> [!summary] 一句话
> Codex 不是一个模型，而是「服务端模型 + 本地 agent runtime」。真正的工程难点集中在三件事：**Turn 循环**、**沙箱与审批**、**上下文管理**；系统提示词则按模型版本分发，只保留 harness 独有的差异。

## 一、形态：模型在服务端，运行时在本地

仓库里有两条线：

- `codex-cli/`：TypeScript/npm 那套早期实现，现在是发布壳；
- `codex-rs/`：Rust 重写的主体，100+ 个 crate 的 workspace，逻辑几乎都在这里。同时用 Cargo 和 Bazel 构建，按公司级 monorepo 在维护。

模型是托管在服务端的 GPT-5.x-Codex，本地这层负责「组织上下文 → 调模型 → 执行工具 → 管权限 → 存会话」。入口不止一个：

- **TUI**：交互式终端界面；
- **`codex exec`**：非交互模式，输出 JSONL，适合 CI 和脚本；
- **`codex app-server`**：JSON-RPC 服务，IDE 插件和 SDK 的地基；
- **`codex cloud`**：把任务搬到云端跑，结果 `apply` 回本地；
- **`codex mcp`**：反过来把自己当 MCP server 暴露出去。

## 二、整体架构

<img class="site-svg" src="大模型/09-agent/codex-architecture.svg" alt="codex-architecture.svg">


### 2.1 先用协议把 UI 和内核解耦

`codex-rs/docs/protocol_v1.md` 定义得很清楚：UI 通过 **Submission Queue** 发 `Op`（`UserTurn`、`Interrupt`、`ExecApproval`……），内核通过 **Event Queue** 回 `EventMsg`（流式正文、`ExecApprovalRequest`、`TurnStarted` / `TurnComplete`……）。传输层可以是 channel、stdio、TCP、HTTP2——所以同一内核能同时喂 TUI、IDE 和云端。

三个词要分清：

- **Session**：一次会话的配置与状态，cwd、model、sandbox、approval policy 都随 turn 传递；
- **Task**：一次用户输入触发的执行，内部包含多个 Turn；同一 Session 同时只跑一个 Task，要并行就开多个实例；
- **Turn**：一次「请求模型 → 执行它要的工具 → 把结果喂回去」的循环。

### 2.2 核心 crate

| crate | 职责 |
| --- | --- |
| `protocol` | `Op` / `EventMsg` / `ResponseItem` 等线协议定义 |
| `core` | Session/Turn 循环、工具编排、上下文拼装、compact、guardian |
| `exec-server`、`unified_exec` | 本地或远端进程、PTY、长驻 shell |
| `sandboxing`、`linux-sandbox`、`windows-sandbox-rs` | 三平台沙箱与违规上报 |
| `execpolicy` | Starlark 写法的命令策略（前缀规则） |
| `apply-patch` | 自有的补丁语言与解析器 |
| `codex-api`、`model-provider`、`models-manager` | Responses 调用、模型目录、每模型提示词 |
| `tui`、`exec`、`app-server`、`cloud-tasks` | 四种交付形态 |
| `codex-mcp`、`rmcp-client`、`skills`、`plugin`、`hooks`、`agent` | 扩展面：MCP、技能、插件、钩子、子代理 |

### 2.3 一次 Turn 的链路

<img class="site-svg" src="大模型/09-agent/codex-turn-loop.svg" alt="codex-turn-loop.svg">


补充两点容易忽略的细节：

- 每轮都是**重发完整历史**（靠 `prompt_cache_key` 命中缓存降本），而不是依赖服务端会话状态——这也是「上下文压缩」成为核心组件的原因；
- 每个 turn 结束会把 `response_id` 作为书签留下，配合落盘的 rollout，支持 resume 与 fork。

## 三、最重要的功能

> [!important] 排序逻辑
> 按「没有它就不是 Codex」来排，而不是按宣传页上的功能列表。

### 1. 沙箱 + 审批 + 可升权

三平台各自实现：macOS 用 Seatbelt，Linux 用 Landlock + seccomp（也支持 bubblewrap），Windows 用受限令牌/AppContainer 一类机制加网络过滤。再叠四层：

- `execpolicy` 的 Starlark 前缀规则，判 allow / prompt / forbid，模型还能提议「记住这个前缀」形成 amendment；
- `request_permissions` 工具，让模型主动申请额外的网络或文件权限；
- 网络代理与域名白名单；
- `approvals_reviewer = auto_review` 时，交由 **guardian 复核模型**判断这次升权是否合规。

审批不是「允许/拒绝」二选一，而是「沙箱内先跑，越界再申请升权」。这是「无人值守跑一小时」能成立的前提。

### 2. `apply_patch` 自定义补丁协议

不是 JSON 化的 diff，而是一种极简文本格式（`*** Begin Patch` / `*** Update File:` / `@@` 上下文 / `*** Move to:`）。好处很直接：省 token、不会被 JSON 转义搞坏、上下文不匹配时能报错重试。它和 shell 走同一套安全检查，等价于「受控写文件」。

### 3. 上下文工程：压缩、预算、截断

- 本地摘要兜底（一份 426 字节的「给下一个 LLM 的交接单」）+ 远端 compact 路径；
- 工具输出强制截断，并附 `Exit code` / `Wall time` 元信息；
- token budget 提醒片段，接近上限时提示模型收尾。

### 4. AGENTS.md 分层指令

从项目根（按 `.git` 等 marker 判定）一路收集到 cwd，按顺序拼接，深层的覆盖浅层的，整体受 `project_doc_max_bytes` 预算约束；以 **user 角色**的 `<INSTRUCTIONS>` 注入，而不是塞进 system。

### 5. 多入口与可嵌入

`app-server` 用 JSON-RPC 暴露会话、审批与流式事件，是 IDE 插件与 SDK 的地基；`exec` 的 JSONL 便于流水线消费；`cloud` 把任务搬到远端再 `apply` 回本地。这套「内核 + 多壳」的设计比 TUI 本身重要得多。

### 6. 扩展面

MCP 双向（既当 client 也当 server）、skills（`SKILL.md`，按需加载）、plugins、hooks（会话/工具前后置钩子）、multi-agent（子代理有独立 base instructions 与权限），以及实验性的 code mode（把工具暴露给 JS 运行时，由模型写代码组合调用）。

### 7. `/review` 是一个独立子代理

它不共用主提示词，而是把 `REVIEW_PROMPT` 直接设为子代理的 base instructions，审批策略强制成 `Never`，输出要求「findings 优先、按严重度排序、带 file:line」。

## 四、系统提示词设计

### 4.1 不是一份提示词，而是「每模型一份 + 通用兜底」

仓库里能直接看到三档体量：

| 文件 | 体积 | 用途 |
| --- | --- | --- |
| `codex-rs/core/gpt-5.2-codex_prompt.md` | 7.6 KB | 当前主模型的精简版 |
| `codex-rs/core/gpt_5_1_prompt.md` | 24 KB | 上一代，含大量行为规范 |
| `codex-rs/models-manager/prompt.md` | 20.9 KB | 未知模型/本地模型的通用兜底 |

运行时优先用模型目录下发的 `model_messages.instructions_template`，`config.base_instructions` 可覆盖，`personality = none` 时还会把 `# Personality` 整段剥掉。另有 `base_instructions_provenance` 区分「模型自带的」与「用户自定义的」：切模型时前者被替换，后者保留，并在历史里插一条 `<model_instructions>` 片段，明确告诉模型「以下指令替换之前的」。

这解释了一个趋势：**提示词在变薄**。GPT-5.1 时代要写 24 KB 的自主性、持久性、进度汇报规范；到 5.2，这些已内化进后训练，prompt 只保留 harness 独有的差异。

### 4.2 7.6 KB 那份的结构

```text
身份（You are Codex, based on GPT-5…）
General（优先 rg）
Editing constraints（ASCII、apply_patch、脏工作区不许回滚、禁 git reset --hard）
Plan tool（最简单的 25% 任务别用、不许单步计划）
Special user requests（"review" → findings first）
Frontend tasks（字体/配色/动效/背景，反 AI slop）
Presenting your work & final message（一大段输出格式契约）
```

最后那段「输出格式」其实是 **UI 契约**：纯文本、标题 `**Title Case**`、bullet 4–6 条、路径写成可点击的 `src/app.ts:42`、不许嵌套列表、不要 ANSI。因为 TUI 只做轻量渲染，模型输出就是界面。

### 4.3 动态部分不写在 system 里，而是「上下文片段」

`core/src/context/` 下有 50+ 个片段模块，每轮按需组装，用 XML 风格标签包裹、以 user 或 developer 角色注入：

- `environment_context`：`<filesystem><workspace_roots>…</workspace_roots><permission_profile type="managed">`，外加网络允许/拒绝域名；
- `permissions_instructions`：按 `read-only` / `workspace-write` / `danger-full-access` 三档模板**运行时渲染**，填入可写根、被拒路径、审批策略，甚至包含 `request_permissions` 的说明与 `auto_review` 的行为约束；
- `user_instructions`：AGENTS.md，形如 `# AGENTS.md instructions for <dir>` + `<INSTRUCTIONS>…</INSTRUCTIONS>`；
- 其余：`token_budget`、`compaction_summary`、`memory`、`skills`、`model_instructions` 等。

「静态前缀尽量稳定、动态事实放下游」的切法，既保住 prompt cache，又让权限、目录、技能这些每次都可能变的事实准确进入模型视野。

### 4.4 五条可迁移的设计原则

1. **提示词分层，而不是一份巨无霸**：身份/行为（system）→ 环境事实（developer）→ 项目指令（user 的 AGENTS.md）→ 工具 schema。优先级写死：system/developer > AGENTS.md，深层 AGENTS.md > 浅层。
2. **机器可读的上下文用标签**：`<environment_context>`、`<INSTRUCTIONS>`、`<model_instructions>`，模型解析稳定，人也一眼能看出边界。
3. **能运行时生成的绝不硬编码**：沙箱模式、可写目录、网络策略都是渲染出来的，提示词永远和真实权限一致。
4. **提示词跟模型版本走**：每代模型重新裁一遍，删掉已内化的段落，补上暴露出的短板（5.2 补的是审美与输出格式）。
5. **可观测**：`codex debug prompt-input` 能把「模型实际看到的完整输入」导出成 JSON，提示词问题可以像代码一样复现和回归。

### 4.5 和 DSH / Claude Code 的对照

AGENTS.md、`SKILL.md` 的按需加载、`apply_patch` 式的定向编辑，已经是业界共同约定。Codex 的差异主要在两点：

- **把沙箱/审批状态写进提示词并运行时渲染**，让「权限」成为模型可推理的事实，而不是外部黑盒；
- **每模型一份、随版本裁剪的提示词管理**，让提示词能跟着后训练迭代，而不是越堆越长。

## 五、可以借鉴的点

> [!tip] 落地建议
> 如果自己搭 coding agent，优先补的不是工具数量，而是「权限模型 + 上下文压缩 + 可恢复会话」这三样。

- 审批做成「沙箱内先跑，越界再申请」，比一开始就弹窗体验好得多；
- 上下文片段用 XML 标签包裹，比自由文本更稳，也更好调试；
- 会话落盘 + 书签，让长任务可以中断、续跑、分叉；
- 提示词里凡是「每次可能变」的事实（目录、权限、预算）都别写死；
- 输出格式要当作 UI 契约来设计，而不是事后让前端去猜。

> [!warning] 版本注意
> 以上依据 `openai/codex` 的 `main` 分支（2026-11）实际代码与提示词原文。仓库演进很快，guardian、code mode、multi-agent v2 等仍是实验特性，细节不宜当作稳定 API。

## 相关笔记

- [[00-Agent导航]]
- [[Agent框架选型对比]]
- [[OpenHands]]
- [[OpenAI Agents SDK]]
- [[大模型/02-应用开发/MCP/MCP概览|MCP 概览]]
