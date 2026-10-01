---
title: "BST第K小元素"
aliases: ["Kth Smallest Element in BST", "第K小元素"]
tags:
  - 算法
  - 算法/树
  - 算法/树/BST
difficulty: medium
created: 2025-01-11
updated: 2026-08-09
---

# BST第K小元素

> [!summary] 一句话说明
> BST 的中序遍历天然有序，所以第 K 小就是中序走到第 K 个节点。

## Go 代码

```go
func kthSmallest(root *TreeNode, k int) int {
    stack := []*TreeNode{}
    for root != nil || len(stack) > 0 {
        for root != nil {
            stack = append(stack, root)
            root = root.Left
        }

        root = stack[len(stack)-1]
        stack = stack[:len(stack)-1]
        k--
        if k == 0 {
            return root.Val
        }
        root = root.Right
    }
    return -1
}
```

## 为什么能提前停

中序本来就是从小到大，数到第 `k` 个就可以直接返回。

## 相关主题

- [[中序遍历|中序遍历]]
- [[BST查找|BST查找]]
- [[../_index|树算法]]

---
返回：[[../_index|树算法]] | [[../../算法学习导航|算法学习导航]]
