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
    fontWeight: 700
    fontSize: clamp(30px, 3.4vw, 46px)
    lineHeight: 1.22
    marginTop: 1.2rem
  h2:
    fontFamily: AlimamaShuHeiTi
    fontWeight: 700
    前缀: 3px 暖橙左边条
  body:
    fontFamily: Noto Sans SC → 苹方 → 雅黑（参考站 --sans 同链）
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.75
  body-wide:
    fontFamily: Noto Sans SC → 苹方 → 雅黑
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
  li-block: 0         # 列表项外边距归零；行高压到 1.55（2026-10-18 二次收紧）
  li-p-block: 0.1em   # 松散列表 li>p 段落间距
  h2-block: 1.4em 0.45em   # h2 上/下外边距
  h3-block: 1.1em 0.35em   # h3 上/下外边距
  hero-top: 1.2rem    # 文章标题上边距
  meta-bottom: 0.9rem # 元信息行下边距（压底边线后）
  callout-in: 0       # callout 标题与内容贴合（content 顶部内边距归零）
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
    accentBarColor: "Quartz 的 --color（按 callout 类型）"
    titleColor: "{colors.ink}"
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
- **Callout**：白卡（`card` + 1px `line` 描边）配 **3px 类型色左边条**（`--color`，由 Quartz 按类型给出），
  标题用 `ink`——对应参考站 `.quiz-item`（白卡 + 线 + 3px 左边条）
- **Callout 内的代码块**：首尾外边距归零，避免与 callout 内边距叠加；底色改回 `paper-deep`（白卡叠白卡会失去层次）
- **文章 hero**：`h1.article-title` 数黑体 700、`clamp(30px,3.4vw,46px)`；
  其下 `.content-meta` 小号弱化（`ink-faint`）并压 1px `line` 底边线，构成 hero 收口
- **frontmatter 属性表**（`details.note-properties.metadata-container`）：渲染成
  赭橙左边线引言框（3px `accent` + 6% 洗色），行底色一律透明，对应参考站的导语条
- **h2 小节**：数黑体 700 + 3px `accent-warm` 左边条
- **右栏目录**：`li.depth-1` 前加 `01/02…` 等宽字体编号（用 `accent-warm`）；
  当前小节加粗并转 `accent-deep`，左边线转 `accent`
- **探索树当前文件**：`accent-wash` 底色 + 2px `accent` 左边条 + `accent-deep` 加粗文字
  （对应参考站 `.sidebar-lesson-item a.active`）
- **左右栏**：≥1200px 时左栏 border-right、右栏 border-left（1px `line`）与正文分隔

## Do's and Don'ts

- 代码块**只有一层卡片**；`pre` / `code` **永不**再加边框、圆角、背景或阴影
- 卡片圆角使用 `rounded.md`，行内代码使用 `rounded.sm`，**永不混用**
- **代码字体栈里中文回退必须排在 `monospace` 之前**——否则中文会落到系统 serif（Windows 上是宋体），小字号下很难看
- 行号与语言角标**永不**使用正文色，必须是 `ink-faint` 且透明度 0.45
- `text` / `txt` / `plaintext` 代码块**永不**显示语言角标，顶部也不保留角标高度
- **永不**给 `.center` 只设 `min-width:100%` 而不设 `box-sizing:border-box`——实测会让它比栅格轨道宽（当前左右内边距 1rem×2=32px），被 `position:sticky` 的右边栏压住，表现为 callout 右边框消失、正文末字被盖
- **永不**用 `!important` 之外的普通规则去改内容区宽度——主题的特异性更高，改不动
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
| `.github/workflows/publish-site.yml` | 发布流水线（把上面两个文件覆盖进 Quartz 后构建） |
