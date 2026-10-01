---
title: "双向BFS"
aliases: ["Bidirectional BFS", "双向广度优先搜索"]
tags:
  - 算法
  - 算法/搜索
  - 算法/搜索/BFS
difficulty: hard
created: 2025-01-11
updated: 2026-08-09
---

# 双向BFS

> [!summary] 一句话说明
> 双向 BFS 的本质不是“写两个 BFS”，而是让起点和终点各走一半，在中间相遇，从而把搜索深度从 `d` 压到大约 `d/2`。

## 为什么会更快

假设每层平均分出 `b` 个状态，目标深度是 `d`：

- 普通 BFS：大约扩展 `b^d`
- 双向 BFS：两边各扩展 `b^(d/2)`，总量约 `2 * b^(d/2)`

```text
普通 BFS:
S -> 一层层往外爆炸

双向 BFS:
S -> ->      <- <- T
      中间相遇
```

## 什么时候适合双向 BFS

- 起点和终点都明确。
- 状态转移基本可逆，或者终点也能自然向外扩展。
- 状态空间很大，普通 BFS 太慢。

不适合：

- 只有起点，没有明确终点。
- 终点方向无法生成前驱状态。

## Go 模板

关键点只有三个：

1. 两边各维护一个前沿集合。
2. 每轮总是扩展更小的那一边。
3. 扩展时一旦碰到对面的前沿，就说明最短路找到了。

```go
func bidirectionalBFS(start, end string) int {
    if start == end {
        return 0
    }

    front := map[string]bool{start: true}
    back := map[string]bool{end: true}
    visited := map[string]bool{start: true, end: true}
    steps := 0

    for len(front) > 0 && len(back) > 0 {
        if len(front) > len(back) {
            front, back = back, front
        }

        nextFront := make(map[string]bool)
        for state := range front {
            for _, next := range getNeighbors(state) {
                if back[next] {
                    return steps + 1
                }
                if !visited[next] {
                    visited[next] = true
                    nextFront[next] = true
                }
            }
        }

        front = nextFront
        steps++
    }

    return -1
}
```

## 为什么总扩展更小的一边

这一步不是可有可无的优化，而是双向 BFS 最核心的剪枝之一。

```go
if len(front) > len(back) {
    front, back = back, front
}
```

原因很简单：

- 每轮成本主要取决于当前前沿大小。
- 扩展更小的一边，能显著减少本轮生成的状态数。

## 例题：单词接龙

双向 BFS 在这题上非常典型，因为：

- 起点和终点都知道。
- 每个状态的邻居生成规则对两边都一样。

```go
func ladderLength(beginWord, endWord string, wordList []string) int {
    wordSet := make(map[string]bool, len(wordList))
    for _, word := range wordList {
        wordSet[word] = true
    }
    if !wordSet[endWord] {
        return 0
    }

    front := map[string]bool{beginWord: true}
    back := map[string]bool{endWord: true}
    visited := map[string]bool{beginWord: true, endWord: true}
    steps := 1

    getWordNeighbors := func(word string) []string {
        chars := []byte(word)
        result := make([]string, 0)
        for i := 0; i < len(chars); i++ {
            original := chars[i]
            for ch := byte('a'); ch <= 'z'; ch++ {
                if ch == original {
                    continue
                }
                chars[i] = ch
                next := string(chars)
                if wordSet[next] {
                    result = append(result, next)
                }
            }
            chars[i] = original
        }
        return result
    }

    for len(front) > 0 && len(back) > 0 {
        if len(front) > len(back) {
            front, back = back, front
        }

        nextFront := make(map[string]bool)
        for word := range front {
            for _, next := range getWordNeighbors(word) {
                if back[next] {
                    return steps + 1
                }
                if !visited[next] {
                    visited[next] = true
                    nextFront[next] = true
                }
            }
        }

        front = nextFront
        steps++
    }

    return 0
}
```

## 例题：打开转盘锁

```go
func openLockBi(deadends []string, target string) int {
    dead := make(map[string]bool, len(deadends))
    for _, state := range deadends {
        dead[state] = true
    }
    if dead["0000"] || dead[target] {
        return -1
    }
    if target == "0000" {
        return 0
    }

    getLockNeighbors := func(state string) []string {
        result := make([]string, 0, 8)
        for i := 0; i < 4; i++ {
            for _, delta := range []int{-1, 1} {
                bytes := []byte(state)
                digit := int(bytes[i]-'0')
                digit = (digit + delta + 10) % 10
                bytes[i] = byte(digit) + '0'
                next := string(bytes)
                if !dead[next] {
                    result = append(result, next)
                }
            }
        }
        return result
    }

    front := map[string]bool{"0000": true}
    back := map[string]bool{target: true}
    visited := map[string]bool{"0000": true, target: true}
    steps := 0

    for len(front) > 0 && len(back) > 0 {
        if len(front) > len(back) {
            front, back = back, front
        }

        nextFront := make(map[string]bool)
        for state := range front {
            for _, next := range getLockNeighbors(state) {
                if back[next] {
                    return steps + 1
                }
                if !visited[next] {
                    visited[next] = true
                    nextFront[next] = true
                }
            }
        }

        front = nextFront
        steps++
    }

    return -1
}
```

## 共享 visited 还是双侧分别维护

两种写法都能做：

```go
visited := map[string]bool{start: true, end: true}
```

或者：

```go
frontVisited := map[string]bool{start: true}
backVisited := map[string]bool{end: true}
```

如果题目只要求最短距离，通常共享 `visited` 就够了。  
如果题目要求重建完整路径，分开维护会更自然。

## 易错点

- `steps` 的定义要统一，很多 bug 都出在相遇时到底返回 `steps` 还是 `steps + 1`。
- “相遇”判断应该放在扩展邻居时，而不是等下一轮统一比较。
- 一定要从更小的前沿扩展，否则双向 BFS 的优势会大打折扣。
- 双向 BFS 只有在“终点也能向外扩”时才成立。

## 相关主题

- [[../广度优先搜索/BFS基础模板|BFS基础模板]]
- [[A星搜索]]

---
返回：[[../_index|搜索算法]]
