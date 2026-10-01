---
title: "BST查找"
aliases: ["BST Search", "二叉搜索树查找"]
tags:
  - 算法
  - 算法/树
  - 算法/树/BST
difficulty: easy
created: 2025-01-11
updated: 2026-08-09
---

# BST查找

> [!summary] 一句话说明
> BST 查找就是二分思想在树上的落地，每次比较后只走一边。

![[附件/算法可视化/bst-search-path.svg]]

## Go 代码：递归

```go
func searchBST(root *TreeNode, val int) *TreeNode {
    if root == nil {
        return nil
    }
    if root.Val == val {
        return root
    }
    if val < root.Val {
        return searchBST(root.Left, val)
    }
    return searchBST(root.Right, val)
}
```

## Go 代码：迭代

```go
func searchBSTIterative(root *TreeNode, val int) *TreeNode {
    for root != nil {
        if root.Val == val {
            return root
        }
        if val < root.Val {
            root = root.Left
            continue
        }
        root = root.Right
    }
    return nil
}
```

## 易错点

> [!warning] 别把 BST 当普通二叉树搜
> 左右一起搜会直接失去 BST 的剪枝价值。

## 相关主题

- [[BST插入|BST插入]]
- [[BST删除|BST删除]]
- [[验证BST|验证BST]]
- [[中序遍历|中序遍历]]
- [[../_index|树算法]]

---
返回：[[../_index|树算法]] | [[../../算法学习导航|算法学习导航]]
