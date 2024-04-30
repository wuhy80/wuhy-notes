---
🌻日期🌻: 2024-04-28
🌙星期🌙: 星期日
⌚️时间⌚️: 22:29:34
tags: 
---
# K8S 组件详解
![](https://www.redhat.com/rhdc/managed-files/kubernetes_diagram-v3-770x717_0.svg)
## Kubernetes 控制平面的运行原理
> [!tip] 控制平面
> 让我们从 Kubernetes 集群的神经中枢（即控制平面）开始说起。在这里，我们可以找到用于控制集群的 Kubernetes 组件以及一些有关集群状态和配置的数据。这些核心 Kubernetes 组件负责处理重要的工作，以确保容器以足够的数量和所需的资源运行。 
> 
> 控制平面会一直与您的计算机保持联系。集群已被配置为以特定的方式运行，而控制平面要做的就是确保万无一失。

### kube-apiserver
如果需要与您的 Kubernetes 集群进行交互，就要通过 API。Kubernetes API 是 Kubernetes 控制平面的前端，用于处理内部和外部请求。API 服务器会确定请求是否有效，如果有效，则对其进行处理。您可以通过 REST 调用、kubectl 命令行界面或其他命令行工具（例如 kubeadm）来访问 API。

### kube-scheduler
您的集群是否状况良好？如果需要新的容器，要将它们放在哪里？这些是 Kubernetes 调度程序所要关注的问题。

调度程序会考虑容器集的资源需求（例如 CPU 或内存）以及集群的运行状况。随后，它会将容器集安排到适当的计算节点。

### kube-controller-manager
控制器负责实际运行集群，而 Kubernetes 控制器管理器则是将多个控制器功能合而为一。控制器用于查询调度程序，并确保有正确数量的容器集在运行。如果有容器集停止运行，另一个控制器会发现并做出响应。控制器会将服务连接至容器集，以便让请求前往正确的端点。还有一些控制器用于创建帐户和 API 访问令牌。

Controller 内部分不同进程运行，但是为部署简单，打包为一个二进制文件运行
- Node controller: Responsible for noticing and responding when nodes go down.
- Job controller: Watches for Job objects that represent one-off tasks, then creates Pods to run those tasks to completion.
- EndpointSlice controller: Populates EndpointSlice objects (to provide a link between Services and Pods).
- ServiceAccount controller: Create default ServiceAccounts for new namespaces.
### etcd
配置数据以及有关集群状态的信息位于 etcd（一个键值存储数据库）中。etcd 采用分布式、容错设计，被视为集群的最终事实来源。

## Kubernetes 节点是什么？
> [!tip] 节点
> Kubernetes 集群中至少需要一个计算节点，但通常会有多个计算节点。容器集经过调度和编排后，就会在节点上运行。如果需要扩展集群的容量，那就要添加更多的节点。

### 容器集
容器集是 Kubernetes 对象模型中最小、最简单的单元。它代表了应用的单个实例。每个容器集都由一个容器（或一系列紧密耦合的容器）以及若干控制容器运行方式的选件组成。容器集可以连接至持久存储，以运行有状态应用。

### 容器运行时引擎
为了运行容器，每个计算节点都有一个容器运行时引擎。比如 Docker，但 Kubernetes 也支持其他符合开源容器运动（OCI）标准的运行时，例如 rkt 和 CRI-O。

### kubelet
每个Node节点上都运行一个 Kubelet 服务进程，默认监听 10250 端口，接收并执行 Master 发来的指令，管理 Pod 及 Pod 中的容器。每个 Kubelet 进程会在 API Server 上注册所在Node节点的信息，定期向 Master 节点汇报该节点的资源使用情况


### kube-proxy
每个计算节点中还包含 kube-proxy，这是一个用于优化 Kubernetes 网络服务的网络代理。kube-proxy 负责处理集群内部或外部的网络通信——靠操作系统的数据包过滤层，或者自行转发流量。

## Kubernetes 集群还需要什么？
> [!tip] 持久存储
> 除了管理运行应用的容器外，Kubernetes 还可以管理附加在集群上的应用数据。Kubernetes 允许用户请求存储资源，而无需了解底层存储基础架构的详细信息。持久卷是集群（而非容器集）所特有的，因此其寿命可以超过容器集。

> [!tip] 容器镜像仓库
> Kubernetes 所依赖的容器镜像存储于容器镜像仓库中。这个镜像仓库可以由您自己配置的，也可以由第三方提供。

> [!tip] 底层基础架构
> 您可以自己决定具体在哪里运行 Kubernetes。答案可以是裸机服务器、虚拟机、公共云提供商、私有云和混合云环境。Kubernetes 的一大优势就是它可以在许多不同类型的基础架构上运行。


# K8S 高可用
## Stacked etcd topology
这个场景下 apiserver 和本地的 etcd 进行通信,controller-manager 和 scheduler 都和本机的 api-server 进行通信，而 Node 节点通过 LB 和 apiserver 进行通信
![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_1/202404301525097.png)


## External etcd topology
这个场景下 apiserver 和远端的 etcd 进行通信,controller-manager 和 scheduler 都和本机的 api-server 进行通信，而 Node 节点通过 LB 和 apiserver 进行通信

![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_1/202404301525862.png)

# 参考文档
> [!hints] https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/ha-topology/#stacked-etcd-topology
> Kubernetes 官方的高可用说明

