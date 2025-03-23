
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
table WITHOUT ID 
  file.path as "路径", 
  file.ctime as "创建时间",
  file.link as "文件链接"
from !"template" and !"Excalidraw"
sort file.ctime desc
limit 20
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

```dataviewjs
let la = Array()
let da = Array()
for(let i of dv.pages().groupBy(p=>p.file.folder.split("/")[0]))
{
	if(i.key === "") {
	    continue;
	}
	la.push(i.key);
	let n = dv.pages(`"${i.key}"`).length;
	da.push(n);
}

dv.paragraph(`\`\`\`chart
type: pie
labels: [${la}]
series:
- title: none
  data: [${da}]
width: 50%
legendPosition: left
labelColors: true
\`\`\``);
```



```tagcloud
shape: pentagon
```
