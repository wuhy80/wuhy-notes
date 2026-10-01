---
title: "树形DP"
aliases: ["Tree DP", "树形动态规划"]
tags:
  - 算法
  - 算法/动态规划
  - 算法/树
difficulty: hard
created: 2025-01-11
updated: 2026-08-09
---

# 树形DP

## 📌 定义

树形DP是在树这种数据结构上进行的动态规划，通常采用DFS后序遍历，从叶子节点向根节点转移状态。

**特点**：
- 在树上进行DP
- 通常使用DFS递归
- 状态定义与节点相关
- 自底向上合并子树信息

## 🎯 基本模型

### 状态定义
```go
dp[node][state] = 以 node 为根的子树在某状态下的最优解
```

### 遍历方式
```go
func dfs(node int, parent int) {
    for _, child := range graph[node] {
        if child == parent {
            continue
        }
        dfs(child, node)
    }

    // 根据子节点更新当前节点
    dp[node] = merge(...)
}
```

## 💻 经典问题

### 1. 树的直径（LeetCode 543）

**问题**：给定二叉树，计算树的直径（任意两个节点之间最长路径的边数）。

```go
func diameterOfBinaryTree(root *TreeNode) int {
    maxDiameter := 0

    var dfs func(node *TreeNode) int
    dfs = func(node *TreeNode) int {
        if node == nil {
            return 0
        }

        leftDepth := dfs(node.Left)
        rightDepth := dfs(node.Right)
        if leftDepth+rightDepth > maxDiameter {
            maxDiameter = leftDepth + rightDepth
        }

        if leftDepth > rightDepth {
            return leftDepth + 1
        }
        return rightDepth + 1
    }

    dfs(root)
    return maxDiameter
}
```

### 2. 打家劫舍III（LeetCode 337）

**问题**：在二叉树上打家劫舍，不能同时偷相邻的节点。

```go
func rob(root *TreeNode) int {
    var dfs func(node *TreeNode) (int, int)
    dfs = func(node *TreeNode) (int, int) {
        if node == nil {
            return 0, 0
        }

        leftRob, leftSkip := dfs(node.Left)
        rightRob, rightSkip := dfs(node.Right)

        robCurrent := node.Val + leftSkip + rightSkip
        skipCurrent := maxPair(leftRob, leftSkip) + maxPair(rightRob, rightSkip)
        return robCurrent, skipCurrent
    }

    robCurrent, skipCurrent := dfs(root)
    return maxPair(robCurrent, skipCurrent)
}

func maxPair(a, b int) int {
    if a > b {
        return a
    }
    return b
}
```

### 3. 二叉树中的最大路径和（LeetCode 124）

```go
func maxPathSum(root *TreeNode) int {
    best := -1 << 60

    var dfs func(node *TreeNode) int
    dfs = func(node *TreeNode) int {
        if node == nil {
            return 0
        }

        leftGain := dfs(node.Left)
        if leftGain < 0 {
            leftGain = 0
        }
        rightGain := dfs(node.Right)
        if rightGain < 0 {
            rightGain = 0
        }

        currentSum := node.Val + leftGain + rightGain
        if currentSum > best {
            best = currentSum
        }

        if leftGain > rightGain {
            return node.Val + leftGain
        }
        return node.Val + rightGain
    }

    dfs(root)
    return best
}
```

### 4. 监控二叉树（LeetCode 968）

```go
func minCameraCover(root *TreeNode) int {
    cameras := 0

    var dfs func(node *TreeNode) int
    dfs = func(node *TreeNode) int {
        if node == nil {
            return 2
        }

        left := dfs(node.Left)
        right := dfs(node.Right)

        if left == 0 || right == 0 {
            cameras++
            return 1
        }
        if left == 1 || right == 1 {
            return 2
        }
        return 0
    }

    if dfs(root) == 0 {
        cameras++
    }
    return cameras
}
```

### 5. 树的最大独立集

**问题**：选择最多的节点，使得任意两个节点不相邻。

```go
func maxIndependentSet(root *TreeNode) int {
    var dfs func(node *TreeNode) (int, int)
    dfs = func(node *TreeNode) (int, int) {
        if node == nil {
            return 0, 0
        }

        leftIn, leftOut := dfs(node.Left)
        rightIn, rightOut := dfs(node.Right)

        include := 1 + leftOut + rightOut
        exclude := maxPair(leftIn, leftOut) + maxPair(rightIn, rightOut)
        return include, exclude
    }

    include, exclude := dfs(root)
    return maxPair(include, exclude)
}
```

### 6. 树中距离之和（LeetCode 834）

```go
func sumOfDistancesInTree(n int, edges [][]int) []int {
    graph := make([][]int, n)
    for _, edge := range edges {
        u, v := edge[0], edge[1]
        graph[u] = append(graph[u], v)
        graph[v] = append(graph[v], u)
    }

    count := make([]int, n)
    ans := make([]int, n)
    for i := range count {
        count[i] = 1
    }

    var dfs1 func(node, parent int)
    dfs1 = func(node, parent int) {
        for _, child := range graph[node] {
            if child == parent {
                continue
            }
            dfs1(child, node)
            count[node] += count[child]
            ans[node] += ans[child] + count[child]
        }
    }

    var dfs2 func(node, parent int)
    dfs2 = func(node, parent int) {
        for _, child := range graph[node] {
            if child == parent {
                continue
            }
            ans[child] = ans[node] - count[child] + (n - count[child])
            dfs2(child, node)
        }
    }

    dfs1(0, -1)
    dfs2(0, -1)
    return ans
}
```

## 💡 解题技巧

### 1. 状态定义

```go
// 单状态
dp[node] = 以 node 为根的子树的最优解

// 多状态
dp[node][0] = 不选 node 的最优解
dp[node][1] = 选择 node 的最优解
```

### 2. 后序遍历

```go
func dfsNode(node *TreeNode) Result {
    if node == nil {
        return baseCase
    }

    leftResult := dfsNode(node.Left)
    rightResult := dfsNode(node.Right)
    return combine(leftResult, rightResult, node.Val)
}
```

### 3. 换根DP

```go
// 第一次 DFS：计算以 root 为根的结果
func dfs1(node, parent int) {
    for _, child := range children[node] {
        if child == parent {
            continue
        }
        dfs1(child, node)
        // 更新 dp[node]
    }
}

// 第二次 DFS：换根，计算所有节点为根的结果
func dfs2(node, parent int) {
    for _, child := range children[node] {
        if child == parent {
            continue
        }
        dp[child] = transitionFromParent(dp[node], ...)
        dfs2(child, node)
    }
}
```

## 📚 经典问题列表

### 基础题
- [ ] [二叉树的直径](https://leetcode.cn/problems/diameter-of-binary-tree/) - LeetCode 543
- [ ] [打家劫舍 III](https://leetcode.cn/problems/house-robber-iii/) - LeetCode 337
- [ ] [二叉树中的最大路径和](https://leetcode.cn/problems/binary-tree-maximum-path-sum/) - LeetCode 124

### 进阶题
- [ ] [监控二叉树](https://leetcode.cn/problems/binary-tree-cameras/) - LeetCode 968
- [ ] [树中距离之和](https://leetcode.cn/problems/sum-of-distances-in-tree/) - LeetCode 834
- [ ] [节点与其祖先之间的最大差值](https://leetcode.cn/problems/maximum-difference-between-node-and-ancestor/) - LeetCode 1026

## 相关主题

- [[二叉树|数据结构/二叉树]] - 树的基础
- [[_index|动态规划]] - 返回总览

---
返回：[[_index|动态规划]] | [[../算法学习导航|算法学习导航]]
