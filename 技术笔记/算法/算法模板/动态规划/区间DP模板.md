---
title: "区间DP模板"
aliases:
  - Interval DP Template
  - 区间动态规划模板
tags:
  - 算法
  - 算法/模板
  - 算法/动态规划
difficulty: hard
created: 2026-08-08
updated: 2026-08-09
status: active
---

# 区间 DP 模板

> [!summary] 一句话说明
> 区间 DP 的核心不是“二维数组”，而是先算短区间，再用分割点把两个已知小区间合成大区间。

## 模板适用场景

- 合并石子
- 矩阵链乘
- 回文区间处理
- 括号 / 分段型区间转移

## 通用骨架

```text
按区间长度从小到大枚举
    枚举左端点
        确定右端点
            枚举分割点
```

## Go 模板：矩阵链乘

`dims = [p0, p1, ..., pn]` 表示第 `i` 个矩阵大小是 `p[i] * p[i+1]`。

```go
func MatrixChainCost(dims []int) int {
    n := len(dims) - 1
    if n <= 1 {
        return 0
    }

    dp := make([][]int, n)
    for i := range dp {
        dp[i] = make([]int, n)
    }

    const inf = int(1e18)

    for length := 2; length <= n; length++ {
        for left := 0; left+length-1 < n; left++ {
            right := left + length - 1
            dp[left][right] = inf

            for split := left; split < right; split++ {
                cost := dp[left][split] +
                    dp[split+1][right] +
                    dims[left]*dims[split+1]*dims[right+1]

                if cost < dp[left][right] {
                    dp[left][right] = cost
                }
            }
        }
    }

    return dp[0][n-1]
}
```

## 为什么必须按区间长度递增

因为 `dp[left][right]` 的转移依赖更短区间，比如：

- `dp[left][split]`
- `dp[split+1][right]`

如果短区间还没算出来，长区间就无从转移。

## 易错点

> [!warning] 区间 DP 模板最容易错的地方
> - 外层一定是区间长度递增，不要先枚举左端点。
> - `split` 通常取值范围是 `[left, right-1]`。
> - 不同题有时不是“普通分割”，而是“最后一次操作”视角，要先想清状态意义。

## 复杂度

| 指标 | 复杂度 |
|---|---:|
| 时间复杂度 | 通常 `O(n^3)` |
| 空间复杂度 | 通常 `O(n^2)` |

## 相关主题

- [[../../动态规划/区间DP|区间DP]]

---
返回：[[../_index|算法模板]]
