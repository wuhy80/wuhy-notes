---
title: "Trie树模板"
aliases:
  - Trie Template
  - 前缀树模板
tags:
  - 算法
  - 算法/模板
  - 算法/数据结构
difficulty: medium
created: 2026-08-08
updated: 2026-08-09
status: active
---

# Trie 树模板

> [!summary] 一句话说明
> Trie 的核心不是“树”，而是“公共前缀只存一次”，所以从根走到某个节点的路径本身就是一个前缀。

## 模板适用场景

- 插入很多字符串
- 判断某个单词是否存在
- 判断某个前缀是否存在
- 字典树搜索、单词替换、前缀统计

如果题目进一步要求多模式匹配，就要转向 [[../../字符串算法/AC自动机|AC自动机]]。

## Go 模板：标准 Trie

```go
type TrieNode struct {
    Children map[byte]*TrieNode
    IsWord   bool
}

type Trie struct {
    Root *TrieNode
}

func NewTrie() *Trie {
    return &Trie{
        Root: &TrieNode{
            Children: map[byte]*TrieNode{},
        },
    }
}

func (t *Trie) Insert(word string) {
    node := t.Root
    for i := 0; i < len(word); i++ {
        ch := word[i]
        if node.Children[ch] == nil {
            node.Children[ch] = &TrieNode{
                Children: map[byte]*TrieNode{},
            }
        }
        node = node.Children[ch]
    }
    node.IsWord = true
}

func (t *Trie) Search(word string) bool {
    node := t.find(word)
    return node != nil && node.IsWord
}

func (t *Trie) StartsWith(prefix string) bool {
    return t.find(prefix) != nil
}

func (t *Trie) find(s string) *TrieNode {
    node := t.Root
    for i := 0; i < len(s); i++ {
        ch := s[i]
        if node.Children[ch] == nil {
            return nil
        }
        node = node.Children[ch]
    }
    return node
}
```

## 这个模板真正维护的是什么

- `Children`：当前前缀后面还能接哪些字符
- `IsWord`：这条路径是不是刚好构成一个完整单词

注意：

```text
找到路径 != 找到完整单词
```

这也是为什么 `Search` 和 `StartsWith` 要分开写。

## 为什么有时用数组而不是 map

如果字符集固定而且很小，比如只有小写字母 `a-z`，可以把 `Children` 改成长度 `26` 的数组，常数更小。  
如果字符集稀疏、范围大，`map` 更灵活。

## 常见扩展

- 统计某个前缀出现次数
- 删除单词
- 通配符搜索
- 配合 DFS 在二维板子上搜单词

很多扩展本质都是在节点上多挂一些字段。

## 易错点

> [!warning] Trie 模板最容易错的地方
> - `Search` 不能只看路径存在，还要看 `IsWord`。
> - 空字符串是否算单词，要看题目定义。
> - 如果字符集不是 ASCII 小写字母，别硬写定长数组。

## 复杂度

| 操作 | 时间复杂度 | 空间复杂度 |
|---|---:|---:|
| 插入 | `O(L)` | `O(L)` 新增前缀时 |
| 查询 | `O(L)` | `O(1)` |
| 前缀判断 | `O(L)` | `O(1)` |

这里 `L` 是字符串长度。

## 相关主题

- [[../../数据结构/Trie树|Trie树]]
- [[../../字符串算法/AC自动机|AC自动机]]

---
返回：[[../_index|算法模板]]
