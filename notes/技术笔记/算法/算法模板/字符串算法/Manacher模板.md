---
title: "Manacher模板"
aliases:
  - Manacher Template
  - 最长回文子串线性模板
tags:
  - 算法
  - 算法/模板
  - 算法/字符串
difficulty: hard
created: 2026-08-08
updated: 2026-08-09
status: active
---

# Manacher 模板

> [!summary] 一句话说明
> Manacher 的核心是先用分隔符把奇偶回文统一，再利用当前最右回文区间的镜像信息减少重复扩展。

## 模板适用场景

- 最长回文子串
- 需要线性时间处理回文半径

如果只是偶尔判断一个子串是不是回文，没必要上这个模板。

## Go 模板：最长回文子串

```go
func LongestPalindrome(s string) string {
    if len(s) == 0 {
        return ""
    }

    t := make([]byte, 0, len(s)*2+3)
    t = append(t, '^')
    for i := 0; i < len(s); i++ {
        t = append(t, '#')
        t = append(t, s[i])
    }
    t = append(t, '#', '$')

    p := make([]int, len(t))
    center, right := 0, 0
    maxLen, centerIndex := 0, 0

    for i := 1; i < len(t)-1; i++ {
        mirror := 2*center - i
        if i < right {
            p[i] = min(right-i, p[mirror])
        }

        for t[i+p[i]+1] == t[i-p[i]-1] {
            p[i]++
        }

        if i+p[i] > right {
            center = i
            right = i + p[i]
        }

        if p[i] > maxLen {
            maxLen = p[i]
            centerIndex = i
        }
    }

    start := (centerIndex - maxLen) / 2
    return s[start : start+maxLen]
}

func min(a, b int) int {
    if a < b {
        return a
    }
    return b
}
```

## 为什么要插入分隔符

因为这样一来：

- 原来的奇数回文
- 原来的偶数回文

都会统一成“以某个位置为中心向两边扩展”的同一种模型。

## 镜像复用到底在复用什么

如果当前位置 `i` 落在当前最右回文区间内，那么它关于 `center` 的镜像点 `mirror` 的部分半径信息可以直接拿来用。  
这样就不用从头暴力扩展。

## 易错点

> [!warning] Manacher 模板最容易错的地方
> - 原串下标换算是 `start = (centerIndex-maxLen)/2`。
> - `right` 记录的是当前已知回文的最右覆盖位置。
> - 分隔符和哨兵字符必须保证不会误参与正常匹配逻辑。

## 复杂度

| 指标 | 复杂度 |
|---|---:|
| 时间复杂度 | `O(n)` |
| 空间复杂度 | `O(n)` |

## 相关主题

- [[../../字符串算法/Manacher算法|Manacher算法]]
- [[../../字符串算法/滑动窗口|滑动窗口]]

---
返回：[[../_index|算法模板]]
