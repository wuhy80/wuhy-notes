---
🌻日期🌻: 2024-06-12
🌙星期🌙: 星期三
⌚️时间⌚️: 14:53:53
tags: 
---
`ufw` (Uncomplicated Firewall) 是 Ubuntu 系统中的一个简单易用的防火墙工具。下面列出了一些常见的 `ufw` 用法：

### 基本命令

1. **启用 ufw**：
   
   ```sh
   ufw enable
   ```

2. **禁用 ufw**：
   
   ```sh
   ufw disable
   ```

3. **检查 ufw 状态**：
   
   ```sh
   ufw status
   ```
   
   或者查看详细状态：

   ```sh
   ufw status verbose
   ```

4. **重载 ufw 配置**：
   
   ```sh
   ufw reload
   ```

### 配置规则

1. **允许特定端口**：
   
   例如，允许 SSH 端口（22/tcp）：

   ```sh
   ufw allow 22/tcp
   ```

2. **拒绝特定端口**：
   
   例如，拒绝 HTTP 端口（80/tcp）：

   ```sh
   ufw deny 80/tcp
   ```

3. **删除规则**：
   
   例如，删除允许 SSH 端口的规则：

   ```sh
   ufw delete allow 22/tcp
   ```

### 高级用法

1. **允许特定 IP 地址访问特定端口**：
   
   例如，允许 IP 地址 `192.168.1.100` 访问 SSH 端口：

   ```sh
   ufw allow from 192.168.1.100 to any port 22
   ```

2. **允许特定子网访问特定端口**：
   
   例如，允许子网 `192.168.0.0/16` 访问 MySQL 端口（3306）：

   ```sh
   ufw allow from 192.168.0.0/16 to any port 3306
   ```

3. **限制特定端口**：
   
   使用 `limit` 来防止暴力破解（例如 SSH 端口）：

   ```sh
   ufw limit 22/tcp
   ```

4. **允许特定接口上的流量**：
   
   例如，允许 eth0 接口上的 HTTP 流量：

   ```sh
   ufw allow in on eth0 to any port 80
   ```

5. **允许特定协议的流量**：
   
   例如，允许 ICMP（ping）流量：

   ```sh
   ufw allow proto icmp
   ```

### 配置默认策略

1. **设置默认允许入站流量**：
   
   ```sh
   ufw default allow incoming
   ```

2. **设置默认拒绝入站流量**：
   
   ```sh
   ufw default deny incoming
   ```

3. **设置默认允许出站流量**：
   
   ```sh
   ufw default allow outgoing
   ```

4. **设置默认拒绝出站流量**：
   
   ```sh
   ufw default deny outgoing
   ```

### 日志记录

1. **启用日志记录**：
   
   ```sh
   ufw logging on
   ```

2. **设置日志记录级别（off, low, medium, high, full）**：
   
   例如，设置日志记录级别为 `high`：

   ```sh
   ufw logging high
   ```

### 示例脚本

以下是一个示例脚本，用于设置常见的 `ufw` 规则：

```sh
#!/bin/bash

# 启用 ufw
ufw --force enable

# 设置默认策略
ufw default deny incoming
ufw default allow outgoing

# 允许 SSH 端口
ufw allow 22/tcp

# 允许 HTTP 和 HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# 允许基本的 Kubernetes 端口
ufw allow 6443/tcp
ufw allow 2379:2380/tcp
ufw allow 10250/tcp
ufw allow 10251/tcp
ufw allow 10252/tcp
ufw allow 53/tcp
ufw allow 53/udp
ufw allow 8472/udp

# 允许 NodePort 端口范围
ufw allow 30000:32767/tcp

# 允许本地和内部网络流量
ufw allow from 192.168.0.0/16
ufw allow from 10.0.0.0/8
ufw allow from 172.16.0.0/12

# 重载 ufw 使规则生效
ufw reload

# 显示防火墙状态和规则
ufw status verbose
```

通过这些常见用法，你可以有效地管理 Ubuntu 系统上的防火墙规则，并确保你的系统和服务的安全性。

# UFW limit
`ufw limit` 主要用于防止暴力破解攻击，通过限制某个 IP 地址在短时间内的连接次数来实现。这种功能不仅适用于 SSH 端口，也适用于其他可能受到暴力破解攻击的服务。以下是一些 `ufw limit` 的用法示例：

### 常见用法

1. **限制 SSH 端口（22/tcp）**：

   ```sh
   ufw limit 22/tcp
   ```

   防止暴力破解 SSH 密码。

2. **限制 HTTP 端口（80/tcp）**：

   ```sh
   ufw limit 80/tcp
   ```

   防止对 Web 服务器的暴力破解和 DoS 攻击。

3. **限制 HTTPS 端口（443/tcp）**：

   ```sh
   ufw limit 443/tcp
   ```

   防止对 HTTPS 服务的暴力破解和 DoS 攻击。

### 高级用法

1. **限制特定 IP 地址的连接尝试**：

   例如，限制特定 IP 地址 `192.168.1.100` 对 SSH 端口的连接尝试：

   ```sh
   ufw limit from 192.168.1.100 to any port 22/tcp
   ```

2. **限制特定子网的连接尝试**：

   例如，限制子网 `192.168.0.0/16` 对 SSH 端口的连接尝试：

   ```sh
   ufw limit from 192.168.0.0/16 to any port 22/tcp
   ```

3. **限制特定接口的连接尝试**：

   例如，限制 eth0 接口上的 SSH 连接尝试：

   ```sh
   ufw limit in on eth0 to any port 22/tcp
   ```

4. **限制特定协议的连接尝试**：

   例如，限制对 ICMP（ping）的连接尝试：

   ```sh
   ufw limit proto icmp
   ```

### 查看和管理限制规则

1. **查看所有规则**：

   ```sh
   ufw status verbose
   ```

2. **删除限制规则**：

   例如，删除对 SSH 端口的限制规则：

   ```sh
   ufw delete limit 22/tcp
   ```

### 示例脚本

以下是一个示例脚本，用于配置 `ufw limit` 规则以防止暴力破解和 DoS 攻击：

```sh
#!/bin/bash

# 启用 ufw
ufw --force enable

# 限制 SSH 端口
ufw limit 22/tcp

# 限制 HTTP 端口
ufw limit 80/tcp

# 限制 HTTPS 端口
ufw limit 443/tcp

# 限制特定 IP 地址的连接尝试
ufw limit from 192.168.1.100 to any port 22/tcp

# 限制特定子网的连接尝试
ufw limit from 192.168.0.0/16 to any port 22/tcp

# 限制特定接口的连接尝试
ufw limit in on eth0 to any port 22/tcp

# 限制 ICMP 协议的连接尝试
ufw limit proto icmp

# 重载 ufw 使规则生效
ufw reload

# 显示防火墙状态和规则
ufw status verbose
```

### 总结

`ufw limit` 是一个强大的工具，可以有效防止暴力破解和 DoS 攻击。它不仅适用于 SSH 端口，还可以用于其他服务的保护。通过合理配置 `ufw limit` 规则，可以显著提高系统的安全性。