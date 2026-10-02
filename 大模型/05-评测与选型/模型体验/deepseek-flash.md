---
tags:
  - 大模型/模型卡片
  - 大模型/Flash
  - 大模型/DeepSeek
type: model-card
model: deepseek-flash
vendor: DeepSeek
model_family: DeepSeek
tier: Flash
release_date: 2026-09-10
open_weights: true
license: MIT
context_window: 1000000
max_output: 384000
total_params_b: 552
active_params_b: 16
input_modalities:
  - 文本
  - 图像
currency: CNY
price_input: 2
price_output: 8
price_cache_hit: 0.04
price_input_usd_equiv: 0.28
price_output_usd_equiv: 1.13
aa_intelligence: 39
aa_speed_tps: 208.9
aa_cost_per_task_usd: 0.27
aa_cache_discount_pct: 98
local_deploy: false
agent_ready: true
price_display: 2 / 8 元（高峰）
params_display: 552B / 16B
context_display: 1M / 输出 384K
key_benchmark: DeepSWE 74.2 · Terminal-Bench 2.1 90.6 · HLE 36.8
verdict: 速度第二快、缓存最便宜；高难推理与长程任务偏弱
status: draft
created: 2026-10-02
updated: 2026-10-02
aliases:
  - DeepSeek V4.1 Flash
  - DeepSeek-V4.1-Flash
  - deepseek-v4-flash
source:
  - https://api-docs.deepseek.com/zh-cn/quick_start/pricing/
  - https://api-docs.deepseek.com/zh-cn/news/news260910/
  - https://artificialanalysis.ai/models/deepseek-v4-1-flash
  - https://m.163.com/tech/article/L6D9G3RR00097U7T.html
---

# deepseek-flash

> [!summary] 一句话
> 四家里速度第二快（208.9 tok/s）、缓存最便宜（折扣 98%）、总 token 消耗最省；短板是**高难推理**（HLE 36.8）和**长程任务稳定性**，以及 552B 参数带来的自部署高门槛。

## 定位

DeepSeek 全新模型结构系列中**最小尺寸**的模型，原生多模态视觉理解。官方称在性能、费用、速度、总用时上全面超越 V4 Pro，因此 V4 Pro 已被有序下线——访问 `deepseek-v4-pro` 会路由到 V4.1 Flash 并按 Flash 单价计费。

## 规格

| 项目 | 值 |
|------|-----|
| 发布时间 | 2026-09-10 |
| 开放权重 | 是（MIT），HuggingFace `deepseek-ai/DeepSeek-V4.1-Flash` |
| 总参数 | 552B MoE |
| 激活参数 | 输入 8B / 输出 16B（非对称） |
| 架构 | Causal-Encoder-Decoder（输入输出不对称）+ CSA2 + Engram |
| 上下文 | 1M |
| 最大输出 | 384K |
| 输入模态 | 文本、图像 |
| 思考控制 | 非思考 / 思考（默认），支持 FIM 仅非思考模式 |
| KV Cache | 约 890 字节/token，相比初代缩小 437 倍；HBM 需求降至 1/4、SSD 需求降至 1/8 |
| 并发限制 | 2500 |

> [!note] 模型名兼容
> 请使用 `deepseek-flash`。旧名 `deepseek-v4-flash`、`deepseek-v4-flash-vision-exp` 仍可调用，但对应模型已下线，请求由 V4.1 Flash 提供服务并按 Flash 价计费。

## 价格（元/百万 tokens）

| 项目 | 空闲时段 | 高峰时段 |
|------|--------:|--------:|
| 输入（缓存命中） | 0.02 | 0.04 |
| 输入（缓存未命中） | 1 | 2 |
| 输出 | 4 | 8 |

- **空闲价为高峰价的一半。** 高峰时段 = 北京时间周一至周五 9:00–12:00、14:00–18:00（不含中国法定节假日）；其余时间含周末与法定节假日全天均为空闲价。
- 缓存命中价低到 0.02 元，配合 KV Cache 压缩，**长会话 Agent 场景的缓存命中费用占比显著下降**。

## 独立评测（Artificial Analysis，max 档）

| 指标 | 值 |
|------|-----|
| 智能指数 | 39（开源权重模型第 7/117） |
| 输出速度 | 208.9 tok/s（同类中位数 69） |
| 混合价 | $0.30 / $1.20 |
| 每任务成本 | $0.27 |
| 缓存折扣 | 98%（四家最高） |
| 输出啰嗦度 | 250M tokens（同类中位数 140M，非常啰嗦） |

## 厂商自报跑分

| 基准 | 分数 | 参照 |
|------|-----:|------|
| DeepSWE | 74.2 | Claude Opus 5 为 74.0、GPT-5.6 Sol 为 73.0 |
| Terminal-Bench 2.1 | 90.6 | — |
| Terminal-Bench 3.0 | 30 | 同一模型换测试版本后大幅回落 |
| HLE | 36.8 | 落后 Claude Opus 5 约 20 分 |

## 优缺点

> [!tip] 优势
> - 速度 208.9 tok/s，且缓存折扣 98%，长会话成本优势明显。
> - 网易智能三题实测（3D 停车游戏 / 电商下单 / 预约系统）**全部通过**，V4 Flash 有两题分别出现 3D 场景倒置、重启后订单读不到的问题。
> - 生成耗时约为 V4 Flash 的三到四成，输出 token 少 14.4%、总 token 少 44.7%。
> - 腾讯 WorkBuddy / CodeBuddy 与 OpenCode 已全量接入；MIT 许可。

> [!warning] 风险
> - **HLE 36.8**：高难学术推理是明确弱项。
> - **长程任务稳定性存疑**：Terminal-Bench 从 2.1 的 90.6 掉到 3.0 的 30，同一模型换测试版本后崩落。
> - **自部署门槛极高**：552B、约 480GiB 权重，社区反馈量化后仍可能慢到 1 tok/s 级，一句话要等 74 秒。
> - 输出啰嗦（250M tokens），刊例价虽低但实际用量偏大。

## 适用场景

- ✅ 长会话 Agent、缓存命中为主的场景（成本最优）
- ✅ 对生成速度敏感的交互式编码与工具调用
- ✅ 廉价批量生成
- ⚠️ 不适合高难推理任务；不适合本地自部署

## 相关

- [[2026-10 四家 Flash 级模型对比]]
- [[GLM-5.3-Flash]]、[[Qwen3.8-Flash]]、[[Gemini 3.8 Flash]]
