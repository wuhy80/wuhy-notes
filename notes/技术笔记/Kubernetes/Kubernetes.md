---
🌻日期🌻: 2026-01-11
🌙星期🌙: 星期日
⌚️时间⌚️: 17:00:00
tags:
  - kubernetes
  - MOC
aliases:
  - K8S
  - k8s
---

# Kubernetes 知识库

> [!quote]
> Kubernetes 是一个开源的容器编排平台，用于自动化部署、扩展和管理容器化应用程序。

## 📚 学习路线

- [[00 学习计划]] - Kubernetes 进阶学习计划和资源推荐

## 🏗️ 核心概念

### 组件与架构
- [[Kubernetes组件详解和高可用配置]] - 控制平面、节点组件详解
- [[源码分析/00 源码框架|源码框架]] - Kubernetes 源码分析

### 调度与运行
- [[K8S调度问题]] - 调度问题排查与 ExternalTrafficPolicy 配置
- [[Kubernetes常见问题]] - 常见问题汇总与解决方案

## 🐳 容器与镜像

### Docker 基础
- [[Docker/00 Docker配置|Docker配置]] - Docker daemon 配置
- [[Docker/01 如何保存镜像为新的镜像|保存镜像为新镜像]] - docker commit 使用方法
- [[Docker/02 如何搭建私有镜像服务器|搭建私有镜像服务器]] - 私有 Registry 部署

### 镜像管理
- [[01 主流镜像分析工具]] - Dive、DockerSlim、Skopeo、Trivy 对比
- [[如何更新镜像文件]] - Kubelet、静态 POD、CoreDNS 镜像更新
- [[如何清理镜像]] - 清理 none 镜像、驱逐 POD、私有仓库清理
- [[一些常用的镜像]] - FTP 服务器等常用镜像部署

### 存储与文件系统
- [[如何查看底层的文件系统路径]] - Overlay 文件系统详解
- [[Longhorn/如何直接读取longhorn的文件|读取 Longhorn 文件]] - 挂载 Longhorn 卷镜像

## ⚡ 高可用与集群管理

### 高可用架构
- [[高可用/00 如何检查是否高可用|检查高可用状态]] - etcd 集群、API Server、内部负载均衡检查
- [[高可用/01 etcd备份恢复|etcd 备份恢复]] - etcd 快照备份与恢复
- [[高可用/02 Etcd配置讲解|Etcd 配置详解]] - etcd 证书配置与集群配置对比
- [[高可用/03 K8S高可用资料|K8S 高可用资料]] - 学习资源推荐

### 高可用方案
- [[高可用/实现外部的高可用集群|外部高可用集群]] - 使用负载均衡器的完整方案
- [[高可用/实现内部高可用集群的方案|内部高可用集群]] - 不使用外部 LB 的手动切换方案
- [[高可用/为什么 kubeadm 多主仍然需要负载均衡器|为什么 kubeadm 多主仍然需要负载均衡器]] - 多 Master 与统一入口的边界

### 集群部署
- [[Kubeadm/Kubeadm的使用|Kubeadm 使用]] - kubeadm join 命令详解
- [[K3S/如何部署K3S|K3S 部署]] - 轻量级 K3S 集群部署
- [[Kubelet分析/Kubelet配置|Kubelet 配置]] - Kubelet 配置说明

## 🔐 安全与网络

### 防火墙配置
- [[安全/开启防火墙|开启防火墙]] - Kubernetes 所需端口列表
- [[安全/防火墙配置|防火墙配置]] - UFW 防火墙完整配置脚本
- [[安全/ufw的常用用法|UFW 常用用法]] - UFW 命令详解与 limit 用法

### 网络与服务
- [[Service/如何开放端口|开放端口]] - 修改 NodePort 监听范围
- [[Secrets/如何使用Secrets|使用 Secrets]] - Secret 创建与挂载

## 📊 运维与监控

### 备份恢复
- [[备份恢复/如何进行K8S的备份恢复|K8S 备份恢复]] - 静态配置备份与恢复策略

### 日志处理
- [[日志处理/00 Loki|Loki 日志收集]] - Loki Sidecar 动态注入

### 工具使用
- [[99 K9S使用技巧]] - K9S 快捷键与排序方式

---

## 📁 文件夹结构

```
Kubernetes/
├── Docker/          # Docker 相关配置和操作
├── K3S/             # K3S 轻量级集群
├── Kubeadm/         # Kubeadm 集群管理
├── Kubelet分析/      # Kubelet 组件分析
├── Longhorn/        # Longhorn 存储
├── Secrets/         # Secret 管理
├── Service/         # Service 网络配置
├── 安全/            # 安全与防火墙
├── 备份恢复/         # 备份恢复策略
├── 高可用/          # 高可用架构
├── 日志处理/         # 日志收集与处理
└── 源码分析/         # 源码学习
```

## 🏷️ 相关标签

#kubernetes #docker #etcd #高可用 #容器

