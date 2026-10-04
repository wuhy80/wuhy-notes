---
version: alpha
name: 技术笔记站（claude-paper）
# Token 源：scripts/quartz.config.yaml 的 theme 段 + scripts/site-custom.scss
# 改颜色/字体请改 quartz.config.yaml，改样式规则请改 site-custom.scss，
# 本文件是二者的「契约摘要」——只描述，不承载实现。
colors:
  # 亮色
  primary: "#284b63"          # 主色：链接与强调文字（与 link 同值）
  surface: "#faf8f8"          # 页面底色
  ink: "#2b2b2b"              # 正文文字
  ink-secondary: "#4e4e4e"    # 次要文字
  ink-tertiary: "#b8b8b8"     # 弱化文字（行号、角标）
  border: "#e5e5e5"           # 边框、代码块底色
  link: "#284b63"             # 链接与强调文字
  accent: "#84a59d"           # 强调色（高亮条、当前态）
  highlight: "#8f9fa926"      # 逐行高亮底色（rgba(143,159,169,.15) 转 hex）
  text-highlight: "#fff23688" # 正文荧光笔
  # 暗色
  surface-dark: "#161618"
  ink-dark: "#ebebec"
  ink-secondary-dark: "#d4d4d4"
  ink-tertiary-dark: "#646464"
  border-dark: "#393639"
  link-dark: "#7b97aa"
  highlight-dark: "#b3aa0288"
typography:
  header:
    fontFamily: Schibsted Grotesk
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: Source Sans Pro
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.75
  body-wide:
    fontFamily: Source Sans Pro
    fontSize: 1rem
    lineHeight: 1.8          # ≥1800px 视口时启用
  code:
    fontFamily: IBM Plex Mono
    fontSize: 0.875rem
    lineHeight: 1.75
  code-inline:
    fontFamily: IBM Plex Mono
    fontSize: 0.86em
  code-label:
    fontFamily: IBM Plex Mono
    fontSize: 0.64rem
    lineHeight: 1
rounded:
  sm: 5px     # 行内代码
  md: 10px    # 代码块卡片
spacing:
  sm: 0.5rem
  md: 1rem
  lg: 1.5rem
  code-y: 1.1rem      # 代码块上下外边距
  code-x: 1.15rem     # 代码块左右内边距
components:
  code-block:
    backgroundColor: "{colors.border}"
    rounded: "{rounded.md}"
    textColor: "{colors.ink}"
  inline-code:
    backgroundColor: "{colors.border}"
    rounded: "{rounded.sm}"
    textColor: "{colors.ink}"
  code-line-number:
    textColor: "{colors.ink-tertiary}"
    typography: "{typography.code}"
  code-language-label:
    textColor: "{colors.ink-tertiary}"
    typography: "{typography.code}"
  link:
    textColor: "{colors.primary}"
  highlighted-line:
    backgroundColor: "{colors.highlight}"
  highlight-bar:
    backgroundColor: "{colors.accent}"
  mark:
    backgroundColor: "{colors.text-highlight}"
    textColor: "{colors.ink}"
---

## Overview

中文技术笔记站点，内容以长文阅读为主（Quartz 静态生成，主题 `claude-paper`，
亮/暗双模式）。视觉基调应**安静、克制**：正文是唯一焦点，装饰一律让位于可读性。

本文件是**给 coding agent 读的设计契约**。改动本站样式前先读它；
实现细节在 `scripts/site-custom.scss`，Token 定义在 `scripts/quartz.config.yaml`。

## Colors

- `ink` / `ink-secondary` / `ink-tertiary` 是三级文字层次，**不要引入第四级**
- `link` 是链接与强调文字的专用色
- `accent` 只用于**当前态与高亮条**，不做大面积填充
- `border` 同时充当**代码块与行内代码的底色**（两者同色，靠圆角与内边距区分）
- 暗色模式使用 `-dark` 后缀的同名 token，不另造颜色
- ⚠️ 本站点**不使用纯黑（#000）与纯白（#fff）**作为正文或底色

## Typography

- 标题 `Schibsted Grotesk`，正文 `Source Sans Pro`，代码 `IBM Plex Mono`（均为自托管）
- 正文 1rem / 行高 1.75；**≥1800px 视口时行高提到 1.8**（超宽行宽下的视线回扫补偿）
- 代码块 0.875rem / 行高 1.75，`tab-size: 4`
- 标题层级最多到 `h3`，不再往下分

## Layout

- **内容铺满视口宽度（硬要求）**：无论换哪个主题，`.page` 与 `#quartz-body` 都必须
  `max-width: none; width: 100%`，且必须带 `!important`（主题会用更高特异性再设一遍）
- 桌面（≥1200px）栅格固定为 `360px minmax(0, 1fr) 360px`：左右侧栏固定，中间正文列吃掉剩余空间
- 间距只用上面 `spacing` 里定义的值

## Elevation & Depth

- 全站**只有一种阴影**：代码块卡片的 `0 1px 2px rgba(20,20,19,0.06)`
- 除代码块外，**任何元素都不使用投影**；层次靠边框与底色区分
- 不使用玻璃拟态（backdrop-filter）、不使用渐变背景

## Shapes

- 行内代码圆角 `rounded.sm`（5px），代码块卡片圆角 `rounded.md`（10px）
- **除这两个之外不引入新的圆角值**

## Components

- **代码块**：全站唯一带边框+圆角+底色的卡片（边框 `1px solid {colors.border}`，底色 `{colors.border}`，圆角 `{rounded.md}`，阴影 `0 1px 2px rgba(20,20,19,0.06)`）
  - 只允许 `figure[data-rehype-pretty-code-figure]` 一层承载边框与背景
  - `pre` 与 `code` 必须透明、无边框、无圆角、无阴影
  - 右上角显示语言角标（`0.64rem`、大写、字距 `0.09em`、透明度 `0.45`）
  - 行号：右对齐、宽 `1.6rem`、右边距 `1.05rem`、透明度 `0.45`、`0.82em`
  - 逐行高亮用内阴影 `inset 2px 0 0 {colors.accent}`，**不挤动文字**
  - 横向滚动条高 `8px`，滑块用 `border` 色，轨道透明
- **行内代码**：只有底色与圆角，**不要方框感**（无边框）
- **Callout 内的代码块**：首尾外边距归零，避免与 callout 内边距叠加

## Do's and Don'ts

- 代码块**只有一层卡片**；`pre` / `code` **永不**再加边框、圆角、背景或阴影
- 卡片圆角使用 `rounded.md`，行内代码使用 `rounded.sm`，**永不混用**
- **代码字体栈里中文回退必须排在 `monospace` 之前**——否则中文会落到系统 serif（Windows 上是宋体），小字号下很难看
- 行号与语言角标**永不**使用正文色，必须是 `ink-tertiary` 且透明度 0.45
- `text` / `txt` / `plaintext` 代码块**永不**显示语言角标，顶部也不保留角标高度
- **永不**给 `.center` 只设 `min-width:100%` 而不设 `box-sizing:border-box`——实测会让它比栅格轨道宽 48px，被 `position:sticky` 的右边栏压住 43px，表现为 callout 右边框消失、正文末字被盖
- **永不**用 `!important` 之外的普通规则去改全屏宽度——主题的特异性更高，改不动
- 正文**永不**使用纯黑，底色**永不**使用纯白
- 不新增上面未定义的间距值、圆角值与颜色

## 相关文件

| 文件 | 角色 |
|---|---|
| `scripts/quartz.config.yaml` | **Token 源**（颜色、字体、主题、插件） |
| `scripts/site-custom.scss` | **样式实现**（含每条硬规则的实测依据） |
| `scripts/DESIGN.md` | **本文件**：给 agent 的设计契约 |
| `.github/workflows/publish-site.yml` | 发布流水线（把上面两个文件覆盖进 Quartz 后构建） |
