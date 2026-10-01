---
title: "DFS与BFS"
aliases: ["图的遍历", "深度优先搜索", "广度优先搜索"]
tags:
  - 算法
  - 算法/图论
  - 算法/搜索
difficulty: easy
created: 2025-01-11
updated: 2026-08-09
---

# DFS与BFS

> [!summary] DFS 是“先沿一条路走到底”，BFS 是“按距离一层一层扩散”，两者最大的区别不在模板，而在扩展顺序和适用问题。

## 先别背模板，先判断该用谁

| 场景 | 优先算法 | 原因 |
|---|---|---|
| 连通块、回溯、枚举所有路径 | DFS | 更适合“做选择 -> 深入 -> 撤销” |
| 无权图最短路、最少步数、按层统计 | BFS | 按距离从近到远推进 |
| 图特别深，递归可能爆栈 | 迭代 DFS / BFS | 避免递归栈问题 |

## 核心直觉

### DFS

```text
先认准一条路走到底，走不动了再回头换路。
```

### BFS

```text
先把离起点最近的一圈处理完，再扩下一圈。
```

这就是为什么：

- DFS 很像“遍历所有可能性”
- BFS 很像“最短步数扩散”

## 动画对照

![[附件/算法可视化/dfs-backtrack.svg]]

![[附件/算法可视化/bfs-layer-traversal.gif]]

## 图和树最大的不同

图里可能有环。  
所以无论 DFS 还是 BFS，都必须认真处理：

```text
visited
```

如果不做访问标记，最直接的后果就是：

- 重复访问
- 死循环
- 最短路层次被破坏

## Go 代码：递归 DFS

```go
func DFSRecursive(graph [][]int, start int) []int {
    visited := make([]bool, len(graph))
    order := []int{}

    var dfs func(node int)
    dfs = func(node int) {
        visited[node] = true
        order = append(order, node)

        for _, next := range graph[node] {
            if visited[next] {
                continue
            }
            dfs(next)
        }
    }

    dfs(start)
    return order
}
```

## Go 代码：栈实现 DFS

```go
func DFSIterative(graph [][]int, start int) []int {
    visited := make([]bool, len(graph))
    stack := []int{start}
    order := []int{}

    for len(stack) > 0 {
        node := stack[len(stack)-1]
        stack = stack[:len(stack)-1]
        if visited[node] {
            continue
        }

        visited[node] = true
        order = append(order, node)

        for i := len(graph[node]) - 1; i >= 0; i-- {
            next := graph[node][i]
            if !visited[next] {
                stack = append(stack, next)
            }
        }
    }

    return order
}
```

## 为什么栈版常常逆序压栈

因为栈是后进先出。  
如果你想和递归版尽量保持相同访问顺序，通常要逆序压栈。

## Go 代码：标准 BFS

```go
func BFS(graph [][]int, start int) []int {
    visited := make([]bool, len(graph))
    visited[start] = true

    queue := []int{start}
    order := []int{}

    for len(queue) > 0 {
        node := queue[0]
        queue = queue[1:]
        order = append(order, node)

        for _, next := range graph[node] {
            if visited[next] {
                continue
            }
            visited[next] = true
            queue = append(queue, next)
        }
    }

    return order
}
```

## 为什么 BFS 要在“入队时”标记

因为同一个点可能被多个前驱同时发现。  
如果你等到出队时才标记，这个点可能会被重复入队很多次。

所以标准写法是：

- 发现它
- 立刻标记
- 再入队

## Go 代码：无权图最短路

```go
func BFSDistance(graph [][]int, start int) []int {
    dist := make([]int, len(graph))
    for i := range dist {
        dist[i] = -1
    }

    dist[start] = 0
    queue := []int{start}

    for len(queue) > 0 {
        node := queue[0]
        queue = queue[1:]

        for _, next := range graph[node] {
            if dist[next] != -1 {
                continue
            }
            dist[next] = dist[node] + 1
            queue = append(queue, next)
        }
    }

    return dist
}
```

## 为什么无权图最短路优先想 BFS

因为每走一条边代价都一样。  
所以：

- 第一次到达某个点
- 就一定是用最少边数到达它

这正是 BFS 的层次性质。

## 常见题型

- 连通块 / 岛屿数量
- 所有路径枚举
- 拓扑之外的一般图遍历
- 无权图最短路
- 网格最少步数

## 一句话判断

- 问“能不能到”“这一整块有多大”“所有方案是什么”，优先怀疑 DFS。
- 问“最少几步”“最短距离”“按层统计”，优先怀疑 BFS。

## 易错点

> [!warning] DFS / BFS 最容易错的地方
> - 图题一定要考虑环，不能照搬树遍历习惯。
> - BFS 求最短路时，访问标记要在入队时做。
> - 图不一定联通，要求“全图遍历”时要从每个未访问点重新启动一次搜索。
> - DFS 里的 `visited` 是否回溯，要看题目是不是允许重复走点。

## 复杂度

| 算法 | 时间复杂度 | 空间复杂度 |
|---|---:|---:|
| DFS | `O(V + E)` | `O(V)` |
| BFS | `O(V + E)` | `O(V)` |

## 相关主题

- [[../最短路径/单源最短路径|单源最短路径]]
- [[../../搜索算法/广度优先搜索/BFS基础模板|BFS基础模板]]
- [[../../搜索算法/深度优先搜索/DFS基础模板|DFS基础模板]]

---
返回：[[../_index|图算法]]
