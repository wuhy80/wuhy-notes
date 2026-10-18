---
version: alpha
name: 技术笔记站（claude-paper）
# Token 源：scripts/quartz.config.yaml 的 theme 段 + scripts/site-custom.scss
# 改颜色/字体请改 quartz.config.yaml，改样式规则请改 site-custom.scss，
# 本文件是二者的「契约摘要」——只描述，不承载实现。
colors:
  # 亮色（2026-10-11 起切换为暖纸色系，参考 xuanyuancode.com 课程页）
  primary: "#c0481e"          # 主色：链接与强调文字（赭橙，与 link 同值）
  surface: "#faf6ee"          # 页面底色（暖纸）
  ink: "#1e2b38"              # 正文文字（墨青）
  ink-secondary: "#5c6b79"    # 次要文字
  ink-tertiary: "#93a0ac"     # 弱化文字（行号、角标）
  border: "#e3d9c6"           # 边框、代码块底色（暖沙）
  accent: "#e05a28"           # 强调色（高亮条、当前态，暖橙）
  highlight: "#8f9fa926"      # 逐行高亮底色（rgba(143,159,169,.15) 转 hex）
  text-highlight: "#fff23688" # 正文荧光笔
  # 暗色（维持原值：参考站仅提供亮色方案）
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
  article-title:
    fontFamily: 系统 CJK 衬线栈（Noto Serif SC → 宋体系 → Georgia）
    fontWeight: 800
    fontSize: clamp(30px, 3.4vw, 46px)
    lineHeight: 1.22
    marginTop: 1.2rem
  h2:
    fontFamily: 同 article-title 衬线栈
    fontWeight: 700
    前缀: 3px 暖橙左边条
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
  # 纵向节奏（2026-10-18 收紧：标题与正文的间隔偏大；10-18 二次修复列表项间距）
  p-block: 0.8em      # 正文段落段间距（≥1800px 视口 1em）
  li-block: 0.15em    # 列表项之间贴紧；松散列表 li>p 另压 0.2em
  h2-block: 1.4em 0.45em   # h2 上/下外边距
  h3-block: 1.1em 0.35em   # h3 上/下外边距
  hero-top: 1.2rem    # 文章标题上边距
  meta-bottom: 0.9rem # 元信息行下边距（压底边线后）
  callout-in: 0       # callout 标题与内容贴合（content 顶部内边距归零）
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
亮/暗双模式）。2026-10-11 起视觉基调参考 xuanyuancode.com 的课程页风格：
**暖纸底、墨青正文、赭橙强调、衬线大标题**——仍是"正文是唯一焦点"的安静阅读
体验，只是从冷灰纸换成了暖纸，并加入了课程页的结构语汇（深色顶栏、左右栏
边线、目录编号）。

本文件是**给 coding agent 读的设计契约**。改动本站样式前先读它；
实现细节在 `scripts/site-custom.scss`，Token 定义在 `scripts/quartz.config.yaml`。

## Colors

- `primary` 是**链接与强调文字的专用色**（对应 Quartz 的 `secondary` token），别拿它做大面积填充
- `ink` / `ink-secondary` / `ink-tertiary` 是三级文字层次，**不要引入第四级**
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

- **内容铺满视口宽度（2026-10-18 恢复硬要求；80% 居中方案仅 10-11~10-17 存活一天多）**：
  `.page` 必须 `width: 100%; max-width: none`，且必须带 `!important`
  （主题会用更高特异性再设一遍）；`#quartz-body` 在其内吃满 100%
- 桌面（≥1200px）栅格为 `clamp(220px,16vw,300px) minmax(0,1fr) clamp(200px,14vw,280px)`：
  左右侧栏按视口比例伸缩、带下限，**中间正文列永远是三栏里最宽的一栏**
- 左右栏各以 1px 边线（`border`）与正文分隔（右栏 border-left、左栏 border-right），不用底色分区
- 顶栏（navbar）为深墨底（`ink`）+ 纸色文字，全站唯一深色块
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
- **文章 hero**：`h1.article-title` 衬线 800、`clamp(30px,3.4vw,46px)`，上边距 2.2rem；
  其下 `.content-meta` 小号弱化并压 1px 底边线，构成 hero 收口
- **frontmatter 属性表**（`details.note-properties.metadata-container`）：渲染成
  暖橙左边线引言框（3px `tertiary` + 6% 洗色），对应参考站的导语条
- **h2 小节**：衬线 700 + 3px 暖橙左边条
- **右栏目录**：`li.depth-1` 前加 `01/02…` 等宽字体编号（对应参考站编号小节导航）
- **左右栏**：≥1200px 时左栏 border-right、右栏 border-left（1px `border`）与正文分隔

## Do's and Don'ts

- 代码块**只有一层卡片**；`pre` / `code` **永不**再加边框、圆角、背景或阴影
- 卡片圆角使用 `rounded.md`，行内代码使用 `rounded.sm`，**永不混用**
- **代码字体栈里中文回退必须排在 `monospace` 之前**——否则中文会落到系统 serif（Windows 上是宋体），小字号下很难看
- 行号与语言角标**永不**使用正文色，必须是 `ink-tertiary` 且透明度 0.45
- `text` / `txt` / `plaintext` 代码块**永不**显示语言角标，顶部也不保留角标高度
- **永不**给 `.center` 只设 `min-width:100%` 而不设 `box-sizing:border-box`——实测会让它比栅格轨道宽（当前左右内边距 1rem×2=32px），被 `position:sticky` 的右边栏压住，表现为 callout 右边框消失、正文末字被盖
- **永不**用 `!important` 之外的普通规则去改内容区宽度——主题的特异性更高，改不动
- **⚠️ 改颜色必须同步改 `site-custom.scss` 的「Token 强制块」**：主题包
  `@quartz-themes/claude-paper` 会在自己的样式里重新声明 `--light/--lightgray/--tertiary`
  等变量且加载更晚（实测 2026-10-11：只改 yaml 时 `--tertiary` 计算值仍是主题的
  `#873f2b`），强制块用 `!important` 变量声明压过主题，且**只强制亮色**
  （`:root[saved-theme="light"]`）——裸 `:root` 会把亮色值灌进暗色模式
- 此版 Quartz 的**页头不在 `article` 里**（结构：`div.page-header` > `div.popover-hint`
  > `h1.article-title`；正文在 `article.popover-hint` 里），hero 相关选择器不能带 `article`
- 正文首个 `h1[id]`（Obsidian 惯例的 `# 标题`）**永不**显示——它与 hero 标题重复
- 正文**永不**使用纯黑，底色**永不**使用纯白
- 不新增上面未定义的间距值、圆角值与颜色

## 相关文件

| 文件 | 角色 |
|---|---|
| `scripts/quartz.config.yaml` | **Token 源**（颜色、字体、主题、插件） |
| `scripts/site-custom.scss` | **样式实现**（含每条硬规则的实测依据） |
| `scripts/DESIGN.md` | **本文件**：给 agent 的设计契约 |
| `.github/workflows/publish-site.yml` | 发布流水线（把上面两个文件覆盖进 Quartz 后构建） |
