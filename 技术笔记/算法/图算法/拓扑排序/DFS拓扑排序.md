---
title: "DFS拓扑排序"
aliases: ["DFS Topological Sort"]
tags:
  - 算法
  - 算法/图论
difficulty: medium
created: 2025-01-11
updated: 2026-08-09
---

# DFS拓扑排序

## 📌 定义

**DFS拓扑排序**是一种基于深度优先搜索的拓扑排序算法，通过后序遍历的逆序得到拓扑序列。

```
有向无环图（DAG）:
    0 → 1 → 3
    ↓   ↓
    2 → 4

DFS后序: 3, 4, 1, 2, 0
拓扑序列（逆序）: 0, 2, 1, 4, 3
```

## 核心思路

- **深度优先**：递归访问所有未访问的节点
- **后序遍历**：在访问完所有邻接节点后记录当前节点
- **逆序输出**：后序遍历的逆序即为拓扑序列
- **环检测**：使用三色标记法检测环

## 复杂度分析

| 指标 | 复杂度 | 说明 |
|------|--------|------|
| 时间复杂度 | O(V+E) | 遍历所有节点和边 |
| 空间复杂度 | O(V) | 递归栈 |

## Go 代码

### Go 实现

```go
package main

const (
    WHITE = 0
    GRAY  = 1
    BLACK = 2
)

func DFSTopologicalSort(graph [][]int, n int) []int {
    color := make([]int, n)
    result := []int{}
    hasCycle := false

    var dfs func(int)
    dfs = func(node int) {
        if hasCycle {
            return
        }

        color[node] = GRAY

        for _, neighbor := range graph[node] {
            if color[neighbor] == GRAY {
                hasCycle = true
                return
            }
            if color[neighbor] == WHITE {
                dfs(neighbor)
            }
        }

        color[node] = BLACK
        result = append(result, node)
    }

    for i := 0; i < n; i++ {
        if color[i] == WHITE {
            dfs(i)
            if hasCycle {
                return []int{}
            }
        }
    }

    // 逆序
    for i, j := 0, len(result)-1; i < j; i, j = i+1, j-1 {
        result[i], result[j] = result[j], result[i]
    }

    return result
}
```

## 思路展开

### 三色标记法

- **白色（WHITE）**：未访问
- **灰色（GRAY）**：正在访问（在递归栈中）
- **黑色（BLACK）**：已完成访问

**环检测**：如果访问到灰色节点，说明存在环

### 执行示例

```
图:
    0 → 1 → 3
    ↓   ↓
    2 → 4

DFS执行过程:

从节点0开始:
  color[0] = GRAY
  访问邻接节点1:
    color[1] = GRAY
    访问邻接节点3:
      color[3] = GRAY
      无邻接节点
      color[3] = BLACK, 记录: [3]
    访问邻接节点4:
      color[4] = GRAY
      无邻接节点
      color[4] = BLACK, 记录: [3, 4]
    color[1] = BLACK, 记录: [3, 4, 1]
  访问邻接节点2:
    color[2] = GRAY
    访问邻接节点4:
      已是BLACK，跳过
    color[2] = BLACK, 记录: [3, 4, 1, 2]
  color[0] = BLACK, 记录: [3, 4, 1, 2, 0]

后序遍历: [3, 4, 1, 2, 0]
拓扑序列（逆序）: [0, 2, 1, 4, 3]
```

### DFS vs Kahn

| 特性 | DFS | Kahn（BFS） |
|------|-----|------------|
| 实现方式 | 递归 | 队列 |
| 代码简洁性 | 更简洁 | 稍复杂 |
| 空间开销 | 递归栈 | 入度数组+队列 |
| 字典序 | 不易控制 | 易于控制 |

## 经典题目

## 💡 优缺点

### 优点
- ✅ 代码简洁
- ✅ 不需要额外的入度数组
- ✅ 递归实现自然
- ✅ 可以检测环

### 缺点
- ❌ 可能栈溢出（深度很大时）
- ❌ 不易控制字典序
- ❌ 不适合在线算法

## 相关主题

- [[Kahn算法|Kahn算法]] - BFS拓扑排序
- [[../图的遍历/深度优先搜索|DFS]] - DFS拓扑排序基于DFS
- [[../经典问题/课程表|课程表]] - 拓扑排序应用
- [[../_index|图算法]] - 返回图算法总览

---
返回：[[../_index|图算法]] | [[../../算法学习导航|算法学习导航]]
