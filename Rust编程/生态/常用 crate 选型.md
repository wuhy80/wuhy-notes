---
tags:
  - Rust
  - crate
  - 生态
  - 选型
created: 2026-10-02
updated: 2026-10-02
status: 初稿
---

# 常用 crate 选型

> [!summary] 一句话理解
> Rust 标准库刻意做得**很小**（没有 HTTP、没有 JSON、没有随机数、没有时间处理），生态靠 crate 补齐。
>
> 选型的原则只有三条：**下载量与维护活跃度、功能边界是否重叠、编译时间成本**。下面按用途给出主流选择与判断依据。

## 1. 按用途选

### 命令行工具

| crate | 定位 | 什么时候选 |
|---|---|---|
| [clap](https://github.com/clap-rs/clap) | 最主流的参数解析，支持 derive | **默认选择**，功能全、文档好 |
| argh | 轻量，Google 出品，derive 风格 | 想减少编译时间和依赖 |
| bpaf | 组合式解析 | 需要复杂/程序化构造参数 |
| indicatif | 进度条 | 长时间任务、批量处理 |
| console | 终端样式、颜色、宽度感知 | 需要跨平台 ANSI 处理 |
| dialoguer | 交互式问答、选择菜单 | 交互式 CLI 向导 |

```rust
use clap::Parser;

/// 一个示例工具
#[derive(Parser)]
#[command(version, about)]
struct Cli {
    /// 输入文件
    #[arg(short, long)]
    input: String,

    /// 详细日志
    #[arg(short, long, action = clap::ArgAction::Count)]
    verbose: u8,
}
```

### 序列化

| crate | 定位 |
|---|---|
| [serde](https://github.com/serde-rs/serde) + `derive` | **事实标准**，几乎所有格式都基于它 |
| serde_json | JSON（最常用） |
| toml | TOML（配置文件首选） |
| serde_yaml **/ serde_yml** | YAML；原 `serde_yaml` 已停止维护，社区分叉是 `serde_yml` |
| ron | Rust 风格的对象表示，适合配置与存档 |
| bincode / postcard | 紧凑二进制；postcard 更适合嵌入式与 no_std |
| prost / quick-protobuf | protobuf |

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct Config {
    name: String,
    #[serde(default)]
    retries: u32,
}
```

> [!note] serde 的取舍
> serde 的 derive 会明显增加编译时间，但它带来的兼容性和生态无可替代。**小工具如果只需要读一个简单 JSON，也可以考虑手写解析或换更轻的库**，但不要为了省编译时间去自己实现序列化框架。

### 异步与网络

| crate | 定位 |
|---|---|
| [tokio](https://github.com/tokio-rs/tokio) | **事实标准异步运行时**（调度 + IO + 定时器 + 同步原语） |
| async-std / smol | 更轻的运行时，生态较小 |
| futures | `Stream`、组合子、`join!` 等基础抽象 |
| hyper | 底层 HTTP/1、HTTP/2 实现（axum/reqwest 的底座） |
| [axum](https://github.com/tokio-rs/axum) | **服务端首选**，Tokio 官方团队维护，tower 中间件生态 |
| actix-web | 老牌高性能 Web 框架，生态成熟 |
| [reqwest](https://github.com/seanmonstar/reqwest) | **客户端首选**，异步/阻塞双模式，支持 TLS、代理、multipart |
| tonic | gRPC（基于 hyper + prost） |

```toml
tokio = { version = "1", features = ["full"] }
axum = "0.7"
reqwest = { version = "0.12", features = ["json", "rustls-tls"] }
```

> [!tip] TLS 后端怎么选
> `native-tls` 用系统 TLS（Windows 上是 SChannel，依赖系统证书库）；`rustls-tls` 是纯 Rust 实现，**交叉编译和容器部署更省事**，不依赖 OpenSSL。生产容器里优先 `rustls`。

### 数据库

| crate | 定位 | 特点 |
|---|---|---|
| [sqlx](https://github.com/launchbadge/sqlx) | **异步、编译期校验 SQL** | 不需要 ORM，SQL 写起来最直接；`query!` 宏可离线校验 |
| diesel | 同步 ORM，类型安全查询构建器 | 成熟稳定，但异步支持较弱、学习曲线陡 |
| sea-orm | 异步 ORM，基于 sqlx | 想要 ORM 抽象又想要异步 |
| rusqlite | SQLite 同步绑定 | 本地单文件库、小工具 |
| redis / deadpool-redis | Redis 客户端 / 连接池 | |

> [!note] 连接池别忘了
> `sqlx` 自带 `Pool`；用 `reqwest`、数据库驱动时，**连接池配置不当是生产事故的常见来源**（连接泄漏、超时叠加）。默认值通常偏大，需要按后端承载能力调。

### 日志与可观测性

| crate | 定位 |
|---|---|
| [tracing](https://github.com/tokio-rs/tracing) + tracing-subscriber | **现代首选**：结构化日志 + span 上下文，异步友好 |
| log + env_logger | 传统 `log` 门面 + 环境变量控制，轻量够用 |
| tracing-opentelemetry | 接入 OTel，做分布式追踪 |
| color-eyre | 人类可读的错误回溯报告 |

```rust
use tracing::{info, instrument};

#[instrument(skip(cfg))]
fn handle(id: u64, cfg: &Config) {
    info!(id, "开始处理");   // 结构化字段，而不是拼字符串
}
```

> [!important] 优先 `tracing` 而不是 `log`
> `tracing` 的 span 能在 `.await` 之间保持上下文，分布式追踪、异步任务里能正确串联日志。`log` 在 async 场景下容易丢上下文。库作者则应该**同时**实现 `tracing` 和 `log` 门面（或在 features 里二选一）。

### 错误处理

| crate | 定位 |
|---|---|
| [thiserror](https://github.com/dtolnay/thiserror) | 库：定义具体错误类型，自动实现 `Error`/`From` |
| [anyhow](https://github.com/dtolnay/anyhow) | 应用：装箱错误 + `.context()` |
| eyre / color-eyre | anyhow 的替代，报告更漂亮 |

详见 [[Rust编程/基础/错误处理|错误处理]]。

### 时间与随机

| crate | 定位 |
|---|---|
| chrono | 老牌日期时间库，功能全，时区处理成熟 |
| time | 更严格、更精简，`no_std` 友好，近年增长快 |
| jiff | 新的时间库，强调正确性（DST、时区规则） |
| rand | 随机数标准选择 |
| uuid | UUID 生成与解析 |

### 文本、集合与并行

| crate | 定位 |
|---|---|
| regex | 正则；**编译一次复用**，别在循环里 `Regex::new` |
| itertools | 迭代器扩展方法（`chunk_by`、`tuple_windows` 等） |
| indexmap | 保持插入顺序的 `HashMap` |
| [rayon](https://github.com/rayon-rs/rayon) | **数据并行**：`into_par_iter()` 一行搞定 |
| dashmap | 分片并发 `HashMap`，替代 `RwLock<HashMap>` |
| walkdir / ignore | 目录遍历；`ignore` 支持 `.gitignore` 语义（ripgrep 用的就是它） |
| globset | 高效的 glob 匹配 |
| tempfile | 临时文件/目录，drop 时自动清理 |
| once_cell | 全局初始化（`std::sync::OnceLock`/`LazyLock` 已在标准库中，可优先用标准库） |

### 测试与质量

| crate | 定位 |
|---|---|
| proptest / quickcheck | 属性测试（生成输入找反例） |
| mockall | mock trait 对象 |
| insta | 快照测试（JSON/文本输出对比） |
| criterion | 统计严谨的基准测试 |
| pretty_assertions | 断言失败时显示彩色 diff |
| assert_cmd / predicates | 命令行工具的端到端测试 |

### 桌面 GUI

见 [[Rust编程/GUI/Rust 在 Windows 上的 GUI 方案选型|Rust 在 Windows 上的 GUI 方案选型]]（Tauri / egui / Slint / iced 等）。

### 其他常见需求

| 需求 | 推荐 |
|---|---|
| 配置文件（多来源合并） | figment / config |
| 环境变量 | dotenvy（开发期加载 `.env`） |
| 文件监听 | notify |
| 压缩 | flate2（gzip）、zstd、xz2 |
| 哈希 | sha2、blake3（更快）、xxhash-rust |
| 加密/TLS | rustls、ring、aes-gcm |
| 图像 | image、fast_image_resize |
| 机器学习 | candle、burn、tch（libtorch 绑定） |
| 嵌入式 | embedded-hal、defmt、heapless |
| WebAssembly | wasm-bindgen、web-sys、wasm-pack |
| Python 互操作 | pyo3 |
| 模拟器/GPU | wgpu、winit |

## 2. 选型原则

> [!important] 三条判断顺序
> 1. **维护活跃度**：最近一次提交时间、是否有人接 issue、是否有安全公告。crates.io 上的"下载量高"不代表"现在还在维护"
> 2. **功能边界**：同一件事只留一个库。同时引入 `chrono` 和 `time`、`reqwest` 和 `hyper` 直连、两个不同的日志门面，都会让依赖树和心智负担翻倍
> 3. **编译时间成本**：`serde` + `tokio full` + `reqwest rustls` + `clap` 四个就把小工具的编译时间推到几十秒。工具型项目可以考虑 `cargo tree -d` 查重复版本、精简 features

几个具体建议：

- **不要选 `*` 版本或长期 0.x 且无人维护的库**：`0.x` 之间不保证兼容
- **优先用标准库已有的能力**：`OnceLock`/`LazyLock`、`std::sync::mpsc`、`std::thread::scope` 已经能覆盖很多场景
- **镜像/代理配置先做好**，否则评估依赖的体验会很差（见 [[Rust编程/工程/Cargo 工作区与依赖管理|Cargo 工作区与依赖管理]]）
- **查文档用 [docs.rs](https://docs.rs/)，找库用 [lib.rs](https://lib.rs/)**：`lib.rs` 的分类和"最近更新"排序比 crates.io 更适合选型

## 3. 三套推荐组合

**命令行小工具**（追求编译快、依赖少）

```toml
[dependencies]
clap = { version = "4", features = ["derive"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
anyhow = "1"
```

**Web 服务**

```toml
[dependencies]
tokio = { version = "1", features = ["macros", "rt-multi-thread", "signal"] }
axum = "0.7"
serde = { version = "1", features = ["derive"] }
sqlx = { version = "0.8", features = ["runtime-tokio", "tls-rustls", "postgres", "macros"] }
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter", "json"] }
thiserror = "2"
anyhow = "1"
```

**系统工具 / 批量处理**

```toml
[dependencies]
clap = { version = "4", features = ["derive"] }
walkdir = "2"
rayon = "1"
indicatif = "0.17"
regex = "1"
anyhow = "1"
```

## 4. 小结

> [!summary] 关键判断
> 1. Rust 标准库小是**设计选择**，生态补齐是常态
> 2. 记住几个"默认答案"：**clap / serde / tokio / axum / reqwest / sqlx / tracing / thiserror+anyhow / rayon**
> 3. 选型看**维护活跃度 > 功能边界 > 编译时间**，不要只看下载量
> 4. 同一件事只留一个库；能用标准库就不加依赖
> 5. 先把**镜像源**配好，再开始评估依赖

## 相关笔记

- [[Rust编程/工程/Cargo 工作区与依赖管理|Cargo 工作区与依赖管理]]
- [[Rust编程/基础/错误处理|错误处理]]
- [[Rust编程/并发/async 与 Tokio 入门|async 与 Tokio 入门]]
- [[Rust编程/GUI/Rust 在 Windows 上的 GUI 方案选型|Rust 在 Windows 上的 GUI 方案选型]]
- [[Rust编程/README|Rust 编程]]
