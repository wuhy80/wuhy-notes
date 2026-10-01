---
🌻日期🌻: 2024-04-16
🌙星期🌙: 星期二
⌚️时间⌚️: 15:52:00
tags:
  - Kubernetes
  - 调度
  - 故障排查
  - 网络
---

# K8S 调度问题

本文档记录 Kubernetes 集群中常见的调度问题及其排查方法。

---

## 调整副本数没有变化怎么办

> [!tip] 排查思路
> 不仅仅是副本数调整失败，遇到所有调度相关的问题，都可以直接查看 **api-server** 的日志。

### 问题现象

K8S 中调整副本数量没有反应，不论是从 0 改成 1 还是改成其他数字都没有反应。

![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_1/202404161552764.png)

### 排查步骤

通过以下命令查看 api-server 日志：

```bash
kubectl logs kube-apiserver-pdl-1 -n kube-system -f
```

![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_1/202404161559331.png)

### 解决方案

> [!warning] 证书问题
> 遇到这种情况通常是证书问题。直接查看证书可能显示没有过期，但证书更新之后需要**重启静态 POD** 才能生效。

解决步骤：
1. 将 manifest 目录迁移出去
2. 等待静态 POD 停止
3. 再将 manifest 目录迁移回来

![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_1/202404161605293.png)

> [!info] 详细证书更新步骤
> 请参考 [[如何更新镜像文件#证书更新]] 中的完整证书更新流程。

---

## 网络组件

### 设置 ExternalTrafficPolicy 为 Local

> [!info] 参考文档
> https://blog.cptsai.com/2020/11/15/k8s-external-traffic-policy

#### 行为说明

| ExternalTrafficPolicy | 访问方式 |
|----------------------|---------|
| `Cluster`（默认） | 集群内任意节点的 IP + NodePort 均可访问 |
| `Local` | 只能使用运行 POD 的节点 IP + NodePort 访问 |

> [!tip] 使用场景
> 设置为 `Local` 后，访问对应的 NodePort 只能使用运行该服务 POD 的机器 IP 和对应端口，而不是集群内任意一台机器的 IP 和端口均可访问。这在需要保留客户端源 IP 的场景下非常有用。

---

## 相关链接

- [[如何更新镜像文件]] - 镜像和证书更新方法
- [[如何查看底层的文件系统路径]] - 容器文件系统排查
- [[Service/如何开放端口]] - Service 端口配置
- [[Kubernetes常见问题]] - 其他常见问题汇总

---

**返回**: [[Kubernetes]]
