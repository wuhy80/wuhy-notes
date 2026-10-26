---
tags:
  - 大模型/基础原理
  - 大模型/推理加速
created: 2026-10-26
updated: 2026-10-26
status: evergreen
---

# LLM 推理加速技术地图

![[LLM推理加速技术地图.svg]]

## 核心框架:所有技术都在攻四个瓶颈

推理分两个阶段,瓶颈完全不同:

- **Prefill**(预填充):一口气并行处理输入的全部 token,**瓶颈是 GPU 算力**;
- **Decode(解码)**:一个 token 一个 token 自回归往外蹦,**瓶颈是内存带宽**——每生成一个 token 都要把模型权重搬到计算单元一遍。

于是所有加速技术归入四条路线:**算得少**(少做计算)、**搬得少**(少搬数据)、**一次出多个**(投机解码)、**并行调度**(榨干硬件)。

## ① 算得少 —— 模型结构层(训练时定死,选模型时关注)

| 技术 | 一句话原理 | 代表 |
| --- | --- | --- |
| MoE 稀疏激活 | 125B 总参但每 token 只激活 6B,计算量小约 20 倍 | Qwen Flash 系、DeepSeek、GLM |
| GQA / MQA | 多个查询头共享一组 KV 头,KV cache 直接缩小数倍 | 几乎所有 2024 年后的新模型 |
| MLA(多头潜在注意力) | 把 KV 压缩到低秩潜向量,cache 再省 90%+ | DeepSeek 全系 |
| 稀疏 / 线性注意力 | 只算部分注意力对,或用递归状态替代注意力 | Mamba / RWKV,长上下文模型标配 |

相关:[[大模型/01-基础原理/MOE/关于MOE的问题|MOE 问题]]

## ② 搬得少 —— 量化与显存管理层

| 技术 | 一句话原理 | 备注 |
| --- | --- | --- |
| 权重量化 | 把权重压到 4bit 级,体积和带宽都降到约 1/4 | GGUF Q4_K_M、Unsloth UD、AWQ、FP8;4bit 是质量/体积甜点,3bit 以下明显掉质量 |
| KV Cache 量化 | 长上下文时 cache 比权重还大,压它收益更高 | 常被忽视,长文本场景必看 |
| PagedAttention | 像操作系统分页一样管理 KV cache,消灭显存碎片 | vLLM 的起家本领,吞吐翻倍级 |
| Prefix Caching | 相同前缀(系统提示词、RAG 文档)的 KV 算一次反复用 | DeepSeek API 的"缓存命中折扣"就是它 |
| 专家 Offload | MoE 专家权重放系统内存,显存只放注意力层与热点 | 8G 显存跑 125B 模型的原理,工具见 `大模型/04-部署与工具链/本地部署/` |

## ③ 一次出多个 —— 投机解码家族

共同思想:**生成必须串行,但验证可以并行**。候选猜对直接白拿,猜错一律否决——加速的同时输出质量零损失。区别只在"候选从哪来":

| 技术 | 候选来源 | 特点 | 现状(2026-10) |
| --- | --- | --- | --- |
| MTP 多 token 预测 | 模型**训练时自带**的预测模块 | 零外挂、接受率高、本地部署最省事 | Qwen Flash、DeepSeek V4、GLM、Kimi K2 原生带;首选 |
| EAGLE-3 | 模型内部特征层做草稿,猜得最准 | 3~4 倍加速 | 云端生产标准,已并入 vLLM / SGLang / TensorRT-LLM |
| n-gram / Prompt Lookup | 从当前上下文查重复片段当候选 | 零模型零训练,极轻量 | llama.cpp 内置;代码编辑场景最高 6 倍,纯聊天几乎无效 |
| Medusa / Draft Model | 多解码头 / 外挂小草稿模型 | 早期方案 | 已被 MTP 与 EAGLE 取代 |

> [!warning] 适用边界
> 投机解码消耗的是 GPU **空闲算力**——高并发服务下 GPU 本来就满载,收益趋近于零;本地单人使用收益最大。营销数字(2.7~3.7 倍)多是特定任务实测,日常聊天通常 1.5~2.5 倍。

## ④ 并行调度 —— 服务端吞吐层(本地单机用不到,建立心智模型即可)

| 技术 | 一句话原理 |
| --- | --- |
| Continuous Batching | 新请求随时插队进批,不再等整批跑完;vLLM 高吞吐的另一半原因 |
| PD 分离 | Prefill 吃算力、Decode 吃带宽,特性相反,拆到不同机器各自优化(DeepSeek / Mooncake 架构) |
| TP / PP / EP | 多卡切分一个模型的三种方式:张量并行 / 流水线并行 / 专家并行 |
| Chunked Prefill | 长输入切块处理,避免长 prefill 阻塞其他请求 |

API 为什么这么计费、为什么缓存命中便宜,理解这层就通了。

## ⑤ 地基 —— 系统内核与推理框架

- **内核**:FlashAttention(注意力 IO 优化)、CUDA Graph、MLX(Apple 统一内存生态);
- **框架**:服务端 vLLM / SGLang / TensorRT-LLM;本地 llama.cpp / Ollama / LM Studio(Ollama 与 LM Studio 底层就是 llama.cpp)。

这层偏工程实现,会用即可,深究需要 CUDA 功底。

## 学习路径建议

按"性价比 × 本地部署目标"排序:

1. **吃透已有闭环**:MoE → 量化(Q4_K_M / UD)→ llama.cpp 显存/内存分工 → MTP。动手跑通 Qwen3.8-Flash-Next 坐实概念;
2. **补 KV cache 一课**:GQA → MLA → PagedAttention → Prefix Caching。这是理解"长上下文为什么贵/便宜"的钥匙;
3. **服务端当选修**:Continuous Batching → PD 分离 → TP/EP;
4. **内核层先不碰**,直到前三步通透。

> [!summary] 费曼检验
> 能向别人讲清"为什么 Decode 阶段瓶颈是内存带宽而不是算力",第 1、2 关就算过了。

## 实测参照:Qwen3.8-Flash-Next(125B-A6B)

| 配置 | 生成速度 |
| --- | --- |
| RTX 6000 PRO 全显存,开 MTP | ~170 tok/s |
| RTX 24G + llama.cpp | 30~80 tok/s |
| 12G 显存 + 内存 offload | ~65 tok/s |
| 8G 显存 + 64G 内存(MTP 调优后) | 20~40,调优后 50~60 tok/s |

8G 方案的瓶颈在**内存带宽**(双通道 DDR4/DDR5),内存规格比显存多 4G 更影响体验。

## 相关笔记

- [[大模型/01-基础原理/推理生成过程|推理生成过程]] —— Prefill / Decode 的底层过程
- [[大模型/01-基础原理/MOE/关于MOE的问题|MOE 问题]]
- [[大模型/01-基础原理/Transformer/逐层分解 Transformer|逐层分解 Transformer]]

## 参考资料

- [Unsloth:How to Run Qwen3.8-Flash-Next Locally](https://unsloth.ai/docs/models/qwen3.8-next)
- [llama.cpp 官方文档:Speculative Decoding](https://github.com/ggml-org/llama.cpp/blob/master/docs/speculative.md)
- [Speculative Decoding Guide(May 2026)](https://localaimaster.com/blog/speculative-decoding-guide)
- [知乎:2026 本地大模型显存需求表](https://zhuanlan.zhihu.com/p/2080280290241660666)
- [MindStudio:DeepSeek V4.1 Flash Local 部署指南](https://www.mindstudio.ai/blog/deepseek-v4-1-flash-local)
