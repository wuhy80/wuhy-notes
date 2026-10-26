---
tags:
  - Rust
  - 并发
  - Send
  - Sync
  - 线程
created: 2026-10-02
updated: 2026-10-02
status: 初稿
---

# Send 与 Sync

> [!summary] 一句话理解
> `Send` 和 `Sync` 是 Rust 并发的**类型级护栏**，回答两个问题：
>
> - `T: Send` —— 这个值的**所有权**能不能交给另一个线程？
> - `T: Sync` —— 这个值的**共享引用** `&T` 能不能给多个线程同时用？
>
> 它们是 **auto trait**：编译器会为复合类型自动推导，你几乎不用手写。它们的价值在于——**编译期就把数据竞争挡在门外**。

## 1. 两个标记的确切含义

```rust
// 标准库中的定义（简化）
pub unsafe auto trait Send {}
pub unsafe auto trait Sync {}
```

| Trait | 含义 | 等价说法 |
|---|---|---|
| `Send` | 可以把所有权移动到另一个线程 | `T` 可以跨线程传递 |
| `Sync` | 多个线程可以同时持有 `&T` | `&T: Send` 当且仅当 `T: Sync` |

关系要记牢：

```text
T: Sync   ⟺   &T: Send
```

换句话说，**“能共享”就是“共享引用能跨线程送过去”**。

## 2. 谁不是 `Send` / `Sync`

| 类型 | `Send` | `Sync` | 原因 |
|---|---|---|---|
| `Rc<T>` | ❌ | ❌ | 引用计数是普通整数，非原子，并发加减会算错 |
| `Arc<T>` | ✅（当 `T: Send + Sync`） | ✅（同左） | 原子计数 |
| `Cell<T>` / `RefCell<T>` | ✅ | ❌ | 内部可变性无同步，多个 `&` 就能改值 |
| `Mutex<T>` | ✅（当 `T: Send`） | ✅（当 `T: Send`） | 加锁保证互斥 |
| `RwLock<T>` | ✅（当 `T: Send`） | ✅（当 `T: Send + Sync`） | 同上 |
| `*const T` / `*mut T` | ❌ | ❌ | 裸指针无安全保证 |
| `&T` | ✅（当 `T: Sync`） | ✅（当 `T: Sync`） | |
| `&mut T` | ✅（当 `T: Send`） | ✅（当 `T: Sync`） | |
| `Vec<T>` / `Option<T>` | 跟随 `T` | 跟随 `T` | 复合类型自动推导 |

> [!note] 复合类型是自动推导的
> 如果结构体的每个字段都是 `Send`，结构体就是 `Send`。所以你几乎只在**用 `Rc`、裸指针、或者手写 `unsafe`** 时才会撞到 `Send` / `Sync` 报错。

报错长这样：

```text
error[E0277]: `Rc<String>` cannot be sent between threads safely
   = help: within `[closure]`, the trait `Send` is not implemented for `Rc<String>`
note: required by a bound in `spawn`
```

**看到这个错的正确反应是换类型，而不是想办法绕过。**

## 3. `thread::spawn` 的两个要求

```rust
pub fn spawn<F, T>(f: F) -> JoinHandle<T>
where
    F: FnOnce() -> T + Send + 'static,
    T: Send + 'static,
```

- `Send`：闭包要跨线程，它的所有捕获物必须能送过去
- `'static`：线程可能活得比创建它的作用域更久，所以**不能借用局部变量**

```rust
use std::thread;

let data = vec![1, 2, 3];

let handle = thread::spawn(move || {   // move 把 data 的所有权转移进去
    data.iter().sum::<i32>()
});

println!("{}", handle.join().unwrap());
```

不想 `move` 所有权？用 **scoped threads**（Rust 1.63+），编译器会在作用域结束时自动 join：

```rust
let data = vec![1, 2, 3];

thread::scope(|s| {
    s.spawn(|| {
        println!("借用，不转移所有权: {:?}", &data);   // ✅ 允许借用
    });
});  // 这里保证所有线程已结束
```

## 4. 两种并发模型

### 消息传递：用通信共享内存

```rust
use std::sync::mpsc;

let (tx, rx) = mpsc::channel();

for i in 0..3 {
    let tx = tx.clone();
    std::thread::spawn(move || {
        tx.send(i * 10).unwrap();
    });
}
drop(tx);   // 关掉最后一个发送端，rx 的迭代才会结束

for value in rx {
    println!("收到 {value}");
}
```

- `Sender<T>: Send`（当 `T: Send`），可以 clone 出多个生产者
- `Receiver<T>` 是 `Send` 但**不是 `Sync`**：可以移动到别的线程，但不能多个线程共享同一个接收端

### 共享状态：加锁

```rust
use std::sync::{Arc, Mutex};

let shared = Arc::new(Mutex::new(Vec::new()));

std::thread::scope(|s| {
    for i in 0..3 {
        let data = Arc::clone(&shared);
        s.spawn(move || {
            data.lock().unwrap().push(i);
        });
    }
});
```

> [!tip] 优先选消息传递
> “不要通过共享内存来通信，而要通过通信来共享内存”。共享状态需要你同时推理**锁的粒度、加锁顺序、锁中毒、跨 await 持锁**四件事；消息传递只需要推理**通道的生命周期**。

## 5. Rust 挡住了什么，没挡住什么

> [!important] 挡住的是数据竞争，不是全部竞态
> - **数据竞争（data race）**：多个线程同时访问同一内存、至少一个在写、且没有同步。**Rust 用 `Send`/`Sync` 在编译期彻底排除。**
> - **竞态条件（race condition）**：逻辑上的时序依赖，比如“检查文件存在 → 创建文件”之间的 TOCTOU。**Rust 不管这个**，需要你自己用锁、原子操作或重试来保证。
>
> 还有两类它也不管：
> - **死锁**：两个线程按相反顺序拿两把锁
> - **锁中毒导致的连锁 panic**

## 6. 常见坑

### `std::sync::Mutex` 不可重入

```rust
let m = Mutex::new(1);
let g = m.lock().unwrap();
// let g2 = m.lock().unwrap();  // ❌ 死锁，同一线程再次加锁会阻塞自己
```

### 加锁顺序要统一

```text
线程 A：lock(a) → lock(b)
线程 B：lock(b) → lock(a)     ❌ 经典死锁
```

**约定一个全局的加锁顺序**，或让临界区只涉及一把锁。

### `MutexGuard` 不是 `Send`

`std::sync::MutexGuard` 不能跨线程移动。这直接导致一个常见报错：**在 `async` 里跨 `.await` 持有 `std::sync::MutexGuard`** 会编译失败（见 [[Rust编程/并发/async 与 Tokio 入门|async 与 Tokio 入门]]）。

### 别在锁内做慢操作

锁内调用网络、磁盘、日志 IO 会把并发度打成串行。**缩小临界区**是并发优化的第一原则。

## 7. 手动实现 `Send` / `Sync`

只有在你**确定**额外的不变量成立时才用：

```rust
struct MyBox(*mut u8);

// ⚠️ 这是一个承诺：我保证这个类型跨线程使用是安全的
unsafe impl Send for MyBox {}
unsafe impl Sync for MyBox {}
```

> [!warning] `unsafe impl` 是安全边界上的书面保证
> 写错了会导致**未定义行为**，而且编译器不会再帮你。绝大多数业务代码一辈子不需要写这两行。真需要时，通常意味着应该用 `Arc<Mutex<_>>`、原子类型或既有的并发容器。

## 8. 数据并行：`rayon`

不需要手写线程池，把迭代器换成并行版即可：

```rust
use rayon::prelude::*;

let sum: i64 = (1..=1_000_000).into_par_iter().map(|x| x * x).sum();
```

`rayon` 内部用工作窃取线程池，要求元素类型满足 `Send`（因为要分发到不同线程）。CPU 密集型任务用它，比手写 `thread::spawn` 简洁得多。

## 9. 小结

> [!summary] 关键判断
> 1. `Send` = 所有权可跨线程；`Sync` = 共享引用可跨线程；**`T: Sync` ⟺ `&T: Send`**
> 2. 它们由编译器自动推导，**看到报错就换类型**，不要 `unsafe impl`
> 3. `Rc` → `Arc`、`RefCell` → `Mutex`/`RwLock`，这是两条最标准的替换路径
> 4. Rust 保证**没有数据竞争**，但**不保证没有死锁和逻辑竞态**
> 5. 优先消息传递；必须共享状态时，缩小临界区、统一加锁顺序

## 相关笔记

- [[Rust编程/基础/智能指针|智能指针]]
- [[Rust编程/并发/async 与 Tokio 入门|async 与 Tokio 入门]]
- [[Rust编程/基础/所有权与借用|所有权与借用]]
- [[Rust编程/README|Rust 编程]]
