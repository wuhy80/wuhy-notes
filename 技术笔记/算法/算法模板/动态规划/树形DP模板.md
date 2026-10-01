---
title: "树形DP模板"
aliases:
  - Tree DP Template
  - 树上动态规划模板
tags:
  - 算法
  - 算法/模板
  - 算法/动态规划
  - 算法/树
difficulty: hard
created: 2026-08-08
updated: 2026-08-09
status: active
---

# 树形 DP 模板

> [!summary] 一句话说明
> 树形 DP 的关键不是树，而是“当前节点的答案依赖子树答案”，所以大多数时候都带明显的后序味道。

## 模板适用场景

- 选或不选当前节点
- 子树信息往父节点汇总
- 树上背包、最大权独立集、打家劫舍 III

## 最经典状态：选 / 不选

很多树形 DP 都能写成：

- `skip`：不选当前节点的最优答案
- `take`：选当前节点的最优答案

## Go 模板：树上最大权独立集

```go
func TreeIndependentSet(graph [][]int, weights []int, root int) int {
    var dfs func(node, parent int) (skip int, take int)
    dfs = func(node, parent int) (skip int, take int) {
        take = weights[node]

        for _, child := range graph[node] {
            if child == parent {
                continue
            }

            childSkip, childTake := dfs(child, node)
            skip += max(childSkip, childTake)
            take += childSkip
        }

        return skip, take
    }

    skip, take := dfs(root, -1)
    return max(skip, take)
}

func max(a, b int) int {
    if a > b {
        return a
    }
    return b
}
```

## 为什么树上一定要传 `parent`

因为很多题给的是无向树。  
如果你不传父节点，递归会沿边来回跑死。

## 这个模板的转移逻辑

### 当前节点不选

那子节点可选可不选，取更优的那个。

### 当前节点选

那子节点就不能选，只能接子节点的 `skip`。

这就是“父子约束”最典型的一类树形 DP。

## 易错点

> [!warning] 树形 DP 模板最容易错的地方
> - 无向树必须传 `parent`。
> - 先定义清楚每个状态到底表示什么，再写转移。
> - 树形 DP 大多是后序合并，不要还没拿到子树答案就硬转移。

## 复杂度

| 指标 | 复杂度 |
|---|---:|
| 时间复杂度 | `O(n)` |
| 空间复杂度 | `O(h)` 递归栈 |

## 相关主题

- [[../../动态规划/树形DP|树形DP]]
- [[../../树算法/_index|树算法]]

---
返回：[[../_index|算法模板]]
