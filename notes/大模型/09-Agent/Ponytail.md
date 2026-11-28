---
tags:
  - 大模型/Agent
  - AI编程
  - AgentSkills
  - PromptEngineering
created: 2026-06-30
updated: 2026-06-30
status: 初稿
source:
  - https://github.com/DietrichGebert/ponytail
  - https://raw.githubusercontent.com/DietrichGebert/ponytail/main/README.md
  - https://raw.githubusercontent.com/DietrichGebert/ponytail/main/AGENTS.md
  - https://raw.githubusercontent.com/DietrichGebert/ponytail/main/docs/agent-portability.md
  - https://raw.githubusercontent.com/DietrichGebert/ponytail/main/skills/ponytail/SKILL.md
  - https://raw.githubusercontent.com/DietrichGebert/ponytail/main/benchmarks/results/2026-06-18-agentic.md
aliases:
  - Ponytail
  - Lazy Senior Dev Mode
---

# Ponytail

> [!summary] 定位
> `Ponytail` 不是一个完整 Agent 框架，而是一个跨 Agent 编程工具的规则集、技能包和插件分发项目。它的目标是让 AI 编程 Agent 像“懒但靠谱的资深开发”一样工作：先判断是否需要做，再优先复用现有代码、标准库、平台原生能力和已安装依赖，最后才写最小必要代码。

## 一、项目基本信息

| 项目 | 内容 |
|---|---|
| 仓库 | [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) |
| 作者 | Dietrich Gebert |
| 许可证 | MIT |
| 当前版本 | `4.8.4` |
| 项目描述 | Lazy senior dev mode for AI agents |
| 主要语言 | JavaScript、Python |
| 核心形态 | Agent rules / skills / hooks / plugins |

README 中给出的核心口号是：**最好的代码，是你根本不用写的代码。**

## 二、它解决什么问题

AI 编程 Agent 常见问题不是“不会写”，而是“太会写”：

- 为简单需求搭复杂组件
- 引入不必要依赖
- 新建过早抽象
- 重复实现代码库里已有工具
- 写很多未来可能用不到的配置、接口、工厂和扩展点

`Ponytail` 解决的是这个问题：让 Agent 在写代码前先走一遍“最小实现阶梯”。

## 三、核心规则：最小实现阶梯

Ponytail 的核心是一个从上到下的判断梯子：

1. 这个东西真的需要存在吗？不需要就跳过。
2. 代码库里已经有类似 helper、util、pattern 吗？有就复用。
3. 标准库能解决吗？能就用标准库。
4. 平台原生能力能解决吗？能就用原生能力。
5. 已安装依赖能解决吗？能就用已有依赖。
6. 能一行解决吗？能就一行。
7. 只有到最后，才写最小可工作的代码。

> [!note] 关键点
> Ponytail 不是让 Agent 草率写短代码。它要求先读代码、理解真实调用链，再选择最小正确方案。

## 四、不是“代码高尔夫”

Ponytail 明确区分“懒”和“粗心”。

不能为了少写代码而删掉：

- 信任边界处的输入校验
- 防止数据丢失的错误处理
- 安全措施
- 可访问性基础
- 用户明确要求的行为
- 非平凡逻辑的最小可运行检查

所以它不是单纯追求一行代码，而是追求“能不写就不写，必须写就写最少且正确的代码”。

## 五、项目结构

仓库主要由几类文件组成：

| 路径 | 作用 |
|---|---|
| `AGENTS.md` | 面向通用 Agent 的紧凑规则集 |
| `skills/` | 核心技能定义，包含 ponytail、review、audit、debt、gain、help |
| `hooks/` | Claude / Codex 生命周期 hook，用于自动注入模式和追踪模式切换 |
| `.claude-plugin/` | Claude Code 插件配置 |
| `.codex-plugin/` | Codex 插件配置 |
| `.opencode/` | OpenCode 插件适配 |
| `.openclaw/skills/` | OpenClaw skills 包 |
| `pi-extension/` | pi agent harness 适配 |
| `plugin.yaml` / `__init__.py` | Hermes Agent 插件适配 |
| `benchmarks/` | benchmark 脚本、任务和结果 |
| `docs/agent-portability.md` | 跨 Agent 适配说明 |

## 六、支持的 Agent / 工具

Ponytail 是一个 agent-portable skill distribution。它为多个 Agent 工具提供适配：

- Claude Code
- Codex / Codex Desktop
- GitHub Copilot CLI
- OpenCode
- Gemini CLI / Antigravity CLI
- Hermes Agent
- Devin CLI
- OpenClaw
- CodeWhale
- Swival
- Cursor
- Windsurf
- Cline
- Kiro
- VS Code + Codex extension
- 通用 `AGENTS.md` / `SKILL.md` 加载方式

其中完整插件模式通常会提供：

- always-on 规则注入
- mode tracking
- slash commands
- skills
- lifecycle hooks

不支持插件的工具则退化为 instruction-only 模式，通过 `AGENTS.md` 或对应规则文件加载。

## 七、命令和技能

Ponytail 提供几类命令：

| 命令 | 作用 |
|---|---|
| `/ponytail [lite\|full\|ultra\|off]` | 设置 Ponytail 强度或关闭 |
| `/ponytail-review` | 检查当前 diff 中的过度设计，输出删除建议 |
| `/ponytail-audit` | 审计整个仓库里的过度设计 |
| `/ponytail-debt` | 收集 `ponytail:` 标记的技术债和升级路径 |
| `/ponytail-gain` | 展示 benchmark 中的收益数据 |
| `/ponytail-help` | 命令帮助 |

核心模式：

| 模式 | 含义 |
|---|---|
| `lite` | 做用户要求的事，但指出更懒的替代方案 |
| `full` | 默认模式，强制执行最小实现阶梯 |
| `ultra` | 更激进的 YAGNI 模式，优先删除和质疑需求 |
| `off` | 关闭 Ponytail |

## 八、安装方式

README 覆盖了很多宿主工具。常见方式包括：

### Claude Code

```bash
/plugin marketplace add DietrichGebert/ponytail
/plugin install ponytail@ponytail
```

### Codex

```bash
codex plugin marketplace add DietrichGebert/ponytail
codex
```

然后在 `/plugins` 里安装，在 `/hooks` 里审查并信任生命周期 hook。

### Hermes Agent

```bash
hermes plugins install DietrichGebert/ponytail --enable
```

Hermes 适配会在每次 LLM 调用前注入当前 Ponytail 模式，并注册 `ponytail:<skill>` 技能和 `/ponytail-*` 命令。README 特别提醒：在共享网关里应限制 `/ponytail` 给可信用户，运行时模式是进程本地状态。

### OpenClaw

```bash
clawhub install ponytail
```

如果不用 ClawHub，可以复制 `.openclaw/skills/ponytail` 到 `~/.openclaw/skills/`。

## 九、配置

Ponytail 不要求配置文件。

可选配置：

```bash
PONYTAIL_DEFAULT_MODE=lite|full|ultra|off
```

或：

```json
{
  "defaultMode": "full"
}
```

配置文件位置：

- Linux / macOS：`~/.config/ponytail/config.json`
- Windows：`%APPDATA%\ponytail\config.json`

默认模式是 `full`。

## 十、benchmark 结果

仓库给出两类 benchmark。

### 1. Agentic benchmark

更可信的是 2026-06-18 的 agentic benchmark：

- 使用真实 Claude Code headless session
- 模型：Haiku 4.5
- 仓库：`tiangolo/full-stack-fastapi-template`
- 12 个真实 feature tickets
- 每个任务 4 次运行
- 以最终 `git diff` 新增行数作为 LOC 指标

结果摘要：

| 维度 | Ponytail 相对 baseline |
|---|---:|
| LOC | -54% |
| tokens | -22% |
| cost | -20% |
| time | -27% |
| safety | 100% |

### 2. 安全任务

benchmark 还设计了 6 个安全相关函数任务，例如路径穿越、SQL 注入、伪造 token、恶意 CSV 等。

结果里 Ponytail 保持了 100% safe，而简单的 “YAGNI + one-liner” prompt 出现过一次安全 guard 被删掉的问题。

> [!warning] benchmark 使用边界
> 这些结果说明 Ponytail 在特定编码任务中能减少过度实现，但不等于任何项目都能自动省 54% 代码。收益最大的是有明显 over-build trap 的任务，例如用原生 `<input type="date">` 替代自定义日期选择器。

## 十一、适合什么场景

适合：

- AI 编程 Agent 默认过度设计的问题
- 代码生成前的约束规则
- code review 中找可删除复杂度
- 团队希望强化 YAGNI / stdlib first / native first 的工程文化
- Claude Code、Codex、Hermes、OpenClaw 等 Agent 工具的技能扩展

不适合：

- 非编码任务
- 需要完整架构设计文档的阶段
- 对复杂业务规则还没理解清楚就强行压缩实现
- 安全、数据一致性、可访问性等不能牺牲的边界

## 十二、优点

- 规则简单，容易理解和迁移。
- 跨 Agent 适配做得很完整。
- 技能、hooks、AGENTS.md 多种加载方式并存。
- 对“过度设计”有明确操作性，不只是口号。
- benchmark 比较诚实，承认早期 single-shot 数据不严谨，并补了 agentic benchmark。
- MIT 许可证，便于学习和二次使用。

## 十三、风险和局限

- 它不是 Agent 框架，不提供任务调度、权限、记忆、多用户隔离等能力。
- 对复杂系统，过度追求最小 diff 可能掩盖长期演进需求，需要人工判断。
- 不同宿主工具的插件能力不一致，有的只有 instruction-only 模式。
- lifecycle hooks 需要用户审查和信任。
- benchmark 只覆盖特定模型、仓库和任务类型，不应外推过度。
- 对非前端 native control 场景，收益可能很小。

## 十四、对我们的启发

Ponytail 对我们的价值不在于“拿来做平台底座”，而在于三点：

1. **作为 Agent 行为约束模板**  
   可以把 `YAGNI -> 复用现有代码 -> 标准库 -> 平台原生 -> 已有依赖 -> 最小实现` 这套梯子引入我们的编码 Agent。

2. **作为 Skill 分发样例**  
   它展示了如何把同一套行为规则分发到 Claude、Codex、Gemini、Hermes、OpenClaw、Cursor 等不同工具。

3. **作为 Review / Audit 工具思路**  
   `ponytail-review` 和 `ponytail-audit` 很适合启发我们做“过度设计审计”类 Agent 工具。

## 十五、结论

> [!summary]
> Ponytail 是一个面向 AI 编程 Agent 的“最小正确实现”规则与技能分发包。它不解决 Agent 平台架构问题，但很适合嵌入现有编码 Agent，让它少造轮子、少引依赖、少写未来用不到的抽象。对我们来说，它最值得借鉴的是跨 Agent 技能分发方式和“懒但不粗心”的工程约束。

## 参考资料

- [GitHub - DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail)
- [AGENTS.md](https://raw.githubusercontent.com/DietrichGebert/ponytail/main/AGENTS.md)
- [Agent portability](https://raw.githubusercontent.com/DietrichGebert/ponytail/main/docs/agent-portability.md)
- [Ponytail skill](https://raw.githubusercontent.com/DietrichGebert/ponytail/main/skills/ponytail/SKILL.md)
- [Agentic benchmark](https://raw.githubusercontent.com/DietrichGebert/ponytail/main/benchmarks/results/2026-06-18-agentic.md)
