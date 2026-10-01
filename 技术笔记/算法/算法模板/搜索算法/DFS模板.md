---
title: "DFS模板"
aliases:
  - Depth-First Search Template
  - 深度优先搜索模板
tags:
  - 算法
  - 算法/模板
  - 算法/搜索
difficulty: easy
created: 2026-08-08
updated: 2026-08-09
status: active
---

# DFS 模板

> [!summary] 一句话说明
> DFS 沿着一条路尽量走到底，走不动再回退，所以它天然适合递归、回溯和连通块搜索。

## 模板适用场景

- 图遍历
- 连通块染色
- 岛屿问题
- 需要深入一条路径到底

如果题目要求最少步数，优先想 BFS，不要本能套 DFS。

## Go 模板：递归 DFS

```go
func DFSRecursive(graph [][]int, start int) []int {
    visited := make([]bool, len(graph))
    order := []int{}

    var dfs func(node int)
    dfs = func(node int) {
        if visited[node] {
            return
        }

        visited[node] = true
        order = append(order, node)

        for _, next := range graph[node] {
            dfs(next)
        }
    }

    dfs(start)
    return order
}
```

## Go 模板：栈实现 DFS

```go
func DFSIterative(graph [][]int, start int) []int {
    visited := make([]bool, len(graph))
    order := []int{}
    stack := []int{start}

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

## 什么时候优先改成迭代

如果图或树的深度可能达到 `10^5` 量级，递归栈就有风险。  
这时显式栈版本更稳。

## Go 模板：网格 DFS 染色

```go
func FloodFill(grid [][]byte, row, col int) {
    rows, cols := len(grid), len(grid[0])
    dirs := [][2]int{{1, 0}, {-1, 0}, {0, 1}, {0, -1}}

    var dfs func(r, c int)
    dfs = func(r, c int) {
        if r < 0 || r >= rows || c < 0 || c >= cols {
            return
        }
        if grid[r][c] != '1' {
            return
        }

        grid[r][c] = '0'
        for _, d := range dirs {
            dfs(r+d[0], c+d[1])
        }
    }

    dfs(row, col)
}
```

## 易错点

> [!warning] DFS 模板最容易错的地方
> - 图有环时必须维护 `visited`。
> - 无向图如果不想单独写 `visited`，也至少要避免走回父节点。
> - 递归写法在深图上可能爆栈，别忽略数据范围。

## 相关主题

- [[../../搜索算法/深度优先搜索/DFS基础模板|DFS基础]]
- [[BFS模板]]
- [[回溯模板]]

---
返回：[[../_index|算法模板]]
