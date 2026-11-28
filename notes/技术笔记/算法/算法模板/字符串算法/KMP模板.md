---
title: "KMP模板"
aliases:
  - KMP Template
  - 前缀函数模板
tags:
  - 算法
  - 算法/模板
  - 算法/字符串
difficulty: medium
created: 2026-08-08
updated: 2026-08-09
status: active
---

# KMP 模板

> [!summary] 一句话说明
> KMP 的本质是：失配时不回退文本指针，而是让模式串跳到“仍有希望继续匹配”的最长边界位置。

## 先记核心定义

`next[i]` 或 `pi[i]` 表示：

```text
pattern[0..i] 的最长相等真前缀和真后缀长度
```

这就是 KMP 能跳过无效比较的关键。

## Go 模板：前缀函数

```go
func PrefixFunction(pattern string) []int {
    pi := make([]int, len(pattern))
    matched := 0

    for i := 1; i < len(pattern); i++ {
        for matched > 0 && pattern[i] != pattern[matched] {
            matched = pi[matched-1]
        }
        if pattern[i] == pattern[matched] {
            matched++
        }
        pi[i] = matched
    }

    return pi
}
```

## Go 模板：查找所有匹配位置

```go
func KMPSearch(text, pattern string) []int {
    if len(pattern) == 0 {
        result := make([]int, len(text)+1)
        for i := range result {
            result[i] = i
        }
        return result
    }

    pi := PrefixFunction(pattern)
    matched := 0
    positions := []int{}

    for i := 0; i < len(text); i++ {
        for matched > 0 && text[i] != pattern[matched] {
            matched = pi[matched-1]
        }
        if text[i] == pattern[matched] {
            matched++
        }
        if matched == len(pattern) {
            positions = append(positions, i-len(pattern)+1)
            matched = pi[matched-1]
        }
    }

    return positions
}
```

## 为什么找到一次后还不能停在 `0`

当匹配完成后，模式串后缀仍可能和它自己的前缀重叠。  
所以要继续跳回：

```text
pi[matched-1]
```

这样才能找出重叠匹配。

## 易错点

> [!warning] KMP 模板最容易错的地方
> - 失配跳转是 `pi[matched-1]`，不是 `pi[matched]`。
> - `pi[i]` 存的是长度，不是下标。
> - 找到一次匹配后不能直接清零，否则会漏掉重叠答案。

## 复杂度

| 阶段 | 时间复杂度 | 空间复杂度 |
|---|---:|---:|
| 构造前缀函数 | `O(m)` | `O(m)` |
| 匹配 | `O(n)` | `O(1)` 额外除前缀数组外 |

## 相关主题

- [[../../字符串算法/KMP算法|KMP算法]]
- [[Z算法模板]]

---
返回：[[../_index|算法模板]]
