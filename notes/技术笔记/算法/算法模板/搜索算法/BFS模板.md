---
title: "BFS模板"
aliases:
  - Breadth-First Search Template
  - 广度优先搜索模板
tags:
  - 算法
  - 算法/模板
  - 算法/搜索
difficulty: easy
created: 2026-08-08
updated: 2026-08-09
status: active
---

# BFS 模板

> [!summary] 一句话说明
> BFS 用队列按距离从近到远扩展，所以在无权图里，第一次到达一个点时就是最短步数。

## 模板适用场景

- 无权图最短路
- 最少步数
- 多源扩散
- 按层遍历

如果边权不是统一的，就不要直接套这个模板。

## Go 模板：无权图最短路

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

## 为什么在入队时标记

这是 BFS 最重要的细节之一。

如果你等到出队时再标记，同一个点可能会被多个前驱反复入队。  
标准做法是：

- 一发现
- 就标记
- 立刻入队

## Go 模板：网格最短路

```go
type Point struct {
    Row int
    Col int
    Dis int
}

func ShortestGridPath(grid [][]int, startRow, startCol, targetRow, targetCol int) int {
    if len(grid) == 0 || len(grid[0]) == 0 {
        return -1
    }

    rows, cols := len(grid), len(grid[0])
    if grid[startRow][startCol] != 0 || grid[targetRow][targetCol] != 0 {
        return -1
    }

    visited := make([][]bool, rows)
    for i := range visited {
        visited[i] = make([]bool, cols)
    }

    dirs := [][2]int{{1, 0}, {-1, 0}, {0, 1}, {0, -1}}
    queue := []Point{{Row: startRow, Col: startCol, Dis: 0}}
    visited[startRow][startCol] = true

    for len(queue) > 0 {
        cur := queue[0]
        queue = queue[1:]

        if cur.Row == targetRow && cur.Col == targetCol {
            return cur.Dis
        }

        for _, d := range dirs {
            nr, nc := cur.Row+d[0], cur.Col+d[1]
            if nr < 0 || nr >= rows || nc < 0 || nc >= cols {
                continue
            }
            if visited[nr][nc] || grid[nr][nc] != 0 {
                continue
            }
            visited[nr][nc] = true
            queue = append(queue, Point{Row: nr, Col: nc, Dis: cur.Dis + 1})
        }
    }

    return -1
}
```

## 常见变形

- 多源 BFS：把所有起点一起以距离 `0` 入队
- 分层统计：每轮先记当前 `queue` 长度
- 需要恢复路径：额外维护 `parent`

## 易错点

> [!warning] BFS 模板最容易错的地方
> - 有权图不能直接套普通 BFS。
> - 访问标记要在入队时做。
> - 网格题本质上也是图题，只是邻居是隐式生成的。

## 相关主题

- [[../../搜索算法/广度优先搜索/BFS基础模板|BFS基础]]
- [[DFS模板]]
- [[../图算法/0-1 BFS模板|0-1 BFS]]

---
返回：[[../_index|算法模板]]
