---
tags:
  - 大模型/模型卡片
  - 大模型/Flash
  - 大模型/Qwen
type: model-card
model: Qwen3.8-Flash
vendor: 阿里云百炼
model_family: Qwen
tier: Flash
release_date: 2026-08-26
open_weights: true
license: Qwen Community License 1.0
context_window: 1000000
max_output: 128000
total_params_b: 180
active_params_b: 6
input_modalities:
  - 文本
  - 图像
  - 视频
  - 音频
currency: CNY
price_input: 0.8
price_output: 2.7
price_cache_hit: 0.1
price_input_usd_equiv: 0.11
price_output_usd_equiv: 0.38
aa_intelligence: 40
aa_speed_tps: 54.6
aa_cost_per_task_usd: 0.37
aa_cache_discount_pct: 89
local_deploy: true
agent_ready: false
price_display: 0.8 / 2.7 元
params_display: 180B / 6B
context_display: 1M / 输出 128K
key_benchmark: NL2Repo 48.1 · Toolathlon 73.5 · CharXiv 90.6
verdict: 个人办公体验最好、单机可跑；Agent 落地问题突出
status: draft
created: 2026-10-02
updated: 2026-10-02
aliases:
  - Qwen 3.8 Flash
  - qwen3.8-flash
  - Qwen3.8-Flash-Next
source:
  - https://developer.aliyun.com/article/1761526
  - https://artificialanalysis.ai/models/qwen3-8-flash-next
  - https://www.leiphone.com/category/yanxishe/Dp2FW4Pb6iLUvdhf.html
---

# Qwen3.8-Flash

> [!summary] 一句话
> 价格最低档、长文档与个人办公体验最好、也是四家里**唯一能在单台 128GB 小主机上跑起来**的；但 Agent 落地问题突出——社区实测有过度思考、死循环、`tool_choice=required` 不履行。

## 定位

Qwen 下一代（Next）架构的首发效率模型：**千亿总参数只激活 6B**，官方称训练成本较 Qwen3.7-Plus 降近 90%。该架构是 Qwen4 的雏形，开放权重版为 **Qwen3.8-Flash-Next**。

> [!note] API 版与开源版的区别
> 百炼上的 `qwen3.8-flash` 主模型 125B，配 51B N-gram Embedding 与 4B MTP；官方技术报告与榜单对应的是开源权重版 **Qwen3.8-Flash-Next**（AA 记为 180B 总参数 / 6B 激活，上下文 256K）。讨论架构与榜单时不要把两者完全等同。

## 规格

| 项目 | 值 |
|------|-----|
| 发布时间 | 2026-08-26 |
| 开放权重 | Flash-Next 开源（Qwen Community License 1.0，按月活与营收附条件） |
| 总参数 / 激活 | 125B 主模型 + 51B N-gram Embedding + 4B MTP / 6B 激活 |
| 上下文 | 1M（最大输入 991K，思考模式 983K；开源 Next 版为 256K） |
| 最大输出 | 128K（思维链上限 256K） |
| 输入模态 | 文本、图像、视频、音频 |
| 架构 | QSA（Qwen Sparse Attention）+ GDN 线性注意力混合、Gated Residual、N-gram Embedding |
| 思考控制 | `enable_thinking: true` |

## 价格（元/百万 tokens，华北2-北京）

| 项目 | 价格 |
|------|-----:|
| 输入 | 0.8 |
| 输出 | 2.7 |
| 输入（缓存命中） | 0.1 |
| 输入（Batch File / Batch Chat） | 0.4 |
| 输出（Batch File / Batch Chat） | 1.35 |
| 显式缓存创建 | 1.25 |

- 2026-08-27 12:00 起由 1 元 / 3 元下调至 0.8 元 / 2.7 元。
- 北京地域有 **100 万 tokens 免费额度**（开通百炼或模型发布起 90 天内，取较晚者），其他地域无免费额度。
- 工具调用：`code_interpreter` 与 `web_extractor` 限时免费，`web_search` 4 元/千次，`t2i_search` 24 元/千次，`i2i_search` 48 元/千次。
- 支持批量推理；**不支持模型调优**。

## 独立评测（Artificial Analysis，口径为 Qwen3.8-Flash-Next）

| 指标 | 值 |
|------|-----|
| 智能指数 | 40（开源权重模型第 6/117） |
| 输出速度 | 54.6 tok/s（慢于平均 69） |
| 混合价 | $0.15 / $0.47 |
| 每任务成本 | $0.37 |
| 缓存折扣 | 89% |
| 输出啰嗦度 | 240M tokens（同类中位数 140M，非常啰嗦） |

## 厂商自报跑分

| 基准 | 分数 | 参照 |
|------|-----:|------|
| NL2Repo-Bench | 48.1 | GLM-5.3-Flash 为 56.3 |
| Toolathlon Verified | 73.5 | GLM-5.3-Flash 为 78.4 |
| DeepSWE | 58.7 | GLM-5.3-Flash 为 63.4 |
| CharXiv RQ | 90.6 | GLM-5.3-Flash 为 89.4（此处领先） |
| SWE-bench Pro | 官方称领先 Claude Opus 4.6 达 9.1 分 | — |
| AndroidWorld / MathVision / ERQA | 分别高出 Opus 4.6 22.5 / 25.1 / 31.5 分 | 多模态与具身向 |

## 优缺点

> [!tip] 优势
> - 输入价与 GLM-5.3-Flash 并列最低，有 100 万 tokens 免费额度。
> - **单机可跑**：N-gram Embedding 表每 token 只读 16 行，可用 mmap 挂到 NVMe，DGX Spark 单台常驻仅 79.4 GiB。
> - DGX Spark 实测中，Flash-Next 是四套配置里**唯一日语机械判定 9/9 全通过**的；200K 长文 TTFT 仅 101 秒，优于双机 GLM。
> - 雷峰网同题实测更懂「个人办公节奏」：智能排序、逾期提示、7 天内到期、Markdown 笔记与分屏预览。
> - 双协议兼容（OpenAI / Anthropic），可接 Claude Code、Codex。

> [!warning] 风险
> - **Agent 落地问题突出**：社区在线 API 实测生成一个网页耗时 19 分 37 秒，任务频繁陷入死循环，作者评分 40；本地实测也出现空回答（概率约 1/20，但会污染后续轮次）。
> - `tool_choice=required` 被受理却返回 0 个工具调用——很多 Agent 框架以 required 为前提，接入前必须先验证。
> - 思考链偏长：弱思考档的输出 token 可达 GLM 的 5–6 倍，10 题总耗时可差 5 倍。
> - 雷峰网实测 UI 存在文本溢出、信息密度偏低等设计失误。
> - 开源版是 Qwen Community License 1.0，产品化需核对月活/营收条件。

## 适用场景

- ✅ 个人办公问答、长文档与代码库阅读、图文/长视频理解
- ✅ 单台小主机（DGX Spark / AI Max 395 / Mac）本地部署
- ⚠️ 谨慎直接接入 Agent 流水线，建议先自测工具调用与长会话稳定性

## 相关

- [[2026-10 四家 Flash 级模型对比]]
- [[GLM-5.3-Flash]]、[[deepseek-flash]]、[[Gemini 3.8 Flash]]
- [[Qwen3模型解读]]
