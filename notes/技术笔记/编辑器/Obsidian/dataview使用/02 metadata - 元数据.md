---
🌻日期🌻: 2024-04-28
🌙星期🌙: 星期日
⌚️时间⌚️: 22:29:34
tags:
  - 编辑器/Obsidian
  - 插件/Dataview
---
# Dataview 中的 Metadata 元数据
对于 Dataview 来说，它无法直接查询文档中的内容，只能查询有索引的内容。文件中只有元数据和隐式字段是具有索引的，简单的介绍一下元数据与隐式字段：

文件中的元数据：在文件中，有两种东西可以有元数据，分别是文件本身和文件中的列表。其中文件本身的元数据分别来自文件的文档属性和文中的内联字段，文件中列表的元数据一般放在该列表的末尾（列表包括无序列表、有序列表和任务）。这些元数据与这篇文件绑定，可以被 Dataview 检索作为分类的依据或者作为展示的内容。

文件的隐式字段：文件中还有一些已经自动有索引的内容，比如文件的名字，文件的创建时间、修改时间等，我们称之为文件的隐式字段。他们也是能够被 Dataview 检索到的。

## 代码
```dataview
TABLE this
WHERE file = this.file
```
## 运行结果
```dataview
TABLE this
WHERE file = this.file
LIMIT 1
```

# Dataview ：向文件添加合适的元数据
## 添加文档属性的方法
- 快捷键法：ctrl + ;
- 命令面板法：ctrl + p，搜索添加文档属性 (英文为 add file property)；
- 鼠标右键文件标题：选择增加文档属性 (英文为 add file property)；
- 标签页标题栏的竖着的三个点：选择增加文档属性 (英文为 add file property)；
- 原来的手动输入 --- 依旧可行；
![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/04/202405021020308.png)

> [!tip] YAML 语法规则
> 大小写敏感，可以使用中文；
> 冒号后要跟一个空格；
> 使用缩进来代表层级关系；
> 缩进时只能用空格，不能用 Tab；
> 缩进的空格数不重要，但是同一级元素必须左对齐；
> 用井号标识注释，从 # 到当前行的末尾是注释；

## Inline Fields 行内字段
### **行内字段单独成行**
`Key::Value`
注意前面不能有其他内容，否则会被当成 Key 中的内容。:: 之后的所有内容都是 Value 的值.
![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/04/202405021023940.png)
### **行内字段插入某一行**
```
读完这本的感受：[feel:: ...]；
读完这本的感受：(feelisthewordafter:: ...)；
```
用方括号或者圆括号把 Key::Value 括起来，区别在于用圆括号括起来后，在阅读模式下不会显示 Key。
![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/04/202405021024219.png)
![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/04/202405021024790.png)

# Dataview 中的 Metadata 的数据类型
## Field Name 属性名
我们为文件添加元数据后，不一定会完全按输入格式保存。Dataview 会在内部（不会直接显示）对 Field Name 值做一定规范化，以保证格式统一。

> [!tip] Field Name 值自动修改规则
> 如果有粗体、斜体等格式，格式会被擦除，变成普通文本；
> 如果中间无空格，原本有大写的 Key 值和全部字母小写后的值都可以当作其 Key 值；
> 如果中间有空格，会被替换成 -，并且所有大写字母会被换成小写字母；

举几个例子

| 原 Field Name 的写法 | 修改后                                | 改动内容              |
| ---------------- | ---------------------------------- | ----------------- |
| **basic**        | basic                              | 去掉粗体              |
| Basic            | `Basic` 或 `basic` （不能是 `BaSic` 之类） | 增加了小写             |
| basic field      | basic-field                        | 用 - 替换空格          |
| **Bold Field**   | bold-field                         | 去掉粗体，并替换空格，同时全部小写 |


