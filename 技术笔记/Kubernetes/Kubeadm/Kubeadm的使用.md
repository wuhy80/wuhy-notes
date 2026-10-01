---
🌻日期🌻: 2024-10-31
🌙星期🌙: 星期四
⌚️时间⌚️: 10:19:06
tags:
  - kubernetes
  - kubeadm
  - 集群管理
  - 节点加入
---

# Kubeadm 使用指南

> [!abstract] 概述
> Kubeadm 是 Kubernetes 官方提供的集群引导工具，用于快速创建和管理 Kubernetes 集群。本文介绍如何使用 kubeadm 生成节点加入命令，以及控制平面节点和工作节点的区别。

## 生成 Join 命令

使用 `kubeadm token create --print-join-command` 命令可以生成节点加入集群的命令。根据是否带 `--certificate-key` 参数，生成的命令用途不同。

### 工作节点加入（不带 certificate-key）

> [!tip] 不带 --certificate-key 参数
> 当不使用 `--certificate-key` 参数时，生成的加入命令用于让**普通工作节点（Worker Node）**加入集群。
>
> - 默认情况下，kubeadm 在创建集群时会生成一个随机令牌
> - 这个令牌主要用于允许新的工作节点加入集群
> - 工作节点不参与集群控制平面，只负责运行 Pod

```bash
# 生成工作节点加入命令
kubeadm token create --print-join-command
```

### 控制平面节点加入（带 certificate-key）

> [!tip] 带 --certificate-key 参数
> 当使用特定的 `--certificate-key` 参数时，生成的加入命令用于添加**新的控制平面节点**。
>
> - 用于扩展集群的控制平面以提高可用性和可靠性
> - 确保新节点能够正确地与现有控制平面节点通信和同步状态
> - 新节点将参与集群的控制平面功能

```bash
# 首先上传证书并记录命令输出的最后一行 certificate-key（有效期约 2 小时）
CERT_KEY=$(kubeadm init phase upload-certs --upload-certs | tail -n 1)

# 生成基础 join 命令；certificate-key 是 join 参数，不是 token create 的参数
JOIN_CMD=$(kubeadm token create --print-join-command)
echo "$JOIN_CMD --control-plane --certificate-key $CERT_KEY"
```

> [!warning] 控制平面端点
> 高可用集群应使用稳定的 `controlPlaneEndpoint`（负载均衡器或 VIP）生成和执行 join 命令，不要把某一台控制平面节点地址当成永久入口。证书上传完成后应在加入窗口结束时删除 `kubeadm-certs` Secret，并妥善处理 token。

```bash
kubectl -n kube-system delete secret kubeadm-certs --ignore-not-found
```

## 节点类型对比

| 特性 | 工作节点 (Worker) | 控制平面节点 (Control Plane) |
|------|------------------|------------------------------|
| 运行 Pod | 是 | 可选 |
| 参与调度决策 | 否 | 是 |
| 运行 etcd | 否 | 是 |
| 运行 API Server | 否 | 是 |
| 需要 certificate-key | 否 | 是 |

> [!important] 设计目的
> Kubeadm 通过这种方式区分不同类型的节点加入集群，可以更好地管理和控制集群的扩展，确保只有经过授权的节点能够加入控制平面。

## 相关链接

- [[Kubernetes组件详解和高可用配置]] - 高可用集群配置
- [[K8S调度问题]] - 调度相关问题
- [[Kubernetes常见问题]] - 常见问题汇总

**返回**: [[Kubernetes]]
