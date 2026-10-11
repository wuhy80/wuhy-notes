---
🌻日期🌻: 2024-05-07
🌙星期🌙: 星期二
⌚️时间⌚️: 13:39:05
tags:
  - docker
  - 技术/Kubernetes/Docker
  - 配置
---

# Docker 配置

## 概述

本文档记录 Docker daemon 的配置方法，包括镜像加速、私有仓库配置等常用设置。

## daemon.json 配置文件

Docker 的核心配置文件位于 `/etc/docker/daemon.json`。

> [!tip] 配置文件位置
> 如果该文件不存在，需要手动创建。

### 配置示例

```json
{
    "registry-mirrors": ["https://ake33s4p.mirror.aliyuncs.com"],
    "insecure-registries": ["192.0.2.172:5000", "192.0.2.90", "192.0.2.90:80"],
    "exec-opts": ["native.cgroupdriver=systemd"]
}
```

### 配置项说明

| 配置项 | 说明 |
|--------|------|
| `registry-mirrors` | 镜像加速器地址，用于加速从 Docker Hub 拉取镜像 |
| `insecure-registries` | 允许使用 HTTP 协议访问的私有仓库地址 |
| `exec-opts` | 执行选项，这里设置 cgroup 驱动为 systemd |

> [!warning] 关于 insecure-registries
> 配置 `insecure-registries` 后，Docker 将不再强制使用 HTTPS 访问这些地址。这在内网环境中使用私有仓库时非常有用，但在生产环境中应谨慎使用。

## 使配置生效

修改 `daemon.json` 文件后，需要重启 Docker 服务：

```bash
# 重新加载 systemd 配置
systemctl daemon-reload

# 重启 Docker 服务
systemctl restart docker
```

> [!note] 注意事项
> 重启 Docker 会导致所有运行中的容器停止，请在操作前确认影响。

## 相关链接

- [[01 如何保存镜像为新的镜像]]
- [[02 如何搭建私有镜像服务器]]
- [[Kubernetes常见问题]]

---

**返回**: [[Kubernetes]]
