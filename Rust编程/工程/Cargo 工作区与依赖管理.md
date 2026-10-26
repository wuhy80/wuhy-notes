---
tags:
  - Rust
  - Cargo
  - 工程
  - 依赖管理
created: 2026-10-02
updated: 2026-10-02
status: 初稿
---

# Cargo 工作区与依赖管理

> [!summary] 一句话理解
> Cargo 同时是**构建工具 + 依赖管理器 + 测试运行器 + 发布工具**。它做得比多数语言的包管理器更完整，所以 Rust 项目基本不需要额外搭构建系统。
>
> 这一篇集中在三件事：**依赖版本怎么控制、多 crate 怎么用工作区组织、编译怎么提速**。

## 1. `Cargo.toml` 的结构

```toml
[package]
name = "my-tool"
version = "0.1.0"
edition = "2021"          # 2021 / 2024；edition 是"语法版本"，不是编译器版本
rust-version = "1.75"     # 声明最低支持的 Rust 版本（MSRV）
authors = ["wuhy80"]
license = "MIT"
description = "一句话说明"
repository = "https://github.com/..."

[dependencies]
serde = { version = "1", features = ["derive"] }

[dev-dependencies]        # 只在 test / example / bench 时编译
pretty_assertions = "1"

[build-dependencies]      # 只在 build.rs 里可用
cc = "1"

[features]
default = ["json"]
json = ["dep:serde_json", "serde"]
```

四类依赖的边界要分清：**`dependencies` 进产物，`dev-dependencies` 不进产物，`build-dependencies` 只在构建脚本里用**。

## 2. 版本号语义

Cargo 默认用 **caret（`^`）**，而不是锁定：

| 写法 | 实际范围 | 说明 |
|---|---|---|
| `"1.2.3"` | `>=1.2.3, <2.0.0` | 默认，等价于 `^1.2.3` |
| `"0.2.3"` | `>=0.2.3, <0.3.0` | **0.x 特殊**：次版本号视为不兼容变更 |
| `"0.0.3"` | `>=0.0.3, <0.0.4` | 0.0.x 更严格 |
| `"~1.2.3"` | `>=1.2.3, <1.3.0` | 只接受补丁级更新 |
| `"=1.2.3"` | 精确锁定 | 极少用，会阻碍依赖消解 |
| `"*"` | 任意版本 | **不要用**，CI 不可复现 |

> [!warning] 0.x 版本的坑
> `0.2.3` 到 `0.3.0` 在 semver 里算**破坏性变更**，所以 `"0.2"` 不会自动升到 `0.3`。这不是 Cargo 的问题，而是 semver 对 0.x 的约定。生态里大量 crate 长期停在 0.x，升级时要读 changelog。

### `Cargo.lock` 要不要提交

| 项目类型 | 建议 |
|---|---|
| 二进制 / 应用 / 服务 | **必须提交**，保证构建可复现 |
| 库 | 提交（有利于 CI 复现），但**发布到 crates.io 时不会生效**，下游用自己的锁文件 |

现代实践的共识是：**默认就提交 `Cargo.lock`**，它只是锁定版本、不锁定源码。

## 3. 工作区（workspace）

把一个项目拆成多个 crate 时，用工作区统一管理依赖与 `target/`：

```toml
# 根 Cargo.toml
[workspace]
resolver = "2"
members = ["crates/*", "tools/cli"]
exclude = ["experiments"]

[workspace.dependencies]
serde = { version = "1", features = ["derive"] }
tokio = { version = "1", features = ["full"] }
my-core = { path = "crates/core" }

[workspace.package]
version = "0.1.0"
edition = "2021"
license = "MIT"
```

各成员复用：

```toml
# crates/cli/Cargo.toml
[package]
name = "my-cli"
version.workspace = true
edition.workspace = true

[dependencies]
serde.workspace = true
my-core.workspace = true
```

好处：

- **一份 `Cargo.lock`、一个 `target/`**：依赖版本全局一致，不会出现同一 crate 被编译多次
- **统一版本号与元数据**：`version.workspace = true` 避免多处手改
- **`cargo test --workspace`** 一条命令跑全部

> [!tip] 什么时候该上工作区
> 当你想“既能作为库被引用，又能作为命令行工具运行”，或者一个项目里有多个可执行文件、多个可复用模块时。单个 crate 够用就别提前拆——工作区会略微增加构建配置的心智负担。

## 4. Features：条件编译与可选依赖

```toml
[features]
default = ["json"]                 # 默认开启
json = ["dep:serde_json"]          # 开启 json 就启用这个可选依赖
full = ["json", "metrics"]         # 组合
metrics = []
```

```toml
[dependencies]
serde_json = { version = "1", optional = true }
```

代码里用属性门控：

```rust
#[cfg(feature = "json")]
pub fn to_json(&self) -> String { ... }
```

三个必须知道的性质：

1. **feature 是加法，不是减法**：Cargo 会把依赖图里所有请求的 feature **取并集**，你无法“关掉”别人开启的 feature
2. `dep:` 语法（Rust 1.60+）可以避免“可选依赖自动变成同名 feature”的隐式行为，**推荐显式写**
3. `default-features = false` 可以关掉别人的默认集，但要注意对方可能把必需能力放在 default 里

> [!warning] feature 并集导致的意外
> 你的 crate 在本地测试时 `json` 没开，编译通过；下游某个依赖开了 `json`，于是**你的代码在 `#[cfg(feature = "json")]` 分支里被编译**，可能暴露编译错误或行为差异。所以 CI 里应该跑几组 feature 组合：**默认、`--no-default-features`、`--all-features`**。

## 5. 发布配置与体积优化

```toml
[profile.release]
opt-level = 3
lto = "thin"           # "fat"/true 更小更慢；"thin" 是常用折中
codegen-units = 1      # 单编译单元，优化更充分
panic = "abort"        # ⚠️ 会禁用 catch_unwind
strip = "symbols"      # 去掉符号表，显著减小体积
incremental = false

[profile.dev]
opt-level = 0

# 经典技巧：只优化依赖，不优化自己的代码 → 开发编译快 + 运行时不太慢
[profile.dev.package."*"]
opt-level = 2
```

> [!note] `panic = "abort"` 的代价
> 它会让 `catch_unwind` 失效、也无法在 panic 时展开栈做清理。长驻服务、需要优雅降级的程序慎用。

## 6. 常用命令速查

| 命令 | 作用 |
|---|---|
| `cargo check` | 只做类型检查，**比 build 快得多**，日常首选 |
| `cargo build --release` | 优化构建 |
| `cargo run -- args` | 编译并运行 |
| `cargo test --workspace` | 跑全部测试 |
| `cargo add serde --features derive` | 加依赖并自动选版本 |
| `cargo remove serde` | 删依赖 |
| `cargo update` | 在 semver 范围内升级，**不改 `Cargo.toml`** |
| `cargo update -p foo --precise 1.2.3` | 精确升到某个版本 |
| `cargo tree` | 看依赖树 |
| `cargo tree -d` | **只看重复依赖**（同一 crate 多个版本） |
| `cargo tree -i serde` | 反向查：谁依赖了 serde |
| `cargo tree -e features` | 看 feature 是怎么被开启的 |
| `cargo doc --open --no-deps` | 生成本项目文档 |
| `cargo clippy --all-targets -- -D warnings` | 静态检查，CI 必备 |
| `cargo fmt` | 格式化 |
| `cargo clean` | 清掉 `target/` |

`cargo tree -d` 值得单独记：**同一个 crate 出现多个大版本会显著拖长编译时间、增大体积**，是排查依赖问题的第一入口。

## 7. 国内镜像源（编译提速关键）

放在 `~/.cargo/config.toml`（全局）或项目 `.cargo/config.toml`：

```toml
[source.crates-io]
replace-with = "rsproxy-sparse"

[source.rsproxy]
registry = "https://rsproxy.cn/crates.io-index"

[source.rsproxy-sparse]
registry = "sparse+https://rsproxy.cn/index/"

[registries.rsproxy]
index = "https://rsproxy.cn/crates.io-index"

[net]
git-fetch-with-cli = true
```

备选镜像（把上面的 URL 换掉即可）：

| 镜像 | sparse 地址 |
|---|---|
| rsproxy（字节） | `sparse+https://rsproxy.cn/index/` |
| 中科大 | `sparse+https://mirrors.ustc.edu.cn/crates.io-index/` |
| 清华 TUNA | `sparse+https://mirrors.tuna.tsinghua.edu.cn/crates.io-index/` |

> [!tip] 为什么用 sparse 协议
> 老的 git index 要把整个索引仓库 clone 下来，首次极慢。**sparse 协议只按需拉取单个 crate 的元数据**，国内环境下差别非常明显（几分钟 → 几秒）。

## 8. 编译加速与检查工具

| 工具 | 用途 |
|---|---|
| `sccache` | 编译缓存，跨项目复用；配合 `RUSTC_WRAPPER=sccache` |
| `mold` / `lld` | 更快的链接器（Linux 上收益最大） |
| `cargo-nextest` | 更快的测试运行器，输出更清晰，支持重试与分片 |
| `cargo-watch` | `cargo watch -x check -x test`，改文件即跑 |
| `cargo-expand` | 展开宏，看 `derive` 到底生成了什么**（排查宏问题神器）** |
| `cargo-audit` | 检查依赖里的已知安全漏洞（RustSec 数据库） |
| `cargo-deny` | 许可证、重复版本、来源、安全公告的统一策略检查 |
| `cargo-udeps` / `cargo-machete` | 找出没用到的依赖 |
| `cargo-bloat` | 看产物里谁占了体积 |
| `miri` | 检测 `unsafe` 代码里的未定义行为（`cargo +nightly miri test`） |

安装方式统一是 `cargo install <名字>`。

## 9. 交叉编译

```bash
rustup target add x86_64-pc-windows-gnu
cargo build --release --target x86_64-pc-windows-gnu
```

常见 target triple：

| Triple | 平台 |
|---|---|
| `x86_64-pc-windows-msvc` | Windows（MSVC 工具链，默认） |
| `x86_64-pc-windows-gnu` | Windows（MinGW，便于从 Linux 交叉编译） |
| `x86_64-unknown-linux-gnu` | Linux |
| `aarch64-unknown-linux-gnu` | ARM64 Linux |
| `x86_64-apple-darwin` / `aarch64-apple-darwin` | macOS Intel / Apple Silicon |
| `wasm32-unknown-unknown` | WebAssembly |

跨平台构建复杂时用 [cross](https://github.com/cross-rs/cross)（基于容器，`cross build --target ...`），或 `cargo-zigbuild`（用 zig 当链接器）。

## 10. `build.rs` 与代码生成

`build.rs` 在编译前运行，用于：

- 生成代码（如 protobuf、bindgen 绑定）
- 链接原生库（`println!("cargo:rustc-link-lib=...")`）
- 探测环境并设置 `cargo:rustc-cfg=...`（配合 `[lints]` 或 `cfg` 使用）

> [!warning] `build.rs` 的代价
> 它会**在构建阶段执行任意代码**，并让增量编译更容易失效。能不用就不用；用了就把它当作需要审查的代码（`cargo-deny` 有专门的检查项）。

## 11. 小结

> [!summary] 关键判断
> 1. `Cargo.toml` 用团体语义版本，**默认 `^`**；**`Cargo.lock` 一律提交**
> 2. 多 crate 用 **workspace + `[workspace.dependencies]`**，一份锁文件、一个 `target/`
> 3. feature 是**并集**语义，CI 要跑默认 / `--no-default-features` / `--all-features` 三组
> 4. `cargo check` 用于日常，`cargo clippy -- -D warnings` 上 CI，`cargo tree -d` 查重复依赖
> 5. 国内环境**先配 sparse 镜像**，这是编译提速里性价比最高的一步

## 相关笔记

- [[Rust编程/生态/常用 crate 选型|常用 crate 选型]]
- [[Rust编程/在线资料/学习路径与资料|学习路径与资料]]
- [[Rust编程/基础/错误处理|错误处理]]
- [[Rust编程/README|Rust 编程]]
