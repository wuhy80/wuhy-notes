---
🌻日期🌻: 2026-07-11
🌙星期🌙: 星期六
⌚️时间⌚️: 18:20:00
tags:
  - kubernetes
  - 高可用
  - kubeadm
  - 负载均衡
---

# 为什么 kubeadm 多主仍然需要负载均衡器

> [!question]
> 已经有多个 Master 节点了，为什么使用 [[技术笔记/Kubernetes/Kubeadm/Kubeadm的使用|Kubeadm]] 搭建多控制平面集群时，通常仍然建议配置负载均衡器？

## 一句话结论

多 Master 只解决“控制平面组件有多个副本”的问题，不自动解决“客户端统一连谁”的问题。  
负载均衡器提供的是一个稳定的 `controlPlaneEndpoint`，让 worker、`kubectl`、控制器和其他客户端始终访问同一个入口，并在某个 Master 异常时自动切走。

> [!summary]
> 多 Master 负责冗余，负载均衡器负责入口稳定和故障切换；两者解决的问题不同。

## 常见误区

### 误区 1：有多个 Master 就天然高可用

不是。  
如果每个节点、每个 kubeconfig 或每个组件都直接写死某一个 Master 的 IP，例如 `master-one:6443`，那么这个 Master 挂掉时：

- 新请求仍会继续打到故障节点。
- `kubectl` 会直接连不上。
- 新加入节点的 `kubeadm join` 也会失败。
- 依赖 API Server 的自动化任务会报错。

也就是说，虽然“集群里还有别的 Master 活着”，但“访问入口”依然单点。

### 误区 2：etcd 已经高可用，所以不需要 LB

这也不对。  
`etcd` 高可用解决的是控制平面存储的一致性和副本容错；负载均衡器解决的是 kube-apiserver 的访问入口问题。

- `etcd` 关注：数据是否还能读写、一致性是否还在。
- 负载均衡器关注：客户端请求还能不能稳定到达健康的 API Server。

两者不是替代关系。

## 负载均衡器到底解决什么问题

### 1. 提供统一入口

`kubeadm` 的高可用拓扑通常会配置一个统一的 `controlPlaneEndpoint`，例如：

```text
lb.k8s.local:6443
```

这样：

- `kubectl` 只连这一个地址。
- worker 节点的 kubelet 只连这一个地址。
- 新控制平面节点加入时，也走这一个地址。
- 后续变更 Master 节点列表时，不需要逐台改客户端配置。

### 2. 做健康检查和故障切换

负载均衡器会把流量转发给健康的 kube-apiserver 实例。某个 Master 宕机或 API Server 不健康时：

- LB 把故障节点从后端池摘掉。
- 请求继续转发到剩余 Master。
- 客户端不需要手工切换地址。

### 3. 降低人工维护成本

如果没有 LB，常见替代方案是：

- 所有人手工改 `kubeconfig`
- 所有 worker 手工改 apiserver 地址
- 自动化脚本改连接目标
- 某个 Master 故障后临时切 IP

这种方式理论上能“凑合用”，但运维复杂度和出错概率都很高，更接近“可恢复”，不是“可高可用”。

## 可以不用负载均衡器吗

可以，但代价很明显。

例如 [[实现内部高可用集群的方案]] 里提到的做法，本质上是：

- 默认所有人先指向某一个 Master
- 这个 Master 出问题后，再手工改到其他节点

这种方式适合：

- 测试环境
- 小规模内部环境
- 可以接受短时中断
- 有明确的人工切换流程

但不适合：

- 生产环境
- 多用户共享集群
- 自动化程度高的系统
- 对控制平面连续可用性要求高的场景

> [!warning]
> 不使用负载均衡器，不代表控制平面没有副本；但通常意味着故障切换依赖人工，而不是自动完成。

## 一个直观类比

可以把多个 Master 理解成多个客服坐席，把负载均衡器理解成总机：

- 多个坐席：说明有人可以接电话，不会只有一个人值班。
- 总机：说明来电的人不用记住每个坐席号码，只打一个总机号即可。

如果没有总机，即使你有多个坐席，客户只记住了其中一个人的手机号，这个人一请假，电话还是打不通。

## 实际设计建议

### 推荐方案

- 生产环境优先使用统一 `controlPlaneEndpoint`
- 通过 HAProxy、NGINX、Keepalived、云 LB 或硬件 LB 暴露 `6443`
- 对 kube-apiserver 做 TCP 健康检查
- 所有节点和运维入口都使用同一个 LB 地址

### 不推荐方案

- 在 worker 或客户端里直接写死某个 Master IP
- 依赖 DNS 手工切换但没有健康检查
- 故障时靠人工逐台改配置

## 相关笔记

- [[实现外部的高可用集群]]
- [[实现内部高可用集群的方案]]
- [[00 如何检查是否高可用]]
- [[Kubeadm/Kubeadm的使用|Kubeadm的使用]]

## 参考资料

- [Kubernetes Documentation - Creating Highly Available Clusters with kubeadm](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/high-availability/)
