---
tags:
  - Rust
  - clap
  - 命令行
  - CLI
created: 2026-10-02
updated: 2026-10-02
status: 初稿
---

# clap 命令行

> [!summary] 一句话理解
> clap 是 Rust 的命令行解析事实标准。**derive 风格**用结构体描述参数，类型驱动解析：`Option<T>` 就是可选、`Vec<T>` 就是可重复、`u16` 就自动校验范围。
>
> 一句话建议：**新项目直接用 `#[derive(Parser)]`，别手写 builder。**

## 1. 最小可用骨架

```toml
[dependencies]
clap = { version = "4", features = ["derive", "env"] }
anyhow = "1"
```

```rust
use clap::Parser;
use std::path::PathBuf;

/// 一个示例工具
#[derive(Parser, Debug)]
#[command(name = "mytool", version, about = "示例命令行工具")]
struct Cli {
    /// 输入文件
    #[arg(short, long, value_name = "FILE")]
    input: Option<PathBuf>,

    /// 详细程度（-v / -vv / -vvv）
    #[arg(short, long, action = clap::ArgAction::Count)]
    verbose: u8,
}

fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();     // 解析失败会自动打印帮助并退出码 2
    println!("{cli:?}");
    Ok(())
}
```

> [!note] `parse()` 与 `try_parse()`
> `Cli::parse()` 在参数错误时**直接 `exit(2)`**，适合最终的可执行文件。想在库或测试里自己处理错误，用 `Cli::try_parse()` 拿 `Result`。

## 2. 参数类型的对应关系

| 字段类型 | 语义 | 示例 |
|---|---|---|
| `T`（如 `String`） | 必填 | 位置参数或 `--input <V>` |
| `Option<T>` | 可选 | 不传就是 `None` |
| `Vec<T>` | 可重复 | `-f a -f b` → `["a","b"]` |
| `bool` | 标志（开关） | `--force` → `true` |
| `u8` + `ArgAction::Count` | 计数 | `-vvv` → `3` |
| 实现 `ValueEnum` 的枚举 | 有限取值 | `--mode fast` |

```rust
#[derive(Copy, Clone, Debug, clap::ValueEnum)]
enum Mode { Fast, Safe, Deep }

#[derive(Parser)]
struct Cli {
    /// 必填位置参数
    path: PathBuf,

    /// 可选选项
    #[arg(short, long)]
    output: Option<PathBuf>,

    /// 可重复
    #[arg(short = 'e', long = "exclude")]
    excludes: Vec<String>,

    /// 开关
    #[arg(long)]
    dry_run: bool,

    /// 有限取值
    #[arg(long, value_enum, default_value_t = Mode::Safe)]
    mode: Mode,

    /// 带默认值
    #[arg(long, default_value_t = 3)]
    retries: u32,

    /// 从环境变量取值（需要 env feature）
    #[arg(long, env = "MY_TOKEN", hide_env_values = true)]
    token: Option<String>,
}
```

`dry_run` 字段会自动生成长选项 `--dry-run`（下划线转连字符）。

## 3. 取值校验

```rust
#[derive(Parser)]
struct Cli {
    /// 端口，必须在 1..=65535
    #[arg(long, value_parser = clap::value_parser!(u16).range(1..=65535))]
    port: u16,

    /// 只接受 .json 结尾
    #[arg(long, value_parser = validate_json_ext)]
    config: PathBuf,
}

fn validate_json_ext(s: &str) -> Result<PathBuf, String> {
    let p = PathBuf::from(s);
    if p.extension().is_some_and(|e| e == "json") {
        Ok(p)
    } else {
        Err(String::from("必须是 .json 文件"))
    }
}
```

> [!tip] 校验放到 `value_parser` 里
> 这样错误信息由 clap 统一输出，带参数名和使用提示，比在业务代码里手动检查体验好得多。

## 4. 子命令

```rust
use clap::{Args, Parser, Subcommand};

#[derive(Parser)]
#[command(version, about)]
struct Cli {
    /// 全局参数：写在这里，所有子命令都能用
    #[arg(short, long, global = true)]
    verbose: bool,

    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    /// 初始化配置
    Init {
        /// 覆盖已有配置
        #[arg(long)]
        force: bool,
    },
    /// 列出条目
    List(ListArgs),
    /// 删除条目
    Remove {
        /// 条目 ID
        id: u64,
    },
}

#[derive(Args)]
struct ListArgs {
    /// 只显示前 N 条
    #[arg(short, long, default_value_t = 20)]
    limit: usize,

    /// 按名称过滤
    #[arg(long)]
    filter: Option<String>,
}

fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();
    match cli.command {
        Command::Init { force } => { /* ... */ }
        Command::List(args) => println!("limit={} filter={:?}", args.limit, args.filter),
        Command::Remove { id } => println!("删除 {id}"),
    }
    Ok(())
}
```

好处：`mytool init --force`、`mytool list --limit 5` 自动成型，`--help` 自动分组。

**把 `Command` 拆到 `Args` 结构体**是组织大型 CLI 的关键——否则 enum 会膨胀到几百行。

## 5. 互斥、依赖与分组

```rust
#[derive(Parser)]
#[command(group = clap::ArgGroup::new("src").required(true).args(["file", "url"]))]
struct Cli {
    #[arg(long)]
    file: Option<PathBuf>,

    #[arg(long)]
    url: Option<String>,

    /// 需要 file 存在
    #[arg(long, requires = "file")]
    follow: bool,

    /// 与 url 冲突
    #[arg(long, conflicts_with = "url")]
    offline: bool,
}
```

| 属性 | 作用 |
|---|---|
| `requires = "other"` | 用了本参数就必须也用 other |
| `conflicts_with = "other"` | 二者不能同时出现 |
| `ArgGroup::required(true)` | 组内至少给一个 |
| `num_args = 1..=3` | 接受 1 到 3 个值 |
| `overrides_with` | 后出现的覆盖前面的 |

## 6. 帮助文本与体验

```rust
#[derive(Parser)]
#[command(
    name = "mytool",
    version,
    about = "一句话说明（短的）",
    long_about = "详细说明，会在 --help 里展开",
    after_help = "示例：\n  mytool list --limit 5",
)]
struct Cli { /* ... */ }
```

- 字段上的 `///` 文档注释**自动成为参数说明**
- `version` 会自动取 `Cargo.toml` 的版本号
- 想要更好的帮助输出，加 `features = ["wrap_help"]`（自动按终端宽度折行）

## 7. 生成 shell 补全

```toml
[build-dependencies]
clap = { version = "4", features = ["derive"] }
clap_complete = "4"
```

```rust
use clap::CommandFactory;
use clap_complete::{generate, shells::Bash};

fn main() {
    let mut cmd = Cli::command();
    generate(Bash, &mut cmd, "mytool", &mut std::io::stdout());
}
```

配合 `clap_mangen` 还能生成 man page。

## 8. 测试命令行

```toml
[dev-dependencies]
assert_cmd = "2"
predicates = "3"
```

```rust
use assert_cmd::Command;
use predicates::prelude::*;

#[test]
fn help_shows_version() {
    Command::cargo_bin("mytool").unwrap()
        .arg("--help")
        .assert()
        .success()
        .stdout(predicate::str::contains("示例命令行工具"));
}

#[test]
fn bad_port_is_rejected() {
    Command::cargo_bin("mytool").unwrap()
        .args(["--port", "99999"])
        .assert()
        .failure()
        .stderr(predicate::str::contains("65535"));
}
```

还可以用 `Cli::try_parse_from(["mytool", "--port", "99999"])` 做**纯解析层**的测试，比端到端快得多。

## 9. 常见坑

| 现象 | 原因 | 修法 |
|---|---|---|
| `--force` 不生效 | 字段名 `force` 但写成了 `--force=true` | 布尔标志**不用给值**；要显式写用 `--force` |
| 负数被当成选项 | `-5` 被解析为短选项 | 用 `--offset=-5`，或加 `allow_hyphen_values = true` |
| 位置参数解析错位 | 多个位置参数且前面的可选 | 尽量只保留一个位置参数 |
| 传含 `-` 的文件名失败 | clap 当成选项 | 用 `--` 分隔：`mytool -- -weird-name.txt` |
| `Vec<T>` 只拿到一个值 | 以为是逗号分隔 | clap 默认**不**按逗号切分；要的话用 `value_delimiter = ','` |
| 环境变量不生效 | 没开 `env` feature | `features = ["env"]` |
| 帮助里显示内部参数 | 调试用参数没隐藏 | `hide = true` |
| 子命令参数不识别 | 参数写在子命令之后但没设 `global` | 全局参数加 `global = true` |

## 10. 一个可直接用的模板

```rust
use anyhow::Result;
use clap::Parser;
use std::path::PathBuf;

/// 批量处理工具
#[derive(Parser, Debug)]
#[command(version, about)]
struct Cli {
    /// 输入目录
    #[arg(short, long, value_name = "DIR", default_value = ".")]
    dir: PathBuf,

    /// 只预演，不实际修改
    #[arg(long)]
    dry_run: bool,

    /// 并发数
    #[arg(short, long, default_value_t = 4)]
    jobs: usize,

    /// 详细程度
    #[arg(short, long, action = clap::ArgAction::Count)]
    verbose: u8,
}

fn main() -> Result<()> {
    let cli = Cli::parse();

    // 日志级别交给参数控制
    let level = match cli.verbose {
        0 => "warn",
        1 => "info",
        2 => "debug",
        _ => "trace",
    };
    tracing_subscriber::fmt()
        .with_env_filter(level)
        .init();

    run(&cli)
}

fn run(cli: &Cli) -> Result<()> {
    tracing::info!(dir = %cli.dir.display(), dry_run = cli.dry_run, jobs = cli.jobs, "开始");
    Ok(())
}
```

## 11. 小结

> [!summary] 关键判断
> 1. **derive 风格 + 类型驱动**：`Option`/`Vec`/`bool`/计数/枚举各对应一种语义
> 2. 子命令用 `enum + #[command(subcommand)]`，参数组拆成 `Args` 结构体
> 3. **校验放进 `value_parser`**，让 clap 统一输出错误
> 4. 全局参数要加 `global = true`
> 5. 测试用 `try_parse_from`（快）+ `assert_cmd`（端到端）
> 6. 记住 `--` 分隔符和"布尔标志不给值"这两条，能避开大部分困惑

## 相关笔记

- [[Rust编程/基础/错误处理|错误处理]]
- [[Rust编程/工程/测试与基准测试|测试与基准测试]]
- [[Rust编程/生态/常用 crate 选型|常用 crate 选型]]
- [[Rust编程/README|Rust 编程]]
