---
tags:
  - 大模型/学习资源
  - 大模型/视频教程
created: 2026-11-07
updated: 2026-11-07
source: https://www.3blue1brown.com/?topic=neural-networks
status: evergreen
type: 资源整理
---

# 3Blue1Brown 神经网络与深度学习系列

> [!abstract] 概述
> [3Blue1Brown](https://www.3blue1brown.com/)（作者 Grant Sanderson）官网 **Neural Networks 主题**下的全部 11 课整理，含英文原题、中文翻译、一句话简介与观看链接。课程清单与官网主题页同步（2026-11-07，元数据取自官网开源仓库 [3b1b/3Blue1Brown.com](https://github.com/3b1b/3Blue1Brown.com)），后续新课可回官网同一主题页查看。

## 观看渠道

- **官网**：每课都有图文互动版（比如能在浏览器里动手画数字的神经网络 demo），配合视频食用最佳；下面每课的第一个链接就是官网课程页
- **YouTube**：[3Blue1Brown 频道](https://www.youtube.com/@3blue1brown)，每课附直链
- **B站**：[3Blue1Brown 官方双语账号](https://space.bilibili.com/88461692)（UID 88461692），官方授权中文字幕，在官方合集里按序观看即可
- 动画全部用作者自研的开源库 [manim](https://github.com/3b1b/manim) 制作；线性代数基础可参考 [[数学学习/线性代数-大模型学习指南]]（其中直接引用了 3Blue1Brown 的线代系列）

## 课程清单（官网主题页顺序）

### 01. But what is a Neural Network? —— 但什么是神经网络？

- **发布**：2017-10-05 · 深度学习系列第 1 章
- **观看**：[官网图文互动版](https://www.3blue1brown.com/lessons/neural-networks) ｜ [YouTube](https://youtu.be/aircAruvnKk)
- **简介**：以「识别手写数字」为例，讲清神经网络的基本结构——层、神经元、权重与偏置，以及"网络学到的东西"长什么样。

### 02. Gradient descent, how neural networks learn —— 梯度下降：神经网络是如何学习的

- **发布**：2017-10-16 · 深度学习系列第 2 章
- **观看**：[官网图文互动版](https://www.3blue1brown.com/lessons/gradient-descent) ｜ [YouTube](https://youtu.be/IHZwWFHWa-w)
- **简介**：讲机器学习里最常用的优化方法——梯度下降，网络如何沿着损失函数的下坡方向调整参数来"学习"。

### 03. Analyzing our neural network —— 剖析我们训练出的神经网络

- **发布**：2017-10-16 · 深度学习系列第 3 章（官网互动图文页，无视频）
- **观看**：[官网互动页面](https://www.3blue1brown.com/lessons/neural-network-analysis)
- **简介**：插入在视频之间的小节：动手在浏览器里画数字，实时观察训练好的网络每层神经元到底在识别什么——是直线、圈圈还是笔画。

### 04. What is backpropagation really doing? —— 反向传播究竟在做什么？

- **发布**：2017-11-03 · 深度学习系列第 4 章
- **观看**：[官网图文互动版](https://www.3blue1brown.com/lessons/backpropagation) ｜ [YouTube](https://youtu.be/Ilg3gGewQ5U)
- **简介**：直观讲解反向传播（backpropagation）——神经网络学习背后的核心算法到底在干什么。

### 05. Backpropagation calculus —— 反向传播的微积分原理

- **发布**：2017-11-03 · 深度学习系列第 5 章
- **观看**：[官网图文互动版](https://www.3blue1brown.com/lessons/backpropagation-calculus) ｜ [YouTube](https://youtu.be/tIeHLnjs5U8)
- **简介**：用微积分把反向传播的每一步严格推导一遍，是第 4 课的数学补充。

### 06. Large Language Models explained briefly —— 大语言模型速览

- **发布**：2024-11-20
- **观看**：[官网图文互动版](https://www.3blue1brown.com/lessons/mini-llm) ｜ [YouTube](https://youtu.be/LPZh9BOjkQs)
- **简介**：十几分钟轻量速览 LLM 是什么，为后面的 Transformer 系列打底。

### 07. Transformers, the tech behind LLMs —— Transformer：大语言模型背后的技术（深度学习第 5 章）

- **发布**：2024-04-01
- **观看**：[官网图文互动版](https://www.3blue1brown.com/lessons/gpt) ｜ [YouTube](https://youtu.be/wjZofJX0v4M)
- **简介**：Transformer 的可视化入门，这一章聚焦总体结构与词向量（embeddings），把 GPT 架构的整体图景搭起来。

### 08. Attention in transformers, step-by-step —— 逐步拆解 Transformer 中的注意力机制（深度学习第 6 章）

- **发布**：2024-04-07
- **观看**：[官网图文互动版](https://www.3blue1brown.com/lessons/attention) ｜ [YouTube](https://youtu.be/eMlx5fFNoYc)
- **简介**：讲透 Transformer 的核心机制「注意力」——Query、Key、Value 到底怎么算、为什么有效。

### 09. How might LLMs store facts —— 大模型可能如何存储事实（深度学习第 7 章）

- **发布**：2024-08-31
- **观看**：[官网图文互动版](https://www.3blue1brown.com/lessons/mlp) ｜ [YouTube](https://youtu.be/9-Jl0dxWQs8)
- **简介**：拆解 Transformer 中的 MLP（多层感知机）层，探讨大模型可能以何种方式存储事实知识。

### 10. But what is Cross-Entropy? —— 交叉熵到底是什么？（压缩即智能·第 2 部分）

- **发布**：2026-07-16
- **观看**：[官网图文互动版](https://www.3blue1brown.com/lessons/cross-entropy) ｜ [YouTube](https://youtu.be/GlYgs6v2YfU)
- **简介**：「压缩即智能」系列第 2 部分：当你的概率模型猜错时，压缩数据的代价有多大——交叉熵的直观本质。

### 11. But how do AI images and videos actually work? —— AI 生图与生视频究竟是怎么工作的？（客座视频）

- **发布**：2025-07-25 · 客座视频，作者 Welch Labs
- **观看**：[官网图文互动版](https://www.3blue1brown.com/lessons/diffusion-models) ｜ [YouTube](https://youtu.be/iv-5mZ_9CPY)
- **简介**：讲扩散模型（Diffusion Models）与 CLIP，把 AI 文生图、文生视频背后的数学原理看明白。

## 观看路径建议

> [!tip] 建议顺序
> 1. **先啃 2017 年的 01–05 课**：手写数字 + 多层感知机，把「结构 → 梯度下降 → 反向传播」这条主线打通，这是所有后续内容的地基；
> 2. **再看 06–09 的 LLM 系列**：从速览到 Transformer 三部曲（总体结构 → 注意力 → MLP），正好对应"大模型是怎么工作的"这条主线；
> 3. **10–11 是延伸**：交叉熵关系到训练目标的本质，扩散模型通向 AI 生图/生视频。

> [!note] 官网图文版的价值
> 每课官网页面都是视频的全文重写版（文字改编 Josh Pullen 等），并且带可交互 demo——比如第 1、3 课可以直接在网页里画数字看网络实时反应，比纯看视频理解更深。

## 参考资料

- 官网主题页：<https://www.3blue1brown.com/?topic=neural-networks>
- B站官方双语空间：<https://space.bilibili.com/88461692>
- 官网开源仓库（本清单元数据出处）：<https://github.com/3b1b/3Blue1Brown.com>
- manim 动画库：<https://github.com/3b1b/manim>
