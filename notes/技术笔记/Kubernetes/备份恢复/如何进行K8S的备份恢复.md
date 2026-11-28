---
🌻日期🌻: 2024-06-04
🌙星期🌙: 星期二
⌚️时间⌚️: 09:41:55
tags:
  - kubernetes
  - 备份
  - 恢复
  - 运维
---

# Kubernetes 集群备份与恢复

> [!abstract] 概述
> 本文介绍如何备份和恢复 Kubernetes 资源清单。`kubectl get ... -o yaml` 只能作为配置导出，不能替代 etcd 快照、PV 数据备份或外部系统（如云资源、镜像仓库）的备份。

## 备份原则

> [!important] 为什么不直接备份 Pod？
> 使用 `kubectl get all --all-namespaces -o yaml > all-resources.yaml` 会备份所有资源包括 Pod，这可能导致恢复时状态不一致。
>
> - Pod 是通过 Deployments 或 StatefulSets 动态生成和管理的
> - 直接备份和恢复 Pod 可能导致状态不一致
> - 控制器会根据其定义自动重新创建 Pod

## 备份方案

### 1. 备份静态配置

使用以下命令导出所有命名空间中的主要控制器和静态配置：

```bash
# 基础备份命令
kubectl get deployments,statefulsets,daemonsets,services,configmaps,secrets,persistentvolumeclaims \
  --all-namespaces -o yaml > cluster-config.yaml
```

> [!warning] 备份边界
> 导出的 YAML 不包含 etcd 的全部集群状态、节点证书和其他控制平面文件，也不会复制 PV 中的数据、CRD 对接的外部系统或 Secret 的加密密钥。Secrets 导出后是可还原的敏感数据，必须加密存储并限制权限。

### 备份边界之外：etcd 和持久化数据

对自建控制平面，使用与 etcd 版本兼容的 `etcdctl snapshot save`，并把快照复制到独立介质；PV 则使用存储系统快照或应用一致性备份。恢复前先在隔离环境验证快照可读。

> [!tip] 使用 kubectl-neat 清理配置
> `kubectl-neat` 可以清理导出配置中的运行时字段，使配置更干净：
> ```bash
> kubectl get deployments,statefulsets,daemonsets,services,configmaps,secrets,persistentvolumeclaims \
>   --all-namespaces -o yaml | ./kubectl-neat > cluster-config.yaml
> ```

### 2. 备份命名空间定义

单独导出命名空间配置：

```bash
kubectl get namespaces -o yaml > namespaces.yaml
```

### 3. 备份特定命名空间

导出特定命名空间（如 `default`）的资源：

```bash
kubectl get deployments,statefulsets,daemonsets,services,configmaps,secrets,persistentvolumeclaims \
  -n default -o yaml > default-namespace-config.yaml
```

## 恢复方案

### 1. 恢复命名空间

首先恢复命名空间定义：

```bash
kubectl apply -f namespaces.yaml
```

### 2. 恢复静态配置

将导出的配置文件应用到集群：

```bash
kubectl apply -f cluster-config.yaml
```

> [!success] 自动重建
> 所有的 Deployments、StatefulSets、DaemonSets 等控制器会根据其定义自动重新创建相应的 Pod，确保 Pod 的状态与原始状态一致。

### 3. 恢复特定命名空间

```bash
kubectl apply -f default-namespace-config.yaml
```

## 备份资源清单

| 资源类型 | 是否备份 | 说明 |
|----------|----------|------|
| Deployments | 是 | 无状态应用控制器 |
| StatefulSets | 是 | 有状态应用控制器 |
| DaemonSets | 是 | 守护进程控制器 |
| Services | 是 | 服务发现和负载均衡 |
| ConfigMaps | 是 | 配置数据 |
| Secrets | 是 | 敏感数据 |
| PersistentVolumeClaims | 是 | 持久化存储声明 |
| Pods | 否 | 由控制器自动创建 |
| ReplicaSets | 否 | 由 Deployment 管理 |

## 参考资料

- [kubectl get 命令文档](https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands#get)
- [kubectl apply 命令文档](https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands#apply)

## 相关链接

- [[如何直接读取longhorn的文件]] - Longhorn 数据恢复
- [[Kubernetes常见问题]] - K8S 常见问题
- [[如何使用Secrets]] - Secrets 管理

**返回**: [[Kubernetes]]
