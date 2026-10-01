---
title: "Trie树"
aliases: ["Trie", "Prefix Tree", "字典树", "前缀树"]
tags:
  - 算法
  - 算法/数据结构
  - 算法/数据结构/树
difficulty: medium
created: 2025-01-11
updated: 2026-08-09
---

# Trie树

> [!summary] 一句话说明
> Trie 的本质是“把字符串拆成一条条字符路径”，让公共前缀只存一份。

## 为什么它适合做前缀查询

假设插入：

- `cat`
- `car`
- `card`
- `dog`

结构会像这样：

```text
root
 ├─ c
 │   └─ a
 │       ├─ t
 │       └─ r
 │           └─ d
 └─ d
     └─ o
         └─ g
```

公共前缀 `ca` 只存一次，所以：

- 查单词：沿字符一路往下走
- 查前缀：同样一路往下走，只是不用要求最后必须是结尾

## Go 代码：基础模板

这里用 `map[rune]*TrieNode`，字符集更灵活；如果题目明确只有小写字母，再换成长度 26 的数组会更快。

```go
type TrieNode struct {
    Children map[rune]*TrieNode
    IsEnd    bool
}

type Trie struct {
    Root *TrieNode
}

func NewTrie() *Trie {
    return &Trie{
        Root: &TrieNode{Children: make(map[rune]*TrieNode)},
    }
}

func (t *Trie) Insert(word string) {
    node := t.Root
    for _, ch := range word {
        if node.Children[ch] == nil {
            node.Children[ch] = &TrieNode{Children: make(map[rune]*TrieNode)}
        }
        node = node.Children[ch]
    }
    node.IsEnd = true
}

func (t *Trie) Search(word string) bool {
    node := t.Root
    for _, ch := range word {
        if node.Children[ch] == nil {
            return false
        }
        node = node.Children[ch]
    }
    return node.IsEnd
}

func (t *Trie) StartsWith(prefix string) bool {
    node := t.Root
    for _, ch := range prefix {
        if node.Children[ch] == nil {
            return false
        }
        node = node.Children[ch]
    }
    return true
}
```

## 如果只有小写字母

```go
type ArrayTrieNode struct {
    Children [26]*ArrayTrieNode
    IsEnd    bool
}

type ArrayTrie struct {
    Root *ArrayTrieNode
}

func NewArrayTrie() *ArrayTrie {
    return &ArrayTrie{Root: &ArrayTrieNode{}}
}

func (t *ArrayTrie) Insert(word string) {
    node := t.Root
    for i := 0; i < len(word); i++ {
        idx := word[i] - 'a'
        if node.Children[idx] == nil {
            node.Children[idx] = &ArrayTrieNode{}
        }
        node = node.Children[idx]
    }
    node.IsEnd = true
}
```

这种实现的好处是：

- 常数更小
- 不需要哈希

代价是：

- 只能处理固定字符集
- 空间更“硬”

## 高级功能：删除单词

删除不是简单地把路径全删掉，因为别的单词可能还在共用前缀。

```go
func (t *Trie) Delete(word string) bool {
    var dfs func(node *TrieNode, chars []rune, index int) bool
    dfs = func(node *TrieNode, chars []rune, index int) bool {
        if index == len(chars) {
            if !node.IsEnd {
                return false
            }
            node.IsEnd = false
            return len(node.Children) == 0
        }

        child := node.Children[chars[index]]
        if child == nil {
            return false
        }

        shouldDelete := dfs(child, chars, index+1)
        if shouldDelete {
            delete(node.Children, chars[index])
        }

        return !node.IsEnd && len(node.Children) == 0
    }

    chars := []rune(word)
    dfs(t.Root, chars, 0)
    return true
}
```

## 获取所有前缀匹配的单词

```go
func (t *Trie) WordsWithPrefix(prefix string) []string {
    node := t.Root
    for _, ch := range prefix {
        if node.Children[ch] == nil {
            return nil
        }
        node = node.Children[ch]
    }

    result := make([]string, 0)
    path := []rune(prefix)

    var dfs func(cur *TrieNode)
    dfs = func(cur *TrieNode) {
        if cur.IsEnd {
            result = append(result, string(path))
        }
        for ch, child := range cur.Children {
            path = append(path, ch)
            dfs(child)
            path = path[:len(path)-1]
        }
    }

    dfs(node)
    return result
}
```

## 经典应用

### LeetCode 211：支持 `.` 通配符

```go
type WordDictionary struct {
    trie *Trie
}

func NewWordDictionary() *WordDictionary {
    return &WordDictionary{trie: NewTrie()}
}

func (wd *WordDictionary) AddWord(word string) {
    wd.trie.Insert(word)
}

func (wd *WordDictionary) Search(word string) bool {
    chars := []rune(word)

    var dfs func(node *TrieNode, index int) bool
    dfs = func(node *TrieNode, index int) bool {
        if index == len(chars) {
            return node.IsEnd
        }

        ch := chars[index]
        if ch == '.' {
            for _, child := range node.Children {
                if dfs(child, index+1) {
                    return true
                }
            }
            return false
        }

        child := node.Children[ch]
        if child == nil {
            return false
        }
        return dfs(child, index+1)
    }

    return dfs(wd.trie.Root, 0)
}
```

### LeetCode 648：替换单词

```go
func replaceWords(dictionary []string, sentence string) string {
    trie := NewTrie()
    for _, word := range dictionary {
        trie.Insert(word)
    }

    words := strings.Split(sentence, " ")
    for i, word := range words {
        node := trie.Root
        prefix := make([]rune, 0)
        replaced := false

        for _, ch := range word {
            if node.Children[ch] == nil {
                break
            }
            node = node.Children[ch]
            prefix = append(prefix, ch)
            if node.IsEnd {
                words[i] = string(prefix)
                replaced = true
                break
            }
        }

        if !replaced {
            words[i] = word
        }
    }

    return strings.Join(words, " ")
}
```

## Trie 和哈希表怎么选

哈希表更适合：

- 精确查单词

Trie 更适合：

- 前缀查询
- 字典序遍历
- 自动补全
- 模糊匹配

## 易错点

- `search` 和 `startsWith` 的区别只在最后是否要求 `IsEnd = true`。
- 删除单词时不能把公共前缀误删掉。
- 如果题目字符集固定，优先考虑数组版节点。
- Go 里 `range string` 按 `rune` 走，和按字节走要分清。

## 相关主题

- [[哈希表]]
- [[../字符串算法/_index|字符串算法]]
- [[二叉搜索树]]

---
返回：[[_index|数据结构]] | [[../算法学习导航|算法学习导航]]
