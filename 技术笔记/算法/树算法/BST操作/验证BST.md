---
title: "验证BST"
aliases: ["Validate BST", "验证二叉搜索树"]
tags:
  - 算法
  - 算法/树
  - 算法/树/BST
difficulty: medium
created: 2025-01-11
updated: 2026-08-09
---

# 验证BST

> [!summary] 一句话说明
> 验证 BST 的关键不是父子比较，而是整棵子树都得落在合法范围里。

![[附件/算法可视化/binary-search.gif]]

## Go 代码：上下界递归

```go
func isValidBST(root *TreeNode) bool {
    return validate(root, nil, nil)
}

func validate(node *TreeNode, low, high *int) bool {
    if node == nil {
        return true
    }
    if low != nil && node.Val <= *low {
        return false
    }
    if high != nil && node.Val >= *high {
        return false
    }
    return validate(node.Left, low, &node.Val) && validate(node.Right, &node.Val, high)
}
```

## Go 代码：中序遍历

```go
func isValidBSTInorder(root *TreeNode) bool {
    stack := []*TreeNode{}
    var prev *TreeNode

    for root != nil || len(stack) > 0 {
        for root != nil {
            stack = append(stack, root)
            root = root.Left
        }

        root = stack[len(stack)-1]
        stack = stack[:len(stack)-1]

        if prev != nil && root.Val <= prev.Val {
            return false
        }
        prev = root
        root = root.Right
    }

    return true
}
```

## 易错点

> [!warning] BST 标准题一般不接受重复值
> 中序法里 `prev` 必须全程保留，不能只跟当前层比。

## 相关主题

- [[BST查找|BST查找]]
- [[BST插入|BST插入]]
- [[中序遍历|中序遍历]]
- [[../_index|树算法]]

---
返回：[[../_index|树算法]] | [[../../算法学习导航|算法学习导航]]
