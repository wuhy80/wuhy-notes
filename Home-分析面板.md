---
cssclasses:
  - home-analytics
aliases:
  - Dashboard Analytics
tags:
  - obsidian/dashboard
updated: 2026-08-08
---

# Home 分析面板

> [!info] 说明
> 这里保留仓库级统计与可视化分析。
> 日常使用优先回到 [[Home]]。

## 仓库概要

```dataviewjs
const stats = {
  total: dv.pages().length,
  diary: dv.pages(`"我的日记"`).length,
  tech: dv.pages(`"技术笔记"`).length,
  project: dv.pages(`"专项项目"`).length,
  llm: dv.pages(`"大模型"`).length,
  ontology: dv.pages(`"Ontology"`).length,
  tags: dv.pages().file.etags.distinct().length
};

dv.table(
  ["总文件", "日记", "技术笔记", "项目文档", "大模型", "Ontology", "标签"],
  [[stats.total, stats.diary, stats.tech, stats.project, stats.llm, stats.ontology, stats.tags]]
);
```

## 最近更新

```dataview
TABLE WITHOUT ID
  file.link as "文件",
  file.folder as "位置",
  dateformat(file.mtime, "MM-dd HH:mm") as "最近更新"
FROM !"template" AND !"Excalidraw" AND !"附件"
WHERE file.name != "Home" AND file.name != "Home-分析面板" AND file.name != "CLAUDE" AND file.name != "AGENTS"
SORT file.mtime DESC
LIMIT 15
```

## 活动热力图

```contributionGraph
title: 知识库活动热力图
graphType: default
dateRangeValue: 360
dateRangeType: LATEST_DAYS
startOfWeek: 1
showCellRuleIndicators: true
titleStyle:
  textAlign: center
  fontSize: 16px
  fontWeight: bold
dataSource:
  type: PAGE
  value: ""
  dateField: {}
fillTheScreen: true
enableMainContainerShadow: false
cellStyleRules:
  - color: "#c6e48b"
    min: 1
    max: 3
  - color: "#7bc96f"
    min: 4
    max: 6
  - color: "#239a3b"
    min: 7
    max: 9
  - color: "#196127"
    min: 10
    max: 999
```

## 内容分布

```dataviewjs
let result = [];
for (let group of dv.pages().groupBy(p => p.file.folder.split("/")[0])) {
  if (group.key === "") continue;
  result.push([group.key, group.rows.length]);
}
result.sort((a, b) => b[1] - a[1]);
dv.table(["文件夹", "文件数"], result);
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
for (let group of dv.pages("").filter(p => p.file.folder != "").groupBy(p => p.file.folder.split("/")[0])) {
  let tags = dv.pages(`"${group.key}"`).file.tags.distinct().sort().array();
  if (tags.length === 0) continue;
  dv.header(4, `${group.key} (${tags.length} 个标签)`);
  dv.paragraph(tags.map(t => `\`${t}\``).join(" "));
}
```
