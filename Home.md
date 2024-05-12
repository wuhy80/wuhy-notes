
[[开发计划]]
[[客户档案]]

| 快捷键功能  | 快捷键              | 功能说明                                                                                                  |
| ------ | ---------------- | ----------------------------------------------------------------------------------------------------- |
| 定位当前文件 | Alt-Shift-Q      | 文件列表: 在文件列表中显示当前文件                                                                                    |
| 提交所有记录 | Alt-Q            | commit all changes                                                                                    |
| 打开调试窗口 | Ctrl + Shift + i | Obsidian 是基于 Electron 开发的，所以可以打开调试窗口，类似于 Chrome 的调试窗口<br>也可以通过 View > Toggle Developer Tools 进行打开<br> |
|        |                  |                                                                                                       |
# 仓库概要
```dataviewjs
var i = [dv.pages().length,dv.pages(`"我的日记"`).length,dv.pages(`"技术笔记"`).length,
         dv.pages().file.etags.distinct().length]
dv.paragraph(`总共有 **${i[0]}** 个文件`)
dv.paragraph(`其中==日记== **${i[1]}** 篇，==技术笔记== **${i[2]}** 篇`)
dv.paragraph(`==标签== **${i[3]}**个`)


```

# 最近创建
```dataview
table WITHOUT ID file.link AS "最近创建",file.ctime as "时间", file.path as "路径"
from !"template" and !"Excalidraw"
sort file.ctime desc
limit 10
```

# 仓库内容
```dataviewjs
// 基于文件夹聚类所有的标签。
for (let group of dv.pages("").filter(p => p.file.folder != "").groupBy(p => p.file.folder.split("/")[0])){
  let datas=dv.pages(`"${group.key}"`).file.tags.distinct().map(t => {return `[${t}](${t})`}).array()
  let lens=datas.length
dv.paragraph(`#### ${group.key} (${lens})`);

  dv.paragraph(
    datas.sort().join(" | "));
}
```



```contributionGraph
title: Contributions
graphType: default
dateRangeValue: 360
dateRangeType: LATEST_DAYS
startOfWeek: 1
showCellRuleIndicators: true
titleStyle:
  textAlign: left
  fontSize: 18px
  fontWeight: normal
dataSource:
  type: PAGE
  value: ""
  dateField: {}
fillTheScreen: false
enableMainContainerShadow: false
cellStyleRules: []

```


# 本周日志
```dataviewjs
// 获取当前文件的创建日期
const currentFileCreateTime = Date.now();
const currentFileDate = new Date(currentFileCreateTime);
console.log(`current date`, currentFileDate)

// 计算本周的第一天（星期一）和最后一天（星期日）
const startOfWeek = new Date(currentFileCreateTime);
startOfWeek.setDate(currentFileDate.getDate() - currentFileDate.getDay() + 1);
const endOfWeek = new Date(currentFileCreateTime);
endOfWeek.setDate(currentFileDate.getDate() - currentFileDate.getDay() + 7);

// 构建我的日记文件夹路径
const diaryFolder = "我的日记";

// 查找本周内的所有日记文件
const weeklyDiaries = dv.pages()
  .filter(page => page.file.path.startsWith(diaryFolder))
  .filter(page => {
    const pageDate = new Date(page.file.frontmatter["🌻日期🌻"]);
    return pageDate >= startOfWeek && pageDate <= endOfWeek;
  })
  .sort(page => page.file.frontmatter["🌻日期🌻"]);

// 输出本周的日记列表
for (const diary of weeklyDiaries) {
  dv.el("li", `[${diary.file.name}](${diary.file.path})`);
}
```
     