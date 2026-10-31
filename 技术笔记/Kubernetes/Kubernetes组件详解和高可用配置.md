---
🌻日期🌻: 2024-04-28
🌙星期🌙: 星期日
⌚️时间⌚️: 22:29:34
tags:
  - kubernetes
  - 架构
  - 高可用
  - etcd
---

# Kubernetes 组件详解和高可用配置

> [!abstract] 概述
> 本文详细介绍 Kubernetes 的核心组件架构，包括控制平面、工作节点以及高可用拓扑配置。

![Kubernetes 架构图](https://www.redhat.com/rhdc/managed-files/kubernetes_diagram-v3-770x717_0.svg)

---

## 控制平面（Control Plane）

> [!tip] 控制平面
> 控制平面是 Kubernetes 集群的神经中枢，包含用于控制集群的核心组件以及集群状态和配置数据。这些组件负责确保容器以足够的数量和所需的资源运行。
>
> 控制平面会一直与计算节点保持联系，确保集群按照配置的方式运行。

### kube-apiserver

API Server 是 Kubernetes 控制平面的前端，用于处理内部和外部请求。

| 访问方式 | 说明 |
|---------|------|
| REST API | 直接调用 API |
| kubectl | 命令行工具 |
| kubeadm | 集群管理工具 |

**相关文档**: [[高可用/00 如何检查是否高可用#检查 Kubernetes 集群高可用性|检查 API Server 状态]]

### kube-scheduler

调度程序负责将 Pod 安排到适当的计算节点：

- 考虑容器集的资源需求（CPU、内存）
- 评估集群的运行状况
- 将容器集安排到适当的计算节点

**相关文档**: [[K8S调度问题|调度问题排查]]

### kube-controller-manager

控制器管理器将多个控制器功能合而为一，内部分不同进程运行，但打包为一个二进制文件：

| 控制器 | 职责 |
|-------|------|
| **Node Controller** | 监控节点状态，响应节点故障 |
| **Job Controller** | 监控 Job 对象，创建 Pod 执行一次性任务 |
| **EndpointSlice Controller** | 维护 Service 和 Pod 之间的链接 |
| **ServiceAccount Controller** | 为新命名空间创建默认 ServiceAccount |

### etcd

> [!important] 集群数据存储
> etcd 是一个分布式键值存储数据库，存储集群的配置数据和状态信息，被视为集群的**最终事实来源**。

**相关文档**:
- [[高可用/01 etcd备份恢复|etcd 备份恢复]]
- [[高可用/02 Etcd配置讲解|etcd 配置详解]]

---

## 工作节点（Node）

> [!tip] 节点
> Kubernetes 集群中至少需要一个计算节点，但通常会有多个。容器集经过调度和编排后，就会在节点上运行。扩展集群容量需要添加更多节点。

### Pod（容器集）

Pod 是 Kubernetes 对象模型中**最小、最简单的单元**：

- 代表应用的单个实例
- 由一个或一系列紧密耦合的容器组成
- 可连接持久存储运行有状态应用

### 容器运行时引擎

每个计算节点都需要一个容器运行时引擎来运行容器：

| 运行时 | 说明 |
|-------|------|
| containerd | 常用 CRI 运行时；需由发行版或管理员安装并配置 |
| CRI-O | 轻量级 OCI 兼容运行时 |
| Docker | 通过 cri-dockerd 适配器支持 |

### kubelet

> [!info] Kubelet 服务
> 每个 Node 节点上都运行一个 Kubelet 服务进程，默认监听 **10250** 端口。

主要职责：
- 接收并执行 Master 发来的指令
- 管理 Pod 及 Pod 中的容器
- 在 API Server 上注册节点信息
- 定期向 Master 汇报资源使用情况

**相关文档**: [[Kubelet分析/Kubelet配置|Kubelet 配置]]

### kube-proxy

kube-proxy 是网络代理，负责处理集群内部或外部的网络通信：

- 使用操作系统的数据包过滤层（iptables/IPVS）
- 或自行转发流量

**相关文档**: [[高可用/00 如何检查是否高可用#方法 1 检查 kube-proxy 模式|检查 kube-proxy 模式]]

---

## 集群基础设施

> [!tip] 持久存储
> Kubernetes 可以管理附加在集群上的应用数据。用户可以请求存储资源，而无需了解底层存储基础架构的详细信息。持久卷是集群（而非 Pod）所特有的，因此其寿命可以超过 Pod。

> [!tip] 容器镜像仓库
> Kubernetes 所依赖的容器镜像存储于容器镜像仓库中。可以是自己配置的私有仓库，也可以由第三方提供。

> [!tip] 底层基础架构
> Kubernetes 可以在许多不同类型的基础架构上运行：裸机服务器、虚拟机、公共云、私有云和混合云环境。

**相关文档**:
- [[Docker/02 如何搭建私有镜像服务器|搭建私有镜像服务器]]
- [[技术笔记/Kubernetes/Longhorn/如何直接读取longhorn的文件|Longhorn 存储]]

---

## 高可用拓扑

### Stacked etcd topology（堆叠式）

在这个场景下：
- API Server 和**本地的 etcd** 进行通信
- Controller Manager 和 Scheduler 都和本机的 API Server 进行通信
- Node 节点通过 **LB** 和 API Server 进行通信

![Stacked etcd topology](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_1/202404301525097.png)

> [!success] 优点
> - 部署简单，etcd 和控制平面组件在同一节点
> - 需要的服务器数量较少

> [!warning] 缺点
> - 控制平面节点故障会同时影响 etcd

### External etcd topology（外部式）

在这个场景下：
- APIr 和**远端的 etcd** 进行通信
- Controller Manager 和 Scheduler 都和本机的 API Server 进行通信
- Node 节点通过 **LB** 和 API Server 进行通信

![External etcd topology](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_1/202404301525862.png)

> [!success] 优点
> - etcd 集群独立，更高的可用性
> - 控制平面和数据存储分离

> [!warning] 缺点
> - 需要更多服务器
> - 部署和维护更复杂

**相关文档**:
- [[高可用/实现外部的高可用集群|外部高可用集群方案]]
- [[高可用/实现内部高可用集群的方案|内部高可用集群方案]]

---

## 参考文档

> [!quote] 官方文档
> [Kubernetes 高可用拓扑](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/ha-topology/#stacked-etcd-topology)

---

**返回**: [[Kubernetes]]
