---
title: "AC自动机模板"
aliases:
  - Aho-Corasick Template
  - 多模式串匹配模板
tags:
  - 算法
  - 算法/模板
  - 算法/字符串
difficulty: hard
created: 2026-08-08
updated: 2026-08-09
status: active
---

# AC 自动机模板

> [!summary] 一句话说明
> AC 自动机就是“Trie + fail 指针”，用一次扫描同时匹配多条模式串。

## 模板适用场景

- 文本里要匹配多组关键词
- 一次扫描找出所有模式串出现位置
- 模式串数量很多，不适合逐条 KMP

## Go 模板

```go
type ACNode struct {
    Next   map[byte]int
    Fail   int
    Output []int
}

type AhoCorasick struct {
    Nodes    []ACNode
    Patterns []string
}

func NewAhoCorasick(patterns []string) *AhoCorasick {
    ac := &AhoCorasick{
        Nodes: []ACNode{{Next: map[byte]int{}}},
        Patterns: patterns,
    }

    for id, pattern := range patterns {
        ac.insert(pattern, id)
    }
    ac.build()
    return ac
}

func (ac *AhoCorasick) newNode() int {
    ac.Nodes = append(ac.Nodes, ACNode{Next: map[byte]int{}})
    return len(ac.Nodes) - 1
}

func (ac *AhoCorasick) insert(pattern string, id int) {
    state := 0
    for i := 0; i < len(pattern); i++ {
        ch := pattern[i]
        next, ok := ac.Nodes[state].Next[ch]
        if !ok {
            next = ac.newNode()
            ac.Nodes[state].Next[ch] = next
        }
        state = next
    }
    ac.Nodes[state].Output = append(ac.Nodes[state].Output, id)
}

func (ac *AhoCorasick) build() {
    queue := []int{}
    for _, next := range ac.Nodes[0].Next {
        queue = append(queue, next)
    }

    for len(queue) > 0 {
        state := queue[0]
        queue = queue[1:]

        for ch, child := range ac.Nodes[state].Next {
            fail := ac.Nodes[state].Fail
            for fail > 0 {
                if _, ok := ac.Nodes[fail].Next[ch]; ok {
                    break
                }
                fail = ac.Nodes[fail].Fail
            }

            if next, ok := ac.Nodes[fail].Next[ch]; ok {
                ac.Nodes[child].Fail = next
            }
            ac.Nodes[child].Output = append(ac.Nodes[child].Output, ac.Nodes[ac.Nodes[child].Fail].Output...)
            queue = append(queue, child)
        }
    }
}

func (ac *AhoCorasick) Search(text string) [][2]interface{} {
    state := 0
    matches := [][2]interface{}{}

    for i := 0; i < len(text); i++ {
        ch := text[i]
        for state > 0 {
            if _, ok := ac.Nodes[state].Next[ch]; ok {
                break
            }
            state = ac.Nodes[state].Fail
        }

        if next, ok := ac.Nodes[state].Next[ch]; ok {
            state = next
        }

        for _, patternID := range ac.Nodes[state].Output {
            pattern := ac.Patterns[patternID]
            matches = append(matches, [2]interface{}{i - len(pattern) + 1, pattern})
        }
    }

    return matches
}
```

## 为什么 fail 指针要按 BFS 构造

因为一个节点的 fail，依赖它父节点的 fail 已经先求出来。  
这正是 BFS 层序构造的意义。

## 为什么输出要继承 fail 节点

因为当前模式串的后缀，可能本身又是另一个模式串。  
如果不继承 fail 节点的输出，就会漏掉这些“后缀匹配”。

## 易错点

> [!warning] AC 自动机模板最容易错的地方
> - fail 必须按 BFS 顺序构造。
> - 输出集合要继承 fail 指向节点的输出。
> - 模式串集合一旦变化，通常要整体重建自动机。

## 复杂度

| 阶段 | 时间复杂度 |
|---|---:|
| 建 Trie | `O(P)` |
| 建 fail | `O(P)` |
| 扫描文本 | `O(T + Z)` |

这里 `P` 是模式串总长度，`T` 是文本长度，`Z` 是匹配结果数。

## 相关主题

- [[../../字符串算法/AC自动机|AC自动机]]
- [[../数据结构/Trie树模板|Trie树模板]]

---
返回：[[../_index|算法模板]]
