---
🌻日期🌻: 2024-08-02
🌙星期🌙: 星期五
⌚️时间⌚️: 15:40:13
tags:
  - kubernetes
  - k3s
  - 轻量级
  - 部署
---

# K3S 部署指南

> [!abstract] 概述
> K3S 是 Rancher 推出的轻量级 Kubernetes 发行版，适合边缘计算、IoT 和资源受限环境。本文介绍如何快速部署 K3S 集群并配置私有镜像仓库。

## 官方文档

- [K3S 快速入门指南](https://docs.rancher.cn/docs/k3s/quick-start/_index/)

## 快速安装

### 安装 Master 节点

安装脚本具有 root 权限，生产环境不要未经检查就直接 pipe 到 shell。先下载脚本、核对发布版本和官方校验值，再执行；同时固定 K3S 版本，避免节点因 `latest` 漂移：

```bash
# 示例：固定版本（请按实际兼容版本替换）
export INSTALL_K3S_VERSION="v1.30.6+k3s1"
curl -fL https://rancher-mirror.rancher.cn/k3s/k3s-install.sh -o /tmp/k3s-install.sh
# 将下面的 SHA256 与对应 K3s release 的校验值比对后再执行
sha256sum /tmp/k3s-install.sh
chmod 700 /tmp/k3s-install.sh
INSTALL_K3S_VERSION="$INSTALL_K3S_VERSION" INSTALL_K3S_MIRROR=cn sh /tmp/k3s-install.sh
```

### 添加 Worker 节点

在其他节点上执行以下命令加入集群：

```bash
# 在每个工作节点上使用同样的固定版本；K3S_TOKEN 属于敏感凭据，不要提交到仓库
curl -fL https://rancher-mirror.rancher.cn/k3s/k3s-install.sh -o /tmp/k3s-install.sh
chmod 700 /tmp/k3s-install.sh
INSTALL_K3S_VERSION="v1.30.6+k3s1" K3S_URL=https://myserver:6443 K3S_TOKEN='<从 server/node-token 读取>' sh /tmp/k3s-install.sh
```

> [!tip] 获取 Token
> Master 节点的 Token 存储在 `/var/lib/rancher/k3s/server/node-token` 文件中。

## 配置私有镜像仓库

### 修改 K3S 服务配置

优先通过 `/etc/rancher/k3s/registries.yaml` 配置 HTTPS 仓库。只有在隔离的临时实验环境中才使用明文 HTTP，并明确设置 `tls.insecure_skip_verify`；不要把 `--insecure-registry` 当作生产配置。

```ini
ExecStart=/usr/local/bin/k3s server --pause-image=192.0.2.90/library/pause:3.7
```

### 配置镜像仓库

编辑 `/etc/rancher/k3s/registries.yaml` 配置私有仓库信息：

```yaml
mirrors:
  192.0.2.90:
    endpoint:
      - "https://192.0.2.90"
  docker.io:
    endpoint:
      - "https://192.0.2.90"
```

> [!warning] 明文仓库边界
> 如实验环境只能使用 HTTP，请在对应镜像条目下显式配置 `tls: { insecure_skip_verify: true }`，并用防火墙限制来源；HTTP 会暴露镜像内容和凭据，不能用于生产。

> [!warning] 注意事项
> - 修改服务配置后需要执行 `systemctl daemon-reload && systemctl restart k3s`
> - 确保私有仓库地址在所有节点上可访问
> - 只有将 Registry 配置为 Docker Hub 的 pull-through cache 时，才可把 `docker.io` 指向该 endpoint；普通私有 Registry 应删除该条目，并使用完整的私有镜像地址。

## 相关链接

- [[Kubernetes常见问题]] - K8S 常见问题汇总
- [[如何部署K3S]] - K3S 部署详细步骤
- [[Docker]] - Docker 相关配置

**返回**: [[Kubernetes]]
