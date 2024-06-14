---
🌻日期🌻: 2024-05-11
🌙星期🌙: 星期六
⌚️时间⌚️: 14:07:41
tags: 
---
# etcd 启动的证书配置
```bash
/usr/local/bin/etcd \\
--cert-file=/etc/etcd/kube-etcd.pem \\                   # 对外提供服务的服务器证书
--key-file=/etc/etcd/kube-etcd-key.pem \\                # 服务器证书对应的私钥
--peer-cert-file=/etc/etcd/kube-etcd-peer.pem \\         # peer 证书，用于 etcd 节点之间的相互访问
--peer-key-file=/etc/etcd/kube-etcd-peer-key.pem \\      # peer 证书对应的私钥
--trusted-ca-file=/etc/etcd/cluster-root-ca.pem \\       # 用于验证访问 etcd 服务器的客户端证书的 CA 根证书
--peer-trusted-ca-file=/etc/etcd/cluster-root-ca.pem\\   # 用于验证 peer 证书的 CA 根证书
...
```

# 一个集群的例子
集群包含 master-one(192.0.2.201) 和 master-two(192.0.2.201) 和 node-one(192.0.2.201) 三个节点

192.0.2.201 上的 etcd 启动配置
```bash
etcd --advertise-client-urls=https://192.0.2.201:2379 
--cert-file=/etc/kubernetes/pki/etcd/server.crt 
--client-cert-auth=true 
--data-dir=/var/lib/etcd 
--experimental-initial-corrupt-check=true 
--initial-advertise-peer-urls=https://192.0.2.201:2380 
--initial-cluster=master-one=https://192.0.2.201:2380 
--key-file=/etc/kubernetes/pki/etcd/server.key 
--listen-client-urls=https://127.0.0.1:2379,https://192.0.2.201:2379 
--listen-metrics-urls=http://127.0.0.1:2381 
--listen-peer-urls=https://192.0.2.201:2380 
--name=master-one 
--peer-cert-file=/etc/kubernetes/pki/etcd/peer.crt 
--peer-client-cert-auth=true 
--peer-key-file=/etc/kubernetes/pki/etcd/peer.key 
--peer-trusted-ca-file=/etc/kubernetes/pki/etcd/ca.crt 
--snapshot-count=10000 
--trusted-ca-file=/etc/kubernetes/pki/etcd/ca.crt
```

192.0.2.201 的 etcd 启动配置
```bash
etcd --advertise-client-urls=https://192.0.2.201:2379 
--cert-file=/etc/kubernetes/pki/etcd/server.crt 
--client-cert-auth=true 
--data-dir=/var/lib/etcd 
--experimental-initial-corrupt-check=true 
--initial-advertise-peer-urls=https://192.0.2.201:2380 
--initial-cluster=master-one=https://192.0.2.201:2380,master-two=https://192.0.2.201:2380 
--initial-cluster-state=existing 
--key-file=/etc/kubernetes/pki/etcd/server.key 
--listen-client-urls=https://127.0.0.1:2379,https://192.0.2.201:2379 
--listen-metrics-urls=http://127.0.0.1:2381 
--listen-peer-urls=https://192.0.2.201:2380 
--name=master-two 
--peer-cert-file=/etc/kubernetes/pki/etcd/peer.crt 
--peer-client-cert-auth=true 
--peer-key-file=/etc/kubernetes/pki/etcd/peer.key 
--peer-trusted-ca-file=/etc/kubernetes/pki/etcd/ca.crt 
--snapshot-count=10000 
--trusted-ca-file=/etc/kubernetes/pki/etcd/ca.crt
```

211 和 214 的配置对比
![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_1/202405111410330.png)


# ETCD 集群配置对比
### Comparing etcd Cluster Configurations

When setting up an etcd cluster, there are different approaches to configuring the `--initial-cluster` parameter. Here, we will compare the two primary methods: consistent configuration versus incremental configuration as used by `kubeadm`.

#### Consistent Configuration Approach

In this approach, all nodes in the etcd cluster are configured with the same `--initial-cluster` parameter that includes the details of all nodes in the cluster.

**Advantages:**
1. **Simplicity and Predictability**: Each node has a consistent configuration, which simplifies understanding and troubleshooting.
2. **Immediate Full Awareness**: All nodes are immediately aware of the complete cluster membership, which can facilitate quicker formation of consensus.
3. **Prevention of Split-Brain Scenarios**: Reduces the risk of split-brain scenarios as all nodes share the same view of the cluster.

**Disadvantages:**
1. **Manual Configuration Overhead**: When adding a new node, you need to manually update the configuration of all existing nodes, which can be error-prone and time-consuming.
2. **Lack of Flexibility**: It can be less flexible in dynamic environments where nodes are frequently added or removed.

Example configuration for all nodes:

```sh
etcd --name master-one \
  --initial-advertise-peer-urls http://192.0.2.201:2380 \
  --listen-peer-urls http://192.0.2.201:2380 \
  --advertise-client-urls http://192.0.2.201:2379 \
  --listen-client-urls http://192.0.2.201:2379 \
  --initial-cluster master-one=http://192.0.2.201:2380,master-two=http://192.0.2.201:2380,master-three=http://192.0.2.201:2380 \
  --initial-cluster-state new \
  --data-dir /var/lib/etcd
```

#### Incremental Configuration Approach (kubeadm)

`kubeadm` uses an incremental approach to configuring the `--initial-cluster` parameter. Initially, each node is configured with a limited view of the cluster, and subsequent nodes are added incrementally.

**Advantages:**
1. **Ease of Bootstrapping**: Simplifies the initial setup process, as nodes can be added one by one without needing to update the configuration of existing nodes.
2. **Automation-Friendly**: Works well with automated tools and scripts, making it easier to scale the cluster dynamically.
3. **Flexibility**: Allows for more dynamic changes in the cluster membership without extensive reconfiguration.

**Disadvantages:**
1. **Initial Inconsistency**: During the bootstrapping process, nodes may have an inconsistent view of the cluster until all nodes are fully configured.
2. **Potential for Errors**: Misconfiguration during the incremental addition of nodes can lead to issues with cluster formation and stability.

Example configuration with incremental updates:

- **First Node (master-one):**

  ```sh
  etcd --name master-one \
    --initial-advertise-peer-urls http://192.0.2.201:2380 \
    --listen-peer-urls http://192.0.2.201:2380 \
    --advertise-client-urls http://192.0.2.201:2379 \
    --listen-client-urls http://192.0.2.201:2379 \
    --initial-cluster master-one=http://192.0.2.201:2380 \
    --initial-cluster-state new \
    --data-dir /var/lib/etcd
  ```

- **Second Node (master-two):**

  ```sh
  etcd --name master-two \
    --initial-advertise-peer-urls http://192.0.2.201:2380 \
    --listen-peer-urls http://192.0.2.201:2380 \
    --advertise-client-urls http://192.0.2.201:2379 \
    --listen-client-urls http://192.0.2.201:2379 \
    --initial-cluster master-one=http://192.0.2.201:2380,master-two=http://192.0.2.201:2380 \
    --initial-cluster-state existing \
    --data-dir /var/lib/etcd
  ```

- **Third Node (master-three):**

  ```sh
  etcd --name master-three \
    --initial-advertise-peer-urls http://192.0.2.201:2380 \
    --listen-peer-urls http://192.0.2.201:2380 \
    --advertise-client-urls http://192.0.2.201:2379 \
    --listen-client-urls http://192.0.2.201:2379 \
    --initial-cluster master-one=http://192.0.2.201:2380,master-two=http://192.0.2.201:2380,master-three=http://192.0.2.201:2380 \
    --initial-cluster-state existing \
    --data-dir /var/lib/etcd
  ```

### Which Approach is Better?

**Consistent Configuration** is generally better for smaller clusters or environments where nodes do not change frequently. It provides simplicity and reduces the risk of misconfiguration.

**Incremental Configuration** is advantageous in dynamic or automated environments, such as those managed by tools like `kubeadm`. It simplifies scaling and maintenance but requires careful management during the bootstrapping phase to avoid inconsistencies.

For more detailed comparisons and examples, refer to the [etcd Clustering Guide](https://etcd.io/docs/v3.5/op-guide/clustering/) and the [Kubernetes Documentation](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/setup-ha-etcd-with-kubeadm/) 【84†source】【85†source】【87†source】.