---
tags:
  - 大模型/模型卡片
  - 大模型/Flash
  - 大模型/GLM
type: model-card
model: GLM-5.3-Flash
vendor: 智谱 BigModel
model_family: GLM
tier: Flash
release_date: 2026-08-26
open_weights: true
license: MIT
context_window: 1000000
max_output: 128000
total_params_b: 320
active_params_b: 18
input_modalities:
  - 文本
  - 图片
  - 视频
  - 文件
currency: CNY
price_input: 0.8
price_output: 2.8
price_cache_hit: 0.23
price_input_usd_equiv: 0.11
price_output_usd_equiv: 0.39
aa_intelligence: 42
aa_speed_tps: 47.2
aa_cost_per_task_usd: 0.25
aa_cache_discount_pct: 83
local_deploy: true
agent_ready: true
price_display: 0.8 / 2.8 元
params_display: 320B / 18B
context_display: 1M / 输出 128K
key_benchmark: Terminal-Bench 2.1 84.3 · DeepSWE 63.4 · Toolathlon 78.4
verdict: 工程交付最完整、每任务成本最低，但输出仅 47 tok/s
# 评测指标明细；键名对应横评表的「指标」行，未收录的键直接省略
bench:
  # ==== Artificial Analysis 同 harness（Intelligence Index v4.3.2，四家可直接横比）====
  aa_briefcase: 1454
  aa_gdpval_v21: 1645
  aa_automationbench: 60
  aa_terminal_bench_40: 33
  aa_scicode: 52
  aa_hle: 40
  aa_gdp_pdf: 15
  aa_critpt: 15
  aa_omniscience: 7
  aa_lcr: 80
  aa_input_price_usd: 0.15
  aa_output_price_usd: 0.50
  aa_cache_hit_usd: 0.026
  aa_price_blended: 0.0982
  aa_cost_index_total: 280
  aa_output_tokens_per_task: 69
  aa_reasoning_tokens_per_task: 47
  aa_index_output_tokens: 181
  aa_ttft: 3.29
  aa_time_first_answer: 45.62
  aa_e2e: 56.20
  aa_time_per_task: 1064.14
  # ==== 厂商自报 / 其他第三方口径（口径见卡片正文）====
  eci: 151.90
  vals_index: 47.22
  gdpval_aa_v2: 1773
  hle_tools: 55.30
  gpqa_diamond: 90.15
  simplebench: 55.10
  arc_agi_1: 91
  arc_agi_2: 65.83
  terminal_bench_21: 84.30
  deepswe: 63.39
  nl2repo: 56.30
  toolathlon: 78.40
  agents_last_exam: 26.30
  automationbench: 48.80
  tau3_banking: 47.20
  finance_agent_v2: 57.85
  vals_tax_agent: 61.96
  vals_code_migration: 20.52
  vals_vibe_code_bench: 30.76
  vals_terminal_bench_science: 2.86
  emb_excel: 55.93
  legal_research: 45.19
  hlab: 6.67
  officeqa_pro: 62.40
  context_arena: 79.45
  charxiv_rq: 89.40
  babyvision: 53.40
  mvvbench: 77.80
  mmvu: 80.50
  medscribe: 88.94
  chartography: 78
  frontier_math_v2: 55.79
  proofbench: 21
status: draft
created: 2026-10-02
updated: 2026-10-02
aliases:
  - GLM 5.3 Flash
  - glm-5.3-flash
source:
  - https://docs.bigmodel.cn/cn/guide/start/pricing
  - https://docs.bigmodel.cn/cn/guide/models/vlm/glm-5.3-flash
  - https://artificialanalysis.ai/models/glm-5-3-flash
---

# GLM-5.3-Flash

> [!summary] 一句话
> 单价最低档的「旗舰级 Agent 能力 + Flash 级成本」，工程交付完整度最好；但 **「Flash」指的是价格档，不是速度档**——输出速度只有 47.2 tok/s。

## 定位

智谱 GLM-5 系列首个原生多模态模型，视觉能力直接进入 Coding 循环（模型能看界面、渲染结果和交互反馈并持续改进）。官方主推场景是 Office、金融研究、专业文档，可交付 PPTX / PDF / DOCX / XLSX。

## 规格

| 项目 | 值 |
|------|-----|
| 发布时间 | 2026-08-26 |
| 开放权重 | 是（MIT） |
| 总参数 / 激活 | 320B / 18B |
| 上下文 | 1M |
| 最大输出 | 128K |
| 输入模态 | 视频、图像、文本、文件 |
| 架构 | 稀疏注意力 + 线性注意力混合 |
| 效率 | 相比 GLM-5.3，注意力计算量降 3.01 倍、KV Cache 降 4.44 倍 |
| 思考控制 | `thinking.type=enabled`，推荐 `reasoning_effort: max` |

## 价格（元/百万 tokens）

| 项目 | GLM-5.3-Flash | GLM-5.3-FlashX |
|------|--------------:|---------------:|
| 输入 | 0.8 | 2 |
| 输出 | 2.8 | 7 |
| 缓存命中 | 0.23 | 0.57 |

- 缓存存储限时免费；Batch API 为标准价 5 折。
- **GLM-5.3-FlashX** 是同架构速度版，官方称约 200 tokens/s，适合对延迟敏感的线上业务。

## 独立评测（Artificial Analysis）

| 指标 | 值 |
|------|-----|
| 智能指数 | 42（开源权重模型第 4/117，同类中位数 18） |
| 输出速度 | 47.2 tok/s（同类中位数 67，明显偏慢） |
| 首 token 时间 | 1.47 s（优于中位数 2.14 s） |
| 混合价 | $0.15 / $0.50 |
| 每任务成本 | $0.25 |
| 缓存折扣 | 83% |
| 输出啰嗦度 | 180M tokens（同类中位数 140M，偏啰嗦） |

## 厂商自报跑分（多为 max 档 + 带工具，口径不可混用）

| 基准 | 分数 | 参照 |
|------|-----:|------|
| Terminal-Bench 2.1 | 84.3 | Claude Opus 4.8 为 85.0、GPT-5.6 Terra 为 87.4 |
| DeepSWE v1.1 | 63.4 | 同门 GLM-5.2 为 46.2 |
| Toolathlon Verified | 78.4 | 同门 GLM-5.3 为 73.0（反而更高） |
| AutomationBench | 48.8 | 同门 GLM-5.2 为 26.2 |
| OfficeQA Pro | 62.4 | — |
| HLE（带工具） | 55.3 | 同门 GLM-5.3 为 62.5（−7.2） |
| GPQA Diamond | 90.15 | — |

## 优缺点

> [!tip] 优势
> - 官方单价最低档（与 Qwen3.8-Flash 持平），每任务成本 $0.25 是四家中最低。
> - 工程完整度最好：雷峰网同题实测（从零开发个人工作台）中结构最完整，登录、模块、CRUD、统计、测试齐全，像标准 SaaS。
> - 原生多模态，文档 / 截图 / 图表类工作负载有结构性优势。
> - 首 token 时间 1.47 s，聊天类交互体感不差。

> [!warning] 风险
> - **输出速度慢**：47.2 tok/s，低于同体量模型中位数 67 tok/s；批处理流水线的墙钟时间会明显偏长。
> - 高难学术推理是降本代价所在：HLE 比同门旗舰低 7.2 分。
> - 1M 上下文的衰减未被独立测量（压缩按定义是以精度换成本）。
> - 本地部署实测中出现「50 字约束超限」「被禁词点名」等指令跟随错误。

## 适用场景

- ✅ 高频办公、文档处理、交付物生成（PPTX/DOCX/XLSX）
- ✅ 需要工程完整度的 Coding Agent 任务
- ✅ 缓存命中为主的批量任务
- ✅ 本地部署：MIT 开源，社区已有单机 3-bit（Unsloth GGUF，120.4 GB）与双机 NVFP4（vLLM TP=2）方案；单机 128GB 需 `--cache-ram 0 --ctx-checkpoints 0` 才能跑完长生成，双机版代码修复仅 38.1 秒
- ⚠️ 不适合对吞吐/墙钟时间敏感的批处理

## 相关

- [[2026-10 四家 Flash 级模型对比]]
- [[Qwen3.8-Flash]]、[[deepseek-flash]]、[[Gemini 3.8 Flash]]
