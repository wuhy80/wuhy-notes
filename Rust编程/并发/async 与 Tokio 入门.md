---
tags:
  - Rust
  - 异步
  - async
  - Tokio
  - 并发
created: 2026-10-02
updated: 2026-10-02
status: 初稿
---

# async 与 Tokio 入门

> [!summary] 一句话理解
> `async fn` 编译成一个**状态机**，返回 `impl Future`。这个 Future 是**惰性的**——不 `.await` 或不交给执行器，它一行都不会跑。
>
> Rust 标准库只提供 `Future` 这个**接口**，不提供运行时。**Tokio 是最常用的运行时**（负责调度、IO、定时器）。
>
> 一句话选型：**高并发 IO 用 async，CPU 密集用线程与 `rayon`。**

## 1. async 到底是什么

```rust
async fn fetch(url: &str) -> String { ... }
```

大致脱糖为：

```rust
fn fetch(url: &str) -> impl Future<Output = String> { ... }
```

函数体被编译成一个**状态机**：每个 `.await` 是一个可能的暂停点，状态机记住“暂停在哪儿、局部变量是什么值”。

```rust
trait Future {
    type Output;
    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output>;
}

enum Poll<T> { Ready(T), Pending }
```

- `Poll::Ready(v)`：完成了
- `Poll::Pending`：还没好，**登记一个 waker 后交出控制权**，等 IO 就绪时被唤醒

> [!important] 惰性：不 poll 就不执行
> ```rust
> let fut = fetch("https://example.com");   // 什么都没发生
> // fut.await;                              // 这才开始跑
> ```
> 这和 JavaScript 一样，和 Go 的 goroutine（一创建就调度）**相反**。所以忘记 `.await` 时，编译器会给你一个 `unused_must_use` 警告——别忽略它。

## 2. 需要运行时：Tokio

```toml
# Cargo.toml
[dependencies]
tokio = { version = "1", features = ["full"] }
```

```rust
#[tokio::main]
async fn main() {
    println!("hello async");
}
```

`#[tokio::main]` 宏做的事：把 `async fn main` 包成同步 `fn main`，在里面建一个 Tokio 运行时并 `block_on` 你的 future。

手动建运行时（想在非 async 环境里跑，或要精细配置时）：

```rust
let rt = tokio::runtime::Runtime::new().unwrap();
rt.block_on(async {
    println!("在运行时里跑");
});
```

### 两种运行时

| 模式 | 特点 | 何时用 |
|---|---|---|
| `multi_thread`（默认） | 多工作线程 + 工作窃取；任务需 `Send` | 服务端、真正的并发 IO |
| `current_thread` | 单线程，任务无需 `Send` | 简单 CLI、测试、需要 `!Send` 局部状态的场合 |

```rust
#[tokio::main(flavor = "current_thread")]
async fn main() { ... }
```

## 3. 起任务与等待

```rust
use anyhow::Result;

#[tokio::main]
async fn main() -> Result<()> {
    let handle = tokio::spawn(async {
        1 + 1
    });

    let sum = handle.await?;    // JoinHandle 的 await 返回 Result<T, JoinError>
    println!("{sum}");
    Ok(())
}
```

`tokio::spawn` 的要求和 `thread::spawn` 一样严格：

```text
future: Send + 'static      返回值: Send + 'static
```

- `'static` → 不能借用局部变量，需要 `move`
- `Send` → 跨 `.await` 持有的东西都必须 `Send`

并发等待多个任务：

```rust
let (a, b, c) = tokio::join!(fetch("a"), fetch("b"), fetch("c"));  // 全部完成
let results = tokio::try_join!(f("a"), f("b"))?;                   // 任一失败即返回
```

超时控制：

```rust
use std::time::Duration;

match tokio::time::timeout(Duration::from_secs(3), fetch("url")).await {
    Ok(v) => println!("成功: {v}"),
    Err(_) => println!("超时"),
}
```

> [!tip] `join!` 是并发的关键
> 顺序 `.await` 是串行；`join!` / `try_join!` 才让多个 future 并发推进。这是 async 里最容易写错的地方——代码看起来像并发，其实在排队。

## 4. 最常见的三个坑

### ① 在 async 里阻塞

```rust
// ❌ 阻塞整个工作线程，同一线程上的其他任务全部停摆
let content = std::fs::read_to_string("big.txt")?;
```

正确做法：

```rust
// ✅ 挪到阻塞线程池
let content = tokio::task::spawn_blocking(|| std::fs::read_to_string("big.txt")).await??;
```

或者用 Tokio 的异步 IO：

```rust
let content = tokio::fs::read_to_string("big.txt").await?;
```

> [!warning] async 是**协作式**调度
> 运行时不会抢占你的任务。一个阻塞调用或一个超长的纯计算循环，会把线程上排队的其他任务一起卡住。**“async 里不能有阻塞”是硬约束，不是风格建议。**

CPU 密集任务也不要塞给 Tokio，用 `rayon`：

```rust
let hash = tokio::task::spawn_blocking(move || rayon_heavy_compute(data)).await?;
```

### ② 跨 `.await` 持有 `std::sync::MutexGuard`

```rust
// ❌ 编译失败：MutexGuard 不是 Send
let guard = std_mutex.lock().unwrap();
some_async_call().await;
drop(guard);
```

因为 `std::sync::MutexGuard` 是 `!Send`，而 `spawn` 出的任务需要 `Send`。三种修法：

```rust
// ① 用作用域把 guard 关在 await 之前（首选）
{
    let mut guard = std_mutex.lock().unwrap();
    guard.push(1);
}
some_async_call().await;

// ② 换成 tokio 的异步锁（可以跨 await 持有）
let guard = tokio_mutex.lock().await;
some_async_call().await;
drop(guard);

// ③ 只取需要的数据，立刻释放锁
let value = { std_mutex.lock().unwrap().clone() };
some_async_call().await;
```

| | `std::sync::Mutex` | `tokio::sync::Mutex` |
|---|---|---|
| 跨 `.await` 持有 | ❌ | ✅ |
| 开销 | 小 | 更大 |
| 建议 | 临界区短、不跨 await 时**优先用它** | 确实需要在 await 期间持锁时才用 |

> [!note] 别一上来就用 `tokio::sync::Mutex`
> 它的开销明显更高。**正常做法是用 `std::sync::Mutex` + 短临界区**（不跨 `.await`），只在真的需要跨 await 持锁时才换 `tokio` 版本。

### ③ `select!` 的取消语义

```rust
tokio::select! {
    v = fetch("a") => println!("a 完成: {v}"),
    _ = tokio::time::sleep(Duration::from_secs(1)) => println!("超时"),
}
```

`select!` 会**取消**没被选中的分支——未完成的 future 直接被 drop。所以：

- future 必须是**取消安全（cancel-safe）**的，否则可能丢数据
- 循环里用 `select!` 时，注意别每次都重建一个“部分消费了数据”的 future

## 5. 通道与流

```rust
use tokio::sync::mpsc;

let (tx, mut rx) = mpsc::channel::<i32>(32);   // 有界队列，带背压

tokio::spawn(async move {
    for i in 0..5 {
        if tx.send(i).await.is_err() { break; }   // 接收端关闭
    }
});

while let Some(v) = rx.recv().await {
    println!("{v}");
}
```

异步流（多个值陆续到达）用 `Stream`：

```toml
futures = "0.3"
```

```rust
use futures::StreamExt;

let mut stream = ...;
while let Some(item) = stream.next().await {
    println!("{item}");
}
```

## 6. 该用 async，还是用线程

| 场景 | 推荐 |
|---|---|
| 大量并发网络 IO（几千连接） | **async + Tokio** |
| Web 服务 / 网关 / 代理 | **async + Tokio**（axum、hyper） |
| CPU 密集计算 | 线程池 / `rayon`（别用 async） |
| 少量固定并发任务 | 普通线程更简单 |
| 简单 CLI 工具、脚本 | 同步代码最省心 |
| 文件 IO 为主 | 视情况，`spawn_blocking` 往往比 `tokio::fs` 更直接 |

> [!summary] 判断标准
> async 的收益来自**“等 IO 的时候不占线程”**。如果你的任务不是 IO 等待为主（而是算力为主），或者并发量只有几个，async 只会带来复杂度，不会带来性能。

## 7. 最小可用模板

```rust
use anyhow::Result;
use std::time::Duration;

#[tokio::main]
async fn main() -> Result<()> {
    let tasks: Vec<_> = (0..10)
        .map(|i| tokio::spawn(async move {
            tokio::time::sleep(Duration::from_millis(50)).await;
            i * i
        }))
        .collect();

    for t in tasks {
        println!("{}", t.await?);
    }
    Ok(())
}
```

## 8. 小结

> [!summary] 关键判断
> 1. `async fn` = 返回 Future 的状态机，**惰性、不 poll 不执行**
> 2. Rust 只给接口不给运行时，**Tokio 是最主流的选择**
> 3. **async 里绝不能阻塞**；CPU 密集任务交给线程或 `rayon`
> 4. 跨 `.await` 持有 `std::sync::MutexGuard` 会编译失败；优先用作用域而非换锁类型
> 5. 顺序 `.await` 是串行，`join!` / `try_join!` 才是并发
> 6. `select!` 会取消落选分支，注意**取消安全**

## 相关笔记

- [[Rust编程/并发/Send 与 Sync|Send 与 Sync]]
- [[Rust编程/基础/智能指针|智能指针]]
- [[Rust编程/生态/常用 crate 选型|常用 crate 选型]]
- [[Rust编程/README|Rust 编程]]
