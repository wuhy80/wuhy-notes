---
version: 2
name: 格物志 Markdown 阅读站点
updated: 2026-11-14
sources:
  tokens: scripts/site-custom.scss
  layout: scripts/reader/layout.css
  shell: scripts/reader/index.html
  skins: scripts/reader/skin.html
default-skin:
  light: cibai
  dark: yaoye
colors:
  # 以下为纸墨皮肤；其他皮肤按 site-custom.scss 的 data-gz-skin 规则取值。
  paper: "#f5eddb"
  paper-deep: "#ede3c4"
  card: "#ffffff"
  ink: "#1c1c1c"
  ink-soft: "#57544e"
  ink-faint: "#8c8676"
  line: "#d8ceb6"
  accent: "#c2410c"
  accent-deep: "#9a3010"
  accent-wash: "#fbe6c7"
typography:
  body:
    fontFamily: Source Sans Pro → Noto Sans SC → 苹方 → 雅黑
    fontSize: 17px
    lineHeight: 1.95
  article-title:
    fontFamily: var(--gz-font-heading)
    fontSize: 48px
    fontWeight: 900
    lineHeight: 1.22
  h2:
    fontSize: 25px
    fontWeight: 900
    margin: 68px 0 24px
  h3:
    fontSize: 17px
    fontWeight: 900
    margin: 34px 0 12px
  code:
    fontFamily: IBM Plex Mono → 系统等宽字体
    fontSize: 0.875rem
    lineHeight: 1.75
layout:
  container: 2034px
  columns: clamp(240px,26vw,500px) minmax(0,1fr) clamp(200px,20.3vw,390px)
  article: 980px
  article-padding: 24px
  navbar: 64px
  mobile-breakpoint: 1199px
  mobile-title: 30px
rounded:
  inline-code: 5px
  code-card: 10px
---

## 适用范围

本文件是阅读站点的视觉契约。2026-11-14 起，Markdown 阅读器正式替代 Quartz；颜色、字体和正文排版直接编译 scripts/site-custom.scss，避免维护两套视觉实现。保留旧 DOM 的 quartz-root / quartz-body 等名称用于现有选择器兼容，它们不代表仍依赖 Quartz。

改样式前先读本文件。改 token 在 site-custom.scss 中完成，改页面结构适配在 reader/layout.css 中完成，并验证真实文章、首页、手机与明暗皮肤。

## 配色与字体

- 四套皮肤：纸墨、玄墨书卷、曜夜终端、瓷白编辑部；沿用 gz-skin / theme 浏览器偏好。
- 系统浅色默认瓷白（白底、靛蓝强调、特黑标题），系统深色默认曜夜。切换皮肤与明暗是两个独立选项。
- 页面、侧栏、正文共用 paper；代码、表格、普通 Callout 使用 card；表头用 paper-deep。
- accent 用于链接、章节编号、当前态、左边条；不按 Callout 类型另造配色。
- ink / ink-soft / ink-faint 是三级文字层次；只在测验判分状态使用 quiz-ok / quiz-bad。
- 正文字体必须西文打头，避免英文弯引号、撇号变成中文全角字形；自托管 Source Sans Pro 的 400 / 600 / 700 与 italic 子集。
- 标题字体由皮肤的 --gz-font-heading 决定；保留自托管阿里妈妈数黑体作为纸墨标题字体。

## 布局与导航

- 三栏布局保留原站比例；1440px 视口正文约 715px，宽屏正文上限 980px。侧栏回缩不能挤窄正文。
- 左右栏与正文用 1px 边线分隔，不增加底色分区或大阴影。
- 顶栏高 64px，显示一级分区与搜索、专注阅读、皮肤菜单。小屏隐藏分区导航，目录通过抽屉展开。
- 左栏只显示当前分区，按卷折叠；当前卷展开，罗马卷号、文章两位序号、篇数和当前项样式保留。
- 侧栏自行滚动，目录定位不得滚动整页；正文锚点要预留顶栏高度。
- 右栏顺序为关系图谱、章节目录、反向链接。
- 首页采用单栏与两列导航卡片，手机上自动单列；不显示文章日期、侧栏、章节水印和首字下沉。

## 正文与组件

- 文章仅显示一个主标题。日期/阅读时间为标题上方的小号强调色文字，不显示 frontmatter 属性面板。
- h2 使用「第 N 站」徽标、右侧淡色水印；章节首段保留首字下沉。正文 17px / 1.95，段距 20px。
- 导语 abstract 无标题、无卡片底色，仅有 3px 强调色左边条和衬线正文。普通引用与 Callout 的外观分别保留。
- 自学卡仅匹配含内嵌 tip 的 question Callout，不能把所有 question 都变成自学卡。标签跨越顶边时保留 overflow:visible。
- 代码卡片用 card 背景、1px line、10px 圆角；行内代码 5px 圆角，代码行保持等宽与横向滚动。
- 公式使用 KaTeX，Mermaid 按文章需要加载。图注的图号用等宽强调色；图片保持原宽高比，不裁切。
- 表格支持横向滚动；不得造成整页横向溢出。
- 「学习小测验」仅转换选项完整且恰好有一个正解的 example Callout；使用原 quiz 类名和 CSS 判分。非测验 example 原样显示。
- 「相关笔记」内显式的上一课/下一课链接生成两张课程导航卡，其他链接保留。
- 交互实验使用 data-lab 占位，由 scripts/lab-widgets.js 按需挂载；公式卡、金句和实验仍复用原样式。
- 双语精读、生词本和 Dataview 复用站点组件，不改笔记的插件语法与存储键。

## 验证与维护

样式改动至少检查首页、技术长文、双语精读、390px 手机宽度、浅色/深色与四套皮肤切换。交互或页面结构修改运行 npm run reader:test。

保留原始 Markdown、WikiLinks、Callout、脚注和引用结构。站点增强在渲染后处理，不回写原始笔记；普通 HTML 仍需净化，笔记内 script 不执行。

| 文件 | 角色 |
|---|---|
| scripts/site-custom.scss | 颜色、字体、四皮肤与正文组件的实现源 |
| scripts/reader/layout.css | 阅读器结构适配 |
| scripts/reader/skin.html | 首屏皮肤初始化与菜单 |
| scripts/reader/content.mjs | 测验与上下课卡片 |
| scripts/lab-widgets.js | 课程交互实验 |
| scripts/build-md-reader.mjs | 打包阅读器、元数据与公开文件 |
| .github/workflows/publish-site.yml | 唯一正式发布流程 |
