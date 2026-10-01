---
title: "BST迭代器"
aliases: ["BST Iterator", "二叉搜索树迭代器"]
tags:
  - 算法
  - 算法/树
  - 算法/树/BST
difficulty: medium
created: 2025-01-11
updated: 2026-08-09
---

# BST迭代器

> [!summary] 一句话说明
> BST 迭代器就是把中序遍历拆成“每次只吐一个最小值”的形式。

## Go 代码

```go
type BSTIterator struct {
    stack []*TreeNode
}

func Constructor(root *TreeNode) BSTIterator {
    it := BSTIterator{}
    it.pushLeft(root)
    return it
}

func (it *BSTIterator) pushLeft(node *TreeNode) {
    for node != nil {
        it.stack = append(it.stack, node)
        node = node.Left
    }
}

func (it *BSTIterator) Next() int {
    node := it.stack[len(it.stack)-1]
    it.stack = it.stack[:len(it.stack)-1]
    it.pushLeft(node.Right)
    return node.Val
}

func (it *BSTIterator) HasNext() bool {
    return len(it.stack) > 0
}
```

## 关键点

栈里始终放着“下一批最小节点”的路径，所以 `Next()` 只要弹一个，再把它的右子树继续压左链。

## 相关主题

- [[中序遍历|中序遍历]]
- [[BST查找|BST查找]]
- [[../_index|树算法]]

---
返回：[[../_index|树算法]] | [[../../算法学习导航|算法学习导航]]
