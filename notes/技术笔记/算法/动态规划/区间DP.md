---
title: "区间DP"
aliases: ["Interval DP", "区间动态规划"]
tags:
  - 算法
  - 算法/动态规划
difficulty: hard
created: 2025-01-11
updated: 2026-08-09
---

# 区间DP

## 📌 定义

区间DP是一类在区间上进行动态规划的问题，通常通过分治的思想，将大区间分解为小区间求解。

**特点**：
- 状态定义：`dp[i][j]` 表示区间`[i,j]`的最优解
- 状态转移：枚举分割点k，将`[i,j]`分为`[i,k]`和`[k+1,j]`
- 遍历顺序：按区间长度从小到大遍历

## 🎯 基本模型

### 状态定义
```text
dp[i][j] = 区间[i,j]的最优解
```

### 状态转移
```go
for length := 2; length <= n; length++ { // 枚举区间长度
    for i := 0; i+length-1 < n; i++ { // 枚举左端点
        j := i + length - 1 // 右端点
        for k := i; k < j; k++ { // 枚举分割点
            dp[i][j] = update(dp[i][j], dp[i][k]+dp[k+1][j]+cost)
        }
    }
}
```

## 💻 经典问题

### 1. 最长回文子串（LeetCode 5）

**问题**：找出字符串中最长的回文子串。

**思路**：
- `dp[i][j]` = s[i:j+1]是否是回文串
- `dp[i][j] = (s[i] == s[j]) and dp[i+1][j-1]`

```go
func longestPalindrome(s string) string {
    if len(s) == 0 {
        return ""
    }

    n := len(s)
    dp := make([][]bool, n)
    for i := range dp {
        dp[i] = make([]bool, n)
        dp[i][i] = true
    }

    start, maxLen := 0, 1
    for length := 2; length <= n; length++ {
        for i := 0; i+length-1 < n; i++ {
            j := i + length - 1
            if s[i] != s[j] {
                continue
            }
            if length == 2 || dp[i+1][j-1] {
                dp[i][j] = true
                if length > maxLen {
                    start = i
                    maxLen = length
                }
            }
        }
    }

    return s[start : start+maxLen]
}

func longestPalindromeExpand(s string) string {
    expand := func(left, right int) int {
        for left >= 0 && right < len(s) && s[left] == s[right] {
            left--
            right++
        }
        return right - left - 1
    }

    start, maxLen := 0, 0
    for i := 0; i < len(s); i++ {
        len1 := expand(i, i)
        len2 := expand(i, i+1)
        currLen := len1
        if len2 > currLen {
            currLen = len2
        }
        if currLen > maxLen {
            maxLen = currLen
            start = i - (currLen-1)/2
        }
    }

    return s[start : start+maxLen]
}
```

### 2. 最长回文子序列（LeetCode 516）

**问题**：给定一个字符串s，找到其中最长的回文子序列。

```go
func longestPalindromeSubseq(s string) int {
    n := len(s)
    dp := make([][]int, n)
    for i := range dp {
        dp[i] = make([]int, n)
        dp[i][i] = 1
    }

    for length := 2; length <= n; length++ {
        for i := 0; i+length-1 < n; i++ {
            j := i + length - 1
            if s[i] == s[j] {
                if length == 2 {
                    dp[i][j] = 2
                } else {
                    dp[i][j] = dp[i+1][j-1] + 2
                }
            } else if dp[i+1][j] > dp[i][j-1] {
                dp[i][j] = dp[i+1][j]
            } else {
                dp[i][j] = dp[i][j-1]
            }
        }
    }

    return dp[0][n-1]
}
```

### 3. 矩阵链乘法（经典问题）

**问题**：给定n个矩阵的维度，求最少的标量乘法次数。

```go
func matrixChainOrder(dimensions []int) int {
    n := len(dimensions) - 1
    dp := make([][]int, n)
    for i := range dp {
        dp[i] = make([]int, n)
    }

    for length := 2; length <= n; length++ {
        for i := 0; i+length-1 < n; i++ {
            j := i + length - 1
            dp[i][j] = int(1e9)
            for k := i; k < j; k++ {
                cost := dp[i][k] + dp[k+1][j] + dimensions[i]*dimensions[k+1]*dimensions[j+1]
                if cost < dp[i][j] {
                    dp[i][j] = cost
                }
            }
        }
    }

    return dp[0][n-1]
}
```

### 4. 戳气球（LeetCode 312）

**问题**：有n个气球，戳破第i个气球可以获得`nums[i-1] * nums[i] * nums[i+1]`枚硬币。求最多能获得多少硬币。

```go
func maxCoins(nums []int) int {
    arr := make([]int, 0, len(nums)+2)
    arr = append(arr, 1)
    arr = append(arr, nums...)
    arr = append(arr, 1)

    n := len(arr)
    dp := make([][]int, n)
    for i := range dp {
        dp[i] = make([]int, n)
    }

    for length := 3; length <= n; length++ {
        for i := 0; i+length-1 < n; i++ {
            j := i + length - 1
            for k := i + 1; k < j; k++ {
                coins := dp[i][k] + dp[k][j] + arr[i]*arr[k]*arr[j]
                if coins > dp[i][j] {
                    dp[i][j] = coins
                }
            }
        }
    }

    return dp[0][n-1]
}
```

### 5. 移除盒子（LeetCode 546）

```go
func removeBoxes(boxes []int) int {
    memo := make(map[[3]int]int)

    var dfs func(i, j, k int) int
    dfs = func(i, j, k int) int {
        if i > j {
            return 0
        }

        key := [3]int{i, j, k}
        if value, ok := memo[key]; ok {
            return value
        }

        for i < j && boxes[j] == boxes[j-1] {
            j--
            k++
        }

        best := dfs(i, j-1, 0) + (k+1)*(k+1)
        for m := i; m < j; m++ {
            if boxes[m] == boxes[j] {
                candidate := dfs(i, m, k+1) + dfs(m+1, j-1, 0)
                if candidate > best {
                    best = candidate
                }
            }
        }

        memo[key] = best
        return best
    }

    return dfs(0, len(boxes)-1, 0)
}
```

### 6. 合并石头的最低成本（LeetCode 1000）

```go
func mergeStones(stones []int, k int) int {
    n := len(stones)
    if (n-1)%(k-1) != 0 {
        return -1
    }

    prefix := make([]int, n+1)
    for i, stone := range stones {
        prefix[i+1] = prefix[i] + stone
    }

    dp := make([][]int, n)
    for i := range dp {
        dp[i] = make([]int, n)
        for j := range dp[i] {
            if i != j {
                dp[i][j] = int(1e9)
            }
        }
    }

    for length := 2; length <= n; length++ {
        for i := 0; i+length-1 < n; i++ {
            j := i + length - 1
            for mid := i; mid < j; mid += k - 1 {
                candidate := dp[i][mid] + dp[mid+1][j]
                if candidate < dp[i][j] {
                    dp[i][j] = candidate
                }
            }
            if (j-i)%(k-1) == 0 {
                dp[i][j] += prefix[j+1] - prefix[i]
            }
        }
    }

    return dp[0][n-1]
}
```

## 💡 解题技巧

### 1. 遍历顺序

```go
// 方法1：按区间长度遍历（推荐）
for length := 2; length <= n; length++ {
    for i := 0; i+length-1 < n; i++ {
        j := i + length - 1
        _ = j
        // 处理 dp[i][j]
    }
}

// 方法2：逆序遍历 i，正序遍历 j
for i := n - 1; i >= 0; i-- {
    for j := i + 1; j < n; j++ {
        // 处理 dp[i][j]
    }
}
```

### 2. 边界处理

```go
// 单个元素的初始化
for i := 0; i < n; i++ {
    dp[i][i] = initialValue
}

// 相邻元素的初始化（如果需要）
for i := 0; i+1 < n; i++ {
    dp[i][i+1] = ...
}
```

### 3. 添加虚拟元素

```go
// 在两端添加虚拟元素简化边界处理
// 例如戳气球问题
arr := make([]int, 0, len(nums)+2)
arr = append(arr, 1)
arr = append(arr, nums...)
arr = append(arr, 1)
```

## 📚 经典问题列表

### 基础题
- [ ] [最长回文子串](https://leetcode.cn/problems/longest-palindromic-substring/) - LeetCode 5
- [ ] [最长回文子序列](https://leetcode.cn/problems/longest-palindromic-subsequence/) - LeetCode 516
- [ ] [回文子串](https://leetcode.cn/problems/palindromic-substrings/) - LeetCode 647

### 进阶题
- [ ] [戳气球](https://leetcode.cn/problems/burst-balloons/) - LeetCode 312
- [ ] [奇怪的打印机](https://leetcode.cn/problems/strange-printer/) - LeetCode 664
- [ ] [移除盒子](https://leetcode.cn/problems/remove-boxes/) - LeetCode 546

### 合并类
- [ ] [合并石头的最低成本](https://leetcode.cn/problems/minimum-cost-to-merge-stones/) - LeetCode 1000
- [ ] [多边形三角剖分的最低得分](https://leetcode.cn/problems/minimum-score-triangulation-of-polygon/) - LeetCode 1039

## 相关主题

- [[二维DP]] - 区间DP是特殊的二维DP
- [[_index|动态规划]] - 返回总览

---
返回：[[_index|动态规划]] | [[../算法学习导航|算法学习导航]]
