---
title: "状态压缩DP"
aliases: ["Bitmask DP", "状压DP"]
tags:
  - 算法
  - 算法/动态规划
  - 算法/位运算
difficulty: hard
created: 2025-01-11
updated: 2026-08-09
---

# 状态压缩DP

## 📌 定义

状态压缩DP是使用二进制位来表示状态的动态规划方法，通常用于处理集合问题和排列组合问题。

**特点**：
- 使用整数的二进制位表示状态
- 适合数据规模较小（通常n≤20）的问题
- 通过位运算快速转移状态

## 🎯 基本概念

### 位运算基础

```go
// 检查第 i 位是否为 1
if (state>>i)&1 == 1 {
}

// 设置第 i 位为 1
state |= 1 << i

// 设置第 i 位为 0
state &^= 1 << i

// 翻转第 i 位
state ^= 1 << i

// 清除最低位的 1
state &= state - 1

// 获取最低位的 1
lowbit := state & -state

// 统计 1 的个数
count := bits.OnesCount(uint(state))
```

### 状态枚举

```go
// 枚举所有子集
n := 5
for state := 0; state < 1<<n; state++ {
    // 处理状态 state
}

// 枚举 state 的所有非空子集
for subset := state; subset > 0; subset = (subset - 1) & state {
    // 处理 subset
}
```

## 💻 经典问题

### 1. 旅行商问题（TSP）

**问题**：给定n个城市和距离矩阵，求访问所有城市一次的最短路径。

```go
func tsp(dist [][]int) int {
    n := len(dist)
    const inf = int(1e9)
    dp := make([][]int, 1<<n)
    for state := range dp {
        dp[state] = make([]int, n)
        for i := range dp[state] {
            dp[state][i] = inf
        }
    }

    dp[1][0] = 0
    for state := 0; state < 1<<n; state++ {
        for i := 0; i < n; i++ {
            if state&(1<<i) == 0 {
                continue
            }
            prevState := state ^ (1 << i)
            if prevState == 0 && i != 0 {
                continue
            }
            for j := 0; j < n; j++ {
                if prevState&(1<<j) == 0 {
                    continue
                }
                candidate := dp[prevState][j] + dist[j][i]
                if candidate < dp[state][i] {
                    dp[state][i] = candidate
                }
            }
        }
    }

    finalState := (1 << n) - 1
    answer := inf
    for i := 1; i < n; i++ {
        candidate := dp[finalState][i] + dist[i][0]
        if candidate < answer {
            answer = candidate
        }
    }
    return answer
}
```

### 2. 分配问题（LeetCode 1125）

```go
func smallestSufficientTeam(reqSkills []string, people [][]string) []int {
    skillToID := make(map[string]int)
    for i, skill := range reqSkills {
        skillToID[skill] = i
    }

    peopleSkills := make([]int, len(people))
    for i, skills := range people {
        state := 0
        for _, skill := range skills {
            if id, ok := skillToID[skill]; ok {
                state |= 1 << id
            }
        }
        peopleSkills[i] = state
    }

    target := (1 << len(reqSkills)) - 1
    dp := map[int][]int{0: {}}
    for i, skills := range peopleSkills {
        snapshot := make(map[int][]int, len(dp))
        for state, team := range dp {
            cloned := append([]int(nil), team...)
            snapshot[state] = cloned
        }

        for state, team := range snapshot {
            newState := state | skills
            candidate := append(append([]int(nil), team...), i)
            current, ok := dp[newState]
            if !ok || len(candidate) < len(current) {
                dp[newState] = candidate
            }
        }
    }

    return dp[target]
}
```

### 3. 火柴拼正方形（LeetCode 473）

```go
func makesquare(matchsticks []int) bool {
    total := 0
    for _, x := range matchsticks {
        total += x
    }
    if total%4 != 0 {
        return false
    }

    side := total / 4
    slices.Sort(matchsticks)
    slices.Reverse(matchsticks)
    if matchsticks[0] > side {
        return false
    }

    n := len(matchsticks)
    dp := make([]int, 1<<n)
    for i := range dp {
        dp[i] = -1
    }
    dp[0] = 0

    for state := 0; state < 1<<n; state++ {
        if dp[state] == -1 {
            continue
        }
        for i := 0; i < n; i++ {
            if state&(1<<i) != 0 {
                continue
            }
            newState := state | (1 << i)
            if dp[newState] != -1 {
                continue
            }
            if dp[state]+matchsticks[i] > side {
                continue
            }
            dp[newState] = (dp[state] + matchsticks[i]) % side
        }
    }

    return dp[(1<<n)-1] == 0
}
```

### 4. 最短超级串（LeetCode 943）

```go
func shortestSuperstring(words []string) string {
    n := len(words)
    overlap := make([][]int, n)
    for i := range overlap {
        overlap[i] = make([]int, n)
    }

    for i := 0; i < n; i++ {
        for j := 0; j < n; j++ {
            if i == j {
                continue
            }
            maxK := len(words[i])
            if len(words[j]) < maxK {
                maxK = len(words[j])
            }
            for k := maxK; k >= 1; k-- {
                if words[i][len(words[i])-k:] == words[j][:k] {
                    overlap[i][j] = k
                    break
                }
            }
        }
    }

    const inf = int(1e9)
    dp := make([][]int, 1<<n)
    parent := make([][]int, 1<<n)
    for state := range dp {
        dp[state] = make([]int, n)
        parent[state] = make([]int, n)
        for i := 0; i < n; i++ {
            dp[state][i] = inf
            parent[state][i] = -1
        }
    }
    for i := 0; i < n; i++ {
        dp[1<<i][i] = len(words[i])
    }

    for state := 1; state < 1<<n; state++ {
        for i := 0; i < n; i++ {
            if state&(1<<i) == 0 {
                continue
            }
            prevState := state ^ (1 << i)
            if prevState == 0 {
                continue
            }
            for j := 0; j < n; j++ {
                if prevState&(1<<j) == 0 {
                    continue
                }
                candidate := dp[prevState][j] + len(words[i]) - overlap[j][i]
                if candidate < dp[state][i] {
                    dp[state][i] = candidate
                    parent[state][i] = j
                }
            }
        }
    }

    finalState := (1 << n) - 1
    end := 0
    for i := 1; i < n; i++ {
        if dp[finalState][i] < dp[finalState][end] {
            end = i
        }
    }

    path := make([]int, 0, n)
    for state, cur := finalState, end; cur != -1; {
        path = append(path, cur)
        next := parent[state][cur]
        state ^= 1 << cur
        cur = next
    }
    slices.Reverse(path)

    result := words[path[0]]
    for i := 1; i < len(path); i++ {
        prev, cur := path[i-1], path[i]
        result += words[cur][overlap[prev][cur]:]
    }
    return result
}
```

## 💡 解题技巧

### 1. 状态表示

```go
// 集合状态：第 i 位表示元素 i 是否在集合中
state := 0b10110 // 包含元素 1, 2, 4

// 检查元素 i 是否在集合中
if state&(1<<i) != 0 {
    fmt.Println("元素在集合中")
}

// 添加元素 i
state |= 1 << i

// 删除元素 i
state &^= 1 << i
```

### 2. 状态转移

```go
for i := 0; i < n; i++ {
    if state&(1<<i) == 0 {
        newState := state | (1 << i)
        dp[newState] = transition(dp[state], ...)
    }
}
```

### 3. 子集枚举

```go
// 枚举 state 的所有非空子集
for subset := state; subset > 0; subset = (subset - 1) & state {
    // 处理 subset
}

// 枚举 state 的所有子集（包括空集）
for subset := state; ; subset = (subset - 1) & state {
    // 处理 subset
    if subset == 0 {
        break
    }
}
```

## 📚 经典问题列表

### 基础题
- [ ] [火柴拼正方形](https://leetcode.cn/problems/matchsticks-to-square/) - LeetCode 473
- [ ] [划分为k个相等的子集](https://leetcode.cn/problems/partition-to-k-equal-sum-subsets/) - LeetCode 698

### 进阶题
- [ ] [最小的必要团队](https://leetcode.cn/problems/smallest-sufficient-team/) - LeetCode 1125
- [ ] [最短超级串](https://leetcode.cn/problems/find-the-shortest-superstring/) - LeetCode 943
- [ ] [分配重复整数](https://leetcode.cn/problems/distribute-repeating-integers/) - LeetCode 1655

## 相关主题

- [[数位DP]] - 另一种状态压缩
- [[_index|动态规划]] - 返回总览

---
返回：[[_index|动态规划]] | [[../算法学习导航|算法学习导航]]
