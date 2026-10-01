---
title: "Trie树（前缀树）"
aliases: ["Trie", "Prefix Tree", "字典树"]
tags:
  - 算法
  - 算法/树
  - 算法/数据结构
difficulty: medium
created: 2025-01-11
updated: 2026-08-09
---

# Trie树（前缀树）

> [!summary] 一句话说明
> Trie 的本质是共享前缀，所以字符串查找、前缀匹配都能被压到很短的路径上。

## Go 代码

```go
type TrieNode struct {
    children map[rune]*TrieNode
    isEnd    bool
}

type Trie struct {
    root *TrieNode
}

func Constructor() Trie {
    return Trie{root: &TrieNode{children: map[rune]*TrieNode{}}}
}

func (t *Trie) Insert(word string) {
    node := t.root
    for _, ch := range word {
        if node.children[ch] == nil {
            node.children[ch] = &TrieNode{children: map[rune]*TrieNode{}}
        }
        node = node.children[ch]
    }
    node.isEnd = true
}

func (t *Trie) Search(word string) bool {
    node := t.root
    for _, ch := range word {
        next := node.children[ch]
        if next == nil {
            return false
        }
        node = next
    }
    return node.isEnd
}

func (t *Trie) StartsWith(prefix string) bool {
    node := t.root
    for _, ch := range prefix {
        next := node.children[ch]
        if next == nil {
            return false
        }
        node = next
    }
    return true
}
```

## 相关主题

- [[../_index|树算法]]

---
返回：[[../_index|树算法]] | [[../../算法学习导航|算法学习导航]]
