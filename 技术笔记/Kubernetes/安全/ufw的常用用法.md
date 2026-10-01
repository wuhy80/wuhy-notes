---
🌻日期🌻: 2024-06-12
🌙星期🌙: 星期三
⌚️时间⌚️: 14:53:53
tags:
  - linux
  - 安全
  - 防火墙
  - ufw
  - ubuntu
  - 网络安全
---

# UFW 常用用法指南

> [!abstract] 概述
> UFW (Uncomplicated Firewall) 是 Ubuntu 系统中简单易用的防火墙工具。本文档详细介绍了 ufw 的基本命令、规则配置、高级用法以及在 [[防火墙配置|Kubernetes 环境]]中的应用。

## 基本命令

### 启用和禁用

```bash
# 启用 ufw
ufw enable

# 禁用 ufw
ufw disable
```

### 查看状态

```bash
# 检查 ufw 状态
ufw status

# 查看详细状态
ufw status verbose
```

### 重载配置

```bash
# 重载 ufw 配置
ufw reload
```

## 配置规则

### 允许端口

```bash
# 允许 SSH 端口（22/tcp）
ufw allow 22/tcp

# 允许 HTTP 端口
ufw allow 80/tcp

# 允许 HTTPS 端口
ufw allow 443/tcp
```

### 拒绝端口

```bash
# 拒绝 HTTP 端口（80/tcp）
ufw deny 80/tcp
```

### 删除规则

```bash
# 删除允许 SSH 端口的规则
ufw delete allow 22/tcp
```

## 高级用法

### 基于 IP 地址的规则

> [!tip] IP 白名单
> 可以限制特定 IP 地址或子网访问特定端口，提高安全性。

**允许特定 IP 地址访问特定端口：**

```bash
# 允许 IP 地址 192.168.1.100 访问 SSH 端口
ufw allow from 192.168.1.100 to any port 22
```

**允许特定子网访问特定端口：**

```bash
# 允许子网 192.168.0.0/16 访问 MySQL 端口（3306）
ufw allow from 192.168.0.0/16 to any port 3306
```

### 基于接口的规则

```bash
# 允许 eth0 接口上的 HTTP 流量
ufw allow in on eth0 to any port 80
```

### 允许特定协议

```bash
# 允许 ICMP（ping）流量
ufw allow proto icmp
```

## 默认策略配置

> [!important] 安全建议
> 建议将默认入站策略设置为拒绝，仅开放必要的端口。

```bash
# 设置默认拒绝入站流量（推荐）
ufw default deny incoming

# 设置默认允许出站流量
ufw default allow outgoing

# 设置默认允许入站流量（不推荐）
ufw default allow incoming

# 设置默认拒绝出站流量
ufw default deny outgoing
```

## 日志记录

```bash
# 启用日志记录
ufw logging on

# 设置日志记录级别（off, low, medium, high, full）
ufw logging high
```

## Kubernetes 防火墙配置脚本

> [!example] 完整示例
> 以下脚本只展示基本顺序和来源限制；CNI、Pod CIDR、Service 暴露方式不同，完整规则参见 [[防火墙配置]]。

```bash
#!/bin/bash

ADMIN_CIDR="192.0.2.0/24"
NODE_CIDR="10.0.0.0/24"
CONTROL_PLANE_CIDR="10.0.0.0/28"

# 设置默认策略
ufw default deny incoming
ufw default allow outgoing

# 必须先允许管理入口
ufw allow from "$ADMIN_CIDR" to any port 22 proto tcp

# Kubernetes 基本通信；替换为实际网段
ufw allow from "$NODE_CIDR" to any port 6443 proto tcp
ufw allow from "$CONTROL_PLANE_CIDR" to any port 2379:2380 proto tcp
ufw allow from "$CONTROL_PLANE_CIDR" to any port 10250 proto tcp

# 仅在使用 Flannel VXLAN 时需要
ufw allow from "$NODE_CIDR" to any port 8472 proto udp

# 检查无误后再启用
ufw show added
ufw --force enable

# 显示防火墙状态和规则
ufw status verbose
```

---

# UFW Limit 功能

> [!abstract] 概述
> `ufw limit` 适合降低 SSH 等 TCP 登录服务的暴力尝试频率。它使用固定的简单阈值，不是通用限流器，也不能替代反向代理、WAF 或 DDoS 防护。

## 常见用法

> [!warning] 防暴力破解
> 使用 `limit` 可以降低 SSH 密码或密钥猜测频率，但仍应优先使用密钥认证、禁用 root 密码登录并限制来源地址。

### 限制常用端口

```bash
# 限制 SSH 端口（22/tcp）- 防止暴力破解 SSH 密码
ufw limit 22/tcp

# 不建议对正常 HTTP/HTTPS 流量直接使用 ufw limit，容易误伤浏览器并发连接
```

## Limit 高级用法

### 限制特定 IP 地址

```bash
# 限制特定 IP 地址 192.168.1.100 对 SSH 端口的连接尝试
ufw limit from 192.168.1.100 to any port 22 proto tcp
```

### 限制特定子网

```bash
# 限制子网 192.168.0.0/16 对 SSH 端口的连接尝试
ufw limit from 192.168.0.0/16 to any port 22 proto tcp
```

### 限制特定接口

```bash
# 限制 eth0 接口上的 SSH 连接尝试
ufw limit in on eth0 to any port 22/tcp
```

`ufw limit` 面向 TCP 新连接，不支持用 `ufw limit proto icmp` 限制 ping。ICMP 策略需要在 UFW 的底层规则中单独设计，并保留路径 MTU、IPv6 邻居发现等必要 ICMP 类型。

## 管理 Limit 规则

### 查看规则

```bash
ufw status verbose
```

### 删除 Limit 规则

```bash
# 删除对 SSH 端口的限制规则
ufw delete limit 22/tcp
```

## 防暴力破解配置脚本

> [!example] 完整示例
> 以下脚本用于限制 SSH 新连接频率，不是 HTTP DoS 防护脚本。

```bash
#!/bin/bash

ADMIN_CIDR="192.0.2.0/24"

# 先添加管理规则
ufw limit from "$ADMIN_CIDR" to any port 22 proto tcp

# 限制特定 IP 地址的连接尝试
ufw limit from 192.168.1.100 to any port 22 proto tcp

# 限制特定子网的连接尝试
ufw limit from 192.168.0.0/16 to any port 22 proto tcp

# 限制特定接口的连接尝试
ufw limit in on eth0 to any port 22/tcp

# 检查后再启用或重载
ufw show added
ufw --force enable

# 显示防火墙状态和规则
ufw status verbose
```

## 总结

> [!success] 最佳实践
> - `ufw limit` 是防止暴力破解和 DoS 攻击的强大工具
> - 不仅适用于 SSH 端口，还可用于其他服务的保护
> - 合理配置 `ufw limit` 规则可显著提高系统安全性
> - 建议对所有对外暴露的服务端口启用 limit 功能

## 相关文档

- [[开启防火墙]] - Kubernetes 防火墙端口详解
- [[防火墙配置]] - Kubernetes 防火墙详细配置

---

**返回**: [[Kubernetes]]
