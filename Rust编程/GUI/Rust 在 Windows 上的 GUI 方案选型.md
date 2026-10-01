---
tags:
  - Rust
  - GUI
  - Windows
  - Tauri
  - egui
  - Slint
created: 2026-06-06
updated: 2026-06-06
status: 初稿
---

# Rust 在 Windows 上的 GUI 方案选型

## 结论

Windows 上 Rust GUI 方案大致可以分成几类：

- WebView 桌面应用：Tauri、Dioxus Desktop。
- 纯 Rust 自绘 UI：egui、iced、Slint。
- Windows 原生 API：windows-rs、native-windows-gui。
- 传统跨平台 GUI：Qt、FLTK、GTK。
- 游戏/渲染式 UI：winit、wgpu、bevy_egui 等。

> [!summary]
> 做普通桌面工具，优先考虑 Tauri / egui / Slint；做深度 Windows 系统集成，再引入 windows-rs；不建议第一版直接用 Win32 API 手写完整 GUI。

## 快速选择

| 场景 | 推荐方案 |
|---|---|
| 想快速做漂亮管理台或工具，有前端经验 | Tauri |
| 想纯 Rust，做小工具、调试器、监控面板 | egui / eframe |
| 想纯 Rust + 正经产品 UI + 声明式界面 | Slint |
| 想 Rust 风格架构，跨平台应用 | iced |
| 想 React 风格但用 Rust 写 UI | Dioxus Desktop |
| 只做 Windows，深度调用系统 API | windows-rs |
| 轻量 Win32 原生控件 | native-windows-gui |
| 复杂企业桌面，已有 Qt 经验 | CXX-Qt / Qt QML |

## 1. Tauri

Tauri 用 Rust 做后端，用系统 WebView 渲染前端。Windows 上使用 WebView2。

适合：

- 配置工具。
- 管理台。
- 数据看板。
- 文件清理工具。
- 需要漂亮 UI 的桌面应用。
- 已经会 Vue / React / Svelte / HTML/CSS 的团队。

优点：

- UI 生态最强，可以直接使用 Web 前端。
- Rust 负责系统能力、文件扫描、后台任务。
- 包体通常比 Electron 小。
- 插件、打包、更新、权限模型比较成熟。

缺点：

- 不是纯 Rust UI。
- 有前后端 IPC 边界。
- 依赖系统 WebView2。
- 做极致原生 Windows 体验不如 WinUI。

适合架构：

```text
Tauri 前端：目录树 / 大文件列表 / 清理建议 / 风险提示
Rust 后端：扫描磁盘 / 分类 / dry-run / 调用系统命令 / 安全删除
Windows API：权限、回收站、磁盘信息、系统目录识别
```

## 2. egui / eframe

egui 是纯 Rust 的 immediate mode GUI。`eframe` 是常用应用框架。

适合：

- 小工具。
- 内部工具。
- 调试面板。
- 性能监控。
- 数据可视化。
- 不追求系统原生外观的桌面程序。

优点：

- 上手快。
- 纯 Rust。
- 状态管理简单。
- 很适合工具型 UI。
- 跨平台和 WebAssembly 都比较方便。

缺点：

- 不像 Windows 原生控件。
- 复杂表单、复杂布局、可访问性、系统级体验不如成熟 UI 框架。
- immediate mode 对大型业务 UI 需要约束代码结构。

适合用来快速做 MVP，例如：

- 左侧目录树。
- 右侧文件列表。
- 底部 dry-run 清理计划。
- 扫描进度和日志面板。

## 3. Slint

Slint 是声明式 GUI 框架，支持 Rust，强调轻量、跨平台、桌面和嵌入式。

适合：

- 工业软件。
- 设备管理工具。
- 有固定设计规范的桌面应用。
- 希望 UI 和业务逻辑分离。
- 不想引入 Web 前端。

优点：

- UI 声明式，比纯 Rust 手写界面更清晰。
- 运行时轻。
- 比 egui 更像正式产品 UI 框架。
- 适合嵌入式、工业软件、跨平台桌面。

缺点：

- 需要学习 `.slint` UI 语言。
- 生态不如 Web。
- 复杂企业后台类组件不如前端生态丰富。

如果要做长期维护的 Rust 原生桌面工具，Slint 通常比 egui 更适合产品化。

## 4. iced

iced 是 Rust 跨平台 GUI 库，架构受 Elm 启发，强调类型安全和清晰状态更新。

适合：

- 纯 Rust 跨平台应用。
- 中等复杂度桌面工具。
- 喜欢状态驱动 UI 架构的人。

优点：

- Rust 风格比较明显。
- 架构清晰。
- 跨平台。
- 比 immediate mode 更适合传统应用结构。

缺点：

- 文档和生态体验不如 Tauri。
- 组件成熟度、复杂 UI 能力要具体评估。
- 对 Rust 初学者不算轻松。

## 5. Dioxus Desktop

Dioxus 是 Rust 的 React-like 框架，Desktop 模式底层使用系统 WebView。

适合：

- 想用 Rust 写前端组件。
- 熟悉 React 思路。
- 想一套代码覆盖 Web / Desktop / Mobile。

优点：

- Rust 写 UI。
- 组件化开发体验接近 React。
- 桌面端使用系统 WebView。

缺点：

- 仍然是 WebView 模式。
- 生态和稳定性要看项目要求。
- 如果团队已经会前端，Tauri + Web 前端通常更稳。

## 6. windows-rs

`windows-rs` 是 Microsoft 官方 Rust Windows API 绑定。它可以调用 Win32、COM、WinRT 等 Windows API。

适合：

- 深度 Windows 原生应用。
- 系统工具。
- 服务、托盘、注册表、权限、Shell 集成。
- 需要直接操作 Win32/WinUI/系统 API。

优点：

- Windows 能力最完整。
- 官方方向。
- 能做最原生的系统集成。

缺点：

- GUI 开发成本高。
- Win32/COM/WinRT 心智负担重。
- 很多地方会接触 unsafe、句柄、消息循环、COM 生命周期。
- 不适合快速做普通业务 UI。

推荐用法：

> [!note]
> UI 层使用 Tauri、egui 或 Slint，系统能力层使用 windows-rs 补充。例如读取磁盘信息、调用 Shell API、处理权限、访问注册表等。

## 7. native-windows-gui

native-windows-gui 是 Rust 上封装 Win32 控件的轻量 GUI 库。

适合：

- 只做 Windows。
- 小型原生工具。
- 想要 Win32 控件外观。
- 不想从零写 Win32。

优点：

- 比直接 Win32 简单。
- 依赖轻。
- 使用 Windows 原生控件。

缺点：

- 只适合 Windows。
- 现代 UI 能力有限。
- 维护活跃度需要谨慎评估。
- 外观更偏传统 Win32，不是现代 WinUI 风格。

## 8. Qt / FLTK / GTK

这些是传统跨平台 GUI 技术。

### Qt / CXX-Qt

适合：

- 已有 Qt/QML 经验。
- 复杂企业桌面。
- 需要成熟控件生态。

缺点：

- 引入 Qt 生态和构建复杂度。
- Rust 与 Qt/QML 边界需要额外适配。

### FLTK

适合：

- 轻量跨平台小工具。
- 对外观要求不高。

缺点：

- UI 风格较传统。
- 生态不如 Web 或 Qt。

### GTK / Relm4

适合：

- Linux 桌面生态。
- GTK 应用。

在 Windows 上可用，但如果主要目标是 Windows，一般不是首选。

## Windows C 盘清理工具的推荐方案

如果要做一个 Windows C 盘清理工具，推荐优先级：

1. **Tauri**：正式产品版首选。
2. **egui**：快速验证 MVP 首选。
3. **Slint**：不想用 Web，但希望产品化 UI。
4. **windows-rs**：作为系统能力补充，不建议独自承担 GUI。

推荐架构：

```text
UI 层：
  Tauri / egui / Slint

业务层：
  Rust 扫描目录、识别缓存、计算大小、生成清理计划

系统层：
  windows-rs 调用 Windows API
  DISM / Storage Sense / cleanmgr 等官方能力

安全层：
  dry-run
  风险分级
  白名单/黑名单
  回收站删除
  操作日志
```

不建议第一版做：

- 纯 Win32 手写完整 GUI。
- 自己删除 WinSxS、Windows Installer、系统更新组件。
- 为了“纯 Rust”放弃成熟 UI 生态。

## 最终建议

> [!summary]
> 如果目标是做一个实用 Windows 桌面工具，优先 Tauri；如果目标是快速验证 Rust 逻辑，优先 egui；如果目标是长期做 Rust 原生产品，考虑 Slint。windows-rs 更适合作为系统能力补充，而不是承担整套 GUI。

## 参考资料

- [Tauri WebView versions](https://v1.tauri.app/v1/references/webview-versions/)
- [egui](https://github.com/emilk/egui)
- [iced](https://docs.iced.rs/)
- [Slint](https://slint.rs/)
- [Dioxus Desktop](https://dioxus.dev/learn/0.6/guides/desktop/)
- [Rust for Windows](https://learn.microsoft.com/windows/dev-environment/rust/rust-for-windows)
- [native-windows-gui](https://github.com/gabdube/native-windows-gui)
- [fltk-rs](https://github.com/fltk-rs/fltk-rs)
- [CXX-Qt](https://kdab.github.io/cxx-qt/book/)

