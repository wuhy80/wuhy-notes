---
title: "数位DP模板"
aliases:
  - Digit DP Template
  - 数位动态规划模板
tags:
  - 算法
  - 算法/模板
  - 算法/动态规划
difficulty: hard
created: 2026-08-08
updated: 2026-08-09
status: active
---

# 数位 DP 模板

> [!summary] 一句话说明
> 数位 DP 的本质是“按位构造上界以内的数字”，其中 `tight` 决定当前位能不能自由取 `0..9`。

## 模板适用场景

- 统计 `[0, limit]` 内满足数位条件的数字个数
- 数位和约束
- 相邻数字约束
- 不重复数位、包含某种模式等约束

## 最常见状态

- `pos`：当前处理到第几位
- `tight`：前缀是否仍然贴着上界
- `started`：是否已经出现第一个非前导零
- 其他约束状态：数位和、上一个数字、mask 等

## Go 模板：统计数位和等于目标值

```go
func CountDigitSum(limit int, target int) int {
    if limit < 0 || target < 0 {
        return 0
    }

    digits := []int{}
    for _, ch := range strconv.Itoa(limit) {
        digits = append(digits, int(ch-'0'))
    }

    type State struct {
        Pos   int
        Sum   int
        Tight int
    }

    memo := map[State]int{}

    var dfs func(pos, sum int, tight bool) int
    dfs = func(pos, sum int, tight bool) int {
        if sum > target {
            return 0
        }
        if pos == len(digits) {
            if sum == target {
                return 1
            }
            return 0
        }

        key := State{Pos: pos, Sum: sum, Tight: boolToInt(tight)}
        if !tight {
            if val, ok := memo[key]; ok {
                return val
            }
        }

        upper := 9
        if tight {
            upper = digits[pos]
        }

        total := 0
        for d := 0; d <= upper; d++ {
            total += dfs(pos+1, sum+d, tight && d == upper)
        }

        if !tight {
            memo[key] = total
        }
        return total
    }

    return dfs(0, 0, true)
}

func boolToInt(b bool) int {
    if b {
        return 1
    }
    return 0
}
```

## 为什么区间统计总写成 `f(r) - f(l-1)`

因为数位 DP 最自然解决的是：

```text
[0, limit]
```

所以区间 `[l, r]` 只要拆成：

```text
count(r) - count(l-1)
```

就行。

## 易错点

> [!warning] 数位 DP 模板最容易错的地方
> - `tight` 的下一状态是 `tight && d == upper`。
> - 只有不依赖具体上界前缀的状态，才适合记忆化。
> - 前导零是否参与统计，要先想清题意，必要时加 `started`。

## 复杂度

复杂度取决于状态数，通常可以理解为：

```text
位数 * 每位可选数字 * 额外状态规模
```

## 相关主题

- [[../../动态规划/数位DP|数位DP]]

---
返回：[[../_index|算法模板]]
