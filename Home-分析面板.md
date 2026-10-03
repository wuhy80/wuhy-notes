---
cssclasses:
  - home-analytics
aliases:
  - Dashboard Analytics
tags:
  - obsidian/dashboard
updated: 2026-10-03
---

# Home 分析面板

> [!info] 说明
> 这里保留仓库级统计与可视化分析，统计范围仅限本库。
> 日常使用优先回到 [[Home]]。
>
> %% 2026-10-03：原「活动热力图」的 contributionGraph 代码块已移除——本库未安装 contribution-graph 插件，该块只会渲染成一段死代码。若日后重新安装插件，可按官方示例加回。 %%

## 仓库概要

```dataviewjs
const groups = [
  ["技术笔记", ["技术笔记"]],
  ["大模型", ["大模型"]],
  ["Ontology", ["Ontology"]],
  ["编程语言", ["编程语言", "Golang编程", "Rust编程"]],
  ["专项学习", ["专项学习"]],
  ["英语学习", ["英语学习"]],
  ["读书笔记", ["读书笔记"]],
  ["网址收藏", ["网址收藏"]],
  ["template 模板", ["template"]]
];
const rows = groups.map(([name, folders]) => {
  const n = dv.pages()
    .where(p => folders.some(f => p.file.folder === f || p.file.folder.startsWith(f + "/")))
    .length;
  return [name, n];
});
rows.push(["全库笔记数", dv.pages().length]);
rows.push(["标签总数", dv.pages().file.etags.distinct().length]);
dv.table(["领域 / 指标", "数值"], rows);
```

## 最近更新

```dataview
TABLE WITHOUT ID
  file.link as "文件",
  file.folder as "位置",
  dateformat(file.mtime, "MM-dd HH:mm") as "最近更新"
FROM !"template" AND !"Excalidraw" AND !"附件"
WHERE file.folder != ".trash" AND file.folder != ".claude"
  AND file.name != "Home" AND file.name != "Home-分析面板"
  AND file.name != "CLAUDE" AND file.name != "AGENTS"
SORT file.mtime DESC
LIMIT 15
```

## 近 12 个月更新量

```dataviewjs
const now = dv.luxon.DateTime.now();
const rows = [];
for (let i = 11; i >= 0; i--) {
  const start = now.minus({ months: i }).startOf("month");
  const end = start.endOf("month");
  const n = dv.pages()
    .where(p => p.file.mtime >= start && p.file.mtime <= end)
    .length;
  rows.push([start.toFormat("yyyy-MM"), n]);
}
dv.table(["月份", "有更新的笔记数"], rows);
```

## 内容分布

```dataviewjs
let result = [];
for (let group of dv.pages().groupBy(p => p.file.folder.split("/")[0])) {
  if (group.key === "" || group.key.startsWith(".")) continue;
  result.push([group.key, group.rows.length]);
}
result.sort((a, b) => b[1] - a[1]);
dv.table(["文件夹", "文件数"], result);
```

## 高频标签

```dataviewjs
const counts = {};
for (const p of dv.pages()) {
  for (const t of p.file.etags) {
    counts[t] = (counts[t] || 0) + 1;
  }
}
const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 30);
dv.paragraph(top.map(([t, c]) => `\`${t}\` ×${c}`).join("　"));
```

## 标签云

```tagcloud
shape: pentagon
width: 900
height: 450
weight: 3
minFontSize: 10
fontWeight: bold
ellipticity: 0.8
```

## 知识分类

```dataviewjs
for (let group of dv.pages("").filter(p => p.file.folder != "" && !p.file.folder.startsWith(".")).groupBy(p => p.file.folder.split("/")[0])) {
  let tags = dv.pages(`"${group.key}"`).file.tags.distinct().sort().array();
  if (tags.length === 0) continue;
  dv.header(4, `${group.key} (${tags.length} 个标签)`);
  dv.paragraph(tags.map(t => `\`${t}\``).join(" "));
}
```
