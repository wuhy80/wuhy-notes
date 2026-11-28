---
🌻日期🌻: 2024-04-28
🌙星期🌙: 星期日
⌚️时间⌚️: 22:00:00
tags:
  - obsidian
  - mermaid
  - 绘图
---

# Mermaid 图表绘制

Mermaid 是 Obsidian 内置支持的图表绘制语言，可以用代码方式创建流程图、序列图、甘特图等多种图表。

## 参考资源

- [Mermaid 画流程图教程](https://coffeetea.top/zh/markdown/mermaid.html)

## 相关笔记

- [[绘图相关/00 Obsidian有哪些绘图功能|Obsidian 绘图功能概览]]

---

## 基础示例

```mermaid
sequenceDiagram
    Alice->>+John: Hello John, how are you?
    Alice->>+John: John, can you hear me?
    John-->>-Alice: Hi Alice, I can hear you!
    John-->>-Alice: I feel great!
```

```mermaid
  flowchart TB
      A("开始") --> B["一级"]
      A --> C("二级")
      A -->|"说明"| D("三级")
	  B --> B1("我是B的下级菜单")
	  C --> C1("我是C的下级菜单")
```

## 序列图/Sequence
```mermaid
sequenceDiagram
    咖啡豆->>+普洱: 你好 普洱, 你好吗?
    咖啡豆->>+普洱: 普洱, 你能听到我吗?
    普洱-->>-咖啡豆: 好的 咖啡豆, 我可以听见你!
    普洱-->>-咖啡豆: 我感觉好极了!
```



## 甘特图/Gantt
```mermaid
gantt
    title 咖啡豆的甘特图
    dateFormat  YYYY-MM-DD
    section 主线任务
    咖啡豆的文档站           :a1, 2023-10-10, 30d
    咖啡豆的公众号           :after a1  , 20d
    section 支线任务
    咖啡豆的示例库    :2023-10-12  , 12d
    咖啡豆的插件      : 24d
```


## class 类图
```mermaid
classDiagram
    Animal <|-- Duck
    Animal <|-- Fish
    Animal <|-- Zebra
    Animal : +int age
    Animal : +String gender
    Animal: +isMammal()
    Animal: +mate()
    class Duck{
      +String beakColor
      +swim()
      +quack()
    }
    class Fish{
      -int sizeInFeet
      -canEat()
    }
    class Zebra{
      +bool is_wild
      +run()
    }
```

## ER 图
```mermaid
erDiagram
    CUSTOMER }|..|{ DELIVERY-ADDRESS : has
    CUSTOMER ||--o{ ORDER : places
    CUSTOMER ||--o{ INVOICE : "liable for"
    DELIVERY-ADDRESS ||--o{ ORDER : receives
    INVOICE ||--|{ ORDER : covers
    ORDER ||--|{ ORDER-ITEM : includes
    PRODUCT-CATEGORY ||--|{ PRODUCT : contains
    PRODUCT ||--o{ ORDER-ITEM : "ordered in"
```



## 5 mindmap 导图
```mermaid
mindmap
  root((咖啡豆的导图))
    第一层A1
      第二层A11
      ::icon(fa fa-book)
      第二层A12
        我是一麻袋的咖啡豆子正文内容
    第一层B1
      第二层B11<br/>换了一行
      第二层B12
        一个节点B121
            节点的下一级a
            节点的下一级b
            节点的下一级c
    第一层C1
      一个节点C11
      一个节点C12
```
## 百分比饼图 pin
```mermaid
pie title 咖啡豆社区组成
    "咖啡豆微信群" : 60
    "咖啡豆文档站" : 20
    "公众号" : 10
    "B站视频" : 10
```
## 四象限图
```mermaid
quadrantChart
    title 一个研究咖啡豆子的SWOT图表📊
    
    x-axis "有帮助🔥" --> "有害的☠️"
    y-axis "外部来源/环境属性" --> "内部来源/组织属性"
    
    quadrant-1 "【Weaknesses/劣势☠️】"
    quadrant-2 "【Strengths/优势🔥】"
    quadrant-3 "【Opportunities/机会🔥】"
    quadrant-4 "【Threats/威胁☠️】"
    
    "咖啡豆文档站": [0.3, 0.7]
    "咖啡豆公众号": [0.2, 0.8]
    "咖啡豆微信群": [0.35, 0.9]
    "咖啡豆微信群": [0.25, 0.6]
    
    "网站要花钱": [0.3, 0.23]
    "写作要花时间": [0.30, 0.34]
    
    "电脑罢工崩溃": [0.7, 0.79]
    
    "心情不好不想写了": [0.78, 0.34]
```
## 时间轴
```mermaid
timeline
    title 咖啡豆社群发展史
    2023-02-03 : 咖啡豆文档站上线
    2023-03-03 : 咖啡豆社群组建
    2023-03-04 : 蹦跶的咖啡豆公众号发布
    2023-09-03 : www.obsidian.vip上线
```
```mermaid
timeline
        title 咖啡豆的第二种时间轴-带详细分类的
        section 咖啡豆文档站
          第一时间点 : 写着好玩没啥事，闲得慌
          第二时间点 : 认真写文，持续更新
        section 咖啡豆公众号
          第一 阶段 : 源于突然的想法开始写作.
                  : 为了部分不能及时. 追新的同学们更新. 很有意思的内容
          第二 阶段 : 内容和网站有所区分.
                  : 会包括不能长期更新内容. 文字中间的换行. 主要看看怎换行了.
```

## git
```mermaid
gitGraph
       commit
       commit
       branch develop
       commit
       commit
       commit
       checkout main
       commit
       commit
```
## state 图
```mermaid
stateDiagram-v2
    [*] --> 我是咖啡豆
    我是咖啡豆 --> [*]
    我是咖啡豆 --> 打成咖啡粉
    打成咖啡粉 --> 我是咖啡豆
    打成咖啡粉 --> 泡成咖啡
    泡成咖啡 --> [*]
```
