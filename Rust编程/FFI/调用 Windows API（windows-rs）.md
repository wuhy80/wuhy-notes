---
tags:
  - Rust
  - windows-rs
  - Windows
  - FFI
  - 系统编程
created: 2026-10-02
updated: 2026-10-02
status: 初稿
---

# 调用 Windows API（windows-rs）

> [!summary] 一句话理解
> `windows-rs` 是微软官方的 Rust Windows API 绑定，能调 Win32、COM、WinRT。
>
> 定位要摆正：**它是“系统能力层”，不是“UI 框架”**。做界面用 Tauri / egui / Slint（见 [[Rust编程/GUI/Rust 在 Windows 上的 GUI 方案选型|Rust 在 Windows 上的 GUI 方案选型]]），只在需要系统集成时用 windows-rs 补齐能力。

> [!warning] 先读这条：接口在不同版本间会变
> `windows` crate 在 0.5x → 0.6x 之间有过好几轮调整：句柄参数在 `Option<HWND>` 与 `HWND` 之间反复、泛型 `Param<PCWSTR>` 参数被移除、部分函数从安全变为 `unsafe`。
>
> **本文的重点是模式（宽字符串、`unsafe`、HRESULT→`Result`、句柄生命周期），不是精确签名。** 复制代码前请对照 [docs.rs 上你锁定的那个版本](https://docs.rs/windows/)——照抄博客里的老代码是最常见的踩坑方式。

## 1. `windows` 与 `windows-sys` 怎么选

| | `windows` | `windows-sys` |
|---|---|---|
| 抽象层次 | 高层：类型安全的包装、`Result`、智能句柄 | 原始绑定，C 风格函数签名 |
| 返回值 | `Result<T, windows::core::Error>`（HRESULT 自动转换） | 裸 `HRESULT` / 返回值，自己判错 |
| 字符串 | `HSTRING`、`PCWSTR`、`w!()` 宏 | 裸 `*const u16` |
| 编译速度 | 较慢（模块多，但可按需开 feature） | 快很多 |
| 适合 | 大多数场景 | 只需几个 API、在意编译时间 |

**建议**：默认用 `windows`；如果只是调三五个 API 且在意编译时间，用 `windows-sys`。

## 2. 依赖与 feature

```toml
[dependencies]
windows = { version = "0.62", features = [
    "Win32_Foundation",                   # HANDLE、BOOL 等基础类型
    "Win32_UI_WindowsAndMessaging",       # 消息框、窗口、消息
    "Win32_Storage_FileSystem",           # 文件与磁盘
    "Win32_System_Com",                   # COM
    "Win32_System_Registry",              # 注册表
] }
```

> [!important] feature 名就是模块路径
> `Win32_UI_WindowsAndMessaging` 对应 `windows::Win32::UI::WindowsAndMessaging`。**按需开**——`windows` 全量 feature 会让编译时间显著变长。

## 3. 宽字符串：Windows 的字符串是 UTF-16

Windows 的 `...W` 系列 API 接收 `LPCWSTR`（以 `\0` 结尾的 UTF-16 序列）。三种做法：

```rust
use windows::core::{w, HSTRING, PCWSTR};

// ① 编译期字面量（零分配，首选）
let s: PCWSTR = w!("Hello");

// ② 运行期构造（拥有型，自动管理内存）
let h = HSTRING::from("动态字符串");

// ③ 手动构造（最原始，也最清楚发生了什么）
let wide: Vec<u16> = "手动构造\0".encode_utf16().collect();
let p = PCWSTR(wide.as_ptr());
```

| 类型 | 含义 |
|---|---|
| `PCWSTR` | 指向不可变 UTF-16 字符串的指针 |
| `PWSTR` | 可变版本（用于接收输出的缓冲区） |
| `HSTRING` | 拥有型、引用计数的宽字符串（WinRT 风格） |
| `w!()` | 编译期 `PCWSTR` 字面量 |

Rust 的 `&str` **不能**直接传给 `...W` API，必须经过上面任一转换。这就是 Windows FFI 代码里大量宽字符串的来源。

## 4. 第一个例子：消息框

```rust
use windows::core::w;
use windows::Win32::UI::WindowsAndMessaging::{
    MessageBoxW, MB_ICONINFORMATION, MB_OK,
};

fn main() {
    // SAFETY: 传入的是编译期常量字符串，参数与 API 签名一致；
    // 该 API 只读取字符串内容，不保存指针。
    unsafe {
        MessageBoxW(None, w!("来自 Rust 的问候"), w!("标题"), MB_OK | MB_ICONINFORMATION);
    }
}
```

要观察的点：

- `w!()` 生成的是 `PCWSTR`，**不是 Rust 的 `&str`**
- 整个调用包在 `unsafe` 里：`MessageBoxW` 是 `unsafe fn`
- 标志位用 `|` 组合（位标志类型，不是裸整数）
- `// SAFETY:` 注释说明为什么这里安全——这是社区惯例

## 5. HRESULT → `Result`

`windows` crate 把返回 `HRESULT` 的 API 包成了 `windows::core::Result<T>`（`HRESULT` 成功时返回 `Ok`，失败时把错误码装进 `Error`）：

```rust
use windows::core::Result;

fn do_something() -> Result<()> {
    // 直接用 ? 传播
    // some_com_api()?;
    Ok(())
}
```

| 概念 | 说明 |
|---|---|
| `HRESULT` | 32 位整数，`>= 0` 表示成功 |
| `windows::core::Error` | 包装 HRESULT，可 `.code()` 取原始值，`Display` 会给出系统错误描述 |
| `windows::core::Result<T>` | `Result<T, windows::core::Error>` |

## 6. 示例：查询磁盘剩余空间

```rust
use windows::core::PCWSTR;
use windows::Win32::Storage::FileSystem::GetDiskFreeSpaceExW;

fn disk_space(drive: &str) -> windows::core::Result<(u64, u64)> {
    // "C:\\" → 宽字符串（记得结尾的 NUL）
    let wide: Vec<u16> = drive.encode_utf16().chain(std::iter::once(0)).collect();

    let mut free_to_caller = 0u64;
    let mut total = 0u64;
    let mut total_free = 0u64;

    // SAFETY: wide 是以 NUL 结尾的合法 UTF-16 缓冲区；
    // 三个输出参数都指向本函数栈上的有效 u64。
    unsafe {
        GetDiskFreeSpaceExW(
            PCWSTR(wide.as_ptr()),
            Some(&mut free_to_caller),
            Some(&mut total),
            Some(&mut total_free),
        )?;
    }

    Ok((total_free, total))
}
```

这个模式在 Windows 系统编程里反复出现：**构造宽字符串 → 准备输出变量 → `unsafe` 调用 → `?` 处理 HRESULT**。

> [!tip] 函数名带 `W` 还是 `A`
> `...W` 是宽字符（UTF-16）版本，`...A` 是 ANSI 版本。**在 Rust 里一律用 `W` 版本**——`A` 版本受系统代码页影响，中文环境下会产生乱码。

## 7. COM：初始化与接口

```rust
use windows::Win32::System::Com::{CoInitializeEx, CoUninitialize, COINIT_APARTMENTTHREADED};

fn main() -> windows::core::Result<()> {
    // SAFETY: 在单线程里成对调用 CoInitializeEx / CoUninitialize
    unsafe {
        CoInitializeEx(None, COINIT_APARTMENTTHREADED).ok()?;
        // ... 使用 COM 对象 ...
        CoUninitialize();
    }
    Ok(())
}
```

要点：

- **每个使用 COM 的线程**都要 `CoInitializeEx`
- 必须与 `CoUninitialize` 成对；用 RAII 包装更稳妥
- 线程模型选择：GUI 线程用 `COINIT_APARTMENTTHREADED`（STA），后台工作线程用 `COINIT_MULTITHREADED`（MTA）
- 接口调用：`&interface` 就能拿到方法，`interface.cast::<IOther>()?` 做接口查询（内部是 `QueryInterface`）

> [!warning] COM 的生命周期与线程亲和性
> STA 下的 COM 对象**只能在创建它的线程使用**。把接口句柄 `Send` 到别的线程再调用，是典型的间歇性崩溃来源。需要跨线程时，走 MTA 或自己做封送。

## 8. 句柄与资源释放

Windows 里有大量句柄：`HANDLE`、`HWND`、`HKEY`、`HMODULE`……它们**不会自动释放**。

```rust
use windows::Win32::Foundation::{CloseHandle, HANDLE};

// 手动模式：必须在所有路径上关闭
let h: HANDLE = /* ... */;
// ...
unsafe { let _ = CloseHandle(h); }
```

更稳的做法是**自己包一层 RAII**：

```rust
struct OwnedHandle(HANDLE);

impl Drop for OwnedHandle {
    fn drop(&mut self) {
        // SAFETY: 句柄由本结构体独占拥有，只在这里关闭一次
        unsafe { let _ = CloseHandle(self.0); }
    }
}
```

新版 `windows` crate 也提供了 `windows::core::Owned<T>` 之类的包装（不同版本名称/位置有差异）。**核心原则不变：句柄必须有人负责关闭，且只关一次。**

## 9. 权限与 manifest

需要管理员权限的操作（写 `Program Files`、改系统服务、访问某些注册表键）要求进程有提权清单：

```xml
<!-- app.manifest -->
<assembly xmlns="urn:schemas-microsoft-com:asm.v1" manifestVersion="1.0">
  <trustInfo xmlns="urn:schemas-microsoft-com:asm.v3">
    <security>
      <requestedPrivileges>
        <requestedExecutionLevel level="requireAdministrator" uiAccess="false"/>
      </requestedPrivileges>
    </security>
  </trustInfo>
</assembly>
```

在 `build.rs` 里嵌入（用 `embed-manifest`、`winres` 之类的 crate）。

> [!warning] 别习惯性要求管理员权限
> 提权会带来 UAC 弹窗、无法拖放文件（UIPI 限制）、以管理员身份运行时的路径差异等一连串副作用。**只在真正需要时提权**，更好的做法是把需要提权的操作拆成独立的小进程按需调用。

## 10. 常用子系统速查

| 需求 | 模块 |
|---|---|
| 注册表 | `Win32::System::Registry`（`RegOpenKeyExW`、`RegQueryValueExW`） |
| 文件与磁盘 | `Win32::Storage::FileSystem` |
| 进程与线程 | `Win32::System::Threading` |
| 服务 | `Win32::System::Services` |
| Shell（托盘、通知、文件关联） | `Win32::UI::Shell` |
| 窗口与消息 | `Win32::UI::WindowsAndMessaging` |
| 控制台 | `Win32::System::Console` |
| 安全性/令牌 | `Win32::Security` |
| 事件日志 | `Win32::System::EventLog` |
| 系统信息 | `Win32::System::SystemInformation` |

## 11. 把 `unsafe` 关进最小范围

> [!important] 分层原则
> **每个 unsafe 调用都立刻包成一个安全函数**，让上层代码完全看不到 `unsafe`：
>
> ```rust
> // 安全 API：调用方不需要 unsafe，也不可能触发 UB
> pub fn available_disk_bytes(drive: &str) -> std::io::Result<u64> {
>     let wide: Vec<u16> = drive.encode_utf16().chain(std::iter::once(0)).collect();
>     let mut total_free = 0u64;
>     // SAFETY: wide 是 NUL 结尾的合法缓冲区；输出参数指向栈上有效变量
>     unsafe {
>         GetDiskFreeSpaceExW(PCWSTR(wide.as_ptr()), None, None, Some(&mut total_free))
>             .map_err(|e| std::io::Error::other(e.to_string()))?;
>     }
>     Ok(total_free)
> }
> ```
>
> 这就是 [[Rust编程/性能/unsafe 的正确用法|unsafe 的正确用法]] 里讲的“安全抽象”：**`unsafe` 在内，安全接口在外**。

## 12. 和 GUI 怎么配合

```text
UI 层    ：Tauri（Web 前端） / egui / Slint
业务层   ：纯 Rust —— 扫描、计算、生成计划
系统层   ：windows-rs —— 磁盘信息、权限、Shell、注册表、回收站
安全层   ：dry-run、风险分级、白名单、操作日志
```

**不要让 windows-rs 承担整套 GUI**（Win32 手写界面成本极高）；也不要为了“纯 Rust”放弃成熟的 UI 生态。详见 [[Rust编程/GUI/Rust 在 Windows 上的 GUI 方案选型|Rust 在 Windows 上的 GUI 方案选型]]。

## 13. 常见坑

| 现象 | 原因 | 修法 |
|---|---|---|
| 中文变成乱码 | 用了 `...A` 版本或编码假设错 | 一律用 `...W` + 宽字符串 |
| 编译找不到类型 | feature 没开 | 加上对应 `Win32_*` feature |
| 字符串结尾没 NUL | 忘了 `.chain(once(0))` | 手动构造时**必须**补 `\0` |
| 程序偶尔崩 / 句柄泄漏 | 句柄没关或关了两次 | RAII 包装，明确唯一所有者 |
| `E_ACCESSDENIED` | 权限不足 | 检查 manifest 与令牌，别盲目加管理员权限 |
| UAC 每次弹窗 | 清单里设了 `requireAdministrator` | 拆出独立提权进程，按需调用 |
| COM 调用时崩 | 没初始化，或跨线程用了 STA 对象 | 每线程 `CoInitializeEx`；注意线程模型 |
| 按老博客抄的代码编译不过 | windows-rs 版本间的签名变化 | 对照 docs.rs 你锁定的版本 |
| 编译特别慢 | 开了太多 feature | 按需精简特征列表 |

## 14. 小结

> [!summary] 关键判断
> 1. **`windows` 用于高层封装，`windows-sys` 用于少而快的调用**
> 2. Windows 字符串是 **UTF-16**：用 `w!()` / `HSTRING` / 手动补 NUL；**一律用 `...W` 版本**
> 3. HRESULT 被包装成 **`Result`**，可以 `?` 传播
> 4. **句柄不自动释放**：RAII 包装，明确唯一所有者
> 5. COM 要**每线程初始化**，注意 STA 的线程亲和性
> 6. **把 `unsafe` 封在安全函数里**，上层代码看不到 `unsafe`
> 7. windows-rs 是**系统能力层**，不要用它写 GUI
> 8. **接口签名随版本变**——照 docs.rs 上你锁定的版本写

## 相关笔记

- [[Rust编程/GUI/Rust 在 Windows 上的 GUI 方案选型|Rust 在 Windows 上的 GUI 方案选型]]
- [[Rust编程/FFI/与 C 互操作|与 C 互操作]]
- [[Rust编程/性能/unsafe 的正确用法|unsafe 的正确用法]]
- [[Rust编程/生态/常用 crate 选型|常用 crate 选型]]
- [[Rust编程/README|Rust 编程]]
