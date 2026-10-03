---
tags:
  - Rust
  - unsafe
  - 未定义行为
  - 安全
created: 2026-10-02
updated: 2026-10-02
status: 初稿
---

# unsafe 的正确用法

> [!summary] 一句话理解
> `unsafe` **不是"关掉借用检查器"的开关**，而是**"我来承担这部分正确性责任"的声明**。
>
> 它只解锁 5 项额外能力，其余规则（所有权、借用、类型检查）**照旧生效**。写 `unsafe` 的正确姿势是：**内部使用、外部包装成安全 API、并写清前置条件**。

## 1. `unsafe` 到底解锁了什么

只有这五件事：

| 能力 | 说明 |
|---|---|
| 解引用裸指针 | `*const T` / `*mut T` |
| 调用 `unsafe` 函数 | 包括 `unsafe fn` 和 `unsafe` 方法 |
| 访问或修改 `static mut` | 全局可变状态（**尽量别用**） |
| 实现 `unsafe trait` | 如 `Send` / `Sync` |
| 访问 `union` 字段 | 联合体 |

> [!important] 它**没有**解锁什么
> 借用规则、生命周期检查、类型检查、move 语义在 `unsafe` 块里**全部照常生效**。很多人以为 `unsafe` 能绕过借用检查器——不能。

## 2. 安全抽象原则

这是 Rust 代码里最重要的一条设计规矩：

> **`unsafe` 代码只出现在模块内部，对外暴露的 API 必须是安全的。**
> 也就是说：**调用方不需要写 `unsafe`，也绝不会因为正常调用而触发 UB。**

```rust
/// 一个把字节切片读成 `u32` 的安全封装。
pub fn read_u32(bytes: &[u8], offset: usize) -> Option<u32> {
    let end = offset.checked_add(4)?;          // ① 边界检查（安全代码）
    let slice = bytes.get(offset..end)?;       // ② 越界返回 None
    let arr: [u8; 4] = slice.try_into().ok()?; // ③ 长度已保证
    Some(u32::from_le_bytes(arr))              // ④ 完全不需要 unsafe
}
```

**这个例子其实根本不需要 `unsafe`。** 很多时候你以为需要，只是还没找到安全写法。

需要 `unsafe` 的版本长这样，并**必须**写清前置条件：

```rust
/// # Safety
///
/// `ptr` 必须指向至少 4 个**已初始化**、**对齐**的字节，
/// 且在本次调用期间不会被其他线程可变借用。
pub unsafe fn read_u32_unchecked(ptr: *const u8) -> u32 {
    // SAFETY: 调用方已按上述前置条件保证指针有效、对齐、可读。
    let arr = unsafe { *(ptr as *const [u8; 4]) };
    u32::from_le_bytes(arr)
}
```

> [!tip] `SAFETY:` 注释是社区惯例
> 每个 `unsafe` 块前写一行 `// SAFETY: ...`，说明**为什么这里满足前置条件**。它既是给 reviewer 看的，也是给未来的自己看的。Clippy 有 `undocumented_unsafe_blocks` 规则可以强制这一点。

## 3. 未定义行为（UB）清单

Rust 里这些是 UB——**编译器可以假设它们永不发生**，因此后果不可预测：

| UB | 说明 |
|---|---|
| **数据竞争** | 多线程无同步地访问同一内存，至少一个在写 |
| **悬垂/释放后使用** | 访问已 drop 的内存 |
| **空指针解引用** | `*ptr` 而 `ptr` 为 null |
| **未对齐访问** | 例如在奇数地址上读 `u32` |
| **无效值** | `bool` 不是 0/1、`char` 不是合法标量值、枚举判别式超出范围、`&T` 为 null、`str` 不是合法 UTF-8 |
| **违反别名规则** | 同一对象同时存在两个活跃的 `&mut`，或 `&mut` 与 `&` 并存 |
| **错误 ABI 调用** | 用错调用约定或参数类型不匹配的 `extern` |
| **整数溢出** | ⚠️ **不是 UB**（release 下按二进制补码回绕，debug 下 panic）；但在 `const` 上下文里是编译错误 |

> [!warning] UB 最难缠的地方
> 它**不一定立刻崩溃**。可能：
> - 现在正常运行，升级 rustc 后行为改变
> - 只在 release + LTO 下出错
> - 只在高并发、特定 CPU 下出错
> - 被编译器优化成"看起来正常但逻辑错了"的代码
>
> **"能跑"不等于"没 UB"。**

## 4. 六个高频错误

### ① 制造两个 `&mut`（破坏别名规则）

```rust
// ❌ UB：同一块内存有两个活跃的可变引用
let mut x = 5;
let p = &mut x as *mut i32;
let a = unsafe { &mut *p };
let b = unsafe { &mut *p };
*a = 1;
*b = 2;      // 编译器可以假设 a、b 不重叠
```

正确做法：需要"同一块内存的多个视图"时，用 `Cell`/`RefCell`/原子类型，或**只保留裸指针**（裸指针不受别名规则约束，解引用时再创建短生命周期的引用）。

### ② 越界 / 未对齐

```rust
let bytes = [0u8; 8];

// ❌ 可能未对齐（u32 需要 4 字节对齐）
let v = unsafe { *(bytes.as_ptr() as *const u32) };

// ✅ 用安全 API
let v = u32::from_le_bytes(bytes[0..4].try_into().unwrap());

// ✅ 真的要零拷贝时，先确认对齐
let v = unsafe { (bytes.as_ptr() as *const u32).read_unaligned() };
```

### ③ `transmute` 乱用

```rust
// ❌ 长度不一致，编译期可能过、运行期 UB
// let x: u64 = unsafe { std::mem::transmute([0u8; 4]) };

// ✅ 用明确的字节转换
let x = u32::from_ne_bytes([1, 2, 3, 4]);

// ✅ 指针类型转换用 cast，别用 transmute
let p = &x as *const u32 as *const u8;

// 真要 transmute，必须先确认：大小相同、对齐满足、目标类型的所有位模式都合法
```

**判据：如果目标类型存在"非法位模式"（`bool`、`char`、枚举、引用），`transmute` 到它几乎总是危险的。**

### ④ `static mut`

```rust
// ❌ 几乎所有场合都是错的
static mut COUNTER: u32 = 0;

// ✅ 原子类型
use std::sync::atomic::{AtomicU32, Ordering};
static COUNTER: AtomicU32 = AtomicU32::new(0);
COUNTER.fetch_add(1, Ordering::Relaxed);

// ✅ 一次性初始化
use std::sync::OnceLock;
static CONFIG: OnceLock<Config> = OnceLock::new();
```

### ⑤ 随意 `unsafe impl Send/Sync`

```rust
// ⚠️ 这是一个保证：我确认这个类型跨线程使用是安全的
unsafe impl Send for MyType {}
unsafe impl Sync for MyType {}
```

写错就是**数据竞争**。绝大多数情况下应该换用 `Arc<Mutex<_>>` 或原子类型。真需要时才写，并在注释里说明**为什么安全**。

### ⑥ 跨 FFI 边界 panic

```rust
#[no_mangle]
pub extern "C" fn callback() {
    // ❌ 这里 panic 会跨越 FFI 边界
    panic!("boom");
}
```

从 Rust 1.71 起，跨 `extern "C"` 边界的 panic 会**直接 abort**（不再是 UB，但进程会死）。要在边界内捕获：

```rust
use std::panic::{catch_unwind, AssertUnwindSafe};

#[no_mangle]
pub extern "C" fn callback() -> i32 {
    match catch_unwind(AssertUnwindSafe(|| real_work())) {
        Ok(v) => v,
        Err(_) => -1,   // 转换成错误码返回给 C
    }
}
```

详见 [[Rust编程/FFI/与 C 互操作|与 C 互操作]]。

## 5. 什么时候真的需要 `unsafe`

按"是否合理"排序：

| 场景 | 是否合理 |
|---|---|
| **FFI**：调用 C 库或暴露 C ABI | ✅ 不可避免 |
| **底层数据结构**：自己实现容器、arena、无锁结构 | ✅ 合理，但优先找成熟 crate |
| **已被证实的性能瓶颈**：消除边界检查、SIMD 内在函数 | ✅ 有剖析数据支撑时 |
| **`no_std` / 嵌入式**：直接操作寄存器和内存映射 IO | ✅ 不可避免 |
| "我觉得这样更快" | ❌ 先测量 |
| "借用检查器太烦了" | ❌ 重新设计 |
| 想绕过类型系统做点小聪明 | ❌ 几乎总是错 |

> [!tip] 优先级：标准库 → 成熟 crate → 自己写
> `bytemuck`（安全类型转换）、`zerocopy`（零拷贝解析）、`memmap2`、`crossbeam`（无锁结构）、`smallvec`、`arrayvec`——这些库已经把危险的 `unsafe` 封装好并经过大量验证。**自己写 `unsafe` 的性价比通常很低。**

## 6. 必用的验证工具

```bash
# Miri：在解释器里跑测试，能抓出大量 UB
rustup +nightly component add miri
cargo +nightly miri test

# Miri 能抓：越界、未对齐、use-after-free、无效值、部分别名规则违反
# Miri 抓不到：大规模性能相关、真实并发交错（但它能检测数据竞争）
```

```bash
# AddressSanitizer / ThreadSanitizer
RUSTFLAGS="-Zsanitizer=address" cargo +nightly test
RUSTFLAGS="-Zsanitizer=thread"  cargo +nightly test
```

| 工具 | 抓什么 |
|---|---|
| **Miri** | 单线程 UB、无效值、未对齐、越界、部分别名问题 |
| **ASan / TSan** | 内存错误 / 数据竞争（需要 nightly） |
| **loom** | 并发算法的**所有可能交错**（穷举验证） |
| **cargo-geiger** | 统计依赖树里的 `unsafe` 用量 |
| **fuzzing（cargo-fuzz）** | 用随机输入找 panic 和 UB |

> [!important] 把 Miri 加进 CI
> 对含有 `unsafe` 的 crate，`cargo +nightly miri test` 应该作为 CI 的一个 job。它跑得慢，但**抓 UB 的性价比无可替代**。

## 7. 写 `unsafe` 的检查清单

写之前问自己：

- [ ] 有没有标准库或成熟 crate 已经做过这件事？
- [ ] 前置条件是什么？能写清楚吗？（写不出就是还没想明白）
- [ ] 前置条件能不能用**类型系统**表达？（如 `NonNull<T>`、newtype 包装）
- [ ] 能不能把 `unsafe` 块**缩小到最小范围**？
- [ ] 每个 `unsafe` 块前有 `// SAFETY:` 说明吗？
- [ ] 对外 API 是**安全的**吗？调用方不需要 `unsafe` 吧？
- [ ] 有测试覆盖边界情况（空、零长度、最大长度、并发）吗？
- [ ] 能跑通 Miri 吗？

## 8. 小结

> [!summary] 关键判断
> 1. `unsafe` 只解锁 **5 项能力**，借用与类型检查照常生效
> 2. **安全抽象原则**：`unsafe` 在内、安全 API 在外、`SAFETY:` 注释写清理由
> 3. UB 不一定崩，**"能跑"不等于"正确"**
> 4. 六个高频错误：双 `&mut`、越界/未对齐、`transmute`、`static mut`、随意 `unsafe impl Send/Sync`、跨 FFI 的 panic
> 5. 真需要 `unsafe` 的场合基本只有：**FFI、底层数据结构、有数据支撑的性能热点、`no_std`**
> 6. **Miri 应该进 CI**

## 相关笔记

- [[Rust编程/性能/性能优化|性能优化]]
- [[Rust编程/FFI/与 C 互操作|与 C 互操作]]
- [[Rust编程/FFI/调用 Windows API（windows-rs）|调用 Windows API（windows-rs）]]
- [[Rust编程/并发/Send 与 Sync|Send 与 Sync]]
- [[Rust编程/README|Rust 编程]]
