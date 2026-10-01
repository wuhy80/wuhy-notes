---
title: "0-1 BFS"
aliases:
  - Zero-One BFS
  - 01 BFS
tags:
  - 算法
  - 算法/图论
  - 算法/最短路径
difficulty: medium
created: 2026-08-08
updated: 2026-08-09
status: active
---

# 0-1 BFS

> [!summary] 一句话说明
> 当边权只有 `0` 和 `1` 时，不必上堆，直接用双端队列：`0` 权边进队头，`1` 权边进队尾。

## 为什么普通 BFS 不够

普通 BFS 隐含一个前提：

```text
每走一条边，代价都一样
```

但一旦图里出现 `0` 权边，就会出现这种情况：

- 多走一条边
- 距离却没有增加

这时“层数”不再等于“最短距离”，普通 BFS 就不成立了。

## 为什么 Dijkstra 又显得有点重

当然可以用 Dijkstra。  
但如果边权只有 `0/1`，最小堆这套就有点浪费了。

因为这时新状态的距离只可能是两种：

- 和当前距离相同
- 比当前距离大 `1`

既然只会差这么一点，就可以直接用双端队列维持顺序。

## 你只要记住一个规则

- 走 `0` 权边：放队头
- 走 `1` 权边：放队尾

这件事背后的含义是：

- `0` 权边不会让距离变大，应该尽快处理
- `1` 权边会让距离加一，可以往后排

## Go 代码：标准模板

```go
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

type Edge struct {
    To     int
    Weight int
}
```

## 这个模板真正维护的是什么

不是“严格有序堆”，而是一个近似按距离递增排列的双端队列。

因为每次松弛成功后：

- 新点要么和当前点同距离
- 要么只多 `1`

所以只需要在两端插入，就足够维持正确的扩展顺序。

## 一个小例子

```text
S --0--> A --0--> T
 \      \
  \--1--> B --1--> T
```

从 `S` 出发：

- 到 `A` 的距离是 `0`，应立刻优先扩展
- 到 `B` 的距离是 `1`，排在后面

这正对应：

- `A` 入队头
- `B` 入队尾

## 什么时候要立刻想到 0-1 BFS

- 题目边权只有 `0/1`
- 网格里“转向代价是 1，直走代价是 0”
- “破墙代价 1，不破墙代价 0”
- “某种操作免费，另一种操作花费 1”

如果边权不止 `0/1`，就不要硬套它，直接回到 [[../最短路径/Dijkstra算法|Dijkstra]] 或其他最短路算法。

## 易错点

> [!warning] 0-1 BFS 最容易错的地方
> - 它只适用于边权为 `0` 或 `1` 的图。
> - 只有松弛成功时才需要重新入队。
> - `0` 权边放队头、`1` 权边放队尾，顺序写反会直接错。

## 复杂度

| 指标 | 复杂度 |
|---|---:|
| 时间复杂度 | `O(V + E)` |
| 空间复杂度 | `O(V)` |

## 相关主题

- [[../最短路径/单源最短路径|单源最短路径]]
- [[../最短路径/Dijkstra算法|Dijkstra算法]]
- [[../图的遍历/DFS与BFS|DFS 与 BFS]]

---
返回：[[../_index|图算法]] | [[../../算法学习导航|算法学习导航]]
