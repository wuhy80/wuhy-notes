---
🌻日期🌻: 2024-06-05
🌙星期🌙: 星期三
⌚️时间⌚️: 14:23:09
tags:
  - 安全
---
SNAT（源地址网络地址转换）和DNAT（目的地址网络地址转换）是两种常见的网络地址转换（NAT）技术，用于修改数据包的源IP地址和目的IP地址。下面分别介绍如何在Linux上使用 `iptables` 实现SNAT和DNAT。

### 实现SNAT

SNAT主要用于内网主机通过公网IP访问外网时，修改数据包的源IP地址为公网IP。以下是配置SNAT的步骤：

假设你有一个内网（192.168.1.0/24）和一个公网IP（203.0.113.1），你希望内网的流量通过公网IP访问外网。

1. **开启IP转发**：

   ```bash
   echo 1 > /proc/sys/net/ipv4/ip_forward
   ```

   或者在`/etc/sysctl.conf`中添加以下内容，并运行`sysctl -p`：

   ```conf
   net.ipv4.ip_forward = 1
   ```

2. **配置SNAT规则**：

   ```bash
   iptables -t nat -A POSTROUTING -s 192.168.1.0/24 -o eth0 -j SNAT --to-source 203.0.113.1
   ```

   其中，`eth0`是连接到外网的网络接口，`203.0.113.1`是你的公网IP。

### 实现DNAT

DNAT主要用于将外网请求重定向到内网服务器，修改数据包的目的IP地址。例如，将所有访问你的公网IP（203.0.113.1）80端口的请求重定向到内网服务器（192.168.1.100:80）。

1. **开启IP转发**（如果还没有开启，参考SNAT步骤1）。

2. **配置DNAT规则**：

   ```bash
   iptables -t nat -A PREROUTING -d 203.0.113.1 -p tcp --dport 80 -j DNAT --to-destination 192.168.1.100:80
   ```

3. **允许转发流量**：

   确保你有以下规则来允许从内网到外网以及从外网到内网的流量：

   ```bash
   iptables -A FORWARD -i eth0 -o eth1 -p tcp --syn --dport 80 -m conntrack --ctstate NEW -j ACCEPT
   iptables -A FORWARD -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
   ```

   其中，`eth1`是连接到内网的网络接口。

### 完整示例

假设你的内网网段是`192.168.1.0/24`，公网IP是`203.0.113.1`，内网服务器IP是`192.168.1.100`。

```bash
# 开启IP转发
echo 1 > /proc/sys/net/ipv4/ip_forward

# 配置SNAT规则
iptables -t nat -A POSTROUTING -s 192.168.1.0/24 -o eth0 -j SNAT --to-source 203.0.113.1

# 配置DNAT规则
iptables -t nat -A PREROUTING -d 203.0.113.1 -p tcp --dport 80 -j DNAT --to-destination 192.168.1.100:80

# 允许转发流量
iptables -A FORWARD -i eth0 -o eth1 -p tcp --syn --dport 80 -m conntrack --ctstate NEW -j ACCEPT
iptables -A FORWARD -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
```

通过这些配置，内网主机的流量会通过公网IP访问外网，同时外网对公网IP的HTTP请求会被转发到内网服务器。