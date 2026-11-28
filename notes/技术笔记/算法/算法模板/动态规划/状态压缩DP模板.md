---
title: "状态压缩DP模板"
aliases:
  - Bitmask DP Template
  - 状压DP模板
tags:
  - 算法
  - 算法/模板
  - 算法/动态规划
  - 算法/位运算
difficulty: hard
created: 2026-08-08
updated: 2026-08-09
status: active
---

# 状态压缩 DP 模板

> [!summary] 一句话说明
> 状压 DP 用二进制位表示“哪些元素已经选过”，把集合压成一个整数状态来做转移。

## 模板适用场景

- `n` 很小，通常 `n <= 20`
- 需要记录“已访问集合”
- TSP、排列型 DP、子集型 DP

## 最常见状态定义

```text
dp[mask][last]
```

表示：

- 已访问集合是 `mask`
- 当前停在 `last`
- 此时最优答案是多少

## Go 模板：旅行商

```go
func TSPMinCost(dist [][]int) int {
    n := len(dist)
    if n <= 1 {
        return 0
    }

    full := 1 << n
    const inf = int(1e18)

    dp := make([][]int, full)
    for mask := range dp {
        dp[mask] = make([]int, n)
        for i := range dp[mask] {
            dp[mask][i] = inf
        }
    }
    dp[1][0] = 0

    for mask := 0; mask < full; mask++ {
        for last := 0; last < n; last++ {
            if mask&(1<<last) == 0 || dp[mask][last] == inf {
                continue
            }

            for next := 0; next < n; next++ {
                if mask&(1<<next) != 0 {
                    continue
                }

                nextMask := mask | (1 << next)
                candidate := dp[mask][last] + dist[last][next]
                if candidate < dp[nextMask][next] {
                    dp[nextMask][next] = candidate
                }
            }
        }
    }

    answer := inf
    for last := 1; last < n; last++ {
        answer = min(answer, dp[full-1][last]+dist[last][0])
    }
    return answer
}

func min(a, b int) int {
    if a < b {
        return a
    }
    return b
}
```

## 常用位运算

```go
contains := mask&(1<<i) != 0
added := mask | (1 << i)
removed := mask &^ (1 << i)
```

枚举子集时：

```go
for sub := mask; sub > 0; sub = (sub - 1) & mask {
    // 处理 sub
}
```

## 为什么它只能做小规模

因为状态数是：

```text
2^n
```

这增长极快，所以状态压缩 DP 的第一反应不是“能不能写”，而是“数据范围允不允许写”。

## 易错点

> [!warning] 状压 DP 模板最容易错的地方
> - 先统一第 `i` 位到底对应哪个元素。
> - 转移前要先确认 `last` 确实在 `mask` 里。
> - `2^n` 爆炸得很快，别忽略规模上限。

## 复杂度

以 TSP 为例：

| 指标 | 复杂度 |
|---|---:|
| 时间复杂度 | `O(2^n * n^2)` |
| 空间复杂度 | `O(2^n * n)` |

## 相关主题

- [[../../动态规划/状态压缩DP|状态压缩DP]]
- [[../../位运算/_index|位运算]]

---
返回：[[../_index|算法模板]]
