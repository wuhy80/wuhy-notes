---
title: "BST最值"
aliases: ["BST Min Max", "二叉搜索树最值"]
tags:
  - 算法
  - 算法/树
  - 算法/树/BST
difficulty: easy
created: 2025-01-11
updated: 2026-08-09
---

# BST最值

> [!summary] 一句话说明
> BST 的最小值一路向左走，最大值一路向右走。

## Go 代码

```go
func findMin(root *TreeNode) int {
    if root == nil {
        return 0
    }
    for root.Left != nil {
        root = root.Left
    }
    return root.Val
}

func findMax(root *TreeNode) int {
    if root == nil {
        return 0
    }
    for root.Right != nil {
        root = root.Right
    }
    return root.Val
}
```

## 关键点

BST 已经帮你把最小值和最大值锁定在最边缘的链上了，不需要整棵树一起看。

## 相关主题

- [[BST查找|BST查找]]
- [[BST删除|BST删除]]
- [[中序遍历|中序遍历]]
- [[../_index|树算法]]

---
返回：[[../_index|树算法]] | [[../../算法学习导航|算法学习导航]]
