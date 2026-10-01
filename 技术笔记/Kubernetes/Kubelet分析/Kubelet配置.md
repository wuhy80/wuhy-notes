---
🌻日期🌻: 2024-10-31
🌙星期🌙: 星期四
⌚️时间⌚️: 09:28:12
tags:
  - kubernetes
  - kubelet
  - 配置
  - 节点管理
---

# Kubelet 配置指南

> [!abstract] 概述
> Kubelet 是运行在每个 Kubernetes 节点上的主要代理程序，负责管理 Pod 和容器的生命周期。本文介绍 Kubelet 的配置方法和常用参数。

## Kubelet 简介

Kubelet 是 Kubernetes 集群中每个节点上运行的核心组件，主要职责包括：

- 接收并执行来自 API Server 的 Pod 规范
- 管理容器的生命周期（创建、启动、停止、删除）
- 监控节点和容器的健康状态
- 向 API Server 报告节点状态

## 配置文件位置

> [!info] 常见配置文件路径
> - Kubelet 配置文件：`/var/lib/kubelet/config.yaml`
> - Kubelet 服务文件：`/etc/systemd/system/kubelet.service.d/10-kubeadm.conf`
> - Kubeadm 配置：`/etc/kubernetes/kubelet.conf`

## 常用配置参数

### 基础配置

```yaml
apiVersion: kubelet.config.k8s.io/v1beta1
kind: KubeletConfiguration
# 集群 DNS 服务器地址
clusterDNS:
  - 10.96.0.10
# 集群域名
clusterDomain: cluster.local
# 容器运行时
containerRuntimeEndpoint: unix:///var/run/containerd/containerd.sock
```

### 资源管理

```yaml
# 系统预留资源
systemReserved:
  cpu: 100m
  memory: 100Mi
# Kubernetes 组件预留资源
kubeReserved:
  cpu: 100m
  memory: 100Mi
# 驱逐阈值
evictionHard:
  memory.available: 100Mi
  nodefs.available: 10%
```

## 相关链接

- [[Kubernetes组件详解和高可用配置]] - K8S 组件详解
- [[K8S调度问题]] - 调度相关问题
- [[Kubernetes常见问题]] - 常见问题汇总

**返回**: [[Kubernetes]]
