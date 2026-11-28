---
tags:
  - 大模型/基础原理
  - 大模型/预训练
created: 2026-10-28
updated: 2026-10-28
status: evergreen
aliases:
  - Scaling Laws
  - 扩展定律
  - Chinchilla 最优比例
---

# Scaling Laws 与 Chinchilla

> [!summary] 一句话理解
> 训练侧的「军备竞赛定律」：模型损失随参数量、数据量、算力三个变量呈幂律下降；Chinchilla 给出算力最优的「每个参数约 20 个 token」比例。而当代开源模型普遍故意「过训练」（远超 20:1），用训练时多花算力换推理时的终身便宜。

## 一、Kaplan Scaling Laws（2020）

OpenAI 的《Scaling Laws for Neural Language Models》（Kaplan et al., arXiv:2001.08361）首次系统测量了损失函数与三个变量的幂律关系：

```text
L(N) ≈ 幂律下降（参数量 N）
L(D) ≈ 幂律下降（数据量 D，token 数）
L(C) ≈ 幂律下降（算力 C ≈ 6·N·D）
```

关键结论：

- 三条曲线都跨越多个数量级仍然成立，可以外推「再大 10 倍会好多少」
- 大模型样本效率更高：同样 token 量，大模型损失更低
- 三者应**同步放大**，只堆参数不堆数据会浪费

这篇论文是 GPT-3 → GPT-4 军备竞赛的理论依据：只要幂律还在，砸算力就有确定回报。

## 二、Chinchilla（2022）：算力最优比例

DeepMind《Training Compute-Optimal Large Language Models》（Hoffmann et al., arXiv:2203.15556）修正了 Kaplan 的结论：

| 模型 | 参数量 | 训练 token | 说明 |
|------|--------|-----------|------|
| Gopher | 280B | 300B | 当时 DeepMind 旗舰 |
| Chinchilla | 70B | 1.4T | 同算力预算，参数少 4 倍、数据多 4.7 倍 |

Chinchilla 在几乎所有任务上反超 Gopher，得出算力最优比例：**每个参数约 20 个 token**（token 数 ≈ 20 × 参数量）。

推论：GPT-3（175B/300B，约 1.7:1）那一代模型都严重「训练不足」——参数堆多了，数据没跟上。

## 三、算力最优 ≠ 部署最优：为什么模型故意「过训练」

Chinchilla 的 20:1 只优化**一次训练的算力**。但模型训完要被百万次调用，推理成本才是终身大头：

- LLaMA 系列有意把小模型训得远超 20:1：Llama 3 8B 用了 15T token（约 1875:1）
- 效果：8B 模型达到当年 70B 级别的部分能力，本地部署（Ollama / M3 Ultra）才可行
- 这正是[[大模型/04-部署与工具链/本地部署/Qwen3.8-27B 显存与 KV Cache 预算|KV Cache 预算]]里「选小参数 + 长上下文」路线成立的原因：行业已经用训练算力补贴了推理端

## 四、2025 年之后的扩展轴

- **并行扩展（Parallel Scaling Law，Qwen ParScale，2025）**：参数、数据之外的第三条轴——同一输入并行跑多份带不同前缀的计算再聚合，用推理时并行换能力，改动小于加深加宽
- **测试时计算（test-time compute）**：把「更好的答案」从训练时挪到推理时，让模型思考更久。见[[大模型/01-基础原理/推理模型与 RLVR|推理模型与 RLVR]]
- Kaplan/Chinchilla 回答的是「预训练要花多少」，这两条轴回答的是「推理时要花多少」——两条曲线共同决定最终能力

## 五、与自己笔记的衔接

- [[大模型/01-基础原理/预训练目标|预训练目标]]：训练在优化什么；本篇补上「要训多大、训多久」的量化答案
- [[大模型/01-基础原理/LLM推理加速技术地图|LLM 推理加速技术地图]]：推理侧的四条加速路线；本篇是训练侧的对称视角
- [[大模型/01-基础原理/推理模型与 RLVR|推理模型与 RLVR]]：能力提升的重心从预训练扩展转向后训练 + 推理时扩展

## 参考来源

- Kaplan et al., *Scaling Laws for Neural Language Models*, arXiv:2001.08361（2020）
- Hoffmann et al., *Training Compute-Optimal Large Language Models*, arXiv:2203.15556（2022）
- Qwen, *Parallel Scaling Law for Language Models*（2025）
