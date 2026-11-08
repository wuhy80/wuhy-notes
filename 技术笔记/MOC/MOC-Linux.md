---
tags:
  - MOC
  - Linux
  - 操作系统
created: 2026-11-08
updated: 2026-11-08
type: MOC
---

# MOC-Linux

> [!abstract] 概述
> Linux 直接相关 120+ 篇，但分两种性质：`技术笔记/Linux/` 25 篇是系统学习阵地（Ubuntu、Shell、系统服务、安全、性能），而 `大模型/10-新闻/` 的 75 篇提及多为「Linux 基金会/内核动态」类新闻噪声。本 MOC 只收真实学习与实践内容，新闻侧仅作趋势入口。另有 `技术笔记/Windows/`、`TCP_IP/` 作为操作系统知识的外围。

## 笔记索引

### 门户

- `README` 为重名文件名（全库 7 份），Linux 目录入口需用全路径 `[[技术笔记/Linux/README|Linux 目录说明]]`

### 基础与 Shell（`技术笔记/Linux/` 根）

- [[99 磁盘性能分析]]、[[LVM资料]]、[[Makefile]]、[[CURL使用技巧]]
- [[Ubuntu技巧]]、[[syslog说明]]、[[一些技巧]]
- `Shell使用/` 子目录 —— 脚本与命令行

### Ubuntu 专题（`技术笔记/Linux/Ubuntu/`）

- `网络处理/`、`日志处理/` 子目录 —— 网络排查与日志定位

### 系统管理子目录

- `系统服务/` —— systemd 服务管理
- `性能优化/` —— 性能调优
- `文件处理/` —— 文本与文件操作
- `网络配置/` —— 网络栈配置
- `终端工具/` —— tmux 等终端效率工具
- `安全相关/` —— 加固与权限

### 操作系统外围

- `技术笔记/TCP_IP/` —— 协议层两篇
- `技术笔记/Windows/` —— Windows 系统服务、终端工具、网络安全（跨平台对照）
- `Golang编程/网络/` —— Go 语言视角的网络编程（抓包、SSH 代理）

### 新闻与生态趋势

- [[00-新闻索引]] —— 开源生态/Linux 基金会动态见各月早报

## 待补链建议

> [!note] 口径说明
> 以下文件有实质 Linux 内容，但没有出链进入 `技术笔记/Linux/` 体系。仅建议，不代改。

- 技术笔记/Kubernetes/Kubelet分析 子目录 —— K8s 节点排障依赖 Linux 知识，可链 [[99 磁盘性能分析]]
- 技术笔记/Kubernetes/如何查看底层的文件系统路径.md —— 可链 [[LVM资料]]
- 技术笔记/数据库/Mysql/Mysql高可用.md —— 部署在 Linux 上的服务排障可链 `Ubuntu/日志处理` 子目录
- Golang编程/网络/如何获取Windows上或者Linux上某个端口被占用的进程信息.md —— 可链 [[CURL使用技巧]] 同目录的网络排查体系
- 技术笔记/物联网/EMQX 相关笔记 —— EMQX 部署运维未链 Linux 目录
- 网址收藏/操作系统.md —— 收藏页未链 [[技术笔记/Linux/README|Linux 目录说明]]

## 相关实体

- [[MOC-Kubernetes与Docker]]、[[MOC-Golang]]（网络编程）、[[MOC-算法与LeetCode]]（刷题环境）、[[MOC-Python]]
