---
title: "剑指Offer"
aliases: ["Coding Interviews", "剑指Offer题解"]
tags:
  - 算法
  - LeetCode
  - 面试
type: index
created: 2025-01-11
updated: 2026-08-09
---

# 剑指Offer

> [!summary] 一句话说明
> 剑指 Offer 的价值不在题量，而在它把国内面试高频的数组、链表、树、DP、栈队列和搜索题压缩成了一套很稳定的基础题单。

## 怎么刷更有效

### 第一阶段：基础结构

- 数组
- 字符串
- 链表
- 树的遍历

### 第二阶段：核心套路

- 双指针
- 二分查找
- BFS / DFS
- 回溯
- 一维 / 二维 DP

### 第三阶段：综合专题

- 单调队列
- 位运算
- BST
- 最近公共祖先

## 高频专题

| 专题 | 代表题型 | 关键词 |
|---|---|---|
| 数组 | 重复数字、旋转数组、连续和 | 哈希、二分、前缀和 |
| 链表 | 倒数第 k 个、反转、相交 | 快慢指针 |
| 树 | 层序遍历、镜像、LCA | 递归、BFS |
| DP | 斐波那契、礼物最大价值 | 状态定义 |
| 栈队列 | 最小栈、滑动窗口最大值 | 单调队列 |

## 一个代表性 Go 模板：链表倒数第 k 个节点

```go
func getKthFromEnd(head *ListNode, k int) *ListNode {
    fast, slow := head, head

    for i := 0; i < k; i++ {
        fast = fast.Next
    }

    for fast != nil {
        fast = fast.Next
        slow = slow.Next
    }

    return slow
}
```

这个题型背后真正该记的是：

```text
快指针先走 k 步，之后快慢一起走
```

## 一个代表性 Go 模板：二叉树镜像

```go
func mirrorTree(root *TreeNode) *TreeNode {
    if root == nil {
        return nil
    }

    root.Left, root.Right = root.Right, root.Left
    mirrorTree(root.Left)
    mirrorTree(root.Right)
    return root
}
```

## 刷题建议

- 不要按题号硬刷，按专题刷更有效
- 每做完一个专题，顺手整理 1-2 个可复用 Go 模板
- Offer 题适合用来建立“稳定手感”，不是用来堆最难技巧

## 相关页面

- [[../按算法分类/算法题解索引|算法题解索引]]
- [[../按数据结构分类/数据结构题解索引|数据结构题解索引]]

---
返回：[[../_index|LeetCode题解]]
