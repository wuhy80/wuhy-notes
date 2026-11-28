---
title: "Z算法模板"
aliases:
  - Z Algorithm Template
  - 扩展KMP模板
tags:
  - 算法
  - 算法/模板
  - 算法/字符串
difficulty: medium
created: 2026-08-08
updated: 2026-08-09
status: active
---

# Z 算法模板

> [!summary] 一句话说明
> `z[i]` 表示从 `i` 开始的后缀，和整个字符串前缀的最长公共前缀长度。

## 模板适用场景

- 模式串匹配
- 判断字符串前缀重复结构
- 需要快速知道“某位置起和前缀能对上多长”

## Go 模板：Z 函数

```go
func ZFunction(s string) []int {
    z := make([]int, len(s))
    left, right := 0, 0

    for i := 1; i < len(s); i++ {
        if i <= right {
            z[i] = min(right-i+1, z[i-left])
        }

        for i+z[i] < len(s) && s[z[i]] == s[i+z[i]] {
            z[i]++
        }

        if i+z[i]-1 > right {
            left = i
            right = i + z[i] - 1
        }
    }

    return z
}

func min(a, b int) int {
    if a < b {
        return a
    }
    return b
}
```

## Go 模板：模式匹配

```go
func ZSearch(text, pattern string) []int {
    if len(pattern) == 0 {
        result := make([]int, len(text)+1)
        for i := range result {
            result[i] = i
        }
        return result
    }

    combined := pattern + "#" + text
    z := ZFunction(combined)
    offset := len(pattern) + 1

    positions := []int{}
    for i := offset; i < len(combined); i++ {
        if z[i] >= len(pattern) {
            positions = append(positions, i-offset)
        }
    }
    return positions
}
```

## 为什么 `[left, right]` 这么重要

Z 算法的优化核心就是当前这个 Z-box：

```text
[left, right]
```

如果当前位置落在这个区间里，就能先借用镜像位置的已有结果，而不是从零开始暴力比。

## 易错点

> [!warning] Z 算法模板最容易错的地方
> - `[left, right]` 是闭区间。
> - 模式串拼接的分隔符必须不会和正常匹配串混淆。
> - 常见约定里 `z[0] = 0`，不要自己改成别的口径又忘了统一。

## 复杂度

| 指标 | 复杂度 |
|---|---:|
| 时间复杂度 | `O(n)` |
| 空间复杂度 | `O(n)` |

## 相关主题

- [[../../字符串算法/Z算法|Z算法]]
- [[KMP模板]]

---
返回：[[../_index|算法模板]]
