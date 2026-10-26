---
tags:
  - Rust
  - FFI
  - C
  - 互操作
created: 2026-10-02
updated: 2026-10-02
status: 初稿
---

# 与 C 互操作

> [!summary] 一句话理解
> FFI 的核心不是“怎么声明函数”，而是**约定所有权**：
>
> - 谁分配的内存，谁负责释放
> - 跨边界不能 panic
> - 结构体布局必须用 `#[repr(C)]` 钉住
> - 字符串要显式转换（`CString` / `CStr`）
>
> 这四条搞错，就会出现“能跑但偶尔崩”的问题。

## 1. 两个方向

| 方向 | 用途 | 关键点 |
|---|---|---|
| **Rust 调用 C** | 用现成的 C 库（SQLite、libgit2、系统 API） | `extern "C"` 声明 + 链接 |
| **C 调用 Rust** | 把 Rust 编译成库给 C/C++/其他语言用 | `#[no_mangle]` + `extern "C"` + `cdylib` |

## 2. 调用 C 库

```rust
use std::os::raw::{c_char, c_int};

// 声明外部函数（Rust 2024 起 extern 块本身也要写 unsafe）
unsafe extern "C" {
    fn sqlite3_libversion() -> *const c_char;
    fn sqlite3_open(filename: *const c_char, pp_db: *mut *mut c_void) -> c_int;
}

fn version() -> String {
    // SAFETY: sqlite3_libversion 返回指向静态字符串的指针，永不为 null
    let ptr = unsafe { sqlite3_libversion() };
    unsafe { CStr::from_ptr(ptr) }.to_string_lossy().into_owned()
}
```

链接方式有两种：

```rust
// ① 系统已装的库
#[link(name = "sqlite3")]
unsafe extern "C" { /* ... */ }
```

```toml
# ② build.rs 里用 pkg-config 或 cc 编译/链接
# [build-dependencies]
# cc = "1"
```

```rust
// build.rs
fn main() {
    cc::Build::new().file("src/native/helper.c").compile("helper");
    println!("cargo:rustc-link-lib=sqlite3");
}
```

## 3. 让 C 调用 Rust

```toml
[lib]
crate-type = ["cdylib", "staticlib", "rlib"]
```

- `cdylib`：动态库（`.dll` / `.so` / `.dylib`），给 C 动态链接
- `staticlib`：静态库（`.a` / `.lib`），给 C 静态链接
- `rlib`：Rust 自己的库格式（给其他 Rust crate 用）

```rust
use std::os::raw::c_int;

/// # Safety
/// 调用方保证传入了合法的指针（本函数不涉及指针，安全）。
#[no_mangle]
pub extern "C" fn add(a: c_int, b: c_int) -> c_int {
    a + b
}
```

> [!warning] `#[no_mangle]` 在 Rust 2024 里的写法变了
> 2024 edition 起，`#[no_mangle]`、`#[export_name]`、`#[link_section]` 这些影响链接的属性必须写成 **`#[unsafe(no_mangle)]`**，因为它们的安全责任在使用者。老代码在 2024 下会报错并给出迁移提示。

生成头文件用 [cbindgen](https://github.com/mozilla/cbindgen)：

```bash
cargo install cbindgen
cbindgen --lang c --output include/mylib.h
```

反向（从 C 头文件生成 Rust 绑定）用 [bindgen](https://github.com/rust-lang/rust-bindgen)，通常在 `build.rs` 里调用。

## 4. 结构体布局

```rust
#[repr(C)]
pub struct Config {
    pub timeout_ms: u32,
    pub retries: u32,
    pub verbose: bool,
}
```

> [!important] 只有 `#[repr(C)]` 的布局是确定的
> Rust 默认会**重排字段**以最小化 padding。跨 FFI 传递的结构体**必须**加 `#[repr(C)]`，否则两侧对字段偏移的理解会不一致——而且这种 bug 往往只在特定平台上暴露。

配套注意事项：

- **`bool` 在 C 里是 `_Bool`/`int`**，跨边界更稳妥的做法是用 `u8` 或 `c_int` 明确表示
- **枚举**要用 `#[repr(C)]`，并且**别让 C 侧传非法判别式**（Rust 枚举的非法值就是 UB）
- **对齐**：C 侧结构体用 `#pragma pack` 改变对齐时，Rust 侧必须用 `#[repr(C, packed)]` 对应

## 5. 字符串

```rust
use std::ffi::{CStr, CString};
use std::os::raw::c_char;

// Rust → C（需要 CString 保证结尾有 NUL 且不含内部 NUL）
let c_str = CString::new("hello").unwrap();
unsafe { c_function(c_str.as_ptr()) };

// C → Rust（借用，不接管所有权）
unsafe fn from_c(ptr: *const c_char) -> String {
    // SAFETY: 调用方保证 ptr 指向以 NUL 结尾的合法 C 字符串
    unsafe { CStr::from_ptr(ptr) }.to_string_lossy().into_owned()
}
```

| 类型 | 说明 |
|---|---|
| `CString` | 拥有型、以 NUL 结尾、不含内部 NUL |
| `CStr` | 借用的 C 字符串（**不保证 UTF-8**） |
| `OsString` / `OsStr` | 平台上“可能非 UTF-8”的字符串（Windows 是 UTF-16） |
| `str::from_utf8` | 校验并转换，失败返回 `Err` |

Windows 上要注意**宽字符（UTF-16）**：用 `encode_utf16` + `Vec<u16>` + 结尾 0，或直接 `windows` crate 的 `w!()` / `HSTRING`。见 [[Rust编程/FFI/调用 Windows API（windows-rs）|调用 Windows API（windows-rs）]]。

## 6. 所有权：最容易出错的地方

> [!important] 唯一规则：谁分配，谁释放
> 跨 FFI 传递指针时，**必须明确约定释放责任**。最稳妥的模式是：**分配和释放都放在同一侧，通过导出的函数完成。**

```rust
// Rust 侧分配，交给 C 使用，之后由 C 调用本函数释放
#[no_mangle]
pub extern "C" fn config_new() -> *mut Config {
    Box::into_raw(Box::new(Config { timeout_ms: 1000, retries: 3, verbose: false }))
}

/// # Safety
/// `ptr` 必须来自 `config_new`，且只能释放一次。
#[no_mangle]
pub unsafe extern "C" fn config_free(ptr: *mut Config) {
    if ptr.is_null() { return; }
    // SAFETY: 调用方保证 ptr 由 config_new 产生且未被释放
    drop(unsafe { Box::from_raw(ptr) });
}
```

要点：

- **`Box::into_raw` / `Box::from_raw` 必须配对**，且只能一次
- **绝不要用 `free()` 释放 `Box` 的内存**，也不要用 `Box::from_raw` 释放 `malloc` 的内存——分配器可能不同
- 传 `&T` / `&mut T` 给 C 时，C 侧**不得保存指针超过调用期**
- 用 `Option<&T>`（`repr(transparent)` 的 `Option<&T>`）表示可为空的引用，比裸指针更安全

## 7. panic 不能跨越边界

```rust
use std::panic::{catch_unwind, AssertUnwindSafe};

#[no_mangle]
pub extern "C" fn risky() -> i32 {
    match catch_unwind(AssertUnwindSafe(|| {
        // 可能 panic 的 Rust 逻辑
        do_work()
    })) {
        Ok(v) => v,
        Err(_) => -1,
    }
}
```

> [!warning] Rust 1.71 起的行为
> 跨 `extern "C"` 边界的 panic 会**直接 abort 整个进程**。所以：**在 FFI 边界内用 `catch_unwind` 兜住**，不要指望它“传过去”给 C 处理。
>
> 需要让 panic 传播到另一个 Rust 栈帧时用 `extern "C-unwind"`。

## 8. 函数指针与可选回调

```rust
// C 侧可能不提供回调 → 用 Option 表示，且是零开销的
pub type Callback = extern "C" fn(code: i32, user: *mut c_void);

#[no_mangle]
pub extern "C" fn set_callback(cb: Option<Callback>) { /* ... */ }
```

`Option<extern "C" fn(...)>` 利用了**空指针优化**，大小与裸函数指针相同，这是 FFI 里表示“可空回调”的惯用法。

## 9. 验证与调试

| 手段 | 用途 |
|---|---|
| `cargo +nightly miri test` | 不能跑 FFI 调用，但能验证纯 Rust 部分 |
| ASan / TSan | `RUSTFLAGS="-Zsanitizer=address"` |
| `valgrind` | Linux 上查跨语言内存错误 |
| C 侧写单元测试 | 用 C 直接调用你的导出函数 |
| 小步验证 | 先只导出一个 `add` 跑通链接，再逐步加复杂度 |

> [!tip] FFI 调试的关键心态
> 崩溃点往往**离真正出错的地方很远**（堆被写坏了，等到下一次 `malloc` 才崩）。所以要**从最简版本开始，一步步加**，而不是写完一大坨再调。

## 10. 常见坑

| 现象 | 原因 | 修法 |
|---|---|---|
| 链接报 `undefined reference` | 没声明 `#[link]` / build.rs 没链接 | 检查 `cargo:rustc-link-lib` |
| 符号找不到 | 忘了 `#[no_mangle]`，或名字被 mangle | 加属性；用 `nm` 查导出符号 |
| C 侧读到的字段错位 | 忘了 `#[repr(C)]` | 加 `#[repr(C)]` |
| 内存越用越多 / 崩溃 | 所有权约定不清，重复释放或泄漏 | 明确“谁分配谁释放”，配对 `into_raw`/`from_raw` |
| 偶尔段错误 | C 保存了只在调用期内有效的借用 | C 侧不得长期保存借用指针 |
| 进程直接退出无堆栈 | panic 跨边界 → abort | 边界内 `catch_unwind` |
| 中文变乱码 | 编码假设不一致（UTF-8 vs 本地 ANSI/UTF-16） | 显式转换，Windows 用宽字符 API |
| 只在 release 下崩 | UB 被优化暴露 | 假设有 UB，上 Miri/ASan 排查 |

## 11. 小结

> [!summary] 关键判断
> 1. **FFI 的难点是所有权与生命周期约定**，不是函数声明
> 2. 结构体必须 **`#[repr(C)]`**；`bool`/枚举/对齐要显式处理
> 3. 字符串用 **`CString`/`CStr`**；Windows 记得宽字符
> 4. **`Box::into_raw` 与 `Box::from_raw` 成对**，且在同一侧释放
> 5. **panic 绝不能跨边界**：`catch_unwind` 兜住
> 6. 生成绑定用 **bindgen**，生成头文件用 **cbindgen**；`build.rs` + `cc` 编译伴生 C 代码
> 7. 调试要**从最小可运行版本开始**，崩溃点通常离真凶很远

## 相关笔记

- [[Rust编程/性能/unsafe 的正确用法|unsafe 的正确用法]]
- [[Rust编程/FFI/调用 Windows API（windows-rs）|调用 Windows API（windows-rs）]]
- [[Rust编程/工程/Cargo 工作区与依赖管理|Cargo 工作区与依赖管理]]
- [[Rust编程/README|Rust 编程]]
