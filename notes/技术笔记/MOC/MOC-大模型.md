---
tags:
  - MOC
  - 大模型
  - LLM
created: 2026-11-08
updated: 2026-11-08
type: MOC
---

# MOC-大模型

> [!abstract] 概述
> 大模型（LLM）是本库第一大主题：`大模型/` 目录 387 篇（基础原理、应用开发、训练微调、部署工具链、评测选型、论文报告、教程课程、个体重构、Agent、新闻），另有 `技术笔记/大模型/`、`Golang编程/大模型开发/`、`读书笔记/人工智能/` 等外围散点，跨 7 个一级目录共约 380 篇直接相关。本 MOC 做跨目录聚合与待补链盘点；`大模型/` 目录内部的逐篇导航见 [[00-大模型学习导航]] 与 [[00-大模型学习计划]]。

## 笔记索引

### 门户与既有导航

- [[00-大模型学习导航]] —— `大模型/` 目录中心索引（含模型卡片 Dataview 横评表）
- [[00-大模型学习计划]] —— 12 周分阶段学习路线与 P0/P1/P2 知识分级
- [[链接收集]] —— 大模型资源链接收集

### 基础原理（`大模型/01-基础原理/`，10 篇正文 + 3 子目录）

- [[大模型基础原理总览]]、[[LLM为什么有推理和写代码的能力]]、[[LLM推理加速技术地图]]
- [[Token、Tokenizer 与 Embedding]]、[[预训练目标]]、[[后训练与对齐]]
- [[Scaling Laws 与 Chinchilla]]、[[推理模型与 RLVR]]、[[幻觉与可靠性]]、[[推理生成过程]]
- 子目录：Transformer（整体结构、QKV 机制）、MOE（[[关于MOE的问题]]）

### 应用开发（`大模型/02-应用开发/`）

- RAG：[[18种RAG技术对比测试]]、[[上下文工程]]（详见 [[MOC-RAG与向量检索]]）
- MCP：[[MCP概览]] 等 6 篇（详见 [[MOC-MCP]]）
- AutoGen：Agent 调度、function call 实战（详见 [[MOC-Agent]]）
- [[相关资料]]（Text2SQL）

### 训练与微调（`大模型/03-训练与微调/`）

- [[大模型微调技术综述]]、[[训练的数据集构造方式]]
- 实战：[[基于 MLX-LM 框架的 Qwen8 微调方案]]、[[Unsloth微调Qwen3实战]]、[[Axolotl微调法律大模型实战]]
- [[汽车故障训练]]、Qwen3.8-27B 赛博治疗系列（一/二/完结篇）

### 部署与工具链（`大模型/04-部署与工具链/`）

- 本地部署：[[M3 ULTRA部署]]、[[Qwen3.8-27B 显存与 KV Cache 预算]]、[[Qwen3.8-27B 部署现状与容量说明]]、[[本地实时语音（Realtime）方案选型与工具调用]]
- [[ollama性能测试]]、[[如何在国内使用huggingface]]、[[TileLang]]（详见 [[MOC-Ollama与本地部署]]）
- 向量数据库：[[向量数据库对比推荐]]、[[QDrant的几种使用方式]] 等

### 评测与选型（`大模型/05-评测与选型/`）

- [[2026-10 四家 Flash 级模型对比]] + GLM-5.3-Flash / Qwen3.8-Flash / deepseek-flash / Gemini 3.8 Flash 四张 model-card
- [[Gemma 4 与 Qwen3.6-27B 对比]]、[[11款英伟达显卡vllm吞吐性能大测试]]

### 论文与报告（`大模型/06-论文与报告/`）

- 论文学习：[[Qwen3模型解读]]、[[2025年LLM年度回顾 - Simon Willison]]、[[A Few Useful Things to Know About Machine Learning]]、论文推荐与路线 2 篇
- 行业报告（全文提取）：[[State of AI 报告：100万亿token实证研究]]、Stanford AI Index 2026、International AI Safety Report 2026、METR Task-Completion Time Horizons、2026 Work Trend Index、OpenAI Shift to Agentic AI (Codex)、PwC 2026 Global AI Jobs Barometer 等 11 篇

### 教程与课程（`大模型/07-教程与课程/`）

- 5 分钟手把手系列 9 篇（本地部署、GraphRAG、Agent、微调、RAG、多 Agent、MLX、Browser Use、ComfyUI）
- [[00-总索引]]（AI 大模型原理教程-轩辕，30 课五卷）—— basename 有歧义场景少，正文引用建议全路径 `[[大模型/07-教程与课程/AI大模型原理教程-轩辕/00-总索引|00-总索引]]`
- [[00-合集总览]]（机器学习-谦行AIing，15 集全片转写）

### 个体重构与知识管理（`大模型/08-个体重构/`、`11-知识管理/`）

- [[AI时代的认知升级框架]]、[[AI时代个人工作流重构框架]]、[[个人工作流改造路线图]]、[[AI时代的第二大脑设计原则]]、[[AI时代的职业能力重构]]
- [[Claude Code + Obsidian 第二大脑实践]]、[[MCP、RAG 与 Agent 在个体重构中的位置]]

### 新闻追踪（`大模型/10-新闻/`，196 篇，全库第二大目录）

- 索引：[[00-新闻索引]]、[[00-日报索引]]、[[00-周报索引]]
- 专题：[[Coding Agent 工具链对比]]、[[SemiAnalysis 订阅额度实测：Anthropic 与 OpenAI 对比]]、[[ChatGPT Pro 20x 与 Claude Max 20x 编程额度深度调查]]、[[2026 Agent 技术与论文追踪]]
- 日报 2026-06 起、周报 2026-04 起，按月索引（`00-2026-XX 月索引` 为重名文件，链接需全路径）

### 外围散点（`大模型/` 之外）

- `技术笔记/大模型/`：[[00 环境信息]]、[[01 优秀网站]]、[[Deepseek更新记录]]、[[一个语言学习助理Prompt]]、OpenAI 兼容 API 接口
- `Golang编程/大模型开发/`：[[AI Agent]]、[[如何实现Function Call]]（Go 视角，详见 [[MOC-Golang]]）
- `读书笔记/人工智能/`：零基础学机器学习
- 双语精读交叉：3Blue1Brown 神经网络系列 11 篇提及 LLM（见 [[MOC-RAG与向量检索]] 的跨库一节）

## 待补链建议

> [!note] 口径说明
> 以下文件正文提到「大模型 / LLM / Transformer」等关键词，但没有出链指向 `大模型/` 的核心笔记。仅建议，不代改。

- 大模型/06-论文与报告/行业报告/International AI Safety Report 2026 全文提取.md —— 大篇幅讨论 LLM 安全，未链 [[大模型基础原理总览]]
- 大模型/06-论文与报告/行业报告/METR Task-Completion Time Horizons 全文提取.md —— 同上，可链 [[00-大模型学习导航]]
- 大模型/06-论文与报告/论文学习/2025年LLM年度回顾 - Simon Willison.md —— 未链 [[00-大模型学习导航]] 或任意基础原理笔记
- 技术笔记/技术笔记.md（目录首页）—— 未链 [[00-大模型学习导航]]
- 网址收藏/人工智能.md —— 大量 LLM 资源链接但未链库内大模型笔记
- 英语学习/外刊看世界/Simon Willison 2026 LLM 盘点：双语精读.md —— 可与 [[2025年LLM年度回顾 - Simon Willison]] 互链（同一作者的连续两年盘点）

## 相关实体

- [[MOC-Agent]]、[[MOC-MCP]]、[[MOC-RAG与向量检索]]、[[MOC-Ollama与本地部署]]、[[MOC-Prompt工程]]、[[MOC-Python]]
- [[MOC-Golang]]（Go 开发 Agent）、[[MOC-Obsidian]]（第二大脑与发布站）
