---
title: "Prim算法"
aliases: ["普里姆算法", "最小生成树"]
tags:
  - 算法
  - 算法/图论
  - 算法/贪心
difficulty: medium
created: 2025-01-11
updated: 2026-08-09
---

# Prim算法

## 📌 定义

**Prim算法**是一种用于求解**最小生成树（MST）**的贪心算法，从一个顶点开始逐步扩展生成树。

```
图示例:
    0 --1-- 1
    |     / |
    4   2   3
    | /     |
    2 --5-- 3

最小生成树（权重和=7）:
    0 --1-- 1
          / |
        2   3
            |
            3
```

## 核心思路

- **从点扩展**：从任意顶点开始，逐步添加最小权重的边
- **贪心策略**：每次选择连接树和非树节点的最小权重边
- **优先队列**：使用最小堆优化边的选择
- **适用场景**：稠密图效率更高

## 复杂度分析

| 实现方式 | 时间复杂度 | 空间复杂度 | 说明 |
|---------|-----------|-----------|------|
| 朴素实现 | O(V²) | O(V) | 适合稠密图 |
| 优先队列 | O((V+E)log V) | O(V+E) | 适合稀疏图 |
| 斐波那契堆 | O(E + V log V) | O(V) | 理论最优 |

## Go 代码

### Go 实现

```go
package main

import (
    "container/heap"
)

type PrimEdge struct {
    U, V, Weight int
}

type PrimPQ []PrimEdge

func (pq PrimPQ) Len() int { return len(pq) }
func (pq PrimPQ) Less(i, j int) bool {
    return pq[i].Weight < pq[j].Weight
}
func (pq PrimPQ) Swap(i, j int) { pq[i], pq[j] = pq[j], pq[i] }
func (pq *PrimPQ) Push(x interface{}) {
    *pq = append(*pq, x.(PrimEdge))
}
func (pq *PrimPQ) Pop() interface{} {
    old := *pq
    n := len(old)
    item := old[n-1]
    *pq = old[0 : n-1]
    return item
}

func PrimMST(graph [][]Edge, n int) (int, []PrimEdge) {
    visited := make(map[int]bool)
    mstEdges := []PrimEdge{}
    totalWeight := 0

    // 从节点0开始
    visited[0] = true
    pq := &PrimPQ{}
    heap.Init(pq)

    for _, edge := range graph[0] {
        heap.Push(pq, PrimEdge{0, edge.To, edge.Weight})
    }

    for pq.Len() > 0 && len(visited) < n {
        edge := heap.Pop(pq).(PrimEdge)

        if visited[edge.V] {
            continue
        }

        visited[edge.V] = true
        mstEdges = append(mstEdges, edge)
        totalWeight += edge.Weight

        for _, nextEdge := range graph[edge.V] {
            if !visited[nextEdge.To] {
                heap.Push(pq, PrimEdge{
                    edge.V,
                    nextEdge.To,
                    nextEdge.Weight,
                })
            }
        }
    }

    return totalWeight, mstEdges
}
```

## 思路展开

### 算法步骤

1. **初始化**：
   - 选择任意起始节点加入MST
   - 将起始节点的所有边加入优先队列

2. **循环扩展**：
   - 从优先队列取出最小权重边
   - 如果边的终点不在MST中，添加该边
   - 将新节点的所有边加入优先队列

3. **终止条件**：
   - MST包含所有节点（V-1条边）
   - 或优先队列为空

### 执行示例

```
图:
    0 --1-- 1
    |     / |
    4   2   3
    | /     |
    2 --5-- 3

执行过程:
初始: MST={0}, pq=[(1,0,1), (4,0,2)]

步骤1: 选择边(0,1,1)
  - 添加节点1到MST
  - MST={0,1}, 权重=1
  - 添加边: (2,1,2), (3,1,3)
  - pq=[(2,1,2), (3,1,3), (4,0,2)]

步骤2: 选择边(1,2,2)
  - 添加节点2到MST
  - MST={0,1,2}, 权重=3
  - 添加边: (5,2,3)
  - pq=[(3,1,3), (4,0,2), (5,2,3)]

步骤3: 选择边(1,3,3)
  - 添加节点3到MST
  - MST={0,1,2,3}, 权重=6
  - 完成（4个节点，3条边）

最小生成树: [(0,1,1), (1,2,2), (1,3,3)]
总权重: 6
```

## 经典题目

## 💡 优缺点

### 优点
- ✅ 适合稠密图
- ✅ 可以从任意节点开始
- ✅ 优先队列实现效率高
- ✅ 易于理解和实现

### 缺点
- ❌ 稀疏图不如Kruskal
- ❌ 需要邻接表或邻接矩阵
- ❌ 不能并行化

## 相关主题

- [[Kruskal算法|Kruskal算法]] - 从边扩展的MST算法
- [[../图的基础/邻接表|邻接表]] - Prim算法的数据结构
- [[../经典问题/连接所有点|连接所有点]] - Prim算法应用
- [[../_index|图算法]] - 返回图算法总览

---
返回：[[../_index|图算法]] | [[../../算法学习导航|算法学习导航]]
