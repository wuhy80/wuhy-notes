---
title: "BST删除"
aliases: ["BST Delete", "二叉搜索树删除"]
tags:
  - 算法
  - 算法/树
  - 算法/树/BST
difficulty: medium
created: 2025-01-11
updated: 2026-08-09
---

# BST删除

> [!summary] 一句话说明
> BST 删除的关键是补位：删掉目标后，还要让树继续保持有序。

## 三种情况

- 没有孩子：直接删
- 只有一个孩子：让孩子顶上来
- 有两个孩子：用后继或前驱替换，再删替身

## Go 代码：后继方案

```go
func deleteNode(root *TreeNode, key int) *TreeNode {
    if root == nil {
        return nil
    }
    if key < root.Val {
        root.Left = deleteNode(root.Left, key)
        return root
    }
    if key > root.Val {
        root.Right = deleteNode(root.Right, key)
        return root
    }

    if root.Left == nil {
        return root.Right
    }
    if root.Right == nil {
        return root.Left
    }

    successor := root.Right
    for successor.Left != nil {
        successor = successor.Left
    }
    root.Val = successor.Val
    root.Right = deleteNode(root.Right, successor.Val)
    return root
}
```

## 为什么先找后继

后继一定比当前节点大，而且是右子树里最小的那个，所以替换后仍然有序。

## 相关主题

- [[BST查找|BST查找]]
- [[BST插入|BST插入]]
- [[验证BST|验证BST]]
- [[../_index|树算法]]

---
返回：[[../_index|树算法]] | [[../../算法学习导航|算法学习导航]]
