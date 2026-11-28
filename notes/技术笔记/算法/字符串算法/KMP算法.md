---
title: "KMP算法"
aliases: [Knuth-Morris-Pratt, KMP]
tags:
  - 算法
  - 算法/字符串
difficulty: hard
created: 2025-01-11
updated: 2026-08-09
---

# KMP算法（Knuth-Morris-Pratt）

## 📌 定义

KMP算法是一种高效的**字符串匹配算法**，由Knuth、Morris和Pratt三人于1977年共同发表。它通过预处理模式串，利用已经匹配的信息避免不必要的回溯，将时间复杂度优化到O(m+n)。

## 核心思路

当模式串与文本串不匹配时，不是简单地将模式串向后移动一位，而是利用**已经匹配的部分信息**，跳过不必要的比较：

1. **预处理模式串**：构建next数组（也叫失配函数、部分匹配表）
2. **匹配过程**：利用next数组快速移动模式串位置

```
文本串: ABABCABABA
模式串: ABABC

暴力匹配需要多次回退
KMP算法通过next数组直接跳转到正确位置
```

## 🧠 为什么可以跳过

暴力匹配失配后会把模式串整体右移一位，文本指针也经常要回退。KMP 不回退文本指针，因为已经匹配过的那一段里，有一部分前缀和后缀相同，可以直接把这段相同前缀挪到后缀位置继续比。

<svg width="680" height="190" viewBox="0 0 680 190" xmlns="http://www.w3.org/2000/svg">
  <style>
    .label { font: 14px sans-serif; fill: #333; }
    .cell { fill: #f8fafc; stroke: #64748b; stroke-width: 1; }
    .hit { fill: #dcfce7; stroke: #16a34a; }
    .miss { fill: #fee2e2; stroke: #dc2626; }
    .arrow { stroke: #2563eb; stroke-width: 2; fill: none; marker-end: url(#arrow); }
  </style>
  <defs>
    <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
      <path d="M0,0 L8,4 L0,8 Z" fill="#2563eb"/>
    </marker>
  </defs>
  <text x="20" y="28" class="label">已经匹配：ABAB，下一位失配</text>
  <g transform="translate(20,45)">
    <text x="0" y="22" class="label">文本</text>
    <rect x="70" y="0" width="42" height="32" class="hit"/><text x="84" y="22" class="label">A</text>
    <rect x="112" y="0" width="42" height="32" class="hit"/><text x="126" y="22" class="label">B</text>
    <rect x="154" y="0" width="42" height="32" class="hit"/><text x="168" y="22" class="label">A</text>
    <rect x="196" y="0" width="42" height="32" class="hit"/><text x="210" y="22" class="label">B</text>
    <rect x="238" y="0" width="42" height="32" class="miss"/><text x="252" y="22" class="label">X</text>
  </g>
  <g transform="translate(20,88)">
    <text x="0" y="22" class="label">模式</text>
    <rect x="70" y="0" width="42" height="32" class="hit"/><text x="84" y="22" class="label">A</text>
    <rect x="112" y="0" width="42" height="32" class="hit"/><text x="126" y="22" class="label">B</text>
    <rect x="154" y="0" width="42" height="32" class="hit"/><text x="168" y="22" class="label">A</text>
    <rect x="196" y="0" width="42" height="32" class="hit"/><text x="210" y="22" class="label">B</text>
    <rect x="238" y="0" width="42" height="32" class="miss"/><text x="252" y="22" class="label">C</text>
  </g>
  <path d="M238 132 C280 160, 350 160, 390 132" class="arrow"/>
  <text x="310" y="178" class="label">ABAB 的最长相等前后缀是 AB，模式串跳到 j=2 继续比较</text>
</svg>

> [!note] 直觉
> `next[j]` 保存的是“失配后还能保留多少已经匹配的字符”。保留下来的部分一定是模式串自己的相等前后缀，所以不会漏掉可能的匹配。

## 💡 next数组的含义

next[i] 表示：模式串 P[0...i] 的**最长相等前后缀的长度**

- **前缀**：不包含最后一个字符的所有以第一个字符开头的连续子串
- **后缀**：不包含第一个字符的所有以最后一个字符结尾的连续子串

```
模式串: ABABC
索引:   01234

i=0: A, next[0]=-1 (规定)
i=1: AB, 无相等前后缀, next[1]=0
i=2: ABA, 前缀A = 后缀A, next[2]=1
i=3: ABAB, 前缀AB = 后缀AB, next[3]=2
i=4: ABABC, 无相等前后缀, next[4]=0
```

## 复杂度分析

| 指标 | 复杂度 | 说明 |
|------|--------|------|
| 时间复杂度 | O(m+n) | m是模式串长度，n是文本串长度 |
| 空间复杂度 | O(m) | next数组的空间 |
| 预处理时间 | O(m) | 构建next数组 |
| 匹配时间 | O(n) | 遍历文本串 |

## Go 代码

### Go 实现

```go
package main

import "fmt"

func getNext(pattern string) []int {
    m := len(pattern)
    next := make([]int, m)

    if m == 1 {
        next[0] = -1
        return next
    }

    next[0] = -1
    i, j := 0, -1

    for i < m-1 {
        if j == -1 || pattern[i] == pattern[j] {
            i++
            j++
            next[i] = j
        } else {
            j = next[j]
        }
    }

    return next
}

func kmpSearch(text, pattern string) []int {
    result := []int{}

    if len(pattern) == 0 || len(text) == 0 {
        return result
    }

    next := getNext(pattern)
    i, j := 0, 0
    n, m := len(text), len(pattern)

    for i < n {
        if j == -1 || text[i] == pattern[j] {
            i++
            j++

            if j == m {
                result = append(result, i-j)
                j = next[j-1]
            }
        } else {
            j = next[j]
        }
    }

    return result
}

func main() {
    text := "ABABCABABA"
    pattern := "ABAB"

    positions := kmpSearch(text, pattern)

    fmt.Printf("在文本'%s'中查找'%s'\n", text, pattern)
    fmt.Printf("匹配位置: %v\n", positions)
}
```

## 思路展开

### 2. 匹配过程演示

```
文本串: A B A B C A B A B A
模式串: A B A B C

i=0, j=0: A==A, i++, j++
i=1, j=1: B==B, i++, j++
i=2, j=2: A==A, i++, j++
i=3, j=3: B==B, i++, j++
i=4, j=4: C==C, i++, j++
匹配成功！位置=0

继续匹配...
```

## 经典题目

### 基础应用
- [ ] [实现 strStr()](https://leetcode.cn/problems/implement-strstr/) - LeetCode 28
- [ ] [重复的子字符串](https://leetcode.cn/problems/repeated-substring-pattern/) - LeetCode 459

### KMP应用
- [ ] [最短回文串](https://leetcode.cn/problems/shortest-palindrome/) - LeetCode 214
- [ ] [串联所有单词的子串](https://leetcode.cn/problems/substring-with-concatenation-of-all-words/) - LeetCode 30

### 变体
- [ ] 多模式串匹配（AC自动机）
- [ ] 循环字符串判断

## ⚖️ 优缺点

### 优点
- ✅ **时间复杂度优秀**：O(m+n)，线性时间
- ✅ **不回溯文本串**：i指针只增不减
- ✅ **理论完美**：最坏情况也是O(m+n)

### 缺点
- ❌ **实现复杂**：next数组不易理解
- ❌ **实际性能**：对短模式串，简单算法可能更快
- ❌ **空间开销**：需要额外的next数组

## 🎨 应用场景

1. **文本编辑器**：查找功能
2. **病毒扫描**：特征码匹配
3. **DNA序列分析**：基因片段查找
4. **数据压缩**：重复模式识别

## 💡 KMP vs 其他字符串匹配算法

| 特性 | KMP | Boyer-Moore | Rabin-Karp |
|------|-----|-------------|------------|
| 时间复杂度 | O(m+n) | 最好O(n/m) | 平均O(m+n) |
| 预处理 | O(m) | O(m+σ) | O(m) |
| 空间 | O(m) | O(m+σ) | O(1) |
| 适用场景 | 通用 | 长模式串 | 多模式匹配 |

注：σ是字符集大小

## 🔍 为什么KMP高效？

1. **利用已匹配信息**：不重复比较已经匹配的部分
2. **文本串不回溯**：i指针始终向前
3. **模式串智能跳转**：通过next数组快速定位

## 💡 KMP的变体

### AC自动机（Aho-Corasick）
- 多模式串匹配
- KMP的扩展
- 应用：敏感词过滤

### 扩展KMP（Z算法）
- 计算每个位置的最长匹配前缀
- 线性时间复杂度

## 相关主题

- [[字符串匹配算法对比#Boyer-Moore|Boyer-Moore算法]] - 另一种高效匹配算法
- [[Rabin-Karp算法]] - 基于哈希的匹配
- [[字符串匹配算法对比#朴素匹配|暴力匹配]] - 基础的匹配算法
- [[字符串匹配算法对比#Sunday|Sunday算法]] - BM的简化版
- [[_index|字符串算法]] - 返回字符串算法总览

---
返回：[[_index|字符串算法]] | [[../算法学习导航|算法学习导航]]
