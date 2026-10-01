---
title: "BST的最近公共祖先"
aliases: ["LCA of BST", "二叉搜索树最近公共祖先"]
tags:
  - 算法
  - 算法/树
  - 算法/树/BST
difficulty: medium
created: 2025-01-11
updated: 2026-08-09
---

# BST的最近公共祖先

> [!summary] 一句话说明
> BST 的 LCA 只看大小关系：两边都小就往左，两边都大就往右，否则当前节点就是答案。

## Go 代码

```go
func lowestCommonAncestor(root, p, q *TreeNode) *TreeNode {
    for root != nil {
        if p.Val < root.Val && q.Val < root.Val {
            root = root.Left
            continue
        }
        if p.Val > root.Val && q.Val > root.Val {
            root = root.Right
            continue
        }
        return root
    }
    return nil
}
```

## 相关主题

- [[最近公共祖先|最近公共祖先]]
- [[BST查找|BST查找]]
- [[../_index|树算法]]

---
返回：[[../_index|树算法]] | [[../../算法学习导航|算法学习导航]]
