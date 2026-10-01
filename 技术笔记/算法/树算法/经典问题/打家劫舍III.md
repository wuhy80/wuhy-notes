---
title: "打家劫舍III"
aliases: ["House Robber III", "树形DP"]
tags:
  - 算法
  - 算法/树
  - 算法/动态规划
difficulty: medium
created: 2025-01-11
updated: 2026-08-09
---

# 打家劫舍III

> [!summary] 一句话说明
> 每个节点都只有两种状态：偷或不偷，后序把左右子树的答案汇总起来就行。

## Go 代码

```go
func rob(root *TreeNode) int {
    var dfs func(node *TreeNode) [2]int
    dfs = func(node *TreeNode) [2]int {
        if node == nil {
            return [2]int{0, 0}
        }

        left := dfs(node.Left)
        right := dfs(node.Right)

        notRob := max(left[0], left[1]) + max(right[0], right[1])
        robCur := node.Val + left[0] + right[0]
        return [2]int{notRob, robCur}
    }

    res := dfs(root)
    return max(res[0], res[1])
}

func max(a, b int) int {
    if a > b {
        return a
    }
    return b
}
```

## 关键点

偷当前节点时，左右孩子都不能偷；不偷当前节点时，左右孩子可以自由选最优解。

## 相关主题

- [[后序遍历|后序遍历]]
- [[树的直径|树的直径]]
- [[../_index|树算法]]

---
返回：[[../_index|树算法]] | [[../../算法学习导航|算法学习导航]]
