---
title: "SPFA算法"
aliases: ["Shortest Path Faster Algorithm"]
tags:
  - 算法
  - 算法/图论
difficulty: medium
created: 2025-01-11
updated: 2026-08-09
---

# SPFA算法

> [!summary] SPFA 的核心不是“比 Bellman-Ford 更高级”，而是只把那些刚刚变短的点继续放进队列，避免每轮都傻扫全部边。

## 定义

**SPFA算法（Shortest Path Faster Algorithm）**是Bellman-Ford算法的队列优化版本，使用队列来优化松弛操作的顺序。

```
图示例:
    0 --2-- 1
    |     / |
    6   8   5
    | /     |
    2 --1-- 3

SPFA通过队列优化，只处理需要更新的节点
```

## 核心思路

- **队列优化**：只对距离被更新的节点的邻接节点进行松弛
- **动态松弛**：节点可以多次入队
- **负权边支持**：可以处理负权边
- **负环检测**：统计入队次数检测负环

## 为什么它看起来更快

Bellman-Ford 每一轮都会把所有边扫一遍。  
SPFA 则只关心“刚刚被更新过的点”，因为只有这些点才可能继续让别人变短。

所以它在很多普通数据上会更快，但这不是严格保证，最坏情况依然能退化回 `O(VE)`。

## 复杂度分析

| 指标 | 复杂度 | 说明 |
|------|--------|------|
| 平均时间 | O(kE) | k是常数，通常很小 |
| 最坏时间 | O(VE) | 退化为Bellman-Ford |
| 空间复杂度 | O(V) | 队列和距离数组 |

## Go 代码

### Go 实现

```go
package main

import "math"

func SPFA(graph [][]Edge, start, n int) []int {
    distance := make([]int, n)
    for i := range distance {
        distance[i] = math.MaxInt32
    }
    distance[start] = 0

    inQueue := make([]bool, n)
    count := make([]int, n)

    queue := []int{start}
    inQueue[start] = true
    count[start] = 1

    for len(queue) > 0 {
        node := queue[0]
        queue = queue[1:]
        inQueue[node] = false

        for _, edge := range graph[node] {
            if distance[node] != math.MaxInt32 &&
                distance[node]+edge.Weight < distance[edge.To] {
                distance[edge.To] = distance[node] + edge.Weight

                if !inQueue[edge.To] {
                    queue = append(queue, edge.To)
                    inQueue[edge.To] = true
                    count[edge.To]++

                    // 检测负环
                    if count[edge.To] >= n {
                        return nil
                    }
                }
            }
        }
    }

    return distance
}
```

## 思路展开

### SPFA vs Bellman-Ford

| 特性 | Bellman-Ford | SPFA |
|------|-------------|------|
| 松弛策略 | 遍历所有边 | 只处理更新的节点 |
| 数据结构 | 无 | 队列 |
| 平均性能 | O(VE) | O(kE) |
| 最坏性能 | O(VE) | O(VE) |

### 优化技巧

**SLF优化（Small Label First）**：

**LLL优化（Large Label Last）**：

## 易错点

> [!warning] SPFA 容易让人误以为“总是比 Bellman-Ford 快”，这是不对的。

- 它只是平均常见情况下更快，最坏情况仍然很差。
- 一个点在队列里时，通常不需要重复入队。
- 负环检测常见做法是统计入队次数，达到 `n` 次就要警惕。
- 如果图没有负权边，优先还是考虑 [[Dijkstra算法]]。

## 经典题目

## 优缺点

### 优点
- ✅ 平均性能优于Bellman-Ford
- ✅ 可以处理负权边
- ✅ 可以检测负权环
- ✅ 实现简单

### 缺点
- ❌ 最坏情况退化为O(VE)
- ❌ 可能被特殊构造的数据卡
- ❌ 不如Dijkstra稳定

## 相关主题

- [[Bellman-Ford算法|Bellman-Ford算法]] - SPFA的基础
- [[Dijkstra算法|Dijkstra算法]] - 非负权图更优
- [[Floyd-Warshall算法|Floyd-Warshall算法]] - 多源最短路径
- [[../_index|图算法]] - 返回图算法总览

---
返回：[[../_index|图算法]] | [[../../算法学习导航|算法学习导航]]
