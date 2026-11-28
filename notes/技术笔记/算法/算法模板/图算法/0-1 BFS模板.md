---
title: "0-1 BFS模板"
aliases:
  - Zero-One BFS Template
  - 01 BFS模板
tags:
  - 算法
  - 算法/模板
  - 算法/图论
  - 算法/最短路径
difficulty: medium
created: 2026-08-08
updated: 2026-08-09
status: active
---

# 0-1 BFS 模板

> [!summary] 一句话说明
> 当边权只可能是 `0` 或 `1` 时，直接用双端队列代替最小堆：`0` 权边进队头，`1` 权边进队尾。

## 模板适用场景

- 图的边权只有 `0/1`
- 网格里某种操作免费、另一种操作代价是 `1`
- 最少改向次数、最少破墙次数这类题

如果边权不止 `0/1`，就别硬套，回到 Dijkstra。

## Go 模板

```go
type Edge struct {
    To     int
    Weight int
}

func ZeroOneBFS(graph [][]Edge, start int) []int {
    const inf = int(1e18)

    dist := make([]int, len(graph))
    for i := range dist {
        dist[i] = inf
    }
    dist[start] = 0

    deque := []int{start}

    for len(deque) > 0 {
        node := deque[0]
        deque = deque[1:]

        for _, e := range graph[node] {
            candidate := dist[node] + e.Weight
            if candidate >= dist[e.To] {
                continue
            }

            dist[e.To] = candidate
            if e.Weight == 0 {
                deque = append([]int{e.To}, deque...)
            } else {
                deque = append(deque, e.To)
            }
        }
    }

    return dist
}
```

## 这个模板真正维护的是什么

它不是严格意义上的优先队列，而是在维护一个“距离几乎有序”的队列：

- `0` 权边产生的新状态，距离不变，必须立刻优先处理
- `1` 权边产生的新状态，距离多 `1`，可以放到后面

这就是为什么双端队列足够。

## 易错点

> [!warning] 0-1 BFS 模板最容易错的地方
> - 只有松弛成功时才重新入队。
> - `0` 权边必须进队头，`1` 权边必须进队尾。
> - 模板只适用于边权恰好属于 `{0,1}`。

## 复杂度

| 指标 | 复杂度 |
|---|---:|
| 时间复杂度 | `O(V + E)` |
| 空间复杂度 | `O(V)` |

## 相关主题

- [[../../图算法/高级专题/0-1 BFS|0-1 BFS]]
- [[../../图算法/最短路径/单源最短路径|单源最短路径]]

---
返回：[[../_index|算法模板]]
