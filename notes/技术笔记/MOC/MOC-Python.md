---
tags:
  - MOC
  - Python
  - 编程语言
created: 2026-11-08
updated: 2026-11-08
type: MOC
---

# MOC-Python

> [!abstract] 概述
> Python 是本库「高提及、低沉淀」的典型：113 篇笔记提到 python/pip/conda，但独立 Python 笔记只有 1 篇（`技术笔记/Python/00 安装配置.md`）——它在大模型教程、微调脚本、Agent 框架中扮演「载体语言」角色，从未形成自己的知识目录。本 MOC 把散点收拢，并把这个缺口显式记录下来。

## 笔记索引

### 独立笔记（全库仅此 1 篇）

- [[00 安装配置]]（`技术笔记/Python/`）—— 环境与包管理起步

### 作为教程载体（`大模型/07-教程与课程/5分钟手把手/`，9 篇中 8 篇含 Python 代码）

- [[4. 如何微调一个大模型(Colab + Unsloth)]] —— Python 训练脚本
- [[5. 本地编写一个RAG系统（Qwen2.5-14b+LlamaIndex + Ollama）]] —— LlamaIndex 应用
- [[3. 本地编写一个AI Agent（Langchain + Ollama）]]、[[6. 本地编写多Agent来对话写文章（Qwen2.5 + Autogen + Ollama）]] —— LangChain/AutoGen 应用

### 作为训练与微调载体（`大模型/03-训练与微调/`）

- [[Unsloth微调Qwen3实战]]、[[Axolotl微调法律大模型实战]] —— Python 训练框架实战
- [[训练的数据集构造方式]] —— 数据处理脚本
- [[大模型微调技术综述]] —— 框架背景（PEFT/LoRA 生态均为 Python）

### 作为工具链载体（`大模型/04-部署与工具链/`）

- [[QDrant的几种使用方式]]、[[如何在国内使用huggingface]] —— Python 客户端
- [[ollama性能测试]]、[[11款英伟达显卡vllm吞吐性能大测试]] —— vLLM 压测脚本

### 机器学习基础（Python 之外的入口）

- [[00-合集总览]]（机器学习-谦行AIing）—— 15 集课程覆盖 scikit-learn 时代的经典方法

## 待补链建议

> [!note] 口径说明
> 以下文件大量出现 Python 代码/生态词，但没有出链指向 [[00 安装配置]]。仅建议，不代改。

- 大模型/07-教程与课程/5分钟手把手 全部 9 篇 —— Python 环境要求未链 [[00 安装配置]]
- 大模型/09-Agent/AutoGen.md —— 框架为 Python 生态，可链 [[00 安装配置]]
- 技术笔记/算法/位运算、分治算法 部分题解 —— Python 题解未链 [[00 安装配置]]
- 技术笔记/物联网/EMQX 相关笔记 —— Python 客户端示例未链
- 大模型/04-部署与工具链/推理框架/DeepInfer 是什么：DeepSeek 开源推理框架.md —— 可链 [[00 安装配置]]

## 相关实体

- [[MOC-大模型]]、[[MOC-Ollama与本地部署]]、[[MOC-RAG与向量检索]]、[[MOC-Agent]]、[[MOC-算法与LeetCode]]（多语言刷题）
- 后续若 Python 独立成体系，建议建 `技术笔记/Python/` 子目录结构并在本 MOC 挂导航
