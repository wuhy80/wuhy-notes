---
tags:
  - 大模型/模型卡片
  - 大模型/Flash
  - 大模型/Gemini
type: model-card
model: Gemini 3.8 Flash
vendor: Google
model_family: Gemini
tier: Flash
release_date: 2026-09-02
open_weights: false
license: 闭源商用
context_window: 1000000
input_modalities:
  - 文本
  - 图像
  - 音频
  - 视频
currency: USD
price_input: 0.75
price_output: 3.75
price_cache_hit: 0.075
price_input_usd_equiv: 0.75
price_output_usd_equiv: 3.75
aa_intelligence: 41
aa_speed_tps: 244.7
aa_cost_per_task_usd: 1.24
aa_cache_discount_pct: 90
local_deploy: false
agent_ready: true
price_display: $0.75 / $3.75（引导价）
params_display: 未公开
context_display: 1M
key_benchmark: AA 旧版指数 high 档 59（3.7 Flash high 为 56）
verdict: 速度最快、全模态含音频；思考 token 计费且 2027 涨价
# 评测指标明细；键名对应横评表的「指标」行，未收录的键直接省略
bench:
  # ==== Artificial Analysis 同 harness（Intelligence Index v4.3.2，四家可直接横比）====
  aa_briefcase: 1202
  aa_gdpval_v21: 1412
  aa_automationbench: 60
  aa_terminal_bench_40: 20
  aa_scicode: 57
  aa_hle: 48
  aa_gdp_pdf: 21
  aa_critpt: 18
  aa_omniscience: 30
  aa_lcr: 81
  aa_input_price_usd: 0.75
  aa_output_price_usd: 3.75
  aa_cache_hit_usd: 0.075
  aa_price_blended: 0.5775
  aa_cost_index_total: 1623
  aa_output_tokens_per_task: 71
  aa_reasoning_tokens_per_task: 43
  aa_index_output_tokens: 172
  aa_ttft: 17.48
  aa_time_first_answer: 17.48
  aa_e2e: 19.53
  aa_time_per_task: 287.01
  # ==== 厂商自报 / 其他第三方口径（口径见卡片正文）====
  eci: 157.13
  vals_index: 62.25
  vals_index_v21: 54.83
  gpqa_diamond: 95.30
  hle_verified: 54.90
  simplebench: 82.40
  arc_agi_1: 98.50
  arc_agi_2: 89.17
  arc_agi_3: 35
  arc_agi_3_std: 10.37
  creative_writing: 1747.90
  mysterymechanism: 36.49
  terminal_bench_21: 89.40
  deepswe: 73.83
  swe_bench_pro: 61.60
  swe_bench_pro_v2: 94.86
  swe_bench_pro_v2_hard: 58.80
  swe_atlas: 51.90
  cursorbench_40: 39.60
  osworld_2: 59
  tau2_banking: 44.90
  tau3_banking: 45
  itbench_sre: 52.50
  hlab: 10.0
  finance_agent_v2: 61.44
  legal_research: 38.94
  vals_tax_agent: 66.77
  vals_code_migration: 36.55
  vals_vibe_code_bench: 78.65
  vals_terminal_bench_science: 8.57
  vals_rsi_index: 19.93
  mmmu_pro: 85.60
  charxiv_rq: 86.20
  lvbench: 87.80
  gdp_pdf_official: 35.0
status: draft
created: 2026-10-02
updated: 2026-10-02
aliases:
  - Gemini 3.8 Flash
  - gemini-3.8-flash
source:
  - https://apidog.com/blog/gemini-3-8-flash-pricing/
  - https://artificialanalysis.ai/models/gemini-3-8-flash
  - https://blog.google/innovation-and-ai/models-and-research/gemini-models/3-8-flash-and-3-8-flash-cyber/
---

# Gemini 3.8 Flash

> [!summary] 一句话
> 四家里**最快**（244.7 tok/s）、上下文 1M、唯一支持音频输入、有免费层；但思考 token 按输出价计费、每任务成本最高（$1.24），且引导价 2027-01-01 翻倍。

## 定位

Google Flash 档最新一代（2026-09-02 发布），官方叙事是 **「works harder」**：复杂任务上执行更多推理步、迭代调用工具、边做边校验。另有安全向变体 **Gemini 3.8 Flash Cyber**。

## 规格

| 项目 | 值 |
|------|-----|
| 发布时间 | 2026-09-02 |
| 开放权重 | 否 |
| 上下文 | 1M |
| 输入模态 | 文本、图像、音频、视频 |
| 思考控制 | `thinking_level`: low / medium / high（默认 medium；`minimal` 已移除，会报校验错误） |
| 计费口径 | **思考 token 按输出价计费**，`usageMetadata.thoughtsTokenCount` 单独返回 |
| 知识截止 | 见官方模型卡 |

## 价格（美元/百万 tokens）

| 项目 | 引导价（至 2026-12-31） | 标准价（2027-01-01 起） |
|------|----------------------:|----------------------:|
| 输入（文本/图像/视频/音频/PDF） | $0.75 | $1.50 |
| 输出（含思考 token） | $3.75 | $7.50 |
| 上下文缓存读取 | $0.075 | $0.15 |
| 缓存存储（每百万/小时） | $0.50 | $1.00 |
| Batch API 输入 / 输出 | $0.375 / $1.875 | $0.75 / $3.75 |

- **免费层**：$0，有限速，数据会被用于改进 Google 产品。
- Google Search grounding：Gemini 3.x 共享每月 5000 次免费，之后 $14/千次。
- 3.6 / 3.7 Flash 同样在 2027-01-01 翻倍，**换旧版 Flash 并不能规避涨价**。

## 独立评测（Artificial Analysis，high 档）

| 指标 | 值 |
|------|-----|
| 智能指数 | 41 |
| 输出速度 | 244.7 tok/s（同类中位数 74） |
| 混合价 | $0.75 / $3.75 |
| 每任务成本 | $1.24 |
| 缓存折扣 | 90% |
| 输出啰嗦度 | 170M tokens（同类中位数 81M，非常啰嗦） |

> [!important] 「同样的刊例价，更贵的账单」
> AA 用旧版指数测得：3.8 Flash high 得分 59（3.7 Flash high 为 56），但每任务多花约 30% 输出 token，每任务成本从 \$0.40 升到 **\$0.58**，耗时从 2.2 分钟升到 2.5 分钟。
> 按 `thinking_level` 降本：high $0.58 → medium $0.41 → low $0.24（每任务）。

## 优缺点

> [!tip] 优势
> - 245 tok/s，四家中最快；1M 上下文。
> - 唯一支持**音频**输入；全模态统一价（除音频外输入同价）。
> - 有免费层，零成本试用与评测。
> - 生态成熟，工具调用与 grounding 集成完善。

> [!warning] 风险
> - **思考 token 按输出价计费**：一次 10K 输入 + 2K 可见输出 + 6K 思考的请求，思考占整单费用的 60%。
> - 引导价 2026-12-31 到期，2027-01-01 起 $1.50/$7.50；届时输入/输出都比 GPT-5.6 Luna（$1/$6）贵，与 Sonnet 5 的差距缩到约 1.3 倍。
> - 默认「更努力」，不显式设置 `thinking_level` 就等于放弃成本控制。
> - 闭源，无法私有化部署。
> - 每任务成本 \$1.24，是 GLM-5.3-Flash（\$0.25）的近 5 倍。

## 适用场景

- ✅ 延迟敏感的高并发通用任务
- ✅ 多模态（含音频）处理、视频与语音类流水线
- ✅ 需要 Google 生态与 grounding 的场景
- ⚠️ 成本敏感场景必须显式下调 `thinking_level`；2027 年前重新评估

## 相关

- [[2026-10 四家 Flash 级模型对比]]
- [[GLM-5.3-Flash]]、[[Qwen3.8-Flash]]、[[deepseek-flash]]
