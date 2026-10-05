---
tags:
  - 大模型/本地部署
  - vLLM
  - KV-Cache
  - Qwen
  - 显存估算
created: 2026-10-03
updated: 2026-10-03
status: 整理
aliases:
  - Qwen3.8-27B 显存预算
  - vLLM KV Cache 显存估算
  - 混合注意力 KV Cache
source:
  - https://recipes.vllm.ai/Qwen/Qwen3.8-27B
  - https://huggingface.co/Qwen/Qwen3.8-27B
  - https://www.modelscope.cn/models/Qwen/Qwen3.8-27B
---

# Qwen3.8-27B 显存与 KV Cache 预算

> [!summary] 一句话
> Qwen3.8-27B **不是普通 dense 模型**：64 层里只有 **16 层是全注意力**，另外 48 层是线性注意力（常数循环状态）。所以它的 KV cache 只有同规模全注意力模型的 **1/4**——每 token **32 KiB（fp8）/ 64 KiB（bf16）**，1M 上下文单序列只要 **32 GiB / 64 GiB**，而不是 256 GiB。

本文资料截至 **2026 年 10 月初**，模型参数取自官方 `config.json`，实测锚点取自 vLLM Recipes（更新于 2026-10-02）。

---

## 一、先搞清架构，否则算不对

从 `config.json` 的 `text_config` 抠出来的关键字段：

```jsonc
{
  "num_hidden_layers": 64,
  "layer_types": "48 × linear_attention + 16 × full_attention",  // full_attention_interval: 4
  "num_key_value_heads": 4,      // GQA，只有 4 个 KV 头
  "head_dim": 256,               // 头维度很大
  "num_attention_heads": 24,
  "hidden_size": 5120,
  "partial_rotary_factor": 0.25, // RoPE 只作用于 25% 的 head_dim

  "linear_num_key_heads": 16,    "linear_key_head_dim": 128,
  "linear_num_value_heads": 48,  "linear_value_head_dim": 128,
  "linear_conv_kernel_dim": 4,
  "mamba_ssm_dtype": "float32",  // 线性状态默认 fp32

  "mtp_num_hidden_layers": 1,    // 内置 MTP 投机头
  "max_position_embeddings": 262144,   // 原生 262K，1M 要 YaRN
  "vocab_size": 248320
}
```

> [!important] 三个反直觉点
> 1. **只有 16 层进 paged KV cache**——这是全部估算的起点。
> 2. **有一个不随上下文增长的固定开销**：48 个线性层的循环状态，约 **144 MiB/序列**（详见第四节）。
> 3. **它是多模态模型**（带 `vision_config`，27 层视觉塔）。纯文本服务可以用 `--language-model-only` 把它丢掉。

---

## 二、每 token 的 KV 成本

只有全注意力层进 KV cache：

```
每 token = 2(K+V) × 16层 × 4头 × 256维 × 字节数
         = 32,768 个元素
  bf16 → 65,536 B = 64 KiB/token
  fp8  → 32,768 B = 32 KiB/token
```

**对比**：如果 64 层全是全注意力，每 token 是 256 KiB，1M 就要 256 GiB。混合架构**整整省了 4 倍**。

> [!tip] 一个顺手的记忆锚
> fp8 KV 下，**每 131,072 tokens 正好 4 GiB**（131,072 × 32 KiB = 4 GiB）。全是 2 的幂，口算很快。

---

## 三、单序列占用：10K → 1M

| 上下文 | bf16 KV | fp8 KV | + 线性状态 | 合计（bf16 / fp8） |
| --- | --- | --- | --- | --- |
| 10K | 625 MiB | 313 MiB | 144 MiB | 0.75 / 0.45 GiB |
| 32K | 2.0 GiB | 1.0 GiB | 144 MiB | 2.14 / 1.14 GiB |
| 128K | 8.0 GiB | 4.0 GiB | 144 MiB | 8.14 / 4.14 GiB |
| 256K（原生上限） | 16.0 GiB | 8.0 GiB | 144 MiB | 16.1 / 8.1 GiB |
| 512K | 32.0 GiB | 16.0 GiB | 144 MiB | 32.1 / 16.1 GiB |
| 1M | 64.0 GiB | 32.0 GiB | 144 MiB | 64.1 / 32.1 GiB |

---

## 四、容易被忽略的那笔账：线性注意力状态

48 个线性层的循环状态是**每序列一份、不随上下文增长**的：

```
48层 × 48个value头 × (128×128) 状态 × 4字节(fp32) ≈ 144 MiB / 序列
```

（按 Gated DeltaNet 标准布局推算，conv 状态约 4.7 MB 可忽略；vLLM 可用 `--mamba-ssm-cache-dtype` 调低精度）

这带来一个**反直觉的容量规律**：

| 场景 | KV | 线性状态 | 状态占比 |
| --- | --- | --- | --- |
| 1 条 1M 序列 | 32 GiB (fp8) | 0.14 GiB | **0.4%** |
| 256 条 10K 序列 | 78 GiB (fp8) | 36.9 GiB | **32%** |

> [!warning] 结论
> **长上下文时状态被摊薄到可忽略；短上下文高并发时，它才是主要开销。**
> vLLM 对混合模型的状态池是**按 `max_num_seqs` 预留**的，所以并发需求不高时，**主动压小 `--max-num-seqs` 是零成本换 KV 池**。

---

## 五、权重占用

| 精度 | 总量 | 实测锚点（TP2，per GPU） |
| --- | --- | --- |
| bf16 | ~54 GiB | — |
| FP8 | ~28.6 GiB | 14.28 GiB（官方 `Qwen3.8-27B-FP8`） |
| NVFP4（Inferact） | ~24.0 GiB | 12.02 GiB，统一 W4A4，MTP 接受率 0.897 |
| NVFP4（unsloth） | ~21.3 GiB | 10.64 GiB，混合精度，KV 池约 2 倍 |

FP8 与 NVFP4 差 **约 4.5 GiB**——在 48GB 卡上正好等于 **+14.7 万 tokens** 的 KV 池。

---

## 六、什么卡能跑什么上下文（fp8 KV）

| 卡 | 权重选择 | KV 预算（估） | 单序列能到 |
| --- | --- | --- | --- |
| 24GB（4090） | ❌ 装不下 | — | 不可行 |
| 32GB（5090） | NVFP4 + `--enforce-eager` | 实测 91K tokens | ~32K |
| 48GB（RTX PRO 5000 / A6000 / L40S） | FP8 | ~10～14 GiB | **256K 稳妥**，384K 需实测 |
| 80GB（A100/H100） | FP8 | ~40 GiB | 1M 可行；bf16 权重则刚好 256K |
| 141GB（H200） | bf16 | ~70 GiB | 1M bf16 可行 |
| 288GB（GB300） | NVFP4 | 实测 6.6M tokens | 1M × 6 条并发 |

### 实测锚点（vLLM Recipes）

| 硬件 | 配置 | 结果 |
| --- | --- | --- |
| 1× GB300 | NVFP4，TP1，1M 上下文 | 权重 24.6 GiB，**6.6M KV tokens** |
| 2× RTX 5090 | TP2，262K，fp8 KV | FP8 377,456 / NVFP4-Inferact 445,875 / NVFP4-unsloth 920,517 tokens |
| 1× RTX 5090 | NVFP4 + `--enforce-eager`，32K | 91,022 tokens；`--language-model-only` → 135,926；再 `--max-num-seqs 8` → 152,917；bf16 KV → 76,458 |

> [!note] 6.6M 这个数字可以自校验
> 6.6M × 32 KiB = **201 GiB**，288GB 卡放得下 ✓；若是 bf16 KV 则要 403 GiB，装不下 ✗。所以它必然是 fp8 KV，公式对得上。

---

## 七、关键旋钮（按收益排序）

| 旋钮 | 效果 |
| --- | --- |
| `--kv-cache-dtype fp8` | **KV 直接减半**。这个模型 head_dim=256、每 token 64 KiB 本来就大，收益极高 |
| `--max-num-seqs N` | 压小线性状态池，把显存让给 KV（短请求高并发时必调） |
| `--language-model-only` | 丢掉视觉塔，实测多出约 45K tokens |
| `--gpu-memory-utilization` | 决定 KV 池总大小（**只影响池子，不影响单请求上限**） |
| `--enable-prefix-caching` | 长共享前缀场景省 KV |
| `--max-model-len` | **只决定单请求上限，不决定池子大小**——最常见的误区 |
| `--mamba-ssm-cache-dtype` | 线性状态精度（默认按 config 的 fp32） |
| `--speculative-config '{"method":"mtp","num_speculative_tokens":3}'` | 启用内置 MTP 头，但投机头本身也占显存 |

**超过 262K 的额外要求**：`--max-model-len` 提到目标值 + YaRN 覆盖（`--hf-overrides`，注意**嵌套在 `text_config` 下**）。静态 YaRN 是恒定缩放，**别常开**；做 ~524K 的活就把 factor 减半到 2.0。

---

## 八、怎么验证（别只信推算）

启动日志里盯这三行：

```
GPU KV cache size: N tokens
   → 拿 N × 32 KiB 应该约等于你留给 KV 的显存；对不上，差额就是被状态池/激活吃掉的

Maximum concurrency for <max-model-len> tokens per request: X.XXx
   → 低于你需要的并发数就要动手调

（混合模型会单列一行 linear / mamba state cache）
   → 如果这行有几 GiB，就是 --max-num-seqs 在漏
```

---

## 相关笔记

- [[大模型/04-部署与工具链/本地部署/Qwen3.8-27B 部署现状与容量说明|Qwen3.8-27B 部署现状与容量说明]]
- [[大模型/04-部署与工具链/本地部署/M3 ULTRA部署|M3 ULTRA 部署]]
- [[大模型/05-评测与选型/模型体验/Qwen3.8-Flash|Qwen3.8-Flash]]

## 参考资料

- [vLLM Recipes — Qwen/Qwen3.8-27B](https://recipes.vllm.ai/Qwen/Qwen3.8-27B)
- [Hugging Face — Qwen/Qwen3.8-27B](https://huggingface.co/Qwen/Qwen3.8-27B)
- [ModelScope — Qwen/Qwen3.8-27B config.json](https://www.modelscope.cn/models/Qwen/Qwen3.8-27B)
- [vLLM 文档](https://docs.vllm.ai/)
