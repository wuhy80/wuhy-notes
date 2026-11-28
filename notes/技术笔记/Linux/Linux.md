---
tags:
  - Linux
  - 运维
  - 操作系统
created: 2026-10-15
updated: 2026-10-15
status: 入口
---

# Linux 技术笔记

Linux 系统运维、网络配置、性能调优与终端工具箱资料总览。

## 专题目录

- `Ubuntu/`：Ubuntu 系统网卡、默认网关与日志排查。
- `系统服务/`：Systemd 守护进程单元编写与生命周期管理。
- `文件处理/`：磁盘定位、日志自动轮转（logrotate）与软件 RAID。
- `网络与安全/`：策略路由、SNAT/DNAT 转发、BPF 规则与网络请求调试。
- `性能优化/`：Brendan Gregg 性能调优全景图与磁盘 I/O 分析。
- `终端工具/`：Zsh、Screen、PuTTY 与 Linux 文本流命令。

---

## 快速入口

### 系统基础与 Ubuntu 配置

- [[技术笔记/Linux/Ubuntu技巧|Ubuntu 技巧]] —— 常用系统命令、APT 源管理与系统配置
- [[技术笔记/Linux/一些技巧|一些实用技巧]] —— 日常 Linux 操作提效小窍门
- [[技术笔记/Linux/Ubuntu/网络处理/网卡配置|Ubuntu 网卡配置]] —— Netplan 与网卡静态/动态 IP 设置
- [[技术笔记/Linux/Ubuntu/网络处理/网关配置|Ubuntu 网关配置]] —— 多网卡与默认网关路由
- [[技术笔记/Linux/Ubuntu/日志处理/轮转记录|Ubuntu 日志轮转记录]] —— 系统日志与排查记录

### 系统服务与进程管理

- [[技术笔记/Linux/系统服务/Systemd详解|Systemd 详解]] —— Service 编写、开机自启、依赖控制与守护进程管理
- [[技术笔记/Linux/syslog说明|Syslog 说明]] —— 系统日志架构与 rsyslog 采集机制

### 网络通信与安全过滤

- [[技术笔记/Linux/网络配置/路由配置|路由配置]] —— 静态路由、策略路由与 ip route 详解
- [[技术笔记/Linux/安全相关/如何实现SNAT和DNAT|SNAT 与 DNAT 实现]] —— iptables 地址伪装与端口转发
- [[技术笔记/Linux/安全相关/BPF过滤|BPF 过滤]] —— Berkeley Packet Filter 抓包过滤规则
- [[技术笔记/Linux/CURL使用技巧|CURL 使用技巧]] —— 常用网络请求、文件传输与接口调试

### 磁盘存储与文件系统

- [[技术笔记/Linux/文件处理/如何找到磁盘占用|如何查找磁盘占用]] —— du / df 高效定位空间占满问题
- [[技术笔记/Linux/文件处理/日志轮转|Logrotate 日志轮转]] —— 自动切割、压缩与清理业务日志
- [[技术笔记/Linux/LVM资料|LVM 逻辑卷管理]] —— PV、VG、LV 创建扩容与快照
- [[技术笔记/Linux/文件处理/软件RAID|软件 RAID 配置]] —— mdadm 阵列构建与冗余存储
- [[技术笔记/Linux/99 磁盘性能分析|磁盘性能分析]] —— iostat 与存储 I/O 瓶颈定位

### 性能调优与脚本工程

- [[技术笔记/Linux/性能优化/性能调优的9张图|Linux 性能调优 9 张图]] —— Brendan Gregg 性能观测与瓶颈全景图
- [[技术笔记/Linux/Makefile|Makefile 实操]] —— 编译构建脚本与规则编写
- [[技术笔记/Linux/Shell使用/Shell的技巧|Shell 脚本技巧]] —— 管道、文本截取与自动化脚本

### 终端工具与环境定制

- [[技术笔记/Linux/终端工具/终端工具说明|主流终端工具说明]] —— 现代终端环境全景介绍
- [[技术笔记/Linux/终端工具/Zsh配置|Zsh 与 Oh-My-Zsh 配置]] —— 插件增强与主题定制
- [[技术笔记/Linux/终端工具/Screen使用|Screen 会话保持]] —— 后台任务保持与断线重连
- [[技术笔记/Linux/终端工具/Putty使用|PuTTY 使用说明]] —— Windows 下轻量 SSH 客户端技巧
- [[技术笔记/Linux/终端工具/排序操作|终端排序操作]] —— sort、uniq 文本行统计分析
