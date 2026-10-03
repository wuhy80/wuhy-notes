---
cssclasses:
  - home-dashboard
aliases:
  - 首页
  - 工作台
updated: 2026-08-09
---

> [!hero] 今日工作台
> 先处理任务和收件箱，再进入项目与知识沉淀。
> 私密库：我的任务 · 任务收件箱 / 待整理 / 日记总览（已迁至私密库 wuhy80_private） · [[Home-分析面板|分析面板]]

## 今日聚焦

> [!focus] 我的任务
> ```dataview
> TASK
> FROM ""
> WHERE file.path = "我的任务.md" AND !completed
> LIMIT 6
> ```

> [!inbox] 收件箱
> ```dataview
> TASK
> FROM ""
> WHERE (file.path = "任务管理/TaskInbox.md" OR file.path = "Inbox/待整理.md") AND !completed
> LIMIT 6
> ```

## 快速入口

> [!tip] 日常管理
> 私密库：我的任务 · 任务收件箱 / 待整理 / 日记总览（已迁至私密库 wuhy80_private）

> [!info] 知识沉淀
> [[技术笔记/技术笔记|技术]] · [[技术笔记/算法/算法学习导航|算法]] · [[编程语言/README|语言]] · [[Golang编程/README|Go]] · [[Rust编程/README|Rust]] · [[大模型/00-大模型学习导航|大模型]] · [[Ontology/README|Ontology]] · [[读书笔记/读书列表|读书]] · [[网址收藏|网址]]

> [!note] 环境与工具
> 私密库：Ubuntu 虚拟机 · Gitea 私有 Git · 网站账号（已迁至私密库）

> [!tip]- 常用快捷键
> | 功能 | 快捷键 | 说明 |
> |:---|:---:|:---|
> | 定位当前文件 | `Alt+Shift+Q` | 在文件列表中显示当前文件 |
> | 提交所有记录 | `Alt+Q` | Git 提交并推送所有更改 |
> | 快速捕获 | `Ctrl+I` | 快速记录想法到收件箱 |
> | 打开日记 | `Ctrl+D` | 打开今日日记 |
> | 调试窗口 | `Ctrl+Shift+I` | 打开开发者工具 |

---

## 最近动态

> [!stream] 最近编辑
> ```dataview
> TABLE WITHOUT ID
>   file.link as "文件",
>   file.folder as "位置",
>   dateformat(file.mtime, "MM-dd HH:mm") as "最近更新"
> FROM !"template" AND !"Excalidraw" AND !"附件"
> WHERE file.name != "Home" AND file.name != "Home-分析面板" AND file.name != "CLAUDE" AND file.name != "AGENTS"
> SORT file.mtime DESC
> LIMIT 8
> ```

> [!journal] 最近日记（已迁至私密库）
> ```dataview
> TABLE WITHOUT ID
>   file.link as "日记",
>   dateformat(file.mtime, "MM-dd HH:mm") as "更新"
> FROM "我的日记·已迁出"
> WHERE regexmatch("^\\d{4}-\\d{2}-\\d{2}$", file.name)
> SORT file.name DESC
> LIMIT 4
> ```

---

## 当前推进

> [!project] 项目文档
> ```dataview
> TABLE WITHOUT ID
>   file.link as "项目文档",
>   dateformat(file.mtime, "MM-dd HH:mm") as "更新"
> FROM "专项项目"
> SORT file.mtime DESC
> LIMIT 6
> ```

> [!research] 技术与大模型
> ```dataview
> TABLE WITHOUT ID
>   file.link as "笔记",
>   file.folder as "位置",
>   dateformat(file.mtime, "MM-dd HH:mm") as "更新"
> FROM "技术笔记" OR "大模型" OR "Ontology"
> SORT file.mtime DESC
> LIMIT 6
> ```

---

> [!abstract] 深入入口
> [[Home-分析面板|分析面板]] · [[技术笔记/技术笔记|技术知识]] · [[大模型/00-大模型学习导航|大模型学习]] · [[Ontology/README|Ontology]]
