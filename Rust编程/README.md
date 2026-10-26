---
tags:
  - Rust
  - 编程
created: 2026-06-06
updated: 2026-10-02
status: 入口
---

# Rust 编程

Rust 相关资料整理入口。从**所有权模型**入手，再往并发、工程、生态、FFI 与性能展开。

## 目录

- `基础/`：所有权与借用、生命周期、Trait 与泛型、错误处理、智能指针、迭代器与闭包、借用检查器排错清单——Rust 的核心心智模型。
- `并发/`：`Send`/`Sync` 线程安全标记、`async` 与 Tokio 运行时。
- `工程/`：Cargo 工作区与依赖管理、测试与基准测试。
- `生态/`：crate 选型、serde、clap、reqwest、sqlx。
- `性能/`：性能优化方法、`unsafe` 的正确用法。
- `FFI/`：与 C 互操作、调用 Windows API（windows-rs）。
- `GUI/`：桌面与窗口界面方案选型。
- `在线资料/`：官方书、进阶材料、工具链、社区与学习路径。

## 快速入口

### 基础

- [[Rust编程/基础/所有权与借用|所有权与借用]] —— 唯一所有者、借用规则、移动/Copy/Clone
- [[Rust编程/基础/生命周期|生命周期]] —— 标注只是约束、省略规则、`'static` 的两种含义
- [[Rust编程/基础/Trait 与泛型|Trait 与泛型]] —— 接口设计、单态化、`impl Trait` 与 `dyn Trait`
- [[Rust编程/基础/错误处理|错误处理]] —— `Result`/`?`、thiserror 与 anyhow 的分工
- [[Rust编程/基础/智能指针|智能指针]] —— `Box`/`Rc`/`Arc`/`RefCell`/`Weak` 怎么选
- [[Rust编程/基础/迭代器与闭包|迭代器与闭包]] —— 惰性求值、三种迭代形式、`Fn`/`FnMut`/`FnOnce`
- [[Rust编程/基础/借用检查器常见错误清单|借用检查器常见错误清单]] —— **排错手册**：按错误码查症状、原因与修法

### 并发

- [[Rust编程/并发/Send 与 Sync|Send 与 Sync]] —— 类型级线程安全护栏、数据竞争 vs 竞态条件
- [[Rust编程/并发/async 与 Tokio 入门|async 与 Tokio 入门]] —— Future 状态机、运行时、三个高频坑

### 工程与生态

- [[Rust编程/工程/Cargo 工作区与依赖管理|Cargo 工作区与依赖管理]] —— 版本语义、workspace、features、镜像源
- [[Rust编程/工程/测试与基准测试|测试与基准测试]] —— 单元/集成/文档测试、criterion、覆盖率
- [[Rust编程/生态/常用 crate 选型|常用 crate 选型]] —— 按用途的主流选择与选型原则
- [[Rust编程/生态/serde 序列化|serde 序列化]] —— 属性、枚举表示、零拷贝、兼容策略
- [[Rust编程/生态/clap 命令行|clap 命令行]] —— derive 风格、子命令、校验、补全
- [[Rust编程/生态/reqwest 与 HTTP 客户端|reqwest 与 HTTP 客户端]] —— Client 复用、超时、重试、流式下载
- [[Rust编程/生态/sqlx 与数据库|sqlx 与数据库]] —— 连接池、编译期校验、事务、迁移

### 性能与 FFI

- [[Rust编程/性能/性能优化|性能优化]] —— 先测量、分配/IO/锁三大战场、反模式清单
- [[Rust编程/性能/unsafe 的正确用法|unsafe 的正确用法]] —— 解锁的五项能力、UB 清单、安全抽象、Miri
- [[Rust编程/FFI/与 C 互操作|与 C 互操作]] —— `extern "C"`、`repr(C)`、字符串、所有权约定
- [[Rust编程/FFI/调用 Windows API（windows-rs）|调用 Windows API（windows-rs）]] —— 宽字符串、HRESULT、COM、句柄

### 其他

- [[Rust编程/GUI/Rust 在 Windows 上的 GUI 方案选型|Rust 在 Windows 上的 GUI 方案选型]] —— Tauri / egui / Slint / iced / windows-rs
- [[Rust编程/在线资料/学习路径与资料|学习路径与资料]] —— 官方与进阶资料、工具链、常见误区

## 建议阅读顺序

```text
所有权与借用 → 生命周期 → Trait 与泛型 → 错误处理 → 智能指针 → 迭代器与闭包
      ↓
Send 与 Sync → async 与 Tokio 入门
      ↓
Cargo 工作区 → 测试与基准测试 → 常用 crate 选型
      ↓
serde / clap / reqwest / sqlx（按需）
      ↓
性能优化 → unsafe → FFI / windows-rs → GUI / 领域深入
```

> [!tip] 如果只有时间读两篇
> 先读 [[Rust编程/基础/所有权与借用|所有权与借用]] 和 [[Rust编程/基础/错误处理|错误处理]]。前者是 Rust 与其他语言最大的差异，后者决定了你的代码在真实项目里能不能维护。

> [!note] 卡在编译错误时
> 直接查 [[Rust编程/基础/借用检查器常见错误清单|借用检查器常见错误清单]]。它按错误码组织，给出的修法按“改设计 → 缩短作用域 → 改借用 → 用标准库工具 → `clone` → `Rc<RefCell>`”的顺序排列，**不要第一反应就 `clone()`**。

## 学习与参考

- 官方教材：[The Rust Programming Language](https://doc.rust-lang.org/book/)（[中文版](https://kaisery.github.io/trpl-zh-cn/)）
- 练习：[Rustlings](https://github.com/rust-lang/rustlings)
- 查 API：[docs.rs](https://docs.rs/) · 选库：[lib.rs](https://lib.rs/)
- 进阶：[[Rust编程/在线资料/学习路径与资料|学习路径与资料]]

## 相关

- [[编程语言/Rust 和 Go 的区别与使用建议|Rust 和 Go 的区别与使用建议]] —— 语言取舍
- [[Golang编程/README|Golang 编程]] —— 对照参考
