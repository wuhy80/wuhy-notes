---
🌻日期🌻: 2024-04-09
🌙星期🌙: 星期二
⌚️时间⌚️: 09:17:00
tags:
  - obsidian
  - callout
  - 样式
---

# Obsidian Callout 使用指南

Callout 是 Obsidian 中用于突出显示重要内容的块级元素，支持多种样式和自定义配置。

## 相关笔记

- [[一些小技巧|Obsidian 使用技巧]]

---

## 实现callout

> [!Note|aside-l] 这是标题
> 这是一个放在左边的callout

> [!Note|aside-r] 这是标题
> 这是一个放在右边的callout


上面的是如何实现放在左边或者右边的Callout

## 样式

默认有12种风格。每一种有不同的颜色和图标。

只要把上面例子里的 `INFO` 替换为下面任意一个就行。

- note
- abstract, summary, tldr
- info, todo
- tip, hint, important
- success, check, done
- question, help, faq
- warning, caution, attention
- failure, fail, missing
- danger, error
- bug
- example
- quote, cite

> [!todo|50%]- cess
> Ddd


可以自定义标题，然后直接不要主体部分，比如
```markdown
> [!TIP] Callouts can have custom titles, which also supports **markdown**!
```
> [!TIP] Callouts can have custom titles, which also supports **markdown**!

可以使用 `+` 默认展开或者 `-` 默认折叠正文部分。
```markdown
> [!FAQ]- Are callouts foldable?
> Yes! In a foldable callout, the contents are hidden until it is expanded.
```
> [!FAQ]- Are callouts foldable?
> Yes! In a foldable callout, the contents are hidden until it is expanded.


# 如果需要自定义
Callout的类型和图标是用CSS来描述，颜色是 `r, g, b` 三色组，图标有相应的 icon ID (比如 `lucide-info`)。也可以自定义SVG图标。
```css
.callout[data-callout="my-callout-type"] {
    --callout-color: 0, 0, 0;
    --callout-icon: icon-id;
    --callout-icon: '<svg>...custom svg...</svg>';
}
```

# 更多的使用

```markdown
<!-- 默认语法 -->
> [!INFO]
> Here's a callout block.

<!-- title&body 语法 -->
> [!INFO] here is title
> here is body.

<!-- folding 语法 -->
> [!INFO] -
> folded callout block.

<!-- nested 语法 -->
> [!INFO]
> > [!todo] second nested callout block.
> > > [!example] third nested callout block.
```

<!-- 默认语法 -->
> [!INFO]
> Here's a callout block.

<!-- title&body 语法 -->
> [!INFO] here is title
> Here is body.

<!-- folding 语法 -->
> [!INFO] -
> Folded callout block.

<!-- nested 语法 -->
> [!INFO]
> > [!todo] second nested callout block.
> > > [!example] third nested callout block.

## callout 快速输入

由于 callout 需要输入 `quoteblock + keyword + style` 等诸多内容，显然有效率提升的必要。

### 使用需求

我自己日常在 Obsidian 中输入 callout 的时候，会遇到几个痛点：

- callout 语法关键字很多，会经常忘记；
- callout 语法需要输入的内容，而这些内容跟正文无关；
- callout 原生渲染样式和关键字支持比较少，无法满足所有写作场景；

### 快捷方法设计

对于解决上面的需求有一个比较简单直接的思路：

1. 自定义 callout，增加关键字支持，增加样式配置（css style + svg）；
2. QuickAdd 增加一个 Multi Macro 和若干 Capture，每个 Capture 根据关键字添加 callout format content；
3. 给 QuickAdd Multi Macro 增加一个快捷键；

### 效果演示

- 在 obsidian 设置中的 css snippets 增加 callout 自定义配置，具体方法参考 [callout customization help](https://help.obsidian.md/How+to/Use+callouts?ref=edony.ink#Customizations)，效果如下图所示：

![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_1/202404090917180.png)

- QuickAdd 命令操作，效果如下图所示：

