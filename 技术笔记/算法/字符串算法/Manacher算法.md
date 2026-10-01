---
title: "Manacher算法"
aliases: ["马拉车算法", "最长回文子串"]
tags:
  - 算法
  - 算法/字符串
difficulty: hard
created: 2025-01-11
updated: 2026-08-09
---

# Manacher算法

## 📌 定义

Manacher算法（马拉车算法）是一种用于在**线性时间**内找出字符串中**最长回文子串**的算法，由Glenn K. Manacher于1975年发明。

## 核心思路

通过利用回文串的**对称性**，避免重复计算，将时间复杂度从O(n²)优化到O(n)：

1. **预处理**：在每个字符间插入特殊字符（如'#'），统一处理奇偶长度回文
2. **记录信息**：使用数组记录每个位置的回文半径
3. **利用对称性**：利用已知的回文信息加速计算

```
原字符串: "abba"
预处理后: "#a#b#b#a#"

奇数长度回文: #a# → a
偶数长度回文: #a#b#b#a# → abba
```

## 💡 关键概念

### 1. 回文半径数组 p[]

`p[i]` 表示以位置i为中心的回文串的**半径**（包含中心字符）

```
字符串: # a # b # b # a #
索引i:  0 1 2 3 4 5 6 7 8
p[i]:   1 2 1 2 5 2 1 2 1

p[4]=5 表示以索引4为中心，半径为5的回文串: #a#b#b#a#
实际回文串长度 = p[i] - 1 = 4 ("abba")
```

### 2. 中心位置 C 和右边界 R

- **C**: 当前已知回文串中，右边界最远的回文串的中心
- **R**: 当前已知回文串能覆盖到的最右位置

## 复杂度分析

| 指标 | 复杂度 | 说明 |
|------|--------|------|
| 时间复杂度 | O(n) | 每个位置最多访问两次 |
| 空间复杂度 | O(n) | 需要p数组和预处理后的字符串 |

## Go 代码

### Go 实现

```go
package main

import (
    "fmt"
    "strings"
)

func manacher(s string) string {
    // 预处理
    var builder strings.Builder
    builder.WriteString("^#")
    for _, c := range s {
        builder.WriteRune(c)
        builder.WriteRune('#')
    }
    builder.WriteString("$")
    t := builder.String()

    n := len(t)
    p := make([]int, n)
    C, R := 0, 0

    // 计算回文半径
    for i := 1; i < n-1; i++ {
        mirror := 2*C - i

        if i < R {
            if p[mirror] < R-i {
                p[i] = p[mirror]
            } else {
                p[i] = R - i
            }
        }

        // 尝试扩展
        for t[i+p[i]+1] == t[i-p[i]-1] {
            p[i]++
        }

        // 更新C和R
        if i+p[i] > R {
            C = i
            R = i + p[i]
        }
    }

    // 找出最长回文
    maxLen := 0
    centerIndex := 0
    for i := 1; i < n-1; i++ {
        if p[i] > maxLen {
            maxLen = p[i]
            centerIndex = i
        }
    }

    start := (centerIndex - maxLen) / 2
    return s[start : start+maxLen]
}

func main() {
    s := "babad"
    fmt.Printf("字符串'%s'的最长回文子串: '%s'\n", s, manacher(s))
}
```

## 思路展开

### 1. 为什么要插入'#'？

统一处理奇偶长度回文：

```
奇数长度回文: "aba"  → "#a#b#a#" (中心是b)
偶数长度回文: "abba" → "#a#b#b#a#" (中心是#)
```

### 2. 利用对称性加速

```
已知：以C为中心的回文串覆盖[L, R]
当前：计算i位置的回文半径
镜像：mirror = 2*C - i

如果i < R：
  情况1: p[mirror]较小，i完全在[L,R]内
         p[i] = p[mirror]

  情况2: p[mirror]较大，超出[L,R]
         p[i] = R - i

  情况3: p[mirror]刚好到L
         需要继续扩展
```

### 3. 为什么时间复杂度是O(n)？

- R只会不断向右移动，不会回退
- 每个位置最多被访问两次：
  1. 作为i被计算
  2. 作为扩展的一部分
- 总的扩展次数 ≤ n

## 经典题目

### 基础应用
- [ ] [最长回文子串](https://leetcode.cn/problems/longest-palindromic-substring/) - LeetCode 5
- [ ] [回文子串](https://leetcode.cn/problems/palindromic-substrings/) - LeetCode 647

### 进阶应用
- [ ] [最短回文串](https://leetcode.cn/problems/shortest-palindrome/) - LeetCode 214
- [ ] [分割回文串 IV](https://leetcode.cn/problems/palindrome-partitioning-iv/) - LeetCode 1745

## ⚖️ 优缺点

### 优点
- ✅ **时间复杂度O(n)**：最优解
- ✅ **思想优美**：利用对称性
- ✅ **可求所有回文**：p数组包含所有信息

### 缺点
- ❌ **理解困难**：算法思想不直观
- ❌ **实现复杂**：细节较多
- ❌ **空间开销**：需要额外数组

## 🎨 应用场景

1. **最长回文子串**：O(n)时间求解
2. **回文子串计数**：sum(p[i]//2)
3. **最短回文前缀/后缀**：添加最少字符构成回文

## 💡 Manacher vs 其他回文算法

| 算法 | 时间复杂度 | 空间复杂度 | 实现难度 |
|------|-----------|-----------|---------|
| 暴力枚举 | O(n³) | O(1) | 简单 |
| 中心扩展 | O(n²) | O(1) | 简单 |
| 动态规划 | O(n²) | O(n²) | 中等 |
| **Manacher** | **O(n)** | **O(n)** | **困难** |

## 🔍 Manacher的扩展应用

## 相关主题

- [[中心扩展法]] - 简单的O(n²)算法
- [[../动态规划/区间DP#1. 最长回文子串（LeetCode 5）|动态规划求回文]] - DP方法
- [[KMP算法]] - 另一个线性时间字符串算法
- [[_index|字符串算法]] - 返回字符串算法总览

---
返回：[[_index|字符串算法]] | [[../算法学习导航|算法学习导航]]
