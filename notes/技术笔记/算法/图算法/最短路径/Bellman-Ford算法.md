---
title: "Bellman-Ford算法"
aliases: ["贝尔曼福特算法", "负权边最短路径"]
tags:
  - 算法
  - 算法/图论
difficulty: medium
created: 2025-01-11
updated: 2026-08-09
---

# Bellman-Ford算法

> [!summary] Bellman-Ford 的本质是反复松弛所有边。它不贪心地“确认某个点”，而是允许答案一轮轮变短，所以能处理负权边。

## 定义

**Bellman-Ford算法**是一种用于计算单源最短路径的算法，可以处理**负权边**，并能检测**负权环**。

```
图示例（含负权边）:
    0 --1-- 1
    |     / |
    4  -3   2
    | /     |
    2 --1-- 3

从节点0的最短距离:
0→1: 1
0→2: -2
0→3: 0
```

## 核心思路

- **动态规划**：通过V-1轮松弛操作求最短路径
- **松弛所有边**：每轮对所有边进行松弛
- **负权边支持**：可以处理负权边
- **负环检测**：第V轮仍能松弛说明存在负环

## 为什么它能处理负权边

Dijkstra 的逻辑是“某个点一旦当前最小，就可以永久确认”。  
但 Bellman-Ford 不做这个假设，它只是不断问：

```text
如果经过这条边，我能不能把终点距离再缩短一点？
```

只要还可能变短，就继续更新。  
这也是它能处理负权边、也能发现负权环的原因。

## 复杂度分析

| 指标 | 复杂度 | 说明 |
|------|--------|------|
| 时间复杂度 | O(VE) | V轮，每轮E条边 |
| 空间复杂度 | O(V) | 距离数组 |
| 最坏情况 | O(VE) | 稠密图时较慢 |

## Go 代码

### Go 实现

```go
package main

import "math"

type Edge struct {
    U, V, Weight int
}

func BellmanFord(edges []Edge, n, start int) []int {
    distance := make([]int, n)
    for i := range distance {
        distance[i] = math.MaxInt32
    }
    distance[start] = 0

    // V-1轮松弛
    for i := 0; i < n-1; i++ {
        updated := false

        for _, edge := range edges {
            if distance[edge.U] != math.MaxInt32 &&
                distance[edge.U]+edge.Weight < distance[edge.V] {
                distance[edge.V] = distance[edge.U] + edge.Weight
                updated = true
            }
        }

        if !updated {
            break
        }
    }

    // 检测负环
    for _, edge := range edges {
        if distance[edge.U] != math.MaxInt32 &&
            distance[edge.U]+edge.Weight < distance[edge.V] {
            return nil // 存在负环
        }
    }

    return distance
}

func HasNegativeCycle(edges []Edge, n int) bool {
    distance := make([]int, n)

    // V-1轮松弛
    for i := 0; i < n-1; i++ {
        for _, edge := range edges {
            if distance[edge.U]+edge.Weight < distance[edge.V] {
                distance[edge.V] = distance[edge.U] + edge.Weight
            }
        }
    }

    // 检测负环
    for _, edge := range edges {
        if distance[edge.U]+edge.Weight < distance[edge.V] {
            return true
        }
    }

    return false
}
```

## 思路展开

### 算法步骤

1. **初始化**：
   - 起点距离设为0
   - 其他节点距离设为∞

2. **松弛操作**（V-1轮）：
   - 遍历所有边
   - 如果 dist[u] + weight < dist[v]，更新 dist[v]

3. **负环检测**（第V轮）：
   - 再次遍历所有边
   - 如果仍能松弛，说明存在负环

### 执行示例

```
图（含负权边）:
    0 --1-- 1
    |     / |
    4  -3   2
    | /     |
    2 --1-- 3

边列表: [(0,1,1), (0,2,4), (1,2,-3), (1,3,2), (2,3,1)]

初始: dist=[0, ∞, ∞, ∞]

第1轮:
  (0,1,1): dist[1] = 0+1 = 1
  (0,2,4): dist[2] = 0+4 = 4
  (1,2,-3): dist[2] = 1+(-3) = -2
  (1,3,2): dist[3] = 1+2 = 3
  (2,3,1): dist[3] = -2+1 = -1
  结果: [0, 1, -2, -1]

第2轮:
  (1,2,-3): dist[2] = 1+(-3) = -2 (无变化)
  (2,3,1): dist[3] = -2+1 = -1 (无变化)
  结果: [0, 1, -2, -1]

第3轮: 无更新，提前退出

负环检测: 无法继续松弛，不存在负环

最终结果: [0, 1, -2, -1]
```

### 为什么需要 `V-1` 轮

- 最短路径最多包含V-1条边
- 每轮松弛至少确定一个节点的最短距离
- V-1轮后所有可达节点的最短距离都已确定

## 易错点

> [!warning] Bellman-Ford 很容易写出能跑但不严格的版本，尤其是做题变形时。

- 要先判断 `dist[u]` 是否还是无穷大，再尝试松弛。
- 做“恰好 / 至多经过 k 条边”这类题时，通常要用上一轮快照，避免一轮内连锁更新。
- 第 `V` 轮还能继续变短，不是普通更新，而是负环信号。
- 它能处理负权边，但如果存在可达负环，最短路就没有意义了。

## 经典题目

## 优缺点

### 优点
- ✅ 可以处理负权边
- ✅ 可以检测负权环
- ✅ 实现简单
- ✅ 适合边数较少的图

### 缺点
- ❌ 时间复杂度高 O(VE)
- ❌ 比Dijkstra慢
- ❌ 不适合稠密图

## 相关主题

- [[Dijkstra算法|Dijkstra算法]] - 非负权图更快
- [[SPFA算法|SPFA算法]] - Bellman-Ford的队列优化
- [[Floyd-Warshall算法|Floyd-Warshall算法]] - 多源最短路径
- [[../_index|图算法]] - 返回图算法总览

---
返回：[[../_index|图算法]] | [[../../算法学习导航|算法学习导航]]
