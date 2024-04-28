
[[开发计划]]
[[客户档案]]


| 快捷键功能  | 快捷键         | 功能说明 |
| ------ | ----------- | ---- |
| 定位当前文件 | Alt-Shift-Q |      |

 

***REMOVED***

```contributionGraph
title: Contributions
graphType: default
dateRangeValue: 180
dateRangeType: LATEST_DAYS
startOfWeek: 1
showCellRuleIndicators: true
titleStyle:
  textAlign: left
  fontSize: 15px
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
const currentFileCreateTime = new Date();
const currentFileDate = new Date(currentFileCreateTime);

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
    const pageDate = new Date(page.file.ctime);
    return pageDate >= startOfWeek && pageDate <= endOfWeek;
  })
  .sort(page => page.ctime);

// 输出本周的日记列表
for (const diary of weeklyDiaries) {
  dv.el("li", `[${diary.file.name}](${diary.file.path})`);
}
```
