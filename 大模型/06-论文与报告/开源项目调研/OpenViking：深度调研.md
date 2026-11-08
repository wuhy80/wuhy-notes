---
tags:
  - 大模型/开源调研
  - 大模型/Agent
  - 大模型/RAG
  - 上下文工程
created: 2026-11-08
updated: 2026-11-08
source: https://github.com/volcengine/OpenViking
status: 已完成
type: 调研报告
---

# OpenViking：深度调研

> [!abstract] 概述
> OpenViking 是火山引擎开源的「Agent 上下文数据库」（Self-evolving Context Database）：把 Agent 的 Memory、知识 RAG 与 Skills 统一成一个可浏览、可编辑、会自我演化的虚拟文件系统（`viking://`）。主语言 Python（存储引擎为 Rust），41.8k★ / 3.4k fork / 主项目 AGPLv3。调研日期 2026-11-08；源码版本 main@`9ac008f`（2026-11-07 提交）。说明：本机沙箱中 git 不可用且预克隆不完整，文中全部代码证据均经 GitHub API 按该 commit 逐文件读取原文，引用路径为仓库内真实路径。

## 项目定位与背景

OpenViking 对「Agent 记忆」这个问题的回答是：**别把上下文藏进黑盒向量库，把它组织成文件系统**。README 的原话是 "Most agent memory is a black box: text goes in, embeddings come out, and nobody can see what was actually stored"——它把 Agent 已知的一切（项目文档、用户偏好、任务经验、技能定义）放进一棵 `viking://` URI 树，Agent 像操作文件一样 `ls / tree / read / grep`，人也能直接打开任何目录检查和修改 Agent「知道什么」。

「Memory + RAG + Skills 统一」是一个有主张的设计：三类上下文共享同一套存储（VikingFS）、同一套检索（向量 + rerank）、同一套分层加载协议（L0/L1/L2），只是生命周期不同——Resource 由用户主动灌入、Memory 从会话中自动抽取演化、Skill 是任务说明书（`SKILL.md`）。这与主流方案形成了鲜明差异：

- **Mem0 / Zep 类记忆层**：面向「对话事实抽取」，产出扁平的记忆条目集合，没有目录结构与「知识」的完整形态；
- **LangGraph Memory / Store**：应用内嵌的键值/向量存储，是框架的一个设施而非独立数据库；
- **普通向量库（Qdrant 等）**：只有 flat 的向量池，检索天然是「全库扫描」，无法按子树 scope，也没有语义摘要层。

OpenViking 的差异化主张有三点：**目录即检索上下文**（`find(query, target_uri="viking://resources/my_project")` 把语义搜索 scope 到子树，背后是 ICDE 论文定义的 Directory-Aware 查询模型）；**读摘要再看原文**（每个目录带生成的 L0 摘要 / L1 概览，Agent 先扫摘要决定要不要读全文，省 token）；**会话自演化**（session commit 触发记忆抽取、合并与蒸馏，上下文越用越准）。README 报告的基准测试称：接入 OpenViking 后三个 Agent 框架在 LoCoMo 长对话记忆测试上从 24%–57% 提升到 80%–83%，同时输入 token 下降 34%–91%。学术背书方面有 VikingMem（VLDB 2026）、目录感知向量检索（ICDE 2026）、VikingRAG 三篇论文，工程与研究的结合度在同类开源项目里少见。

## 架构拆解

**整体分层**：`CLI / SDK / HTTP → HTTP Server（FastAPI, 默认 :1933）→ Service 层（FS/Search/Session/Resource/Pack/Debug 六个服务）→ Retrieve / Session / Parse → VikingFS → RAGFS + 向量索引`（`docs/en/concepts/01-architecture.md`）。

**存储模型是「双层」的**（`docs/en/concepts/05-storage.md`）：内容层 RAGFS 已用 Rust 重写（`crates/ragfs/`，141 个源文件，经 `crates/ragfs-python` 以 maturin 绑定回 Python），支持 localfs / S3 / memory 三种后端；索引层存 URI、向量、元数据和可检索文本，后端可选 local / http / 火山 VikingDB。向量 collection 的 schema 值得一读——目录信息被显式建模进索引：`uri`、`parent_uri`、`context_type`（resource/memory/skill）、`is_leaf`、`abstract`、`active_count`（使用计数）。`parent_uri` 支撑子树 scope 检索，`active_count` 是「越用越被召回」的自演化信号之一。

**上下文组织**：`openviking/core/directories.py` 用 `DirectoryDefinition` 数据类声明了整套预置目录树，每个目录自带 L0/L1 文案，Memory 部分按类型分治：

```python
@dataclass
class DirectoryDefinition:
    path: str        # 相对路径，如 "memory/preferences"
    abstract: str    # L0 摘要
    overview: str    # L1 概览
    children: List["DirectoryDefinition"] = field(default_factory=list)
```

预置类型包括 preferences（按主题聚合偏好）、entities（人物/项目/概念各一目录）、events（只增不改的事件）、cases（具体案例）、patterns（可复用方法/SOP）、trajectories（执行轨迹）、experiences（从轨迹蒸馏的经验）。可以看到它把「案例 → 模式 → 经验」的归纳链路直接做成了目录约定。

**self-evolving 的机制主体**在 `openviking/session/`：session commit 时由 `SessionCompressorV3`（`compressor_v3.py`）编排归档，`memory/extract_loop.py` 按 MemoryType schema 抽取记忆，`memory/memory_updater.py`（93KB）通过 merge 操作（`memory/merge_op/` 下有 patch / replace / sum / link_merge / immutable 五种）把新事实写成补丁合并回已有记忆文件，去重与幂等由 schema 约束。另一条演化路径是 `ov compile`（`docs/en/context-compilation/`）：把资源或会话记录用 Skill 编译成 wiki、知识图谱、日报或「知识蒸馏」页，其中 `ov compile memory` 模式对既有记忆**原地去重/合并/拆分/压缩**且承诺不造新事实。目录摘要侧车（`.abstract.md` / `.overview.md`）由 SemanticQueue 异步自底向上重算——`docs/en/concepts/03-context-layers.md` 定义了 freshness 协议：侧车带 `pending_child_changes` 计数，子内容变更累计到 `semantic.freshness_refresh_ratio`（默认 0.10）才触发父目录刷新，避免频繁重生成。**「演化」因此不是一句口号，而是抽取、合并、编译、摘要刷新四条异步流水线的组合。**

**检索链路**（`docs/en/concepts/07-retrieval.md`）：`find()` 是单查询快速路径（QUICK 模式，limit 条召回）；`search()` 先做意图分析（`retrieve/intent_analyzer.py`，LLM 生成 0–5 条带 context_type 的 TypedQuery——闲聊可以 0 条即不检索），再逐查询做向量召回，配置了 reranker 时自动升级为 THINKING（2×limit 召回 + 一轮重排）。最见功力的是上下文组装器（`openviking/retrieve/context_assembler/`）：`budget.py` 的 `plan_entries()` 在 token 预算内做「先广度后深度」的层级填充——

```python
def per_entry_cap(max_tokens: int, candidate_count: int) -> int:
    """Twice the average share — the ceiling one entry may occupy."""
    return max(1, max_tokens // max(1, candidate_count) * 2)
```

每个候选项先落在所属类别的默认层级（`tiers.py` 里 `tier_text()` 按 uri / abstract / overview / full 四档取文，目录候选直接从 `.overview.md` 侧车起读），再用剩余预算按得分从高到低跑三轮 upgrade（overview → full → 无上限的 spare pass），超长摘要降级而不是截断，同正文去重。注释里那句 "the observed 0.38-0.50 score band cannot support anyway"（分数挤在窄带里，把预算全押给 top1 是坏赌注）说明这套策略是实测调出来的。

**对 Agent 的接口形态**：HTTP API + Python/Go/TypeScript 三种 SDK + MCP server + 各 Agent 的 hook/插件（Claude Code、Codex、Cursor、OpenCode、DSH 等官方集成文档齐全），另有 `ov` CLI 和 Web Studio 可视化界面。`openviking/ingest/sources/` 里还有 codex.py、claude_code.py、cursor.py、opencode.py 等会话日志摄取器——它把自己定位成「接住所有 Agent 会话沉淀的下沉数据库」。

## 代码质量与成熟度

综合评分 **4 / 5**。分项：

- **规模与结构（4.5）**：仓库 6117 个文件、409MB，Python 主包 889 文件，模块边界清晰（core / storage / retrieve / session / parse / service / server 各司其职）；但存在若干巨型文件——`session/session.py` 约 196KB、`storage/viking_vector_index_backend.py` 约 131KB、`storage/content_write.py` 约 120KB、`memory/memory_updater.py` 约 93KB，阅读和维护成本偏高。
- **测试与 CI（5）**：930 个测试文件（unit 161、api_test 160、server 87、storage 67……），`.github/workflows/` 下 35+ 条流水线（含 CodeQL、gateway e2e、多 SDK 发布、host-compat 矩阵），工程化程度远超同期开源 Agent 项目。
- **文档（5）**：`docs/en` 与 `docs/zh` 各 147 篇，概念、API、部署、私有化全套，且行为细节（如侧车写保护、光标失效语义）写到反常地诚实。
- **活跃度（5）**：2026-01-05 建仓，9 个月 41.8k★，PR 编号已过 #7200，最新 release v0.5.3（2026-11-02），调研当天仍有提交。
- **成熟度警示（-）**：`pyproject.toml` 自标 `Development Status :: 3 - Alpha`，依赖锁定激进（litellm、tree-sitter 全部 pin 死版本），1324 个 open issue，0.4→0.5 之间有破坏性变更记录——API 面还在动，早期采用者要有跟版心理准备。

## 对本知识库的落地方案

先盘点 vault 现有的「手搓上下文系统」：Markdown 是唯一真相源，每次 push 由发布流水线重建三类派生物——`scripts/build-d1-index.mjs` 全量灌 Cloudflare D1（FTS5 全文索引，正文截断 5 万字符）、`scripts/build-embeddings.mjs` 生成 bge-m3 向量写进 `embeddings.json` 静态资产（`cloudflare/_worker.js` 暴力余弦检索）、`scripts/build-vault-meta.mjs` 导出 `vault-meta.json` 供 `site-assets/dataview-lite.cjs` 在浏览器现场渲染 Dataview；另有 `scripts/build-vocab.mjs` 聚合生词本、14 个人工维护的实体 MOC 页（`技术笔记/MOC/`）。全库 2454 篇 Markdown。

**同构关系相当高**。OpenViking 的设计原则之一是 "Single Data Source"（RAGFS 存源文件，向量记录只是检索投影）——这正是 `docs/d1-search-setup.md` 里「D1 只是构建产物」的口径。它的 L0/L1/L2 三层在 vault 里都有朴素对应：D1 的 title/excerpt 是 L0、MOC 页的「笔记索引 + 概述」是人工 L1、单篇全文是 L2；生词本的频段分级（band 1–5）对应 `active_count` 式的使用强度信号；甚至连「会话沉淀」也有一半——OpenViking 内置 codex/claude_code 会话摄取器，vault 则靠 DSH 每批改动顺手提交。差别在于：vault 的 L0/L1 全靠人工维护，检索没有 scope 概念，且「演化」只发生在生词本 localStorage 里，MOC 和 AGENTS.md 都是静态的。按三档给方案：

**可直接采用（低成本，收益立现）**

1. **给 D1 加摘要层**：`build-d1-index.mjs` 已解析 frontmatter，再抽每篇笔记的 `> [!abstract]` 段（MOC 页都有）成 `notes.abstract` 列并入 `notes_fts`，`/api/search` 返回它作 L0——对应 OpenViking「先读摘要再读原文」，改动集中在该脚本与 `cloudflare/_worker.js`，半天工作量。
2. **子树 scope 检索**：`/api/semantic-search` 与 FTS 查询加 `path` 前缀参数（notes 表本就有 path，JOIN 过滤即可），对应 OpenViking 的 `target_uri` 子树检索；2454 篇的量级毫无性能顾虑。
3. **MOC freshness 提示**：借 `pending_child_changes` 思路，在每个 MOC 页脚注入一个 dataview-lite 查询（本目录按 `mt` SORT 取最近 N 篇），让「侧车过期」对人可见——dataview-lite 现有方言就支持。

**需改造（对齐 OpenViking 的分层与演化思路）**

1. **自动生成目录 L0/L1**：OpenViking 由 SemanticQueue 底向上生成摘要；vault 没有常驻服务，可以在 `build-embeddings.mjs` 同一轮构建里用 Workers AI 为 14 个 MOC 与各一级目录生成 256 字摘要写入 `vault-meta.json`，MOC 从「全人工」升级为「AI 草稿 + 人工校订」，人工只维护「待补链建议」这类判断性内容。
2. **生词本引入个人词频**：`build-vocab.mjs` 已按页聚合词条，再加「同一词出现在几篇精读」字段并排序——用词频表 band 之外的个人出现频次驱动复习优先级，这是 `active_count` 思路的直接移植。
3. **会话记忆文件化**：仿 OpenViking 的 `experiences/`、`cases/` 类型目录，约定 DSH 每完成一批改动在固定目录（如 `大模型/09-Agent记忆/` 或私密库）沉淀一条 type 为 experience 的短笔记（做了什么、踩了什么坑），由 D1 索引、[[MOC-Agent]] 挂链——把 AGENTS.md 这种「静态规则」升级成「可检索经验库」，这是对 self-evolving 最有 vault 特色的一次移植。

**仅借鉴思路（与部署评估）**

部署一个 OpenViking 实例当 vault 发布站的后端——**结论是不值得**。理由有三：其一，合规面：主项目 AGPLv3，发布站的对外查询接口若由它承担，需要开放服务端源码，且 LICENSE 附加了「禁止整体重写后再开源、翻译成其他语言需书面授权」等额外条款，个人项目没必要背这个传染面；其二，部署面：409MB 仓库、Python 3.10+ 加 Rust maturin 工具链、必须配 VLM + embedding 双模型（官方基准用火山 Doubao），服务端面向 macOS/Linux，Windows 只有 beta 桌面端——与本机 DSH 沙箱受限的现状直接冲突；其三，收益错配：vault 的核心场景是 2454 篇静态 Markdown、更新粒度是 push，不需要「会话 → 记忆」的持续写入管线，而 OpenViking 最重的价值恰恰在那条管线上；它做得好的「分层 + scope + 预算式组装」，用上面三步就能复制八成。例外路径：若目标是给 DSH/Claude Code 配跨会话个人记忆，可按官方 DSH 集成文档（`docs/en/agent-integrations/17-dsh.md`）部署到一台 Linux 小机，或直接试用火山托管版（前 50 文件免费），门槛低且不动发布站架构。

## 风险与边界

- **许可证**：主项目 AGPLv3（`crates/ov_cli`、examples 为 Apache 2.0，LangChain 适配器 AGPLv3、Agent Framework 适配器 MIT）。AGPL 对「自建对外网络服务」要求开放源码；附加条款限制整体重写与转译，商用集成需法务过目。个人本地使用、学习、写笔记不受影响。
- **火山生态绑定**：`pyproject.toml` 依赖 `volcengine` 与 `volcengine-python-sdk[ark]`，向量后端一等公民是 VikingDB，托管版即火山 OpenViking Service；但 init 向导显式支持 OpenAI、Kimi、GLM、Ollama 本地模型，向量与文件后端也有 local 实现——绑定是「默认方便」而非「硬锁」，离线自托管可行（`docs/en/guides/20-private-deployment.md`）。
- **部署成本**：双模型（VLM + embedding）是硬依赖，摘要生成与记忆抽取的质量直接由它决定；0.5.x 迭代快，升级需跟 changelog（`docs/en/about/02-changelog.md` 已 64KB）。基准数字为项目方自报且使用自家模型，复现脚本在 `benchmark/` 但结论宜打折看待。
- **适用边界**：它适合「有持续会话、要跨会话长记忆」的 Agent 场景；纯静态知识库、低频更新场景收益有限。个人隐私记忆全部落盘为可读 Markdown，隐私配置（`privacy/` 模块）与加密需显式开启。

## 参考资料

- 仓库：[volcengine/OpenViking](https://github.com/volcengine/OpenViking)（main@9ac008f）
- 架构文档：[Architecture Overview](https://docs.openviking.ai/en/concepts/01-architecture)、[Context Layers](https://docs.openviking.ai/en/concepts/03-context-layers)、[Retrieval](https://docs.openviking.ai/en/concepts/07-retrieval)、[Storage](https://docs.openviking.ai/en/concepts/05-storage)
- 官方博客：[OpenViking Context Database 设计动机](https://blog.openviking.ai/post/openviking-context-database/)、[基准测试报告](https://blog.openviking.ai/post/openviking-benchmark-results/)
- 论文：[VikingMem (arXiv:2605.29640)](https://arxiv.org/abs/2605.29640)、[Directory-Aware Query and Maintenance in Vector Databases (arXiv:2606.16903)](https://arxiv.org/abs/2606.16903)、[VikingRAG (arXiv:2609.11390)](https://arxiv.org/abs/2609.11390)
- 社区评价：[OpenViking Review (vibecodinghub)](https://vibecodinghub.org/tools/openviking)
- 本库关联：[[上下文工程]]、[[MOC-RAG与向量检索]]、[[MOC-Agent]]、[[向量数据库对比推荐]]、[[MOC-Obsidian]]
