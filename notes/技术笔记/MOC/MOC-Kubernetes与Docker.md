---
tags:
  - MOC
  - Kubernetes
  - Docker
  - 云原生
created: 2026-11-08
updated: 2026-11-08
type: MOC
---

# MOC-Kubernetes与Docker

> [!abstract] 概述
> 容器与编排合计 70+ 篇提及。核心阵地是 `技术笔记/Kubernetes/`（33 篇，含 Docker、K3S、Kubeadm、Kubelet 源码分析、Longhorn、备份恢复、高可用等 12 个子目录），是本库运维深度最高的一块；另有 `大模型/04-部署与工具链/` 的容器化部署、`Rust编程/生态/` 的容器工具（Rust 系）、`Golang编程/日志/` 的 K8s 日志实践等跨目录散点。

## 笔记索引

### 门户与核心概念（`技术笔记/Kubernetes/` 根）

- [[Kubernetes]] —— 主笔记
- [[Kubernetes组件详解和高可用配置]] —— 组件与高可用
- [[Kubernetes常见问题]]、[[K8S调度问题]] —— 排障与调度
- [[00 学习计划]]、[[01 主流镜像分析工具]]、[[99 K9S使用技巧]]、[[一些常用的镜像]]

### 镜像与运维实操

- [[如何更新镜像文件]]、[[如何清理镜像]]、[[如何查看底层的文件系统路径]]
- `备份恢复/` 子目录、`日志处理/` 子目录

### 子主题目录（12 个）

- `Docker/`、`K3S/`、`Kubeadm/`、`Kubelet分析/`（含源码级分析）
- `Longhorn/`（存储）、`Secrets/`、`Service/`
- `高可用/`（7 篇：Etcd 配置、证书、检查方法等）、`安全/`、`源码分析/`

### 大模型侧的容器化（`大模型/`）

- [[1. 使用Mac Book Pro本地部署大模型（Ollama+Llama3.1_8B+Docker+OpenWebUI）]] —— Docker 部署 LLM 栈
- [[如何打包向量数据库]]、[[QDrant的备份方法]] —— 向量库的容器化运维
- [[M3 ULTRA部署]] —— 与容器方案的对照（裸机 vs 容器）

### 语言生态交叉

- `Golang编程/日志/` —— K8s 环境日志采集实践
- `Rust编程/生态/` —— Rust 系容器与云原生工具
- `技术笔记/数据库/Mysql/Mysql高可用.md` —— 数据库高可用与 K8s 部署对照

## 待补链建议

> [!note] 口径说明
> 以下文件有容器/编排内容，但没有出链进入 `技术笔记/Kubernetes/` 体系。仅建议，不代改。

- 大模型/04-部署与工具链/本地部署/M3 ULTRA部署.md —— 未链 [[Kubernetes]]
- 大模型/04-部署与工具链/向量数据库/如何打包向量数据库.md —— 未链 `Docker/` 子目录
- 大模型/06-论文与报告/论文学习/2025年LLM年度回顾 - Simon Willison.md —— 提及容器化趋势，可链 [[Kubernetes]]
- 大模型/10-新闻/SemiAnalysis 订阅额度实测：Anthropic 与 OpenAI 对比.md —— 提及基础设施，可链 [[Kubernetes]]
- 技术笔记/数据库/Mysql/Mycat 和 ProxySQL对比.md —— 数据库中间件可链 `Service/` 子目录
- Golang编程/日志/logrus如何使用.md —— 日志库选型可链 `日志处理/` 子目录（K8s 日志实践）

## 相关实体

- [[MOC-Linux]]、[[MOC-Golang]]（K8s 生态为 Go 编写）、[[MOC-Ollama与本地部署]]、[[MOC-Rust]]（Rust 系云原生工具）
