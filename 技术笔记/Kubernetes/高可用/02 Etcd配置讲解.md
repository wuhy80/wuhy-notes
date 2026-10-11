---
🌻日期🌻: 2024-05-11
🌙星期🌙: 星期六
⌚️时间⌚️: 14:07:41
tags:
  - kubernetes
  - etcd
  - 配置
  - 高可用
  - 证书
---

> [!abstract] 概述
> 本文详细讲解 etcd 的启动配置参数，包括证书配置、集群配置以及两种不同的集群配置方式（一致性配置 vs 增量配置）的对比分析。

## etcd 启动的证书配置

```bash
/usr/local/bin/etcd \
  --cert-file=/etc/etcd/kube-etcd.pem \                   # 对外提供服务的服务器证书
  --key-file=/etc/etcd/kube-etcd-key.pem \                # 服务器证书对应的私钥
  --peer-cert-file=/etc/etcd/kube-etcd-peer.pem \         # peer 证书，用于 etcd 节点之间的相互访问
  --peer-key-file=/etc/etcd/kube-etcd-peer-key.pem \      # peer 证书对应的私钥
  --trusted-ca-file=/etc/etcd/cluster-root-ca.pem \       # 用于验证访问 etcd 服务器的客户端证书的 CA 根证书
  --peer-trusted-ca-file=/etc/etcd/cluster-root-ca.pem \  # 用于验证 peer 证书的 CA 根证书
  ...
```

> [!info] 证书说明
> | 参数 | 用途 |
> |------|------|
> | `--cert-file` | 对外提供服务的服务器证书 |
> | `--key-file` | 服务器证书对应的私钥 |
> | `--peer-cert-file` | peer 证书，用于 etcd 节点之间的相互访问 |
> | `--peer-key-file` | peer 证书对应的私钥 |
> | `--trusted-ca-file` | 用于验证访问 etcd 服务器的客户端证书的 CA 根证书 |
> | `--peer-trusted-ca-file` | 用于验证 peer 证书的 CA 根证书 |

## 集群配置示例

集群包含以下三个节点：
- **master-one**: 192.0.2.211
- **master-two**: 192.0.2.214
- **node-one**: 192.0.2.135

### master-one (192.0.2.211) 的 etcd 启动配置

```bash
etcd --advertise-client-urls=https://192.0.2.211:2379 \
  --cert-file=/etc/kubernetes/pki/etcd/server.crt \
  --client-cert-auth=true \
  --data-dir=/var/lib/etcd \
  --experimental-initial-corrupt-check=true \
  --initial-advertise-peer-urls=https://192.0.2.211:2380 \
  --initial-cluster=master-one=https://192.0.2.211:2380 \
  --key-file=/etc/kubernetes/pki/etcd/server.key \
  --listen-client-urls=https://127.0.0.1:2379,https://192.0.2.211:2379 \
  --listen-metrics-urls=http://127.0.0.1:2381 \
  --listen-peer-urls=https://192.0.2.211:2380 \
  --name=master-one \
  --peer-cert-file=/etc/kubernetes/pki/etcd/peer.crt \
  --peer-client-cert-auth=true \
  --peer-key-file=/etc/kubernetes/pki/etcd/peer.key \
  --peer-trusted-ca-file=/etc/kubernetes/pki/etcd/ca.crt \
  --snapshot-count=10000 \
  --trusted-ca-file=/etc/kubernetes/pki/etcd/ca.crt
```

### master-two (192.0.2.214) 的 etcd 启动配置

```bash
etcd --advertise-client-urls=https://192.0.2.214:2379 \
  --cert-file=/etc/kubernetes/pki/etcd/server.crt \
  --client-cert-auth=true \
  --data-dir=/var/lib/etcd \
  --experimental-initial-corrupt-check=true \
  --initial-advertise-peer-urls=https://192.0.2.214:2380 \
  --initial-cluster=master-one=https://192.0.2.211:2380,master-two=https://192.0.2.214:2380 \
  --initial-cluster-state=existing \
  --key-file=/etc/kubernetes/pki/etcd/server.key \
  --listen-client-urls=https://127.0.0.1:2379,https://192.0.2.214:2379 \
  --listen-metrics-urls=http://127.0.0.1:2381 \
  --listen-peer-urls=https://192.0.2.214:2380 \
  --name=master-two \
  --peer-cert-file=/etc/kubernetes/pki/etcd/peer.crt \
  --peer-client-cert-auth=true \
  --peer-key-file=/etc/kubernetes/pki/etcd/peer.key \
  --peer-trusted-ca-file=/etc/kubernetes/pki/etcd/ca.crt \
  --snapshot-count=10000 \
  --trusted-ca-file=/etc/kubernetes/pki/etcd/ca.crt
```

### 配置对比

![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_1/202405111410330.png)

> [!tip] 关键差异
> - `--initial-cluster`: master-two 包含了两个节点的信息
> - `--initial-cluster-state`: master-two 设置为 `existing`，表示加入现有集群

## etcd 集群配置方式对比

在设置 etcd 集群时，`--initial-cluster` 参数有两种主要的配置方式：**一致性配置** 和 **增量配置**（kubeadm 使用的方式）。

### 方式一：一致性配置（Consistent Configuration）

所有节点使用相同的 `--initial-cluster` 参数，包含集群中所有节点的信息。

> [!success] 优点
> 1. **简单且可预测**：每个节点配置一致，便于理解和故障排查
> 2. **即时完整感知**：所有节点立即知道完整的集群成员，有助于更快形成共识
> 3. **防止脑裂**：降低脑裂场景的风险，因为所有节点共享相同的集群视图

> [!warning] 缺点
> 1. **手动配置开销**：添加新节点时，需要手动更新所有现有节点的配置
> 2. **缺乏灵活性**：在节点频繁添加或删除的动态环境中不够灵活

**配置示例**（所有节点使用相同配置）：

```bash
etcd --name master-one \
  --initial-advertise-peer-urls http://192.0.2.211:2380 \
  --listen-peer-urls http://192.0.2.211:2380 \
  --advertise-client-urls http://192.0.2.211:2379 \
  --listen-client-urls http://192.0.2.211:2379 \
  --initial-cluster master-one=http://192.0.2.211:2380,master-two=http://192.0.2.214:2380,master-three=http://192.0.2.135:2380 \
  --initial-cluster-state new \
  --data-dir /var/lib/etcd
```

### 方式二：增量配置（Incremental Configuration）

[[Kubeadm]] 使用的方式。初始时每个节点配置有限的集群视图，后续节点逐步添加。

> [!success] 优点
> 1. **易于引导**：简化初始设置过程，节点可以逐个添加
> 2. **自动化友好**：与自动化工具和脚本配合良好，便于动态扩展集群
> 3. **灵活性高**：允许更动态地更改集群成员，无需大量重新配置

> [!warning] 缺点
> 1. **初始不一致**：在引导过程中，节点可能对集群有不一致的视图
> 2. **潜在错误**：增量添加节点时的配置错误可能导致集群形成和稳定性问题

**配置示例**：

**第一个节点 (master-one)**：

```bash
etcd --name master-one \
  --initial-advertise-peer-urls http://192.0.2.211:2380 \
  --listen-peer-urls http://192.0.2.211:2380 \
  --advertise-client-urls http://192.0.2.211:2379 \
  --listen-client-urls http://192.0.2.211:2379 \
  --initial-cluster master-one=http://192.0.2.211:2380 \
  --initial-cluster-state new \
  --data-dir /var/lib/etcd
```

**第二个节点 (master-two)**：

```bash
etcd --name master-two \
  --initial-advertise-peer-urls http://192.0.2.214:2380 \
  --listen-peer-urls http://192.0.2.214:2380 \
  --advertise-client-urls http://192.0.2.214:2379 \
  --listen-client-urls http://192.0.2.214:2379 \
  --initial-cluster master-one=http://192.0.2.211:2380,master-two=http://192.0.2.214:2380 \
  --initial-cluster-state existing \
  --data-dir /var/lib/etcd
```

**第三个节点 (master-three)**：

```bash
etcd --name master-three \
  --initial-advertise-peer-urls http://192.0.2.135:2380 \
  --listen-peer-urls http://192.0.2.135:2380 \
  --advertise-client-urls http://192.0.2.135:2379 \
  --listen-client-urls http://192.0.2.135:2379 \
  --initial-cluster master-one=http://192.0.2.211:2380,master-two=http://192.0.2.214:2380,master-three=http://192.0.2.135:2380 \
  --initial-cluster-state existing \
  --data-dir /var/lib/etcd
```

## 如何选择配置方式？

| 场景 | 推荐方式 |
|------|----------|
| 小型集群或节点不经常变化的环境 | **一致性配置** - 提供简单性并降低配置错误风险 |
| 动态或自动化环境（如 kubeadm 管理） | **增量配置** - 简化扩展和维护，但需要在引导阶段仔细管理 |

> [!quote] 参考资料
> - [etcd Clustering Guide](https://etcd.io/docs/v3.5/op-guide/clustering/)
> - [Kubernetes Documentation - Setup HA etcd with kubeadm](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/setup-ha-etcd-with-kubeadm/)

---

**返回**: [[Kubernetes]]

**相关文档**:
- [[00 如何检查是否高可用]]
- [[01 etcd备份恢复]]
- [[实现内部高可用集群的方案]]
