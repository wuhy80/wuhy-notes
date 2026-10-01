---
title: "BST与有序数组转换"
aliases: ["Convert Sorted Array to BST", "有序数组转BST"]
tags:
  - 算法
  - 算法/树
  - 算法/树/BST
difficulty: easy
created: 2025-01-11
updated: 2026-08-09
---

# BST与有序数组转换

> [!summary] 一句话说明
> 有序数组转 BST 就是取中点做根；BST 转数组就用中序遍历还原有序序列。

## Go 代码：有序数组转 BST

```go
func sortedArrayToBST(nums []int) *TreeNode {
    var build func(left, right int) *TreeNode
    build = func(left, right int) *TreeNode {
        if left > right {
            return nil
        }
        mid := left + (right-left)/2
        root := &TreeNode{Val: nums[mid]}
        root.Left = build(left, mid-1)
        root.Right = build(mid+1, right)
        return root
    }
    return build(0, len(nums)-1)
}
```

## Go 代码：BST 转有序数组

```go
func bstToSortedArray(root *TreeNode) []int {
    result := []int{}
    var inorder func(node *TreeNode)
    inorder = func(node *TreeNode) {
        if node == nil {
            return
        }
        inorder(node.Left)
        result = append(result, node.Val)
        inorder(node.Right)
    }
    inorder(root)
    return result
}
```

## 相关主题

- [[中序遍历|中序遍历]]
- [[平衡二叉树|平衡二叉树]]
- [[../_index|树算法]]

---
返回：[[../_index|树算法]] | [[../../算法学习导航|算法学习导航]]
