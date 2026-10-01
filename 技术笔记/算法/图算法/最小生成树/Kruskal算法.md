---
title: "Kruskal算法"
aliases: ["克鲁斯卡尔算法", "最小生成树"]
tags:
  - 算法
  - 算法/图论
  - 算法/贪心
difficulty: medium
created: 2025-01-11
updated: 2026-08-09
---

# Kruskal算法

## 📌 定义

**Kruskal算法**是一种用于求解**最小生成树（MST）**的贪心算法，通过对边进行排序并使用并查集来避免环的产生。

```
图示例:
    0 --1-- 1
    |     / |
    4   2   3
    | /     |
    2 --5-- 3

边排序: 1, 2, 3, 4, 5
选择边: (0,1,1), (1,2,2), (1,3,3)
总权重: 6
```

## 核心思路

- **从边扩展**：按权重从小到大选择边
- **并查集**：使用并查集检测和避免环
- **贪心策略**：每次选择最小权重且不形成环的边
- **适用场景**：稀疏图效率更高

## 复杂度分析

| 操作 | 时间复杂度 | 说明 |
|------|-----------|------|
| 边排序 | O(E log E) | 主要开销 |
| 并查集操作 | O(E α(V)) | α是反阿克曼函数 |
| 总时间 | O(E log E) | 排序占主导 |
| 空间复杂度 | O(V) | 并查集 |

## Go 代码

### Go 实现

```go
package main

import "sort"

type UnionFind struct {
    parent []int
    rank   []int
}

func NewUnionFind(n int) *UnionFind {
    parent := make([]int, n)
    rank := make([]int, n)
    for i := range parent {
        parent[i] = i
    }
    return &UnionFind{parent, rank}
}

func (uf *UnionFind) Find(x int) int {
    if uf.parent[x] != x {
        uf.parent[x] = uf.Find(uf.parent[x])
    }
    return uf.parent[x]
}

func (uf *UnionFind) Union(x, y int) bool {
    px, py := uf.Find(x), uf.Find(y)
    if px == py {
        return false
    }

    if uf.rank[px] < uf.rank[py] {
        px, py = py, px
    }
    uf.parent[py] = px
    if uf.rank[px] == uf.rank[py] {
        uf.rank[px]++
    }
    return true
}

type KruskalEdge struct {
    U, V, Weight int
}

func KruskalMST(edges []KruskalEdge, n int) (int, []KruskalEdge) {
    // 按权重排序
    sort.Slice(edges, func(i, j int) bool {
        return edges[i].Weight < edges[j].Weight
    })

    uf := NewUnionFind(n)
    mstEdges := []KruskalEdge{}
    totalWeight := 0

    for _, edge := range edges {
        if uf.Union(edge.U, edge.V) {
            mstEdges = append(mstEdges, edge)
            totalWeight += edge.Weight

            if len(mstEdges) == n-1 {
                break
            }
        }
    }

    return totalWeight, mstEdges
}
```

## 思路展开

### 算法步骤

1. **边排序**：
   - 将所有边按权重从小到大排序

2. **初始化并查集**：
   - 每个节点初始化为独立集合

3. **选择边**：
   - 遍历排序后的边
   - 如果边的两个端点不在同一集合，选择该边
   - 合并两个端点所在的集合

4. **终止条件**：
   - 选择了V-1条边
   - 或遍历完所有边

### 执行示例

```
图:
    0 --1-- 1
    |     / |
    4   2   3
    | /     |
    2 --5-- 3

边列表: [(0,1,1), (1,2,2), (1,3,3), (0,2,4), (2,3,5)]

步骤1: 排序边
  排序后: [(0,1,1), (1,2,2), (1,3,3), (0,2,4), (2,3,5)]

步骤2: 初始化并查集
  parent: [0, 1, 2, 3]

步骤3: 处理边(0,1,1)
  - find(0)=0, find(1)=1, 不同集合
  - 合并: parent[1]=0
  - 添加边, 权重=1
  - MST: [(0,1,1)]

步骤4: 处理边(1,2,2)
  - find(1)=0, find(2)=2, 不同集合
  - 合并: parent[2]=0
  - 添加边, 权重=3
  - MST: [(0,1,1), (1,2,2)]

步骤5: 处理边(1,3,3)
  - find(1)=0, find(3)=3, 不同集合
  - 合并: parent[3]=0
  - 添加边, 权重=6
  - MST: [(0,1,1), (1,2,2), (1,3,3)]

步骤6: 已有3条边（V-1），完成

最小生成树: [(0,1,1), (1,2,2), (1,3,3)]
总权重: 6
```

### 并查集优化

**路径压缩**：

**按秩合并**：

## 经典题目

## 💡 优缺点

### 优点
- ✅ 适合稀疏图
- ✅ 实现简单
- ✅ 可以处理不连通的图
- ✅ 易于并行化

### 缺点
- ❌ 需要对所有边排序
- ❌ 稠密图不如Prim
- ❌ 需要边集数组

## 相关主题

- [[Prim算法|Prim算法]] - 从点扩展的MST算法
- [[../../树算法/高级树结构/并查集|并查集]] - Kruskal的核心数据结构
- [[../图的基础/边集数组|边集数组]] - Kruskal算法的数据结构
- [[../经典问题/连接所有点|连接所有点]] - Kruskal算法应用
- [[../_index|图算法]] - 返回图算法总览

---
返回：[[../_index|图算法]] | [[../../算法学习导航|算法学习导航]]
