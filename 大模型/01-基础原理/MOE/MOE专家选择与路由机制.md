---
tags:
  - 大模型/架构
  - 大模型/MOE
  - DeepResearch
created: 2026-07-28
updated: 2026-07-28
status: 整理
aliases:
  - MoE专家路由
  - 混合专家路由机制
source:
  - https://arxiv.org/abs/1701.06538
  - https://arxiv.org/abs/2101.03961
  - https://arxiv.org/abs/2401.04088
  - https://arxiv.org/abs/2401.06066
  - https://arxiv.org/abs/2505.09388
---

# MOE 专家选择与路由机制

## 核心结论

>[!summary] 一句话理解
>MoE 不是先训练好若干“数学家、程序员、翻译家”，再由模型识别任务并调用其中一个。现代稀疏 MoE 通常是在 Transformer 的 FFN 位置放置许多结构相同但参数不同的子网络；每个 token 到达每一层时，Router 根据该 token 当前的上下文表示计算分数，选择 Top-k 个专家，将 token 发给它们处理，再将多个专家的输出加权合并。

理解 MoE 最重要的十点：

1. **专家通常是 FFN 子网络，不是完整语言模型。** Attention、Embedding 等大部分结构仍由所有 token 共享。
2. **选择单位通常是 token，而不是句子、请求或用户。** 同一句话里的 token 可以走向不同专家。
3. **每一层都会重新选择。** 一个 token 在第 5 层选择 E3/E17，在第 6 层可能选择 E8/E42。
4. **Router 看的是上下文化隐藏向量。** 相同词在不同上下文中可能选择不同专家。
5. **专家通常没有人工预设的领域标签。** 专业化是在联合训练中涌现的，而且往往是局部、重叠和难解释的。
6. **Top-k 只减少本次计算，不减少模型总权重。** 部署时通常仍需让全部专家权重驻留在一台或多台设备上。
7. **活跃参数量不等于专家数量。** Qwen3-30B-A3B 中的 A3B 表示每个 token 计算时大约激活 3B 参数，不是只选择 3 个专家。
8. **负载均衡是训练成败的关键。** 如果 Router 总把 token 发给少数专家，就会产生拥塞和专家塌缩。
9. **MoE 的瓶颈常是通信和内存，而不是纯 FLOPs。** All-to-All、Token 重排和小批量下的低利用率会抵消稀疏计算收益。
10. **不能简单抽取某个“领域专家”当小模型。** 专家能力分散在不同层、共享模块和多个专家之间，通常需要剪枝、蒸馏和再训练。

## 研究问题与范围

本文采用 [[大模型/11-知识管理/深度研究与问题分析方法|Deep Research]] 的问题拆解方式，重点回答：

1. MoE 中的“专家”究竟是什么？
2. Router 根据什么选择专家，Top-k 是怎样计算的？
3. 被选中的专家如何接收 token、计算并合并结果？
4. Router 和专家怎样一起训练，离散选择如何获得梯度？
5. 为什么需要负载均衡、容量限制和 Router 稳定化？
6. 专家是否会自然形成数学、代码、语言等分工？
7. Shared Expert、Expert Choice 和细粒度专家解决了什么问题？
8. MoE 在训练和推理时为什么难以获得理论上的加速？
9. Qwen3、Mixtral、DeepSeekMoE 等模型实际如何配置专家？
10. 能否只提取少数专家，得到一个更小、更快的模型？

研究范围限于 Transformer 大语言模型中的稀疏 MoE，重点是 Token Choice Routing。传统集成学习中的 Mixture of Experts、视觉 MoE 和多模态 MoE 只在机制相关处提及。

>[!info] 调研基线
>本文以经典 MoE、GShard、Switch Transformer、ST-MoE、Expert Choice、MegaBlocks、Mixtral、DeepSeekMoE 和 Qwen3 技术报告为主要证据。2026-07-28 调研时，ArXiv API 出现限流，Hugging Face 连接超时，因此论文链接和模型发布资料已列出，但最新仓库配置仍应以实际下载模型的 `config.json` 为准。

## 一、先建立正确的结构图

### Dense Transformer 层

一个简化的 Dense Transformer 层可以看成：

```text
输入隐藏状态
  -> Self-Attention
  -> 残差连接
  -> 单个共享 FFN
  -> 残差连接
  -> 下一层
```

在许多模型中，FFN 占据大量参数。以 SwiGLU 为例，一个 FFN 可以简化为：

$$
FFN(h)=W_{down}\left(SiLU(W_{gate}h)\odot W_{up}h\right)
$$

### Sparse MoE Transformer 层

MoE 通常将“单个共享 FFN”替换成多个 FFN 专家：

```text
输入隐藏状态
  -> Self-Attention（共享）
  -> 残差连接
  -> Router
       -> Expert 0 FFN
       -> Expert 1 FFN
       -> ...
       -> Expert N-1 FFN
  -> 合并被选专家的输出
  -> 残差连接
  -> 下一层
```

每个专家结构通常相同，但权重不同：

$$
E_i(h)=W_{down}^{(i)}\left(SiLU(W_{gate}^{(i)}h)\odot W_{up}^{(i)}h\right)
$$

>[!important] “专家”不是什么
>以 Mixtral 为例，“8 个专家”不是 8 个完整的 7B 模型，也不是每个专家各自拥有 Attention、Tokenizer 和 KV Cache。它们主要是每个 MoE 层中的 8 组 FFN 参数；Attention 等模块仍然共享。

## 二、Router 怎样选择专家

### 第一步：用隐藏状态计算路由分数

设某一层某个 token 的上下文化隐藏向量为 $h_t\in\mathbb{R}^{d}$，该层有 $N$ 个专家。最常见的 Router 是一个很小的线性层：

$$
z_t=W_rh_t+b_r
$$

其中：

- $W_r\in\mathbb{R}^{N\times d}$ 是 Router 参数。
- $z_t\in\mathbb{R}^{N}$ 是该 token 对所有专家的 logits。
- 第 $i$ 个 logit 越大，表示 Router 越倾向选择专家 $i$。

Router 的输入不是原始 token ID，而是经过当前层之前所有计算得到的隐藏向量。因此它已经包含词义、位置和上下文信息。

### 第二步：将 logits 转为分数

常见做法是 Softmax：

$$
p_{t,i}=\frac{e^{z_{t,i}}}{\sum_{j=1}^{N}e^{z_{t,j}}}
$$

部分新模型会使用 Sigmoid、分组路由、额外偏置或缩放。工程上还存在两种细节差异：

- 先对所有专家 Softmax，再取 Top-k。
- 先取 Top-k，再只对入选专家重新归一化。

这会影响合并权重，但不改变“根据当前 token 隐藏状态选择少数专家”的核心逻辑。

### 第三步：Top-k 选择

$$
S_t=TopK(p_t,k)
$$

- Top-1：每个 token 只交给一个专家，Switch Transformer 是代表。
- Top-2：每个 token 交给两个专家，Mixtral 8x7B 是代表。
- 更大的 k：提供更多计算路径和冗余，但增加计算与通信。

选中后，得到归一化门控权重 $g_{t,i}$：

$$
g_{t,i}=\frac{p_{t,i}}{\sum_{j\in S_t}p_{t,j}},\quad i\in S_t
$$

### 一个数值例子

假设一层有 4 个专家，某个 token 的 Router logits 是：

```text
E0:  2.2
E1:  0.5
E2:  1.8
E3: -0.4
```

Softmax 后大约为：

```text
E0: 0.519
E1: 0.095
E2: 0.348
E3: 0.039
```

Top-2 选择 E0 和 E2，在二者之间重新归一化后权重大约为 0.599 和 0.401。最终输出为：

$$
y_t=0.599E_0(h_t)+0.401E_2(h_t)
$$

下一层会基于新的隐藏状态重新路由，不保证继续使用 E0 和 E2。

## 三、选择之后，专家是怎样“使用”的

在真实实现中，不能低效地逐 token 调用 Python 中的专家函数。一个 MoE 层通常执行以下数据流：

```text
1. 输入张量 [batch, sequence, hidden]
2. 展平为 T 个 token：[T, hidden]
3. Router 生成 [T, N] 分数
4. 为每个 token 得到 k 个专家索引和权重
5. 按专家索引对 token 重排和分桶
6. 将 token 发往专家所在 GPU（Expert Parallel）
7. 各专家批量执行 FFN / Grouped GEMM
8. 将专家输出发回并恢复原 token 顺序
9. 按 Router 权重合并同一 token 的多个输出
10. 进入残差连接和下一层
```

### Token Dispatch

假设有 4 个 token 和 4 个专家，每个 token 选择 2 个专家：

| Token | 选择结果 | 分发目标 |
| --- | --- | --- |
| T0 | E0: 0.7, E2: 0.3 | E0、E2 |
| T1 | E1: 0.6, E2: 0.4 | E1、E2 |
| T2 | E0: 0.8, E3: 0.2 | E0、E3 |
| T3 | E2: 0.9, E1: 0.1 | E2、E1 |

实现会把发给相同专家的 token 聚合：

```text
E0 <- T0, T2
E1 <- T1, T3
E2 <- T0, T1, T3
E3 <- T2
```

专家完成计算后再执行逆置换，并按门控权重合并。一个 token 选择两个专家时，它会被复制到两条计算路径，但在层输出位置仍恢复为一个向量。

### Expert Parallel 与 All-to-All

专家数量较多时，各 GPU 只保存部分专家。例如 8 张 GPU、128 个专家，每张 GPU 可以保存 16 个专家。Router 的选择结果通常跨越设备，因此需要 All-to-All 通信：

```text
每张 GPU 上的原始 token
  -> 按目标专家重排
  -> All-to-All 发送到专家所在 GPU
  -> 专家计算
  -> All-to-All 发回原 GPU
  -> 恢复 token 顺序
```

这解释了为什么“只激活少量参数”不一定自动变成低延迟：网络带宽、设备互联、负载倾斜和 Token 重排都可能成为瓶颈。

### Prefill 与 Decode 的差异

- **Prefill**：一次处理较多 token，容易形成较大的专家批次，矩阵计算利用率较高，但 All-to-All 数据量也大。
- **Decode**：每个序列每步只新增一个 token。若 Batch 较小，每个专家分到的 token 太少，GPU 利用率可能很低。
- **高并发 Decode**：多个请求可以合并成较大的 token 批次，MoE 的吞吐优势更容易体现。

## 四、Router 和专家怎样训练

### 联合训练，不是先训练专家再分配标签

主流 MoE 通常从预训练阶段就联合优化：

```text
语言模型损失
  -> 更新共享 Attention、Embedding 等参数
  -> 更新被选中专家的 FFN 参数
  -> 通过门控权重更新 Router
  -> 通过辅助损失改善负载和数值稳定性
```

对于一次前向传播，只有接收到 token 的专家会从这些 token 获得任务梯度。长期训练中，Router 的选择和专家的能力相互影响：

```text
Router 更常把某类表示送给 E7
  -> E7 更常从这类 token 获得梯度
  -> E7 更擅长处理这类表示
  -> Router 更倾向继续选择 E7
```

这个正反馈产生专业化，也可能导致少数专家越来越热门的“专家塌缩”。

### Top-k 不可导，为什么 Router 还能学

Top-k 的专家索引是离散的，排序变化点本身不可导，但训练仍可进行：

- 在一次前向路径内，入选专家的连续门控权重可以求导。
- Router logits 通过这些权重接收任务损失的梯度。
- 负载均衡损失和 Router 稳定化损失直接作用于路由分布。
- 随着参数逐步变化，专家排序会跨过边界，离散选择随之改变。

因此它不是对 Top-k 索引本身求普通梯度，而是在分段连续的路由区域内优化分数，并依靠训练动态改变排序。

### 总损失

典型训练目标可以写成：

$$
\mathcal{L}=\mathcal{L}_{LM}+\alpha\mathcal{L}_{balance}+\beta\mathcal{L}_{z}+\gamma\mathcal{L}_{other}
$$

- $\mathcal{L}_{LM}$：语言建模主损失。
- $\mathcal{L}_{balance}$：负载均衡损失。
- $\mathcal{L}_{z}$：Router z-loss，约束过大的 logits。
- 其他项：模型特有的路由、通信或正则约束。

## 五、为什么需要负载均衡

### 专家塌缩

如果没有约束，Router 可能把大量 token 发给少数早期表现稍好的专家：

- 热门专家容量溢出，token 被丢弃或延迟。
- 冷门专家得不到梯度，参数长期训练不足。
- 设备之间工作量不均，整体速度由最忙的设备决定。
- 模型名义参数很多，但实际只使用其中一小部分。

### Switch Transformer 的辅助损失直觉

令：

- $f_i$：实际被分配给专家 $i$ 的 token 比例。
- $P_i$：Router 给专家 $i$ 的平均概率。
- $N$：专家数量。

一个典型辅助损失为：

$$
\mathcal{L}_{balance}=N\sum_{i=1}^{N}f_iP_i
$$

它推动“Router 想选谁”和“实际发给谁”都趋于均衡。完全均匀并不一定代表最佳语义分工，但可以避免极端拥塞。

### Router z-loss

ST-MoE 使用 Router z-loss 抑制 logits 无限制增大：

$$
\mathcal{L}_{z}=\frac{1}{T}\sum_t\left(\log\sum_i e^{z_{t,i}}\right)^2
$$

它主要改善数值稳定性，特别是在低精度和大规模训练中。

### 辅助损失的副作用

过强的负载均衡约束可能迫使 Router 为了“人数平均”而牺牲语义上更合适的分配。DeepSeek-V3 等工作探索了 Auxiliary-Loss-Free Load Balancing：通过动态调整专家选择偏置来平衡负载，尽量减少辅助损失对主任务梯度的干扰。

>[!note] 均衡不等于每个专家完全一样
>理想状态是计算负载可控，同时允许专家形成有用差异。工程目标通常是避免极端倾斜，而不是要求每个专家在任何 Batch 中接收完全相同的 token。

## 六、容量、溢出与 Dropless MoE

### Expert Capacity

若一个 Batch 中共有 $T$ 个 token，每个 token 选择 $k$ 个专家，共有 $N$ 个专家，则平均每个专家接收 $Tk/N$ 个 token。常见容量定义为：

$$
C=\left\lceil capacity\_factor\times\frac{Tk}{N}\right\rceil
$$

- `capacity_factor > 1`：预留不均衡空间，但增加显存和填充浪费。
- 超过容量的 token：可能被丢弃、交给备选专家、只走残差路径或延后处理，取决于实现。
- 容量太小会损害质量，太大则降低硬件效率。

### Dropless MoE

MegaBlocks 等工作使用块稀疏计算，让不同专家处理可变数量的 token，减少固定容量 Padding 和 Token Dropping。它不意味着负载问题消失：热门专家仍可能形成执行长尾和通信拥塞，只是计算内核能更灵活地处理不规则负载。

## 七、专家是否真的会“专业化”

### 专业化是涌现的，不是人工命名的

训练开始时，专家通常只是随机初始化或从 Dense 模型扩展出的多组 FFN。数据不会显式标注“这个 token 送给数学专家”。专业化来自 Router 与专家参数的共同优化。

可能出现的分工包括：

- 标点、数字、代码符号或特定词形。
- 某些语言、主题或语法结构。
- 上下文整合、事实回忆、格式控制等内部功能。
- 不同训练数据域或不同表示空间区域。

但真实情况通常不是清晰的“一专家一领域”：

- 同一专家可能处理看似无关的 token，因为它们在隐藏空间中需要相似变换。
- 多个专家可能具有冗余能力，提高鲁棒性或容量。
- 不同层的同编号专家没有统一含义。
- 专家分工会随模型、训练阶段、语言和上下文变化。
- Router 选择只能说明计算路径，不能直接当作可解释的因果证据。

### 相同 token 为什么会选择不同专家

“bank”在“river bank”和“bank account”中进入 Router 时，隐藏向量已经不同。即使原始 token 相同，Router 看到的是上下文化表示，因此可以路由到不同专家。

在自回归模型中，当前位置的隐藏状态只能使用它之前的 token；Router 不会偷看未来。Prefill 虽然并行计算多个位置，因果 Mask 仍保持这一约束。

### 为什么不能直接抽取“数学专家”

即使观察到某些专家更常被数学 token 选择，也不能直接取出它们组成小模型：

1. 每一层都有独立专家集合，所谓“数学路径”可能跨越许多不同专家。
2. Attention、Embedding、Normalization 和输出层仍承载大量能力。
3. 同一数学问题中的自然语言、格式和推理 token 可能选择不同专家。
4. 删除专家会改变 Router 分布，并产生训练时未见过的组合。
5. 路由频率高不等于该专家单独具有完整任务能力。

可行路线通常是专家剪枝后继续训练、知识蒸馏、结构化稀疏化或直接微调较小的 Dense 模型，而不是复制几个专家权重即可。

## 八、Shared Expert 与细粒度专家

DeepSeekMoE 提出了两个重要思路：

### Fine-Grained Expert Segmentation

将一个较大的 FFN 专家拆成更多、较小的专家，并相应增加每个 token 的激活数量。这样可以形成更细粒度的知识组合，提高组合灵活性。

### Shared Expert Isolation

将一部分专家设为所有 token 都会经过的 Shared Expert，用来承载通用知识；其余 Routed Expert 仍由 Router 稀疏选择：

$$
y_t=\sum_{s\in Shared}E_s(h_t)+\sum_{i\in S_t}g_{t,i}E_i(h_t)
$$

直觉上：

- 通用能力放在共享专家中，减少每个路由专家重复学习相同知识。
- 路由专家可以更集中于差异化表示。
- 代价是共享专家始终产生计算开销。

## 九、主要路由方式对比

| 路由方式 | 谁选择谁 | 优点 | 主要问题 |
| --- | --- | --- | --- |
| Token Choice Top-k | 每个 token 选 k 个专家 | 简单、主流、适合自回归 LLM | 专家负载不固定 |
| Switch Top-1 | 每个 token 选 1 个专家 | 计算和通信较少 | 单路径冗余较低，依赖容量处理 |
| Expert Choice | 每个专家选择最需要的固定数量 token | 天然固定专家容量 | 每个 token 获得的专家数可变，实现和因果场景更复杂 |
| Hash Routing | 按 token 或规则固定映射 | 无需学习 Router、负载可预测 | 缺乏上下文自适应 |
| Hierarchical / Group Routing | 先选组或节点，再在组内选专家 | 限制跨节点通信 | 可能牺牲全局最优路由 |
| Soft MoE | 用连续方式混合 token 与专家槽位 | 更平滑、可微 | 计算与实现方式不同于经典稀疏 Top-k |

## 十、典型模型如何选择专家

| 模型 | 路由特点 | 应如何理解 |
| --- | --- | --- |
| Sparsely-Gated MoE | Noisy Top-k Gating | 奠定现代稀疏条件计算基础 |
| Switch Transformer | Top-1 Routing | 用单专家路由简化大规模训练与通信 |
| Mixtral 8x7B | 每个 MoE 层 8 个 FFN 专家，每 token 选 2 个 | 不是从 8 个完整 7B 模型中挑 2 个 |
| DeepSeekMoE | 细粒度 Routed Expert + Shared Expert | 通用知识共享，差异化知识稀疏路由 |
| Qwen3-30B-A3B | 发布配置为 128 个专家，每 token 激活 8 个；约 30.5B 总参数、3.3B 活跃参数 | A3B 表示活跃参数规模，不是 3 个专家 |
| Qwen3-235B-A22B | 同样采用大量专家、每 token 激活少数专家 | A22B 表示每 token 的近似活跃参数规模 |

>[!warning] 模型配置应以版本为准
>模型名称只提供近似总参数和活跃参数信息，不足以推导专家个数、专家宽度、共享专家或路由算法。实际部署前应检查对应版本的 `config.json`、技术报告和推理框架实现。

### Qwen3-30B-A3B 到底“分了哪些专家”

官方没有把 128 个专家公开命名为“数学、代码、中文、英语”等领域模型。更准确的说法是：

- 每个 MoE 层包含 128 组可路由 FFN 参数。
- 每个 token 在每个 MoE 层选择 8 个专家。
- 专家是训练中涌现出的内部计算路径，不是 128 个带业务标签的 Agent。
- 约 3.3B 活跃参数包含共享模块和被激活专家，不等于 8 个专家各有 3.3B 参数。
- 若想研究专家分工，需要采集不同语料在各层的路由统计，而不能仅看模型名称。

## 十一、总参数、活跃参数、计算量与显存

这四个概念必须分开：

### 总参数

模型文件中所有共享参数和全部专家参数之和，决定权重存储和总体模型容量。

### 活跃参数

一个 token 前向传播实际经过的共享参数与被选专家参数之和。它是计算规模的近似指标，不是精确延迟指标。

### FLOPs

由激活参数、序列长度、Attention、Batch、实现和精度共同决定。MoE 主要稀疏化 FFN，Attention 仍是 Dense 计算。

### 显存 / 内存

若所有专家常驻设备集群，权重显存仍主要按总参数计算；只是在多卡 Expert Parallel 下分散到不同设备。将冷门专家从 CPU 或磁盘动态换入可以减少常驻显存，但通常增加不可预测的延迟。

>[!example] 为什么 6B Dense 可能比 30B-A3B 更快
>6B Dense 需要加载的总权重更少，没有 Router、Token 重排和跨卡 All-to-All；在单卡、小 Batch、低延迟场景下通常更容易跑快。30B-A3B 的活跃计算量可能接近 3B 级，但仍需管理约 30B 总权重。在高并发、优化良好的多卡服务中，MoE 才更容易把容量优势转化为吞吐优势。因此不能只比较“6B”和“A3B”就断言速度。

## 十二、推理系统中的真正瓶颈

### 通信

Expert Parallel 需要 All-to-All。跨节点网络远慢于 GPU 本地显存，因此现代系统会使用 Group-Limited Routing、节点亲和路由和通信计算重叠。

### 负载倾斜

即使平均负载均衡，一个具体 Batch 也可能集中到少数专家。同步执行时，所有设备要等待最忙的专家完成。

### 小矩阵问题

专家越多，每个专家收到的 token 越少，矩阵乘法越小，GPU 越难达到高利用率。Grouped GEMM 和 Token 合批用于缓解这一问题。

### 权重带宽

Decode 阶段经常受权重读取带宽限制。一个 Batch 如果激活了许多不同专家，虽然每个 token 只使用 k 个专家，但整个 Batch 可能几乎触及全部专家权重。

### KV Cache

MoE 主要改变 FFN，不会因为稀疏专家自动消除 Attention 的 KV Cache。长上下文服务仍需要处理 KV Cache 容量和带宽问题。

## 十三、微调 MoE 时需要监控什么

全量训练或微调 MoE，除了任务损失，还应监控：

- 每层每个专家接收的 token 数量。
- Router 概率分布和路由熵。
- Top-1/Top-k 专家集中度。
- 专家容量使用率和丢弃 token 比例。
- Load Balancing Loss 与 Router z-loss。
- 不同数据域、语言和任务的路由差异。
- Expert Parallel 的 All-to-All 时间和负载长尾。
- 微调前后是否出现 Router Collapse。

### LoRA 的特殊问题

- 给全部专家 FFN 添加 LoRA，会产生大量独立适配器参数。
- 只给共享 Attention 添加 LoRA 成本较低，但可能不足以改变专家内部能力。
- 只微调 Router 风险较高：它只能重新组合已有专家，不能创造专家不具备的能力。
- 领域数据过窄时，Router 可能把大量 token 集中到少数专家，降低泛化和部署效率。

因此 MoE 微调方案必须明确：训练共享层、全部专家、部分专家还是 Router，并用路由统计验证实际发生了什么。

## 十四、一个教学版伪代码

下面代码只展示语义，不是高性能实现：

```python
def moe_forward(hidden_states, router, experts, top_k=2):
    # hidden_states: [tokens, hidden_size]
    logits = router(hidden_states)                 # [tokens, num_experts]
    top_values, top_indices = logits.topk(top_k, dim=-1)
    top_weights = top_values.softmax(dim=-1)       # [tokens, top_k]

    output = zeros_like(hidden_states)

    for expert_id, expert in enumerate(experts):
        token_pos, slot_pos = where(top_indices == expert_id)
        if len(token_pos) == 0:
            continue

        expert_input = hidden_states[token_pos]
        expert_output = expert(expert_input)
        weights = top_weights[token_pos, slot_pos].unsqueeze(-1)
        output.index_add_(0, token_pos, weights * expert_output)

    return output, logits
```

生产实现会把循环替换为 Token 排序、Grouped GEMM、块稀疏计算和跨卡 All-to-All。

## 十五、常见误解

### “一个问题只会选择一个专家”

错误。通常是每个 token、每个 MoE 层重新选择 Top-k 专家。一个请求会形成复杂的动态专家路径。

### “专家就是独立的小模型”

错误。现代 LLM MoE 的专家通常只是 FFN，不能脱离共享 Attention 等模块独立生成文本。

### “A3B 代表激活 3 个专家”

错误。A3B 表示近似活跃参数量。Qwen3-30B-A3B 的发布配置是每 token 激活 8 个专家。

### “数学问题会自动交给数学专家”

过度简化。可能存在领域倾向，但没有固定标签，路由也可能按词法、语法或内部表示功能分工。

### “MoE 的速度等于同活跃参数 Dense 模型”

错误。通信、总权重带宽、路由、负载不均和小矩阵效率都会影响实际速度。

### “删除不常用专家不会影响模型”

不一定。低频专家可能负责少见但重要的输入，删除还会改变路由分布。剪枝后通常需要校准和继续训练。

## 十六、如何实证研究一个模型的专家分工

若要分析 Qwen3 等具体模型，可以设计以下实验：

1. 准备平衡数据集：中文、英文、代码、数学、常识、对话、格式化文本等。
2. 注册 Router Hook，记录每层每个 token 的 Top-k 专家和权重。
3. 统计每个领域的专家选择频率、路由熵和层间变化。
4. 使用互信息或显著性检验判断专家与领域的关联是否超过随机波动。
5. 对相同词的不同上下文进行配对，比较路由差异。
6. 屏蔽或替换候选专家，测量各任务损失与能力变化。
7. 检查结论是否跨数据集、提示模板和模型版本稳定。

推荐记录表：

| 层 | 专家 | Token 数 | 领域偏好 | 平均权重 | 消融影响 | 判断 |
| ---: | ---: | ---: | --- | ---: | --- | --- |
| 12 | 37 |  |  |  |  |  |

>[!warning] 相关不等于功能
>某专家更常接收代码 token，只能说明路由相关性。只有结合消融、替换和性能变化，才能更接近判断该专家是否对代码能力具有因果贡献。

## 十七、证据矩阵

| 关键判断 | 主要证据 | 置信度 | 限制 |
| --- | --- | --- | --- |
| 稀疏门控可在较低单样本计算下扩大模型容量 | Sparsely-Gated MoE、GShard、Switch Transformer | 高 | 实际收益依赖硬件和通信 |
| Token Choice Router 通常根据当前隐藏状态做 Top-k | 多篇架构论文与开源实现 | 高 | 具体归一化和偏置实现不同 |
| 负载均衡和 Router 稳定性是关键训练问题 | Switch Transformer、ST-MoE | 高 | 不同模型损失设计不同 |
| 固定容量会造成 Padding 或 Token Dropping | Switch、Expert Choice、MegaBlocks | 高 | 现代推理实现常采用 Dropless 路线 |
| 专家分工是涌现且不完全可解释的 | 路由与专家分析研究、模型实现 | 中高 | 不同模型的专业化程度不同 |
| Shared Expert 可承载共同知识、减少路由专家冗余 | DeepSeekMoE | 中高 | 结论依赖具体训练与架构 |
| Qwen3-30B-A3B 不是“3 个活跃专家” | Qwen3 技术报告与发布配置 | 高 | 精确配置以对应版本为准 |
| 同活跃参数下 MoE 不保证比 Dense 延迟低 | MoE 系统论文与部署机制 | 高 | 结果依赖 Batch、设备与实现 |

## 十八、学习与验证路线

### 第一阶段：掌握单个 token 的数据流

- [ ] 手算一次 4 专家 Top-2 Softmax 和加权输出。
- [ ] 阅读教学伪代码，确认 Token Dispatch 和 Combine 的维度。
- [ ] 理解同一 token 会在不同层重新路由。

### 第二阶段：理解训练稳定性

- [ ] 绘制每个专家的 Token 负载直方图。
- [ ] 比较有无 Load Balancing Loss 时的专家利用率。
- [ ] 观察 Router logits、熵和 z-loss 的变化。

### 第三阶段：理解系统实现

- [ ] 对比单卡循环、Grouped GEMM 和 Expert Parallel。
- [ ] 分析 Prefill 与 Decode 的专家 Batch 大小。
- [ ] 测量 All-to-All 占总推理时间的比例。

### 第四阶段：研究真实模型

- [ ] 读取 Qwen3-30B-A3B 的 `config.json` 和 Router 实现。
- [ ] 采集不同领域、不同层的专家路由统计。
- [ ] 通过专家消融区分相关性和因果贡献。
- [ ] 将 6B Dense 与 30B-A3B 在同硬件、同精度、同 Batch 下实测，而不是只比较参数名。

## 参考资料

### 基础与路由

- [Outrageously Large Neural Networks: The Sparsely-Gated Mixture-of-Experts Layer](https://arxiv.org/abs/1701.06538)
- [GShard: Scaling Giant Models with Conditional Computation and Automatic Sharding](https://arxiv.org/abs/2006.16668)
- [Switch Transformers: Scaling to Trillion Parameter Models with Simple and Efficient Sparsity](https://arxiv.org/abs/2101.03961)
- [ST-MoE: Designing Stable and Transferable Sparse Expert Models](https://arxiv.org/abs/2202.08906)
- [Mixture-of-Experts with Expert Choice Routing](https://arxiv.org/abs/2202.09368)

### 工程实现

- [MegaBlocks: Efficient Sparse Training with Mixture-of-Experts](https://arxiv.org/abs/2211.15841)
- [Tutel: Adaptive Mixture-of-Experts at Scale](https://arxiv.org/abs/2206.03382)

### 代表模型

- [Mixtral of Experts](https://arxiv.org/abs/2401.04088)
- [DeepSeekMoE: Towards Ultimate Expert Specialization in Mixture-of-Experts Language Models](https://arxiv.org/abs/2401.06066)
- [DeepSeek-V2: A Strong, Economical, and Efficient Mixture-of-Experts Language Model](https://arxiv.org/abs/2405.04434)
- [DeepSeek-V3 Technical Report](https://arxiv.org/abs/2412.19437)
- [Qwen3 Technical Report](https://arxiv.org/abs/2505.09388)
- [Qwen3-30B-A3B 模型页](https://huggingface.co/Qwen/Qwen3-30B-A3B)

## 关联笔记

- [[大模型/01-基础原理/MOE/关于MOE的问题|关于 MOE 的问题]]
- [[大模型/01-基础原理/Transformer/Transformer 整体结构|Transformer 整体结构]]
- [[大模型/01-基础原理/Transformer/图解 Transformer 中的 QKV 机制|QKV 机制]]
- [[大模型/11-知识管理/深度研究与问题分析方法|深度研究与问题分析方法]]

