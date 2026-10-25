---
tags:
  - 大模型/推理框架
  - DeepSeek
  - DeepInfer
  - vLLM
  - 推理优化
created: 2026-10-25
updated: 2026-10-25
source: https://www.douyin.com/video/7700231617540853026
status: 整理
aliases:
  - DeepInfer
  - DeepSeek 推理框架
---

# DeepInfer：DeepSeek 开源的推理框架

> [!summary] 一句话
> DeepInfer 是 DeepSeek 生产环境的推理框架，2026-10-16 以 **Apache-2.0** 开源。它**最初基于 vLLM 开发**，靠 MoE 专家并行 + EPLB、DSpark 投机解码、零开销异步调度等手段把单请求生成速度拉高；但这次只放出**离线推理 + 引擎内核**，不含 KV Cache、PD 分离、DP 负载均衡这些"能对外服务"的部件，且只支持 `DeepSeek-V4.1-Flash`，硬件要 **NVIDIA SM100 或华为昇腾 950**。

> [!info] 视频信息
> - 标题：Vibe知识大赏 | **DeepSeek 推理框架是什么？10 分钟速通 DeepInfer**
> - 作者：@抖音科技；时长 **11:19**；发布 2026-10-24 21:51
> - 互动数据（抓取时）：点赞 2386 · 评论 100 · 分享 1225 · 收藏 375
> - 链接：<https://www.douyin.com/video/7700231617540853026>
> - ⚠️ 本笔记是**视频自带文案/摘要 + 官方仓库**的整理，不是逐字稿（边界见文末）

## 一、视频怎么说

视频页面上的文案（视频自带的 AI 摘要）原文：

> DeepSeek 推理框架是一种高度定制化的推理引擎，基于 vLLM 进行了优化，采用了 prefill 和 decode 分离、投机解码、零开销调度和专家并行等技术，提高了大模型的推理性能和效率。DeepSeek 推理框架在吞吐不变的前提下，可将单个请求的生成速度提升 60% 到 85%。

拆成四条关键技术：

| # | 技术 | 一句话解释 |
|---|---|---|
| 1 | **Prefill / Decode 分离** | 预填充（算 prompt）和解码（逐 token 生成）拆成两组机器，各自按负载扩缩，互不拖累 |
| 2 | **投机解码** | 用小模型/额外头部先"猜"几个 token，再用大模型一次性验证，猜对就省下多次前向 |
| 3 | **零开销调度** | 把批调度放到 CPU 异步做，和 GPU 计算重叠，调度时间几乎不进关键路径 |
| 4 | **专家并行（EP）** | MoE 的专家分散到多卡多机，靠 EPLB 之类的负载均衡避免个别专家拖慢全局 |

## 二、官方仓库说了什么

仓库：[`deepseek-ai/DeepInfer`](https://github.com/deepseek-ai/DeepInfer)（2026-10-16 创建，Apache-2.0，抓取时 21.8k star / 2.5k fork）

| 维度 | 官方说法（README 原文要点） |
|---|---|
| 定位 | "powers DeepSeek's large-scale production services"，**本次开源的是离线推理 + 服务所需的核心能力** |
| 支持模型 | **只有 `DeepSeek-V4.1-Flash`**（默认 checkpoint `deepseek-ai/DeepSeek-V4.1-Flash-1017`） |
| 并行 | Attention DP / balanced CP；**MoE EP + EPLB** |
| 投机解码 | **DSpark + confidence-scheduled verification**（`DEEPINFER_ENABLE_MTP_VARLEN=1`，draft 上限 `DEEPINFER_USE_NEXTN_DECODE`，默认 5） |
| 调度 | **异步调度（zero-overhead batch scheduler）**，默认开启 |
| 省 prefill | **SWA bounded replay**：只重放一段有界后缀（默认保留 140 token） |
| 一致性 | batch-invariant 推理、确定性采样（NVIDIA only） |
| 结构化输出 | 正则 / JSON Schema / EBNF 语法约束 |
| 算子 | FlashMLA、DeepGEMM、DeepEP、TileKernels、DeepSelect + 自研 TileLang kernel |
| 硬件 | **NVIDIA SM100（Blackwell）**、**华为昇腾 950 NPU** |
| 门槛 | Linux、GCC ≥13、Python 3.12、CUDA 13（NVIDIA）/ CANN 9.2（昇腾） |
| **本版不含** | KV Cache 系统、**VE/Prefill/Decode 分离**（引擎侧大部分已实现但未随包发布）、prefill/decode 各自的 DP 负载均衡 |
| 致谢 | "**originally built primarily on vLLM**"，另参考了 SGLang 与 TensorRT-LLM |
| Benchmark 环境 | prefill 用 **4 张 SM100**、decode 用 **64 张**（同一 scale-up 域） |
| 复现与评测 | benchmark 用 `examples/sweep/run_sweep.sh` 复现；评测基准在 `eval/README.md`；构建时用 `DEEPINFER_ACCELERATOR=nvidia\|ascend` 选硬件 |

## 三、逐条核对：视频 vs 官方

| 视频说法 | 官方证据 | 结论 |
|---|---|---|
| 基于 vLLM 优化 | README 致谢："originally built primarily on vLLM" | ✅ 成立（"最初基于"，现在内核已自研） |
| Prefill / Decode 分离 | README 把 PD 分离列在"**本版不含**"里 | ⚠️ 生产环境有，**开源包没带** |
| 投机解码 | DSpark + confidence-scheduled verification | ✅ 成立（且能配 draft 长度） |
| 零开销调度 | "Asynchronous scheduling (zero-overhead batch scheduler)" | ✅ 措辞几乎逐字对应 |
| 专家并行 | "MoE EP + EPLB" | ✅ 成立 |
| 单请求生成速度 +60%~85%（吞吐不变） | README 只给 prefill/decode 的 **Pareto 图**，没有这个数字 | ❓ **未证实**，暂无出处 |

> [!warning] 别把"开源了"理解成"能直接对外提供服务"
> 一个能跑的推理服务至少还要：**KV Cache 系统**、**PD 分离部署**、**prefill/decode 的 DP 负载均衡**——这三样恰好都在"本次不含"清单里。开源出来的是**引擎内核**，不是可直接运营的服务。

## 四、为什么从 vLLM 分叉出自研框架

vLLM 是通用推理引擎，强在 PagedAttention + 广覆盖；但 DeepSeek 的服务有三条特殊需求，通用引擎很难同时满足：

1. **MoE 专家并行要在多机多卡上跑**，还要处理"某些专家天然更热"的负载不均 → 需要 EPLB（专家并行负载均衡）；
2. **PD 分离 + 大规模 EP** 会引入大量跨机通信 → 需要计算/通信重叠（2025 年官方文章讲的"双 batch 重叠"、decode 拆 5 段流水线）；
3. **FP8 训练与服务同精度**、专用算子（FlashMLA / DeepGEMM / DeepEP）要深度嵌入调度。

官方 2025-03 的《DeepSeek-V3 / R1 推理系统概览》给过具体配置，可以当作 DeepInfer 的"前身"：

- Prefill：路由专家 **EP32**、MLA 与共享专家 **DP32**，一个部署单元 4 节点，32 个冗余路由专家，每卡 9 路由 + 1 共享专家；
- Decode：路由专家 **EP144**、MLA 与共享专家 **DP144**，一个部署单元 18 节点，每卡 2 路由 + 1 共享专家；
- 全部 H800，矩阵与 dispatch 用 **FP8**、core-attention 与 combine 用 **BF16**；
- 24h 实测：输入 608B token（56.3% 命中 KVCache 硬盘缓存）、输出 168B、平均 20~22 tps、prefill 吞吐约 73.7k tok/s、decode 吞吐约 14.8k tok/s（原文口径：**平均每台 H800**，即 8 卡服务器，非每卡），峰值占用 278 节点，**理论利润率 545%**。

## 五、开源版能干什么、不能干什么

| 想做的事 | 可行性 |
|---|---|
| 读源码学推理引擎架构（PD、EP、EPLB、异步调度） | ✅ 最推荐，代码 + 算子仓库一起看 |
| 在 SM100 / 昇腾 950 上跑离线推理 | ✅ 官方给了 `examples/offline_inference.py` 与 `build.sh` |
| 在 A100 / H800 / 4090 上跑 | ❌ 不在支持列表（SM100 起） |
| 直接替换 vLLM 上线服务 | ❌ 缺 KV Cache / PD / DP 负载均衡 |
| 跑 V3 / R1 等旧模型 | ❌ 只声明支持 `V4.1-Flash` |

> [!tip] 想"动手感受"的最短路径
> 不追求复现性能，只想理解设计：先读 README 的 feature 段 → 再看 `deepinfer/` 里调度与 EP 相关模块 → 配合 `FlashMLA`/`DeepGEMM`/`DeepEP` 三个算子仓库。真要跑，至少需要一张 SM100（或昇腾 950 环境 + CANN 9.2）。

## 六、我的判断

1. **这是一次"能力展示型"开源**：把生产引擎的核心调度与并行开放出来，但把运营必需的 KV Cache/PD/负载均衡留在内部——既赚生态口碑，又不承诺可托管的服务形态。
2. **单模型支持**说明它是"给自家模型配套的引擎"，不是通用推理框架，和 vLLM/SGLang 不在同一个竞争位面。
3. **昇腾 950 进支持列表**是个强信号：DeepSeek 在把推理栈往国产算力上铺。
4. 视频那 60%~85% 的提速数字**暂时当宣传口径看**，官方 README 只给 Pareto 图，没有单点数字。

## 相关笔记

- [[大模型/01-基础原理/推理生成过程|推理生成过程]]
- [[大模型/04-部署与工具链/本地部署/Qwen3.8-27B 显存与 KV Cache 预算|Qwen3.8-27B 显存与 KV Cache 预算]]
- [[大模型/05-评测与选型/性能测试/11款英伟达显卡vllm吞吐性能大测试|11 款英伟达显卡 vLLM 吞吐性能大测试]]
- [[大模型/07-教程与课程/AI大模型原理教程-轩辕/卷四-大语言模型/26-KV 缓存、稀疏注意力与 FlashAttention|26-KV 缓存、稀疏注意力与 FlashAttention]]

## 参考资料

- 官方仓库（README，2026-10-25 抓取）：<https://github.com/deepseek-ai/DeepInfer>
- 官方推理系统概览（2025-03，知乎原文的 IT之家转载）：<https://tech.ifeng.com/c/8hMojg5JwG6>
- 视频：<https://www.douyin.com/video/7700231617540853026>

## 整理说明（可信度边界）

- 视频 **11:19 的口播内容没有转录**（本机无 ASR 能力）。文中「视频怎么说」取自**页面上的文案/摘要与标题**，可能不完整，也可能与口播有出入。
- 「60%~85%」这个数字来自视频文案，**官方 README 无对应表述**，未核实。
- 官方事实（模型、特性、硬件、门槛、许可证、"不含"清单、benchmark 环境）均来自 GitHub README 原文。
- 若之后拿到完整讲稿/字幕，可回来补「逐段要点」一节。
- **2026-10-25 复核**：通过 GitHub API 逐行核对 README（模型、特性、环境变量默认值、硬件、门槛、许可证、"不含"清单、benchmark 环境、致谢措辞）与仓库元数据（2026-10-16 创建、Apache-2.0、21.9k star / 2.5k fork），全部一致；2025-03 推理系统概览的数字（EP32/DP32、EP144/DP144、608B/168B、56.3% 命中、20~22 tps、73.7k/14.8k、278 节点、545%）经凤凰网原文逐项核对一致，**据原文修正一处单位**：吞吐为「平均每台 H800（8 卡服务器）」而非「每卡」。抖音页为反爬 JS 壳，视频互动数据无法复核，维持抓取时记录。
