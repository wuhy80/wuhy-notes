---
tags:
  - MOC
  - 大模型/本地部署
  - Ollama
created: 2026-11-08
updated: 2026-11-08
type: MOC
---

# MOC-Ollama与本地部署

> [!abstract] 概述
> 本地部署是「大模型」主题下实操性最强的一条线：Ollama 直接相关约 50 篇，加上本地部署/推理框架/显存规划约 60 篇。核心阵地是 `大模型/04-部署与工具链/`（Ollama、本地部署、HuggingFace、推理框架四个子目录）、`技术笔记/大模型/Ollama/`，以及 `大模型/07-教程与课程/5分钟手把手/` 前 3 篇教程。新闻侧 2026-10 有 5 篇早报提及 Ollama 生态动态。

## 笔记索引

### Ollama 专题

- [[ollama性能测试]]（`大模型/04-部署与工具链/Ollama/`）
- [[OpenAI兼容API接口]]（`技术笔记/大模型/Ollama/`）—— 把 Ollama 接入标准 API 生态
- [[1. 使用Mac Book Pro本地部署大模型（Ollama+Llama3.1_8B+Docker+OpenWebUI）]] —— 全流程入门教程

### 本地部署实战（`大模型/04-部署与工具链/本地部署/`）

- [[M3 ULTRA部署]] —— Apple Silicon 大内存机器部署
- [[Qwen3.8-27B 显存与 KV Cache 预算]] —— 混合注意力架构的显存估算公式与容量表
- [[Qwen3.8-27B 部署现状与容量说明]] —— 48GB 单卡容量规划
- [[本地实时语音（Realtime）方案选型与工具调用]] —— 语音链路选型

### 推理框架与硬件

- [[DeepInfer 是什么：DeepSeek 开源推理框架]]（`大模型/04-部署与工具链/推理框架/`）
- [[11款英伟达显卡vllm吞吐性能大测试]]（`大模型/05-评测与选型/性能测试/`）—— vLLM 吞吐横评
- [[TileLang]] —— 算子开发视角
- [[LLM推理加速技术地图]] —— 量化/KV cache/投机解码/并行调度四条路线

### HuggingFace 与模型获取

- [[如何在国内使用huggingface]] —— 国内镜像与加速

### 教程（`大模型/07-教程与课程/5分钟手把手/`）

- [[2. 本地部署Graphrag（Pycharm+Ollama+LM Studio）]] —— LM Studio 路线
- [[3. 本地编写一个AI Agent（Langchain + Ollama）]]、[[5. 本地编写一个RAG系统（Qwen2.5-14b+LlamaIndex + Ollama）]]、[[6. 本地编写多Agent来对话写文章（Qwen2.5 + Autogen + Ollama）]] —— Ollama 作推理底座的三类应用
- [[7. MAC本地微调大模型（MLX + Qwen2.5）]] —— Mac 本地训练

### 训练-部署闭环（`大模型/03-训练与微调/`）

- [[Qwen3.8-27B 赛博治疗续作（二）：训练量化部署答疑]] —— 训练后量化与部署的衔接
- [[基于 MLX-LM 框架的 Qwen8 微调方案]] —— MLX 本地训练方案

## 待补链建议

> [!note] 口径说明
> 以下文件正文提到 Ollama/本地部署/推理框架，但没有出链指向上述核心笔记。仅建议，不代改。

- 大模型/06-论文与报告/行业报告/Stanford AI Index Report 2026 全文提取.md —— 未链 [[M3 ULTRA部署]] 或 [[ollama性能测试]]
- 大模型/07-教程与课程/5分钟手把手/8. 本地通过Browser Use进行浏览器AI自动化操作.md —— 本地浏览器自动化，可链 [[1. 使用Mac Book Pro本地部署大模型（Ollama+Llama3.1_8B+Docker+OpenWebUI）]]
- 大模型/04-部署与工具链/向量数据库/向量数据库对比推荐.md —— 未链 [[ollama性能测试]]（本地 RAG 的推理端）
- 技术笔记/技术笔记.md —— 未链 `技术笔记/大模型/Ollama/` 子目录
- 网址收藏/优秀博客.md —— Ollama 相关博客资源未链库内部署笔记
- 大模型/10-新闻/日报/2026-10 各早报 —— Ollama 动态无出链

## 相关实体

- [[MOC-大模型]]、[[MOC-RAG与向量检索]]、[[MOC-Kubernetes与Docker]]（容器化部署面）、[[MOC-Python]]（训练脚本载体）
