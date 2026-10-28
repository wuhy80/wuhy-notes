---
tags:
  - 大模型/基础原理
  - 大模型/后训练
created: 2026-10-28
updated: 2026-10-28
status: evergreen
aliases:
  - 推理模型
  - Reasoning Model
  - RLVR
  - 测试时计算
  - test-time compute
---

# 推理模型与 RLVR

> [!summary] 一句话理解
> 推理模型 = 回答前先生成长思维链、且这条思维链本身是用强化学习训出来的模型。RLVR（可验证奖励强化学习）用「数学答案对不对、代码测试过不过」这类程序可判定的奖励替代人类标注，让模型自己学会思考——这是 2025 年以来行业最大的方法论转变，Karpathy 称之为预训练、SFT、RLHF 之后的第四个训练阶段。

## 一、演化时间线

```text
2022  Chain-of-Thought 提示词    手工教模型「一步步想」
2023  Tree-of-Thoughts           思维搜索树，仍是提示词层面
2024.09  OpenAI o1               首个商用推理模型：想得久 = 答得准
2025.01  DeepSeek-R1             开源复现 + GRPO/RLVR，纯 RL 涌现推理
2025     全行业跟进               Qwen3、GLM、Gemini 等全线思考模式
```

o1 的贡献是提出**测试时计算**（test-time compute）：准确率随推理时生成的思考 token 数量提升，成为预训练 Scaling Laws 之外的第二条扩展曲线。

## 二、DeepSeek-R1：RLVR 的代表作

论文《DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning》（arXiv:2501.12948）：

**R1-Zero 的激进实验**：在基座模型上直接跑 GRPO 强化学习，不做任何 SFT，奖励只有两条程序规则——答案正确 + 格式正确（`<think>` 标签）。没有奖励模型、没有人类偏好标注。

涌现出的行为：自我验证、反思回溯、论文里著名的「aha moment」。副作用是语言混杂、可读性差。

**正式版 R1 的多阶段流水线**：

1. 少量冷启动 SFT（教会基本格式）
2. 面向推理的 RL
3. 拒绝采样生成新 SFT 数据（含非推理数据，修可读性）
4. 全场景 RL（推理 + 有用性/无害性并重）

## 三、GRPO：省掉 critic 的 PPO

PPO 需要训练一个和策略同规模的价值网络（critic）来估计优势函数，显存翻倍。GRPO（Group Relative Policy Optimization）的替代方案：

- 同一 prompt 采样 G 个回答
- 组内奖励做归一化，直接当优势：`A_i = (r_i - mean(r)) / std(r)`
- 不需要 critic，训练成本低一半左右

代价是每个 prompt 要采样 G 份，所以 RLVR 任务必须奖励廉价——这正是「可验证」的意义。

## 四、RLVR vs RLHF 的分工

| | RLVR | RLHF |
|------|------|------|
| 奖励来源 | 程序判定（答案/测试/格式） | 人类偏好训练的奖励模型 |
| 适用任务 | 数学、代码、逻辑等有标准答案 | 开放对话、写作、安全 |
| 主要风险 | 可验证任务覆盖面有限 | 奖励模型可被钻空子（reward hacking） |

《SFT Memorizes, RL Generalizes》（2025）给的经验规律：SFT 偏记忆模仿，RL 泛化更好——所以推理能力主要靠 RL 练出来，SFT 负责格式与知识灌输。

## 五、能力边界：两篇必读的对照

- 《Inference-Time Scaling for Complex Tasks: Where We Stand and What Lies Ahead》（Microsoft，2025）：系统盘点后结论是测试时计算的收益**集中在数学、代码等可验证任务**，开放式任务收益有限，且存在边际递减
- 《The Illusion of Thinking》（Apple，2025）：用可控谜题环境测出「复杂度超过某个阈值后准确率崩塌，且思考 token 数反而下降」——引发推理模型是否真会推理的大争论

公允的读法：推理模型不是万能，但在它的甜区（数学/代码/形式化推理）是实打实的跃升；对日常对话类任务，普通模型 + 好上下文往往更划算。Karpathy 用「锯齿状智能」（jagged intelligence）总结这种能力分布的极度不均匀。

## 六、与自己实践的衔接

- 本地部署：Qwen3 等开源模型的 thinking 模式开关，就是推理模型能力的消费端；部署侧注意思考 token 会显著拉长输出、放大 [[大模型/04-部署与工具链/本地部署/Qwen3.8-27B 显存与 KV Cache 预算|KV Cache 占用]]
- 微调侧：GRPO 已进入 Unsloth / TRL 工具链，小模型 + 少量可验证数据（如领域判题规则）就能跑通 RLVR 的最小闭环；与[[大模型/03-训练与微调/模型训练/微调技术/大模型微调技术综述|微调技术综述]]里的 SFT 流程互补
- 原理衔接：思维链的推理在[[大模型/01-基础原理/推理生成过程|推理生成过程]]的框架内仍是逐 token 生成，只是生成的是「思考过程」；对齐语境见[[大模型/01-基础原理/后训练与对齐|后训练与对齐]]

## 参考来源

- DeepSeek, *DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via RL*, arXiv:2501.12948（2025）
- Microsoft Research, *Inference-Time Scaling for Complex Tasks: Where We Stand and What Lies Ahead*（2025）
- Apple, *The Illusion of Thinking*（2025）
- Andrej Karpathy, *2025 LLM Year in Review*（2025-12）
