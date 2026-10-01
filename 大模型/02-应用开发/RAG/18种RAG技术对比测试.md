---
title: 18种RAG技术对比测试
created: 2026-01-11
tags:
  - 大模型/RAG
  - 技术/检索增强
  - 评测
source: https://levelup.gitconnected.com/testing-18-rag-techniques-to-find-the-best-094d166af27f
author: Fareed Khan
aliases:
  - RAG Techniques
  - 检索增强生成
---

# 18种RAG技术对比测试

> [!abstract] 概述
> 本文测试了18种不同的RAG技术，从简单RAG到高级技术如CRAG、Fusion、HyDE等，找出最佳方案。

## 测试结论：Adaptive RAG 胜出！

> [!success] 最佳技术
> **Adaptive RAG** 以 **0.86** 的最高分获胜。通过智能分类查询并为每种问题类型选择最合适的检索策略，Adaptive RAG 展现出优于其他方法的性能。

### 各技术得分排名

| 排名 | 技术 | 得分 |
|------|------|------|
| 🥇 | **Adaptive RAG** | 0.86 |
| 🥈 | Hierarchical Indices | 0.84 |
| 🥉 | Fusion RAG | 0.83 |
| 4 | CRAG | 0.824 |
| ... | Simple RAG | 0.3 |

---

## RAG 技术分类

### 1. Simple RAG（基础）

最简单的 RAG 流程：

```
PDF → 文本提取 → 分块 → 向量化 → 语义搜索 → LLM生成 → 评估
```

**得分：0.3**（低于平均）

### 2. Semantic Chunking（语义分块）

基于语义相似度进行文本分块，而非固定长度。

### 3. Contextual Compression（上下文压缩）

压缩检索到的上下文，只保留与查询相关的部分。

### 4. Fusion RAG

融合多个检索结果，提高召回率和准确性。

**得分：0.83**

### 5. HyDE (Hypothetical Document Embeddings)

先让 LLM 生成假设性答案，再用该答案进行检索。

### 6. CRAG (Corrective RAG)

带有纠错机制的 RAG，能够识别和修正检索错误。

**得分：0.824**

### 7. Hierarchical Indices（层级索引）

使用多层级的索引结构，先粗粒度检索再细粒度检索。

**得分：0.84**

### 8. Adaptive RAG 🏆

> [!tip] 核心优势
> 智能分类查询类型，动态选择最合适的检索策略：
> - 事实类查询 → Factual 策略
> - 分析类查询 → Analytical 策略
> - 观点类查询 → Opinion 策略
> - 上下文类查询 → Contextual 策略

**得分：0.86**（最高）

### 9. Graph RAG

利用知识图谱增强检索，捕获实体间的关系。

### 10. RSE (Relevant Segment Extraction)

提取最相关的文本片段。

### 11. Feedback Loop RAG

引入反馈循环，根据生成结果优化检索。

### 12. Multi-Modal RAG

支持多模态（文本+图像）的检索增强。

---

## 测试配置

### 测试查询
```
How does AI's reliance on massive data sets act as a double-edged sword?
```

### 标准答案
```
It drives rapid learning and innovation while also risking the amplification
of inherent biases, making it crucial to balance data volume with fairness
and quality.
```

### 使用的模型
- **响应生成 & 验证**：LLaMA-3.2-3B Instruct
- **Embedding**：TaylorAI/gte-tiny

---

## 实现代码

> [!info] GitHub 仓库
> 所有技术的 Jupyter Notebook 实现：
> [FareedKhan-dev/all-rag-techniques](https://github.com/FareedKhan-dev/all-rag-techniques)

### 代码结构
```
├── 1_simple_rag.ipynb
├── 2_semantic_chunking.ipynb
├── 9_rse.ipynb
├── 10_contextual_compression.ipynb
├── 11_feedback_loop_rag.ipynb
├── 12_adaptive_rag.ipynb
├── 17_graph_rag.ipynb
├── 18_hierarchy_rag.ipynb
├── 19_HyDE_rag.ipynb
├── 20_crag.ipynb
└── data/
    └── val.json
    └── AI_information.pdf
    └── attention_is_all_you_need.pdf
```

---

## Simple RAG 实

```python
# 1. 提取文本并分块
pdf_path = "data/AI_information.pdf"
extracted_text = extract_text_from_pdf(pdf_path)
text_chunks = chunk_text(extrac1000, 200)

# 2. 创建向量嵌入
response = create_embeddings(text_chunks)

# 3. 语义搜索
query = "How does AI's reliance on massive data sets act as a double-edgerd?"
top_chunks = semantic_search(query, text_chunks, embeddings, k=2)

# 4. 生成响应
system_prompt = "You are an AI assistant that strictly answers based on the given context."
user_prompt = "\n".join([f"Context {i+1}:\n{chunk}" for i, chunk in enumerate(top_chunks)])
ai_response = generate_response(system_prompt, user_prompt)

# 5. 评估
evaluation_prompt = f"User Query: {query}\nAI Response: {ai_response}\nTrue Response: {true_answer}"
evaluation_response = generate_response(evaluate_system_prompt, evaluation_prompt)
```

---

## 选型建议

| 场景 | 推荐技术 |
|------|----------|
| 通用问答 | **Adaptive RAG** |
| 复杂文档 | Hierarchical Indices |
| 多源检索 | Fusion RAG |
| 需要纠错 | CRAG |
| 资源受限 | Simple RAG + Semantic Chunking |
| 知识图谱场景 | Graph RAG |

---

## 相关链接

- 微调 vs RAG 的选择
- [[向量数据库]] - RAG 的存储层

## 主题关联

> [!note] 在个体重构中的位置
> 从个人知识系统角度看，RAG 更像“知识接入层”，可结合下面几篇一起看：

- [[大模型/08-个体重构/02-工作流重构/MCP、RAG 与 Agent 在个体重构中的位置]]
- [[大模型/08-个体重构/03-知识系统与第二大脑/AI时代的第二大脑设计原则]]
- [[大模型/08-个体重构/05-案例观察/AI工作台路线图与知识层设计]]

## 参考资料

- [原文链接](https://levelup.gitc.com/testing-18-rag-techniques-to-find-the-best-094d166af27f)
- [GitHub 代码仓库](https://github.com/FareedKhan-dev/alechniques)
