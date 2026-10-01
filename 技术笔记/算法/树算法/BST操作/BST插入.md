---
title: "BST插入"
aliases: ["BST Insert", "二叉搜索树插入"]
tags:
  - 算法
  - 算法/树
  - 算法/树/BST
difficulty: easy
created: 2025-01-11
updated: 2026-08-09
---

# BST插入

> [!summary] 一句话说明
> BST 插入就是先找到空位，再把新节点挂上去。

![[附件/算法可视化/binary-search.gif]]

## Go 代码：递归

```go
func insertIntoBST(root *TreeNode, val int) *TreeNode {
    if root == nil {
        return &TreeNode{Val: val}
    }
    if val < root.Val {
        root.Left = insertIntoBST(root.Left, val)
    } else if val > root.Val {
        root.Right = insertIntoBST(root.Right, val)
    }
    return root
}
```

## Go 代码：迭代

```go
func insertIntoBSTIterative(root *TreeNode, val int) *TreeNode {
    if root == nil {
        return &TreeNode{Val: val}
    }

    cur := root
    for {
        if val < cur.Val {
            if cur.Left == nil {
                cur.Left = &TreeNode{Val: val}
                break
            }
            cur = cur.Left
            continue
        }
        if val > cur.Val {
            if cur.Right == nil {
                cur.Right = &TreeNode{Val: val}
                break
            }
            cur = cur.Right
            continue
        }
        break
    }

    return root
}
```

## 易错点

> [!warning] 递归版一定要把返回值接回父节点
> 空树插入时，新节点本身就是根。

## 相关主题

- [[BST查找|BST查找]]
- [[BST删除|BST删除]]
- [[验证BST|验证BST]]
- [[../_index|树算法]]

---
返回：[[../_index|树算法]] | [[../../算法学习导航|算法学习导航]]
