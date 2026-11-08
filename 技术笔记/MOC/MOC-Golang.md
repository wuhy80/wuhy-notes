---
tags:
  - MOC
  - Golang
  - 编程语言
created: 2026-11-08
updated: 2026-11-08
type: MOC
---

# MOC-Golang

> [!abstract] 概述
> Go/Golang 相关笔记 30 篇：`Golang编程/` 25 篇自成体系（网络编程、Gin/GORM、序列化、大模型开发），另有 `技术笔记/数据库/`、`技术笔记/Kubernetes/` 等 10 处散点提及（K8s 生态、数据库中间件的 Go 实现）。目录入口 [[Golang编程/README|Golang 编程 README]] 已有完整分类导航，本 MOC 补跨目录视角与语言对照。

## 笔记索引

### 门户与语言选型

- [[Golang编程/README|Golang 编程 README]] —— 目录中心索引（README 为重名文件名，用全路径）
- [[Rust 和 Go 的区别与使用建议]] —— 内存模型、并发、错误处理与工程成本对比

### 基础与环境（`Golang编程/安装配置/`、`基本信息/`）

- [[00 设置代理]]、[[01 配置文件读取方式]]、[[如何进行引用]]

### 网络编程（`Golang编程/网络/`）

- [[UDP通讯]]、[[FTP通信]]、[[网络包解析]]、[[如何实现一个SSH的代理]]、[[如何获取Windows上或者Linux上某个端口被占用的进程信息]]

### Web 框架与数据（`Golang编程/GIN/`、`GORM/`）

- [[中间件]]、[[Swagger使用注意]]、[[如何防止DOS攻击]]、[[如何重置数据库]]

### 数据与系统（`Golang编程/序列化/`、`文件/`、`文字处理/`、`日志/`）

- JSON/GOB 序列化、[[XML解析]]、字符编码转换、[[logrus如何使用]]

### 大模型开发（`Golang编程/大模型开发/`，Agent 的 Go 路线）

- [[AI Agent]]、[[如何实现Function Call]] —— 不依赖 Python 生态的 Agent 实现

### 课程与资料

- `课程笔记/深入学习Go语言/`（含 [[Go学习路径]]）、[[Golang tutorial series]]（`Golang编程/在线资料/`）

### 跨目录关联

- `技术笔记/Kubernetes/源码分析/` —— K8s 生态即 Go 项目的源码阅读
- `技术笔记/数据库/` 的 B+ 树笔记 —— [[B+树详解与Go实现]] 在算法目录，数据库侧可对照
- `Rust编程/` —— 与 Go 的语言对照散见 [[Rust 和 Go 的区别与使用建议]] 与 Rust 目录 README

## 待补链建议

> [!note] 口径说明
> 以下文件有 Go 相关内容，但没有出链进入 `Golang编程/` 体系。仅建议，不代改。

- 技术笔记/数据库/B树深入解析：扇出与其他索引结构.md —— 可与 [[B+树详解与Go实现]] 互链
- 技术笔记/Kubernetes/源码分析 子目录 —— 未链 [[如何进行引用]]（Go 工程规范）
- 技术笔记/Linux/安全相关 相关笔记 —— 提及 Go 工具链未链 Golang 目录
- Rust编程/并发/ 的 async 笔记 —— 可与 [[Rust 和 Go 的区别与使用建议]] 双向对照
- 网址收藏/编程语言.md —— Go 资源收藏未链 [[Golang编程/README|Golang 编程 README]]

## 相关实体

- [[MOC-Rust]]、[[MOC-Agent]]（Go 实现 Agent）、[[MOC-Kubernetes与Docker]]、[[MOC-Linux]]（网络编程）
