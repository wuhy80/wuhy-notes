---
title: "LCS与LIS模板"
aliases:
  - LCS LIS Template
  - 最长公共子序列模板
  - 最长递增子序列模板
tags:
  - 算法
  - 算法/模板
  - 算法/动态规划
difficulty: medium
created: 2026-08-08
updated: 2026-08-09
status: active
---

# LCS 与 LIS 模板

> [!summary] 一句话说明
> LCS 的关键是二维状态转移，LIS 的关键是维护“每种长度下最小可能尾值”。

## LCS：最长公共子序列

### 状态定义

```text
dp[i][j] = text1 前 i 个字符 与 text2 前 j 个字符 的 LCS 长度
```

### 转移逻辑

- 如果当前字符相等：来自左上角 `+1`
- 如果不相等：来自上方或左方较大值

## Go 模板：LCS

```go
func LCSLength(text1, text2 string) int {
    prev := make([]int, len(text2)+1)

    for i := 1; i <= len(text1); i++ {
        cur := make([]int, len(text2)+1)
        for j := 1; j <= len(text2); j++ {
            if text1[i-1] == text2[j-1] {
                cur[j] = prev[j-1] + 1
            } else {
                cur[j] = max(prev[j], cur[j-1])
            }
        }
        prev = cur
    }

    return prev[len(text2)]
}

func max(a, b int) int {
    if a > b {
        return a
    }
    return b
}
```

## LIS：最长递增子序列

### 核心直觉

`tails[i]` 表示：

```text
长度为 i+1 的递增子序列，其最小可能结尾值
```

它不一定是真实某条 LIS，但它的长度一定等于答案长度。

## Go 模板：LIS 长度

```go
func LISLength(nums []int) int {
    tails := []int{}

    for _, x := range nums {
        pos := sort.SearchInts(tails, x)
        if pos == len(tails) {
            tails = append(tails, x)
        } else {
            tails[pos] = x
        }
    }

    return len(tails)
}
```

## 为什么替换更小尾值不会丢答案

因为长度相同的递增子序列里，结尾越小，后面越容易接新数。  
所以我们总是保留“更有潜力继续扩展”的那个尾值。

## 易错点

> [!warning] LCS / LIS 模板最容易错的地方
> - LCS 不要求连续，最长公共子串才要求连续。
> - 严格递增用 `SearchInts` / `lower_bound`，非严格递增口径不同。
> - `tails` 只能稳定求长度，若要恢复具体序列，要额外记录前驱。

## 复杂度

| 模板 | 时间复杂度 | 空间复杂度 |
|---|---:|---:|
| LCS | `O(mn)` | `O(n)` 滚动数组 |
| LIS | `O(n log n)` | `O(n)` |

## 相关主题

- [[../../动态规划/二维DP|二维DP]]
- [[../../动态规划/一维DP|一维DP]]

---
返回：[[../_index|算法模板]]
