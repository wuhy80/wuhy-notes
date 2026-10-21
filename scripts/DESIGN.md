---
version: alpha
name: 技术笔记站（claude-paper）
# Token 源：scripts/quartz.config.yaml 的 theme 段 + scripts/site-custom.scss
# 改颜色/字体请改 quartz.config.yaml，改样式规则请改 site-custom.scss，
# 本文件是二者的「契约摘要」——只描述，不承载实现。
colors:
  # 参考站调色板（2026-10-18 二次对齐：直接取自 xuanyuancode.com 课程页
  # .ai-llm-scope 自己声明的 CSS 变量，不再是像素采样近似值）
  paper: "#f5eddb"          # --paper      页面纸底（body / #quartz-body / 左右侧栏 / 中栏同色）
  paper-deep: "#ede3c4"     # --paper-deep 深一档纸色（表头、callout 内嵌代码块）
  card: "#ffffff"           # --paper-card 卡片底（代码块、表格、callout；同参考站 .fig-frame/.quiz-item）
  ink: "#1c1c1c"            # --ink        正文与标题
  ink-soft: "#57544e"       # --ink-soft   次要文字
  ink-faint: "#8c8676"      # --ink-faint  弱化文字（元信息、行号、语言角标）
  line: "#d8ceb6"           # --line       边线（侧栏分隔、表格框、卡片描边；同时是 Quartz lightgray）
  accent: "#c2410c"         # --accent     链接、h2 左边条、目录编号、属性框左边条（Quartz secondary）
  accent-deep: "#9a3010"    # --accent-deep 当前态文字、行内代码文字
  accent-warm: "#e0561f"    # --accent-warm 当前态描边与高亮条（Quartz tertiary）
  accent-wash: "#fbe6c7"    # --accent-wash 当前态洗色（Quartz highlight、逐行高亮底色）
  inline-code: "rgba(194, 65, 12, 0.08)"      # 行内代码底（accent 8% 洗色）
  text-highlight: "rgba(225, 181, 92, 0.45)"  # 荧光笔（暖金，取自参考站 highlight 色相）
  # Quartz token 映射（quartz.config.yaml 的 lightMode；必须与 site-custom.scss 的
  # 「0/6 调色板」强制块逐值一致，两边冲突时以 scss 为准）
  quartz-light: "#f5eddb"
  quartz-lightgray: "#d8ceb6"
  quartz-gray: "#8c8676"
  quartz-darkgray: "#57544e"
  quartz-dark: "#1c1c1c"
  quartz-secondary: "#c2410c"
  quartz-tertiary: "#e0561f"
  quartz-highlight: "#fbe6c7"
  # 暗色（2026-10-18 未改：沿用 claude-paper 主题原暗色；scss 里另有一份同名映射）
  paper-dark: "#30302e"
  paper-deep-dark: "#262624"
  card-dark: "#383835"
  ink-dark: "#faf9f5"
  ink-soft-dark: "#c2c0b6"
  ink-faint-dark: "#9c9a92"
  line-dark: "rgba(222, 220, 209, 0.16)"
  accent-dark: "#e38b6b"
  accent-deep-dark: "#f0a283"
  accent-wash-dark: "rgba(227, 139, 107, 0.15)"
typography:
  # 2026-10-18 字体与参考站（xuanyuancode）靠齐：标题 = 阿里妈妈数黑体
  # （自托管 woff2，发布流水线拷入 Quartz static/font/），正文 = 参考站
  # --sans 同链（Noto Sans SC 缺省时落到苹方/雅黑，无 webfont）
  header:
    fontFamily: AlimamaShuHeiTi
    fontWeight: 700
    lineHeight: 1.25
  article-title:
    fontFamily: AlimamaShuHeiTi
    fontWeight: 900
    fontSize: 48px
    lineHeight: 1.22
    marginTop: 1.4rem
  h2:
    fontFamily: AlimamaShuHeiTi
    fontWeight: 900
    fontSize: 25px
    lineHeight: 1.3
    前缀: 站号徽标「第 N 站」（accent 底 + paper 字 + 等宽 11px/字距 .22em）+ 右侧 170px 水印数字
  h3:
    fontFamily: AlimamaShuHeiTi
    fontWeight: 900
    fontSize: 17px
  body:
    fontFamily: Noto Sans SC → 苹方 → 雅黑（参考站 --sans 同链）
    fontSize: 17px
    fontWeight: 400
    lineHeight: 1.95
    color: "{colors.ink}"
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
  # 纵向节奏（2026-10-21 按参考站实测重定：段距 20px、站间距 68/24px）
  p-block: 20px       # 正文段落段间距（参考站 .station p { margin-top: 20px }）
  li-block: 0         # 列表项外边距归零（行高随正文 1.95）
  li-p-block: 0.1em   # 松散列表 li>p 段落间距
  h2-block: 68px 24px # h2 上/下外边距（参考站 .station 上留白 68、标题下 24）
  h3-block: 34px 12px # h3 上/下外边距
  hero-top: 1.4rem    # 文章标题上边距
  meta-bottom: 10px   # eyebrow 下边距
  callout-in: 0       # callout 标题与内容贴合
layout:
  # 参考站原栅格：40 + 260 + 82 + 716 + 82 + 220 + 40 = 1440
  # 2026-10-21 两次放大（用户要求）：侧栏各 +50% 后继续加宽，尤其左栏；
  # 正文 716 → 980。当前 500 + 82 + 980 + 82 + 390 = 2034 为外壳上限。
  container: 2034px            # 三栏总宽上限，居中（视口更宽时两侧留白）
  columns: clamp(240px,26vw,500px) minmax(0,1fr) clamp(200px,20.3vw,390px)
  article: 980px               # 正文列上限（阅读宽度），列内居中；不足 2034 时侧栏按 vw 回缩，优先保正文
  article-padding: 24px        # 正文与侧栏边线之间的呼吸位（中列上限 = 980 + 48 = 1028）
  sidebar-left: 500px          # 下限 240（26vw 回缩；刻意比右栏宽，用户要求「尤其左边栏」）
  sidebar-right: 390px         # 下限 200（20.3vw 回缩）
  rail-padding: 28px 0 48px 22px
  navbar: 64px                 # 深色固定顶栏（rgba(28,28,28,.96) + 底边 1px 白 10%）
  progress-bar: 2px            # accent 色阅读进度条（纯 CSS 滚动驱动）
  footer: 980px                # 深色页脚，与正文列同宽（含 24 内边距）
components:
  code-block:
    backgroundColor: "{colors.card}"
    borderColor: "{colors.line}"
    rounded: "{rounded.md}"
    textColor: "{colors.ink}"
  inline-code:
    backgroundColor: "{colors.inline-code}"
    rounded: "{rounded.sm}"
    textColor: "{colors.accent-deep}"
  table:
    backgroundColor: "{colors.card}"
    borderColor: "{colors.line}"
    headerBackgroundColor: "{colors.paper-deep}"
  callout:
    backgroundColor: "{colors.card}"
    borderColor: "{colors.line}"
    accentBarColor: "{colors.accent}"   # 2026-10-21 起统一赭橙（不再按类型上色）
    titleColor: "{colors.ink}"
    rounded: 4px
    abstractVariant: 导语条（无卡片、无标题、衬线字体 + 3px accent 左边条）
  figure-card:            # 插图白卡（对应参考站 .fig-frame）
    backgroundColor: "{colors.card}"
    borderColor: "{colors.line}"
    padding: 26px 22px 18px
    rounded: 0
    captionTextColor: "{colors.ink-faint}"
    captionFontSize: 13px
    figureNumberColor: "{colors.accent}"   # 「图 3-1」等宽赭橙（导出时注入 .fig-no）
  station-badge:          # 「第 N 站」徽标（h2::before）
    backgroundColor: "{colors.accent}"
    textColor: "{colors.paper}"
    typography: IBM Plex Mono 11px / 字距 0.22em
  station-watermark:      # 站号水印（h2::after，170px，颜色很淡）
    textColor: "rgba(28,28,28,0.055)"
  dropcap:                # 小节首字下沉（h2 + p::first-letter）
    fontSize: 3.2em
    textColor: "{colors.accent}"
  eyebrow:                # 标题上方的元信息行（.content-meta）
    typography: IBM Plex Mono 12px / 字距 0.1em
    textColor: "{colors.accent}"
  toc-marker:             # 右栏目录的圆点标记（未激活 ○ / 激活 ●）+ 编号
    textColor: "{colors.accent}"
  navbar:                 # 深色固定顶栏（复用左栏的 .page-title，fixed 定位）
    backgroundColor: "rgba(28,28,28,0.96)"
    textColor: "{colors.paper}"
    borderBottom: "1px rgba(255,255,255,0.1)"
  footer:                 # 深色页脚
    backgroundColor: "{colors.ink}"
    textColor: "color-mix(in srgb, paper 68%, transparent)"
  quiz:                   # 测验（enhance-content.cjs 把 callout 结构化后才有）
    badgeBackgroundColor: "{colors.accent}"
    itemBackgroundColor: "{colors.card}"
    itemBorderColor: "{colors.line}"
    optionBackgroundColor: "{colors.paper}"
    okColor: "#2f7d4f"    # 只用于「答对」，不参与全站配色
    badColor: "#b3261e"   # 只用于「答错」，不参与全站配色
  lesson-nav:             # 文末上一课/下一课（enhance-content.cjs 生成）
    cardBackgroundColor: "{colors.card}"
    cardBorderColor: "{colors.line}"
    labelTypography: IBM Plex Mono 11px / 字距 0.16em
    emptyBorderStyle: dashed
  code-line-number:
    textColor: "{colors.ink-faint}"
    typography: "{typography.code}"
  code-language-label:
    textColor: "{colors.ink-faint}"
    typography: "{typography.code}"
  link:
    textColor: "{colors.accent}"
  active-item:
    backgroundColor: "{colors.accent-wash}"
    borderColor: "{colors.accent}"
    textColor: "{colors.accent-deep}"
  highlighted-line:
    backgroundColor: "{colors.accent-wash}"
  highlight-bar:
    backgroundColor: "{colors.accent-warm}"
  mark:
    backgroundColor: "{colors.text-highlight}"
    textColor: "{colors.ink}"
---

## Overview

中文技术笔记站点，内容以长文阅读为主（Quartz 静态生成，主题 `claude-paper`，
亮/暗双模式）。视觉基调对齐 xuanyuancode.com 的课程页：**整片暖纸底
（`paper` #F5EDDB）+ 白色卡片（`card` #FFFFFF）+ 1px 暖线（`line` #D8CEB6）
+ 赭橙强调（`accent` #C2410C）**，标题用阿里妈妈数黑体。仍然是"正文是唯一焦点"
的安静阅读体验，结构语汇来自课程页（左右栏 1px 边线、h2 左边条、目录编号、
属性表引言框）。

2026-10-18 的二次对齐修的是**「纸色没有铺开」**：上一版只改了页面底色，
而主题把 `--claude-paper-surface`(#faf9f5) 画在 `#quartz-body`、
`--claude-paper-surface-secondary`(#f5f4ed) 画在左右侧栏上，于是页面同时存在
三种"纸色"（`#f5eddb` / `#faf9f5` / `#f5f4ed`），观感是灰白网页而非暖纸。
现在两套变量一起强制，全站只有 `paper` 一种底色。

本文件是**给 coding agent 读的设计契约**。改动本站样式前先读它；
实现细节在 `scripts/site-custom.scss`，Token 定义在 `scripts/quartz.config.yaml`。

2026-10-21 的**第三次对齐**（本次）解决的是「**版式语汇不像参考站**」：同一课页面
逐项实测后把差异全部补齐——阅读宽度 966→716、正文 16/1.6→17/1.95 且颜色从
`ink-soft` 改回 `ink`、插图从"裸图 + 卡外图注"改成**白卡 + 卡内图注 + 等宽赭橙图号**、
callout 的四种类型色左边条统一成**单一赭橙**、补齐参考站的课程页语汇（深色固定顶栏、
eyebrow、第 N 站徽标 / 170px 水印数字 / 首字下沉、圆点目录、深色页脚、阅读进度条），
并隐藏了会把 h1 往下推的 frontmatter 属性表。**三条旧的硬规则因此作废**：
"内容铺满视口"→ 现在正文列固定 716 居中；"h2 带 3px 左边条"→ 现在靠站号徽标；
"callout 左边条按类型上色"→ 现在全站一种赭橙。

## Colors

- 全站**只有两层底色**：`paper`（页面与侧栏）与 `card`（卡片：代码块、表格、callout）
  - `paper-deep` 是纸色深一档，只用于**表头**与 **callout 内的代码块**
- `accent` 是**强调专用色**：链接、h2 左边条、目录编号、属性框左边条；别拿它做大面积填充
- `accent-deep` 只用于**当前态文字**（探索树当前文件、目录当前小节、行内代码文字）
- `accent-warm` 只用于**当前态描边与高亮条**；`accent-wash` 只用于**当前态洗色与逐行高亮**
- `ink` / `ink-soft` / `ink-faint` 是三级文字层次，**不要引入第四级**
- 暗色模式使用 `-dark` 后缀的同名 token，不另造颜色
- ⚠️ **页面底色不使用纯白**（页底永远是 `paper`）；**卡片底色就是纯白 `#fff`**，
  这是参考站 `--paper-card` 的原值，不要改成暖白
- ⚠️ 正文不使用纯黑：`ink` 是 `#1c1c1c`

## Typography

- 标题 `AlimamaShuHeiTi`（自托管 woff2），正文 `Noto Sans SC → 苹方 → 雅黑`，代码 `IBM Plex Mono`
- **正文 17px / 行高 1.95 / 颜色 `ink`（#1c1c1c）**——2026-10-21 起与参考站逐值一致；
  段间距 20px。旧的 16px/1.75 + `ink-soft` 是"读起来发灰又挤"的根因
- ⚠️ 主题把段落的 `font-family` 单独设成了界面字体（实测 `p` 计算值是 `ui-sans-serif`，
  既不是 Noto Sans SC 也不是 Source Sans Pro）。因此**必须对 `article p/li/td` 显式
  设 `font-family: inherit` 并把 `article` 的字体压在 `Noto Sans SC`**，否则中文正文会落到系统 UI 字体
- 代码块 0.875rem / 行高 1.75，`tab-size: 4`
- 标题层级最多到 `h3`，不再往下分；h1 48/900、h2 25/900、h3 17/900

## Layout

- **三栏整体居中，上限 2034px**（视口更宽时两侧留白），列宽
  `clamp(240px,26vw,500px) / minmax(0,1fr) / clamp(200px,20.3vw,390px)`
- **正文列上限 980px 并在中栏居中对齐**（中列上限 1028 = 980 + 左右各 24 呼吸位），
  宽屏下等价于 `500+82+980+82+390=2034`
  - 2026-10-21 用户要求分两步放大：先两边栏各 **+50%**（260→390、220→330）+
    正文 **+20%**（716→860），再把正文提到 **980**、侧栏继续加宽且**左栏给得比右栏多**
    （500 / 390，因为文件树最深、需要横向空间）
  - 实测：1920 视口 → 499 / 980 / 390；2560 视口 → 500 / 980 / 390（栏间各 82）；
    1440 视口 → 374 / 715 / 292（vw 回缩，正文仍 ≥715）
  - 视口不足 2034 时**侧栏按 vw 回缩**（下限 240/200），**优先保住正文宽度**——
    侧栏加宽不能以挤窄正文为代价（用户明确要求）
  - ⚠️ 改宽度时**必须同时把 `min-width` 归零**：旧的"铺满视口"规则写了
    `min-width:100%`，只设 `max-width` 会被它压住（2026-10-21 实测：`#quartz-body`
    与 `footer` 都踩过这个坑，`footer` 还有主题自带的 `min-width: calc(100% - 48px)`）
- 左右栏各以 1px 边线（`border`）与正文分隔（右栏 border-left、左栏 border-right），不用底色分区
- **深色固定顶栏 64px**：复用左栏里的 `.page-title`（`position: fixed` 铺满宽度，
  `rgba(28,28,28,.96)` + 底边 1px 白 10%），工具栏（搜索/暗色/阅读模式）一并 fixed 到右侧；
  `#quartz-body` 加 `padding-top: 64px` 让位，左右栏 `sticky top: 64px`
- **深色页脚 980px**（与正文列同宽，含 24 内边距；实现为 `calc(100% - 48px)` + 上限 980）：`ink` 底 + 纸色 68% 文字，padding 40/24
- 间距只用上面 `spacing` 里定义的值
- <1200px 时不启用上述栅格（保持 Quartz 默认单列/抽屉），深色顶栏也不启用

## Elevation & Depth

- 全站**只有一种阴影**：代码块卡片的 `0 1px 2px rgba(20,20,19,0.06)`
- 除代码块外，**任何元素都不使用投影**；层次靠边框与底色区分
- 不使用玻璃拟态（backdrop-filter）、不使用渐变背景

## Shapes

- 行内代码圆角 `rounded.sm`（5px），代码块卡片圆角 `rounded.md`（10px）
- **除这两个之外不引入新的圆角值**

## Components

- **代码块**：白卡（底色 `{colors.card}`，边框 `1px solid {colors.line}`，圆角 `{rounded.md}`，
  阴影 `0 1px 2px rgba(20,20,19,0.06)`）
  - 只允许 `figure[data-rehype-pretty-code-figure]` 一层承载边框与背景
  - `pre` 与 `code` 必须透明、无边框、无圆角、无阴影
  - 右上角显示语言角标（`0.64rem`、大写、字距 `0.09em`、透明度 `0.45`）
  - 行号：右对齐、宽 `1.6rem`、右边距 `1.05rem`、透明度 `0.45`、`0.82em`
  - 逐行高亮底色 `{colors.accent-wash}`，左强调条用内阴影 `inset 2px 0 0 {colors.accent-warm}`，**不挤动文字**
  - 横向滚动条高 `8px`，滑块用 `line` 色，轨道透明
- **行内代码**：`{colors.inline-code}`（accent 8% 洗色）+ `{colors.accent-deep}` 文字，
  圆角 `rounded.sm`，**不要方框感**（无边框）——对应参考站 `.article-body :not(pre) > code`
- **表格**：白卡（`card` + 1px `line` 描边 + 8px 圆角），单元格只保留 1px `line` 分隔线，
  表头铺 `paper-deep` 且**取消斑马纹**——对应参考站 `.fig-frame` 的卡片语汇
- **Callout**：白卡（`card` + 1px `line` 描边）+ **3px 赭橙左边条**（全站统一用 `accent`，
  图标同色），圆角 4px，padding `0 24px`——2026-10-21 起不再按类型上色（之前 abstract 蓝 /
  question 琥珀 / tip 青 / example 紫，一页四种颜色，与"全站一种强调色"的基调冲突）
- **「本课导读」callout（abstract）= 参考站的导语条**：无卡片、无边框、无标题，
  3px `accent` 左边条 + 16px 左内边距，文字用衬线 `Noto Serif SC`、`ink-soft`、17/1.95
- **Callout 内的代码块**：首尾外边距归零，避免与 callout 内边距叠加；底色改回 `paper-deep`（白卡叠白卡会失去层次）
- **文章插图 = 白卡 + 卡内图注**（对应参考站 `.fig-frame` + `figcaption`）：
  `<img class="site-svg">` 自身是卡片上半部（`card` 底 + 1px `line` 描边、**圆角 0**、
  padding `26px 22px 18px`、下边线去掉），紧随其后的图注段落
  （`p:has(> em:only-child)`）是卡片下半部（同底色、左右下三条边、上边线去掉、
  padding `0 22px 14px`、13px `ink-faint`、**斜体转正**），两者拼接成一个连续卡片
  - `width:100%` + `height:auto` + `box-sizing:border-box`，图片内容区 = 716 − 44 = 672px，
    与参考站卡片内图宽一致
  - 图注里的「图 3-1」由导出脚本包成 `<span class="fig-no">`（等宽 + `accent`），
    只处理行首的 `*图 N-M…*`，不影响正文里的图号引用
  - **永不**用 Quartz 原生的 `<object>`：它对 Obsidian 的 SVG 嵌入固定输出
    `<object width="auto" height="auto">`，浏览器按替换元素默认尺寸渲染成 300×150 的小框
  - 插图文件必须与引用它的笔记**同目录**（导出脚本按嵌入目标镜像路径），
    且必须带 `xmlns="http://www.w3.org/2000/svg"`——缺命名空间的独立 SVG 在 `<img>` 里加载失败
- **文章 hero**：`h1.article-title` 数黑体 48px/900；**h1 下方没有边线**（主题默认画了一条
  `rgba(31,30,29,.16)` 的灰线，已去掉）；h1 上方依次是面包屑、**eyebrow**（`.content-meta`：
  等宽 12px、字距 0.1em、`accent` 色——参考站的 `LESSON 03 · 卷一 基础数学 · ◉ 4,903 次阅读`）。
  实现靠 `.popover-hint` 的 flex + `order` 重排（breadcrumb −4 / meta −3 / h1 0）
- **frontmatter 属性表在正文页隐藏**（`display:none`）：参考站标题区只有「eyebrow → h1 → 导语条」
  三段；教材笔记的属性表有 6 行，会把 h1 往下推 60~100px。frontmatter 仍在源文件里，
  标签页（`/tags`）不受影响。需要恢复时删掉那条 `display:none` 即可
- **h2 = 站号徽标 + 标题 + 水印数字**（对应参考站 `.station-head` + `.station::before`）：
  `h2::before` 输出「第 N 站」（`accent` 底、`paper` 字、等宽 11px、字距 0.22em、
  padding 3×12、无圆角），`h2::after` 输出 170px 的同序号水印（`rgba(28,28,28,.055)`）；
  **h2 本身不再有左边条**；序号来自 `counter-increment: station`
- **小节首字下沉**：`h2 + p::first-letter` = 3.2em / 900 / `accent`（对应参考站 `.dropcap-letter`）
- **右栏目录**：`li.depth-1` 前加「○/● + 编号」（等宽 0.78em、`accent`；当前小节实心 ● 并加粗转 `accent-deep`）；
  字号 12.5px（参考站 rail 是 12.5px，之前 16px 明显偏大）
- **探索树当前文件**：`accent-wash` 底色 + 2px `accent` 左边条 + `accent-deep` 加粗文字
  （对应参考站 `.sidebar-lesson-item a.active`）；探索树条目与「探索」小标题统一 13px
- **左右栏**：≥1200px 时左栏 260px、右栏 220px（padding `28px 0 48px 18px`），
  各以 1px `line` 边线与正文分隔；右栏栏目标题降为 13px，关系图谱压到 150px 给目录腾位置
- **阅读进度条**：`body::before` 2px `accent` 条，`animation-timeline: scroll(root block)`
  纯 CSS 驱动（无需 JS，Chrome 115+；不支持时静默不显示）
- **测验**（`scripts/enhance-content.cjs` 构建后生成）：把 `> [!example] 学习小测验` 的
  「Q1/Q2 + A~D + ✅ 正解 + 折叠讲解」改写成 `<section class="quiz">`：
  每题一张白卡，选项是真 `<input type="radio">`（可点、可键盘操作），
  **判分纯 CSS**：`:has(input:checked)` + 正确项上的 `.is-answer` 类 →
  选对绿 `✓ 答对`、选错红 `✗ 再想想` 同时把正确项标绿，讲解用
  `grid-template-rows: 0fr→1fr` 过渡自动展开。**无 JS、无后端**
- **文末上一课/下一课**（同一脚本）：把 `<h2 id="相关笔记">` 后的 `<ul>`
  （所属卷/上一课/下一课/课程总览）改写成 `<nav class="lesson-nav">` 两张箭头卡
  + 一行「所属卷 · 总览」小字；该 h2 加 `.lesson-nav-heading` 类以跳过站号徽标与水印。
  卡片直接复用原 `<a>` 的 `href`（相对路径，已由 Quartz 解析）+ `internal` 类保留 SPA 跳转

## Do's and Don'ts

- 代码块**只有一层卡片**；`pre` / `code` **永不**再加边框、圆角、背景或阴影
- 卡片圆角使用 `rounded.md`，行内代码使用 `rounded.sm`，**永不混用**
- **代码字体栈里中文回退必须排在 `monospace` 之前**——否则中文会落到系统 serif（Windows 上是宋体），小字号下很难看
- 行号与语言角标**永不**使用正文色，必须是 `ink-faint` 且透明度 0.45
- `text` / `txt` / `plaintext` 代码块**永不**显示语言角标，顶部也不保留角标高度
- **改宽度时先查 `min-width`**：主题与早期规则给 `#quartz-body` 写了 `min-width:100%`、
  给 `footer` 写了 `min-width: calc(100% - 48px)`——只设 `max-width` 会被它们压住
  （2026-10-21 两次踩坑，表现为"设了 716 却仍是 822/870"）。凡改宽度都同时写
  `min-width: 0 !important`
- **永不**用 `!important` 之外的普通规则去改内容区宽度——主题的特异性更高，改不动
- **h1 下不要边线**：主题给 `h1.article-title` 画了 `border-bottom: 1px rgba(31,30,29,.16)`，
  参考站的标题是"裸露"的，需显式 `border-bottom: 0`
- **深色顶栏靠 fixed 复用 DOM**：`.page-title` 是左栏的子元素，靠 `position: fixed` 拉成
  全宽顶栏；它所在的 `.sidebar.left` 是 `sticky`（无 `transform`/`filter`），所以 fixed
  才相对视口定位。**一旦给侧栏加 `transform`/`filter`/`contain`，顶栏会缩进侧栏宽度内**
- **callout 只用一种强调色**：改 `--color` 到 `accent` 即可同时改变左边条与图标；
  不要按类型再上色，参考站全站只有赭橙一种强调色
- **构建后两个改写器的顺序不能颠倒**：先 `fix-html-emphasis.cjs`（兜住字面 `**`），
  再 `enhance-content.cjs`（测验要靠已经生成好的 `<strong>Q1.…</strong>` 才能识别题目）
- **`enhance-content.cjs` 只认「有选项且恰好标了一个 ✅」的 example callout**，
  不满足就原样保留——不要在样式里硬把它当测验，否则普通示例块会被误伤
- 测验的对/错用 `--quiz-ok` / `--quiz-bad` **两个语义色，只在判分状态里出现**；
  全站其余地方仍然只有赭橙一种强调色，不要拿它们做装饰
- **⚠️ 改颜色要动三处**（`quartz.config.yaml` + `site-custom.scss` 的「0/6 调色板」强制块 + 本文件）：
  主题包 `@quartz-themes/claude-paper` 会在自己的样式里重新声明两套变量且加载更晚——
  (1) Quartz token（`--light/--lightgray/--dark/--secondary/--tertiary`…）；
  (2) 主题私有的一整套 `--claude-paper-surface / -surface-secondary / -surface-raised /
  -ink / -border / -accent…`（**这是 2026-10-18 之前"纸色铺不开"的根因**：只改前者时
  `#quartz-body` 仍是主题的 `#faf9f5`、侧栏仍是 `#f5f4ed`）。
  两套都要在强制块里用 `!important` 压；强制块**只强制亮色**（`:root[saved-theme="light"]`），
  暗色另有一份 `:root[saved-theme="dark"]` 映射——裸 `:root` 会把亮色值灌进暗色模式
- **永远不要用 `var(--code-background)` 给代码块上底色**：主题会在
  `figure[data-rehype-pretty-code-figure]` 元素自身上把这个变量清成空值
  （实测 2026-10-18：该元素取到 `""`），声明会静默落到 fallback 上，
  代码块变成"边线色卡片"。代码块底色直接用本站的 `--card`
- **`color-mix()` 里不要用主题变量做底色**：主题给 `.callout` 的底色是它自己按类型
  算出的 `oklch(...)`，必须在白卡规则里 `!important` 直接覆盖
- 此版 Quartz 的**页头不在 `article` 里**（结构：`div.page-header` > `div.popover-hint`
  > `h1.article-title`；正文在 `article.popover-hint` 里），hero 相关选择器不能带 `article`
- 正文首个 `h1[id]`（Obsidian 惯例的 `# 标题`）**永不**显示——它与 hero 标题重复
- 正文**永不**使用纯黑（用 `ink` #1c1c1c）；**页面底色永不**使用纯白，
  但**卡片底色就是纯白**（参考站 `--paper-card` 原值）
- 不新增上面未定义的间距值、圆角值与颜色

## 相关文件

| 文件 | 角色 |
|---|---|
| `scripts/quartz.config.yaml` | **Token 源**（颜色、字体、主题、插件） |
| `scripts/site-custom.scss` | **样式实现**（含每条硬规则的实测依据） |
| `scripts/DESIGN.md` | **本文件**：给 agent 的设计契约 |
| `scripts/fix-html-emphasis.cjs` | 构建后：把产物里残留的字面 `**` 收口成 `<strong>`（在 `enhance-content.cjs` 之前跑） |
| `scripts/enhance-content.cjs` | 构建后：测验结构化（纯 CSS 判分）+ 文末上一课/下一课导航卡 |
| `.github/workflows/publish-site.yml` | 发布流水线（把上面两个文件覆盖进 Quartz 后构建） |
