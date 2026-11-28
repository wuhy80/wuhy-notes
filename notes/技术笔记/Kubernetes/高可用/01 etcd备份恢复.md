---
🌻日期🌻: 2024-05-09
🌙星期🌙: 星期四
⌚️时间⌚️: 13:32:18
tags:
  - kubernetes
  - etcd
  - 备份恢复
  - 运维
  - 高可用
---

> [!abstract] 概述
> 本文介绍 etcd 数据库的备份与恢复操作，这是 Kubernetes 集群灾难恢复的关键步骤。etcd 存储了整个集群的状态数据，定期备份可以在集群故障时快速恢复。

## 如何备份 etcd

> [!important] 前置条件
> 在执行备份操作前，建议先停止所有的 etcd 服务，以确保数据一致性。

### 执行备份命令

```bash
ETCDCTL_API=3 etcdctl \
  --endpoints=<etcd-endpoint1>,<etcd-endpoint2>,<etcd-endpoint3> \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key \
  snapshot save <backup-file-path>
```

### 验证备份文件

备份之后的数据用下面的命令可以进行验证：

```bash
ETCDCTL_API=3 etcdctl \
  --write-out=table snapshot status <backup-file-path>
```

### 关于 --endpoints 参数

> [!tip] 最佳实践
> 在使用 `etcdctl` 进行备份或恢复操作时，`--endpoints` 参数用于指定 etcd 集群的成员地址。如果你的 etcd 集群是多主（multi-master）或者有多个成员（通常是奇数个），你应该列出所有成员的地址。

例如，如果 etcd 集群有三个成员，它们的地址分别是 `etcd-member1:2379`、`etcd-member2:2379` 和 `etcd-member3:2379`，应该在 `--endpoints` 参数中列出所有这些地址：

```bash
ETCDCTL_API=3 etcdctl \
  --endpoints=etcd-member1:2379,etcd-member2:2379,etcd-member3:2379 \
  ...
```

> [!success] 优势
> - 即使集群中的某个成员暂时不可用，`etcdctl` 仍然可以与其他成员通信，完成备份或恢复操作
> - 列出所有成员地址有助于确保备份或恢复操作能够覆盖集群中的所有数据

> [!warning] 注意
> 如果只指定一个特定成员的地址进行备份或恢复，可能会导致数据不完整，因为 etcd 集群中的数据是分布式的，每个成员都可能持有不同的数据。

## 如何恢复 etcd

### 恢复步骤

1. **停止 etcd 服务**
2. **清除现有的 etcd 数据目录**（通常是 `/var/lib/etcd` 或 `/var/etcd`）
3. **执行恢复命令**

```bash
ETCDCTL_API=3 etcdctl \
  --data-dir=<etcd-data-directory> \
  snapsstore <backup-file-path>
```

4. **启动 etcd 服务器**
5. **验证功能性**

### 恢复后验证

恢复完成后，可以使用以下命令验证 etcd 集群状态：

```bash
etcdctl member list
etcdctl endpoint health
```

> [!danger] 重要提醒
> - 恢复操作会覆盖现有数据，请确保在执行前已做好充分准备
> - 建议在非生产环境中先测试恢复流程
> - 恢复后需要验证 Kubernetes 集群的所有组件是否正常工作

---

**返回**: [[Kubernetes]]

**相关文档**:
- [[00 如何检查是否高可用]]
- [[02 Etcd配置讲解]]
- [[备份恢复/如何进行K8S的备份恢复|K8S 备份恢复]]
