---
title: "Kahn算法（BFS拓扑排序）"
aliases: ["Kahn算法", "BFS拓扑排序"]
tags:
  - 算法
  - 算法/图论
difficulty: medium
created: 2025-01-11
updated: 2026-08-09
---

# Kahn算法（BFS拓扑排序）

## 📌 定义

**Kahn算法**是一种基于BFS的拓扑排序算法，通过不断移除入度为0的节点来生成拓扑序列。

```
有向无环图（DAG）:
    0 → 1 → 3
    ↓   ↓
    2 → 4

拓扑序列: 0 → 1 → 2 → 3 → 4
或: 0 → 2 → 1 → 3 → 4
```

## 核心思路

- **入度统计**：统计每个节点的入度
- **队列处理**：将入度为0的节点加入队列
- **逐层移除**：处理节点时减少邻接节点的入度
- **环检测**：如果无法处理所有节点，说明存在环

## 复杂度分析

| 指标 | 复杂度 | 说明 |
|------|--------|------|
| 时间复杂度 | O(V+E) | 遍历所有节点和边 |
| 空间复杂度 | O(V) | 队列和入度数组 |

## Go 代码

### Go 实现

```go
package main

func KahnTopologicalSort(graph [][]int, n int) []int {
    inDegree := make([]int, n)

    // 统计入度
    for i := 0; i < n; i++ {
        for _, neighbor := range graph[i] {
            inDegree[neighbor]++
        }
    }

    // 入度为0的节点入队
    queue := []int{}
    for i := 0; i < n; i++ {
        if inDegree[i] == 0 {
            queue = append(queue, i)
        }
    }

    result := []int{}

    for len(queue) > 0 {
        node := queue[0]
        queue = queue[1:]
        result = append(result, node)

        for _, neighbor := range graph[node] {
            inDegree[neighbor]--
            if inDegree[neighbor] == 0 {
                queue = append(queue, neighbor)
            }
        }
    }

    if len(result) != n {
        return []int{}
    }
    return result
}
```

## 思路展开

### 算法步骤

1. **统计入度**：
   - 遍历所有边，统计每个节点的入度

2. **初始化队列**：
   - 将所有入度为0的节点加入队列

3. **BFS处理**：
   - 从队列取出节点，加入结果
   - 将该节点的所有邻接节点入度减1
   - 如果邻接节点入度变为0，加入队列

4. **检查结果**：
   - 如果结果包含所有节点，返回拓扑序列
   - 否则说明存在环

### 执行示例

```
图:
    0 → 1 → 3
    ↓   ↓
    2 → 4

边: [(0,1), (0,2), (1,3), (1,4), (2,4)]

步骤1: 统计入度
  in_degree = [0, 1, 1, 1, 2]

步骤2: 初始化队列
  queue = [0]

步骤3: 处理节点0
  - 输出: 0
  - 减少入度: in_degree[1]=0, in_degree[2]=0
  - 入队: queue = [1, 2]

步骤4: 处理节点1
  - 输出: 0, 1
  - 减少入度: in_degree[3]=0, in_degree[4]=1
  - 入队: queue = [2, 3]

步骤5: 处理节点2
  - 输出: 0, 1, 2
  - 减少入度: in_degree[4]=0
  - 入队: queue = [3, 4]

步骤6: 处理节点3
  - 输出: 0, 1, 2, 3
  - 无邻接节点
  - queue = [4]

步骤7: 处理节点4
  - 输出: 0, 1, 2, 3, 4
  - 完成

拓扑序列: [0, 1, 2, 3, 4]
```

## 经典题目

## 💡 优缺点

### 优点
- ✅ 直观易懂
- ✅ 可以检测环
- ✅ 适合在线算法
- ✅ 可以输出字典序最小的拓扑序列

### 缺点
- ❌ 需要额外的入度数组
- ❌ 不如DFS简洁

## 相关主题

- [[DFS拓扑排序|DFS拓扑排序]] - 另一种拓扑排序方法
- [[../图的遍历/广度优先搜索|BFS]] - Kahn算法基于BFS
- [[../经典问题/课程表|课程表]] - Kahn算法应用
- [[../_index|图算法]] - 返回图算法总览

---
返回：[[../_index|图算法]] | [[../../算法学习导航|算法学习导航]]
