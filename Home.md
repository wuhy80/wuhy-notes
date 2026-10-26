---
cssclasses:
  - home-dashboard
aliases:
  - 首页
  - 工作台
tags:
  - obsidian/dashboard
updated: 2026-10-15
---

> [!hero] 知识库工作台
> 本库是**可公开**的技术与学习知识库，只保留技术笔记、大模型研究、Ontology 与学习资料。
> 个人任务、日记、投资、客户项目资料已迁至私密库 `E:\Obsidian\wuhy80_private`，本页不再放会指向空目录的查询。
>
> [[技术笔记/技术笔记|技术笔记]] · [[大模型/00-大模型学习导航|大模型]] · [[Ontology/README|Ontology]] · [[编程语言/README|编程语言]] · [[大模型/10-新闻/日报/00-日报索引|AI 早报]] · [[读书笔记/读书列表|读书]] · [[网址收藏/网址收藏|网址收藏]] · [[Home-分析面板|分析面板]]

## 快速入口

> [!tip] 技术专题
> - [[技术笔记/技术笔记|技术笔记总入口]]：全部专题的索引
> - [[技术笔记/算法/算法学习导航|算法]]：基础算法、数据结构、动态规划与题解索引
> - [[技术笔记/Kubernetes/Kubernetes|Kubernetes]]：集群部署、网络、存储、安全与源码分析
> - [[技术笔记/Linux/README|Linux]]：系统管理、网络、日志、性能与安全
> - [[技术笔记/数据库/README|数据库]]：MySQL、InfluxDB、B树存储、备份与高可用
> - [[技术笔记/Vue/README|Vue]] ｜ [[技术笔记/前端开发/前端通信技术概览|前端开发]]
> - [[技术笔记/版本管理/GIT使用|版本管理]]：Git 与 SVN，另见 [[技术笔记/版本管理/知识库双仓库拆分与多机同步|知识库双仓库拆分]]

> [!info] 大模型与 Ontology
> - [[大模型/00-大模型学习导航|大模型学习导航]]：基础原理、应用开发、训练微调、部署工具链、评测选型
> - [[大模型/09-Agent/00-Agent导航|Agent 导航]]：LangGraph、CrewAI、Dify、Manus、OpenHands 等
> - [[大模型/10-新闻/日报/00-日报索引|AI 早报]] ｜ [[大模型/10-新闻/周报/00-周报索引|大模型周报]]（[[大模型/10-新闻/00-新闻索引|新闻总览]]）
> - [[大模型/08-个体重构/00-个体重构导航|个体重构]]：AI 时代的工作流与认知框架
> - [[Ontology/README|Ontology 总览]]：[[Ontology/00-总览/Palantir Ontology 资料索引|资料索引]] · [[Ontology/90-阅读路线/Palantir Ontology 阅读路线|阅读路线]]

> [!note] 编程语言与专项学习
> - [[编程语言/README|编程语言]] ｜ [[Golang编程/README|Golang]] ｜ [[Rust编程/README|Rust]]
> - [[英语学习/文章荟萃/00 Index|英语学习：文章荟萃]]

> [!abstract] 阅读与收藏
> - [[读书笔记/读书列表|读书列表]] ｜ [[读书笔记/好书资源|好书资源]] ｜ [[读书笔记/电子书信息|电子书信息]]
> - [[网址收藏/网址收藏|网址收藏]]：按主题分组的书签页（操作系统、算法、网络、人工智能、优秀博客等）

## 最近动态

> [!stream] 最近编辑
> ```dataview
> TABLE WITHOUT ID
>   file.link as "文件",
>   file.folder as "位置",
>   dateformat(file.mtime, "MM-dd HH:mm") as "最近更新"
> FROM !"template" AND !"Excalidraw" AND !"附件"
> WHERE file.folder != ".trash" AND file.folder != ".claude"
>   AND file.name != "Home" AND file.name != "Home-分析面板"
>   AND file.name != "CLAUDE" AND file.name != "AGENTS"
> SORT file.mtime DESC
> LIMIT 8
> ```

> [!journal] 每日 AI 早报（最近 5 期）
> ```dataview
> TABLE WITHOUT ID
>   file.link as "早报期号",
>   dateformat(created, "MM-dd") as "日期"
> FROM "大模型/10-新闻/日报"
> WHERE type = "ai-daily"
> SORT created DESC
> LIMIT 5
> ```

> [!journal] 大模型周报（最近 5 期）
> ```dataview
> TABLE WITHOUT ID
>   file.link as "周报期号",
>   dateformat(file.mtime, "yyyy-MM-dd") as "更新"
> FROM "大模型/10-新闻/周报"
> WHERE type = "weekly-news" OR file.name != "00-周报索引"
> SORT file.name DESC
> LIMIT 5
> ```

## 内容推进

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

> [!project] 专项学习与语言
> ```dataview
> TABLE WITHOUT ID
>   file.link as "笔记",
>   file.folder as "位置",
>   dateformat(file.mtime, "MM-dd HH:mm") as "更新"
> FROM "专项学习" OR "英语学习" OR "编程语言" OR "Golang编程" OR "Rust编程"
> SORT file.mtime DESC
> LIMIT 6
> ```

> [!focus] 待写选题（Ontology）
> ```dataview
> TASK
> FROM "Ontology"
> WHERE !completed
> LIMIT 6
> ```

## 知识库概览

```dataviewjs
const groups = [
  ["技术笔记", ["技术笔记"]],
  ["大模型", ["大模型"]],
  ["Ontology", ["Ontology"]],
  ["编程语言", ["编程语言", "Golang编程", "Rust编程"]],
  ["专项学习", ["专项学习"]],
  ["英语学习", ["英语学习"]],
  ["读书笔记", ["读书笔记"]],
  ["网址收藏", ["网址收藏"]]
];
const rows = groups.map(([name, folders]) => {
  const n = dv.pages()
    .where(p => folders.some(f => p.file.folder === f || p.file.folder.startsWith(f + "/")))
    .length;
  return [name, n];
});
rows.push(["全库合计", dv.pages().length]);
dv.table(["领域", "笔记数"], rows);
```

```dataviewjs
const counts = {};
for (const p of dv.pages()) {
  for (const t of p.file.etags) {
    counts[t] = (counts[t] || 0) + 1;
  }
}
const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 18);
dv.paragraph(top.map(([t, c]) => `\`${t}\` ×${c}`).join("　"));
```

## 维护说明

> [!warning] 任务、日记与项目文档不在本库
> `我的任务.md`、`任务管理/`、`Inbox/`、`我的日记/`、`专项项目/` 均已迁至私密库 `E:\Obsidian\wuhy80_private`。
> 本库按 `Ctrl+D` / `Ctrl+I` 会把内容写进已被 `.gitignore` 排除的目录，**不会进入备份**，请改在私密库操作。

> [!tip] Git 与备份
> 2026-10-03 起已无定时备份任务，改为每次改动后顺手提交推送：
> ```bash
> node scripts/backup-vaults.mjs
> ```
> 流程为提交 → `git fetch` → `git pull --ff-only` → 推送；只接受快进，分叉时需人工 `git pull --rebase`。

> [!note] 快捷键现状
> | 功能 | 快捷键 | 现状 |
> |:---|:---:|:---|
> | 定位当前文件 | `Alt+Shift+Q` | 可用 |
> | 打开日记 | `Ctrl+D` | 日记在私密库，本库按此键写入被忽略目录 |
> | 快速捕获 | `Ctrl+I` | 同上，请到私密库使用 |
> | 调试窗口 | `Ctrl+Shift+I` | 可用 |
> | 提交并推送 | ~~`Alt+Q`~~ | obsidian-git 已卸载，快捷键失效 |

> [!abstract] 深入入口
> [[Home-分析面板|分析面板]]：仓库统计、内容分布与标签云 · [[技术笔记/技术笔记审计记录|技术笔记审计记录]]
