---
title: "数位DP"
aliases: ["Digit DP", "数位动态规划"]
tags:
  - 算法
  - 算法/动态规划
difficulty: hard
created: 2025-01-11
updated: 2026-08-09
---

# 数位DP

## 📌 定义

数位DP是一种用于解决与数字的数位相关的计数问题的动态规划方法。通常用于统计一个区间内满足特定条件的数字个数。

**特点**：
- 处理数字的每一位
- 通常配合记忆化搜索
- 可以处理很大的数字范围
- 常用于计数问题

## 🎯 基本模型

### 问题模式

统计区间 `[L, R]` 内满足条件的数字个数：
```go
answer := count(R) - count(L-1)
```

### 状态定义

```go
dfs(pos, state, isLimit, isNum)
// pos: 当前处理到第几位
// state: 当前状态（如前面数字的和、是否包含某数字等）
// isLimit: 当前位是否受到上界限制
// isNum: 前面是否填了数字（处理前导零）
```

## 💻 经典问题

### 1. 统计特殊整数（LeetCode 2376）

**问题**：统计[1, n]范围内没有重复数字的整数。

```go
func countSpecialNumbers(n int) int {
    s := strconv.Itoa(n)
    memo := make(map[[2]int]int)

    var dfs func(pos, mask int, isLimit, isNum bool) int
    dfs = func(pos, mask int, isLimit, isNum bool) int {
        if pos == len(s) {
            if isNum {
                return 1
            }
            return 0
        }

        key := [2]int{pos, mask}
        if !isLimit && isNum {
            if value, ok := memo[key]; ok {
                return value
            }
        }

        result := 0
        if !isNum {
            result += dfs(pos+1, mask, false, false)
        }

        low := 0
        if !isNum {
            low = 1
        }
        up := 9
        if isLimit {
            up = int(s[pos] - '0')
        }
        for d := low; d <= up; d++ {
            if mask&(1<<d) != 0 {
                continue
            }
            result += dfs(pos+1, mask|(1<<d), isLimit && d == up, true)
        }

        if !isLimit && isNum {
            memo[key] = result
        }
        return result
    }

    return dfs(0, 0, true, false)
}
```

### 2. 数字1的个数（LeetCode 233）

**问题**：给定一个整数n，计算[1, n]中数字1出现的次数。

```go
func countDigitOne(n int) int {
    s := strconv.Itoa(n)
    memo := make(map[[2]int]int)

    var dfs func(pos, cnt int, isLimit bool) int
    dfs = func(pos, cnt int, isLimit bool) int {
        if pos == len(s) {
            return cnt
        }

        key := [2]int{pos, cnt}
        if !isLimit {
            if value, ok := memo[key]; ok {
                return value
            }
        }

        result := 0
        up := 9
        if isLimit {
            up = int(s[pos] - '0')
        }
        for d := 0; d <= up; d++ {
            add := 0
            if d == 1 {
                add = 1
            }
            result += dfs(pos+1, cnt+add, isLimit && d == up)
        }

        if !isLimit {
            memo[key] = result
        }
        return result
    }

    return dfs(0, 0, true)
}
```

### 3. 不含连续1的非负整数（LeetCode 600）

**问题**：给定一个正整数n，统计[0, n]中二进制表示不包含连续1的数字个数。

```go
func findIntegers(n int) int {
    s := strconv.FormatInt(int64(n), 2)
    memo := make(map[[2]int]int)

    var dfs func(pos, prev int, isLimit bool) int
    dfs = func(pos, prev int, isLimit bool) int {
        if pos == len(s) {
            return 1
        }

        key := [2]int{pos, prev}
        if !isLimit {
            if value, ok := memo[key]; ok {
                return value
            }
        }

        result := 0
        up := 1
        if isLimit {
            up = int(s[pos] - '0')
        }
        for d := 0; d <= up; d++ {
            if prev == 1 && d == 1 {
                continue
            }
            result += dfs(pos+1, d, isLimit && d == up)
        }

        if !isLimit {
            memo[key] = result
        }
        return result
    }

    return dfs(0, 0, true)
}
```

### 4. 至多有K个连续块的数字（LeetCode 902）

```go
func atMostNGivenDigitSet(digits []string, n int) int {
    s := strconv.Itoa(n)
    nums := make([]int, len(digits))
    for i, digit := range digits {
        nums[i] = int(digit[0] - '0')
    }

    memo := make(map[int]int)
    var dfs func(pos int, isLimit, isNum bool) int
    dfs = func(pos int, isLimit, isNum bool) int {
        if pos == len(s) {
            if isNum {
                return 1
            }
            return 0
        }

        if !isLimit && isNum {
            if value, ok := memo[pos]; ok {
                return value
            }
        }

        result := 0
        if !isNum {
            result += dfs(pos+1, false, false)
        }

        up := 9
        if isLimit {
            up = int(s[pos] - '0')
        }
        for _, d := range nums {
            if d > up {
                break
            }
            result += dfs(pos+1, isLimit && d == up, true)
        }

        if !isLimit && isNum {
            memo[pos] = result
        }
        return result
    }

    return dfs(0, true, false)
}
```

### 5. 数字范围按位与（数位DP变体）

```go
func rangeBitwiseAnd(left, right int) int {
    shift := 0
    for left < right {
        left >>= 1
        right >>= 1
        shift++
    }
    return left << shift
}
```

## 💡 解题模板

### 标准模板

```go
func digitDP(n int) int {
    s := strconv.Itoa(n)
    memo := make(map[[2]int]int)

    var dfs func(pos, state int, isLimit, isNum bool) int
    dfs = func(pos, state int, isLimit, isNum bool) int {
        if pos == len(s) {
            if isNum {
                return 1
            }
            return 0
        }

        key := [2]int{pos, state}
        if !isLimit && isNum {
            if value, ok := memo[key]; ok {
                return value
            }
        }

        result := 0
        if !isNum {
            result += dfs(pos+1, state, false, false)
        }

        low := 0
        if !isNum {
            low = 1
        }
        up := 9
        if isLimit {
            up = int(s[pos] - '0')
        }

        for d := low; d <= up; d++ {
            if valid(state, d) {
                nextState := updateState(state, d)
                result += dfs(pos+1, nextState, isLimit && d == up, true)
            }
        }

        if !isLimit && isNum {
            memo[key] = result
        }
        return result
    }

    return dfs(0, initState, true, false)
}
```

### 区间计数

```go
func countInRange(left, right int) int {
    return count(right) - count(left-1)
}
```

## 💡 解题技巧

### 1. is_limit的作用

```go
// isLimit = true: 当前位最多只能填到 s[pos]
// isLimit = false: 当前位可以填 0-9 任意数字

// 只有 isLimit == false 时才能记忆化
// 因为 isLimit == true 时结果取决于上界，不具有重复性
```

### 2. is_num的作用

```go
// isNum = false: 前面都是前导零
// isNum = true: 前面已经填了数字

// 用于处理前导零
// 例如统计 123 时，100-109 的十位是 0，但这个 0 不是数字的一部分
```

### 3. 状态设计

```go
// 根据题目要求设计 state
// 常见状态：
// - 前面数字的和
// - 是否包含某个数字
// - 前一个数字是什么
// - 使用过的数字集合（状态压缩）
```

## 📚 经典问题列表

### 基础题
- [ ] [数字1的个数](https://leetcode.cn/problems/number-of-digit-one/) - LeetCode 233
- [ ] [不含连续1的非负整数](https://leetcode.cn/problems/non-negative-integers-without-consecutive-ones/) - LeetCode 600

### 进阶题
- [ ] [统计特殊整数](https://leetcode.cn/problems/count-special-integers/) - LeetCode 2376
- [ ] [最大为N的数字组合](https://leetcode.cn/problems/numbers-at-most-n-given-digit-set/) - LeetCode 902
- [ ] [数字范围按位与](https://leetcode.cn/problems/bitwise-and-of-numbers-range/) - LeetCode 201

## 相关主题

- [[状态压缩DP]] - 另一种状态压缩方法
- [[_index|动态规划]] - 返回总览

---
返回：[[_index|动态规划]] | [[../算法学习导航|算法学习导航]]
