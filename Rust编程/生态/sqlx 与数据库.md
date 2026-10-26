---
tags:
  - Rust
  - sqlx
  - 数据库
  - 异步
created: 2026-10-02
updated: 2026-10-02
status: 初稿
---

# sqlx 与数据库

> [!summary] 一句话理解
> sqlx 是**异步、不做 ORM 抽象**的 SQL 工具：你写原生 SQL，它负责参数绑定、类型映射、连接池和**编译期 SQL 校验**（`query!` 宏真的会去连数据库检查你的 SQL 和类型）。
>
> 它和 diesel/sea-orm 的取舍是：**sqlx 换来透明和性能，放弃查询构建器的抽象**。

## 1. 依赖配置

```toml
[dependencies]
sqlx = { version = "0.8", default-features = false, features = [
    "runtime-tokio",
    "tls-rustls",
    "postgres",        # 或 mysql / sqlite
    "macros",          # query! 系列宏
    "migrate",         # 迁移
    "chrono",          # 时间类型映射（或 "time"）
    "uuid",            # UUID 类型映射
    "json",            # JSON/JSONB 映射
] }
tokio = { version = "1", features = ["macros", "rt-multi-thread"] }
anyhow = "1"
```

## 2. 连接池

```rust
use sqlx::postgres::PgPoolOptions;
use std::time::Duration;

let pool = PgPoolOptions::new()
    .max_connections(10)                            // 关键参数，见下
    .min_connections(2)
    .acquire_timeout(Duration::from_secs(5))        // 取不到连接就报错，别无限等
    .idle_timeout(Duration::from_secs(600))
    .max_lifetime(Duration::from_secs(1800))
    .connect(&std::env::var("DATABASE_URL")?)
    .await?;
```

> [!important] `max_connections` 怎么定
> 连接池的总量要**除以实例数**来看。PostgreSQL 默认 `max_connections = 100`，如果你部署 20 个 Pod、每个池 10 条，就是 200 条，直接把数据库打满。
>
> 经验值：`max_connections ≈ CPU 核数 × 2 + 磁盘数`（这是数据库侧的经验公式），再除以应用实例数。**宁可让应用排队，也不要打爆数据库。**

## 3. 三种查询方式

```rust
#[derive(Debug, sqlx::FromRow)]
struct User { id: i64, name: String, email: Option<String> }

// ① 运行时绑定 + FromRow（类型检查在运行时）
let user = sqlx::query_as::<_, User>("SELECT id, name, email FROM users WHERE id = $1")
    .bind(id)
    .fetch_optional(&pool)
    .await?;

// ② 编译期校验（推荐：能在编译阶段发现 SQL 写错、列名错、类型不匹配）
let user = sqlx::query_as!(
    User,
    "SELECT id, name, email FROM users WHERE id = $1",
    id
).fetch_optional(&pool).await?;

// ③ 只要一个标量
let count: i64 = sqlx::query_scalar("SELECT count(*) FROM users")
    .fetch_one(&pool)
    .await?;
```

| 方法 | 返回 |
|---|---|
| `fetch_one` | 恰好一行，否则 `Err(RowNotFound)` |
| `fetch_optional` | `Option<Row>` |
| `fetch_all` | `Vec<Row>` |
| `fetch` | 流（`Stream`），适合大结果集 |
| `execute` | `QueryResult`，含 `rows_affected()` |

> [!note] PostgreSQL 用 `$1`，MySQL/SQLite 用 `?`
> 占位符风格**随数据库而异**。这也是用 `query!` 宏的一个附带好处：写错了它会立刻告诉你。

## 4. 编译期校验的取舍

`query!` 宏在**编译时连接数据库**读取 schema，因此需要：

```bash
export DATABASE_URL="postgres://user:pass@localhost/mydb"
cargo build
```

CI 里连不上数据库时，用**离线模式**：

```bash
cargo install sqlx-cli --no-default-features --features postgres,rustls
cargo sqlx prepare                    # 生成 .sqlx/ 目录
# 把 .sqlx/ 提交到仓库，CI 里设置：
export SQLX_OFFLINE=true
cargo build
```

| | `query!` 宏 | `query()` 运行时 |
|---|---|---|
| 编译期检查 SQL/类型 | ✅ | ❌ |
| 需要数据库或 `.sqlx/` | ✅ | ❌ |
| 动态拼 SQL | ❌ | ✅ |
| 编译速度 | 较慢（每次改 SQL 要重连） | 快 |
| 适合 | 固定查询（绝大多数） | 动态筛选、报表 |

> [!tip] 实用组合
> **固定查询全用 `query!`**（把 SQL 错误挡在编译期），**动态筛选用 `QueryBuilder`**。不要因为“CI 麻烦”就放弃编译期校验——`cargo sqlx prepare` 一次配置，长期受益。

## 5. 事务

```rust
let mut tx = pool.begin().await?;

sqlx::query("UPDATE accounts SET balance = balance - $1 WHERE id = $2")
    .bind(100_i64).bind(from_id)
    .execute(&mut *tx).await?;

sqlx::query("UPDATE accounts SET balance = balance + $1 WHERE id = $2")
    .bind(100_i64).bind(to_id)
    .execute(&mut *tx).await?;

tx.commit().await?;
```

三个要点：

- `.execute(&mut *tx)` 里的 `&mut *tx` 是**显式重借用**，避免 `tx` 被移动
- **没 `commit` 就 drop → 自动回滚**（`Drop` 里发起回滚），这是安全默认值
- 事务里的语句**必须在同一个连接上**，所以不能把 `&pool` 换成 `&tx` 之外的东西

> [!warning] 事务不要跨网络等待
> 事务开启期间持有连接和锁。**别在事务里调用外部 HTTP 接口**——网络抖动会让锁持有时间不可控，直接引发数据库侧阻塞。

## 6. 迁移（migrations）

```bash
cargo sqlx migrate add create_users      # 生成 migrations/20261002_create_users.sql
cargo sqlx migrate run                   # 应用
cargo sqlx migrate info                  # 查看状态
```

```rust
// 应用启动时自动跑迁移（单实例或加锁场景下才这么做）
sqlx::migrate!("./migrations").run(&pool).await?;
```

> [!note] 迁移文件的纪律
> - **已发布的迁移文件不要改**（别人的数据库已经执行过了）
> - 一次迁移只做一件事，方便回滚定位
> - 加非空列时先给默认值，再回填，最后加约束（大表加锁时间长）
> - 迁移文件**提交进仓库**，和代码同版本管理

## 7. 动态查询：`QueryBuilder`

```rust
use sqlx::QueryBuilder;

let mut qb = QueryBuilder::new("SELECT id, name FROM users WHERE 1=1");

if let Some(name) = filter_name {
    qb.push(" AND name ILIKE ").push_bind(format!("%{name}%"));
}
if let Some(min) = min_id {
    qb.push(" AND id >= ").push_bind(min);
}
qb.push(" ORDER BY id DESC LIMIT ").push_bind(limit);

let rows = qb.build_query_as::<User>().fetch_all(&pool).await?;
```

`push_bind` 会**正确参数化**，这是它比字符串拼接安全的地方。

> [!warning] 排序字段要白名单
> `ORDER BY {user_input}` **不能用参数绑定**（列名不是值）。必须用白名单映射：
> ```rust
> let col = match sort.as_str() {
>     "name" => "name",
>     "created" => "created_at",
>     _ => "id",
> };
> qb.push(" ORDER BY ").push(col);
> ```

## 8. 类型映射常见对应

| Rust | PostgreSQL |
|---|---|
| `i16` / `i32` / `i64` | `SMALLINT` / `INTEGER` / `BIGINT` |
| `f32` / `f64` | `REAL` / `DOUBLE PRECISION` |
| `bool` | `BOOLEAN` |
| `String` / `&str` | `TEXT` / `VARCHAR` |
| `Option<T>` | 可空列（**可空列必须用 `Option`**） |
| `Vec<u8>` | `BYTEA` |
| `serde_json::Value` | `JSONB` |
| `chrono::NaiveDateTime` | `TIMESTAMP` |
| `chrono::DateTime<Utc>` | `TIMESTAMPTZ` |
| `uuid::Uuid` | `UUID` |
| `sqlx::types::Decimal` | `NUMERIC` |

**可空列必须映射成 `Option<T>`**，否则运行时（或编译期）会报 `unexpected null`。这是最常见的类型错误。

## 9. 完整小例子

```rust
use anyhow::{Context, Result};
use sqlx::{postgres::PgPoolOptions, PgPool};

#[derive(Debug, sqlx::FromRow)]
struct User { id: i64, name: String, email: Option<String> }

async fn connect(url: &str) -> Result<PgPool> {
    PgPoolOptions::new()
        .max_connections(10)
        .acquire_timeout(std::time::Duration::from_secs(5))
        .connect(url)
        .await
        .context("连接数据库失败")
}

async fn find_user(pool: &PgPool, id: i64) -> Result<Option<User>> {
    let u = sqlx::query_as::<_, User>("SELECT id, name, email FROM users WHERE id = $1")
        .bind(id)
        .fetch_optional(pool)
        .await?;
    Ok(u)
}

async fn insert_user(pool: &PgPool, name: &str, email: Option<&str>) -> Result<i64> {
    let id: i64 = sqlx::query_scalar(
        "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id",
    )
    .bind(name)
    .bind(email)
    .fetch_one(pool)
    .await?;
    Ok(id)
}
```

## 10. 常见坑

| 现象 | 原因 | 修法 |
|---|---|---|
| 请求越来越慢，最后超时 | 连接泄漏：持有连接期间做了慢操作 | 缩小持有范围；用完立刻 drop |
| `pool timed out while waiting for an open connection` | `max_connections` 太小，或慢查询堆积 | 调大池 / 加 `acquire_timeout` 暴露问题 / 优化慢查询 |
| 报 `unexpected null` | 可空列映射成了非 `Option` | 改成 `Option<T>` |
| 编译期宏报连不上数据库 | 没有 `DATABASE_URL` 或没跑 `sqlx prepare` | 设置环境变量或用离线 `.sqlx/` |
| 迁移在生产执行很慢/锁表 | 大表加非空列、加索引无 `CONCURRENTLY` | 分步迁移；用 `CREATE INDEX CONCURRENTLY` |
| N+1 查询 | 循环里逐条查询 | 改成 `= ANY($1)` 批量查，或一次 JOIN 取回 |
| 事务里数据不一致 | 忘了 `commit`，被 drop 回滚 | 检查 `commit` 调用；用 `?` 传播错误时注意回滚是预期的 |

> [!warning] N+1 与批量查询
> ```rust
> // ❌ N+1：每次循环一次往返
> for id in ids { find_user(&pool, id).await?; }
>
> // ✅ 一次往返
> let users = sqlx::query_as::<_, User>(
>     "SELECT id, name, email FROM users WHERE id = ANY($1)"
> ).bind(&ids).fetch_all(&pool).await?;
> ```
> 网络往返通常是查询本身耗时的几十倍，**批量查询是第一优先级优化**。

## 11. 小结

> [!summary] 关键判断
> 1. sqlx 的原则是**原生 SQL + 类型映射**，不做 ORM 抽象
> 2. **固定查询用 `query!` 宏**（编译期校验），**动态查询用 `QueryBuilder`**（参数化拼接）
> 3. `max_connections` 要按**实例数 × 池大小 ≤ 数据库上限**来规划
> 4. **`acquire_timeout` 一定要设**，否则池耗尽时请求会无限等待
> 5. 事务**不 commit 就自动回滚**；事务里不要做网络调用
> 6. **可空列必须映射为 `Option<T>`**；**批量查询优先于循环单查**

## 相关笔记

- [[Rust编程/并发/async 与 Tokio 入门|async 与 Tokio 入门]]
- [[Rust编程/生态/常用 crate 选型|常用 crate 选型]]
- [[Rust编程/基础/错误处理|错误处理]]
- [[Rust编程/README|Rust 编程]]
