---
title: "A*搜索"
aliases: ["A-Star Search", "A星算法"]
tags:
  - 算法
  - 算法/搜索
  - 算法/搜索/启发式搜索
difficulty: hard
created: 2025-01-11
updated: 2026-08-09
---

# A*搜索

> [!summary] 一句话说明
> A* 的本质是“带方向感的 Dijkstra”：不仅看已经走了多远，还看离目标大概还剩多远。

## 核心公式

```text
f(n) = g(n) + h(n)
```

- `g(n)`：起点到当前节点的真实代价
- `h(n)`：当前节点到终点的启发式估计
- `f(n)`：这个节点“看起来最值得先扩展”的综合评分

## 为什么 A* 比 BFS / Dijkstra 更快

```text
BFS:       不知道目标在哪，均匀往外扩
Dijkstra:  只按真实代价扩，不关心目标方向
A*:        既看已付出的代价，也看离目标还有多远
```

只要 `h(n)` 设计得合理，A* 就会明显减少无效扩展。

## 启发式函数怎么选

### 曼哈顿距离

适合网格里只能上下左右走：

```go
func manhattanDistance(x1, y1, x2, y2 int) int {
    return abs(x1-x2) + abs(y1-y2)
}
```

### 欧几里得距离

适合可以朝任意方向移动：

```go
func euclideanDistance(x1, y1, x2, y2 int) float64 {
    dx := float64(x1 - x2)
    dy := float64(y1 - y2)
    return math.Sqrt(dx*dx + dy*dy)
}
```

### 切比雪夫距离

适合允许对角线移动：

```go
func chebyshevDistance(x1, y1, x2, y2 int) int {
    dx := abs(x1 - x2)
    dy := abs(y1 - y2)
    if dx > dy {
        return dx
    }
    return dy
}
```

> [!note] 可接受性
> 启发式函数不能高估真实最短距离。高估后，A* 可能跑得快，但不再保证最优解。

## Go 模板

下面用网格最短路解释 A* 的骨架。为了把重点放在算法结构上，最小堆细节用 `PriorityQueue` 抽象表示。

```go
type Point struct {
    X int
    Y int
}

type State struct {
    Point Point
    G     int
    F     int
}

func aStar(start, goal Point, grid [][]int) int {
    pq := NewPriorityQueue()
    pq.Push(State{
        Point: start,
        G:     0,
        F:     heuristic(start, goal),
    })

    gScore := map[Point]int{start: 0}
    visited := make(map[Point]bool)
    directions := [][2]int{{0, 1}, {0, -1}, {1, 0}, {-1, 0}}

    for pq.Len() > 0 {
        current := pq.Pop()
        point := current.Point

        if visited[point] {
            continue
        }
        visited[point] = true

        if point == goal {
            return current.G
        }

        for _, d := range directions {
            next := Point{point.X + d[0], point.Y + d[1]}
            if !inArea(next, grid) || blocked(next, grid) {
                continue
            }

            tentativeG := current.G + 1
            oldG, ok := gScore[next]
            if !ok || tentativeG < oldG {
                gScore[next] = tentativeG
                pq.Push(State{
                    Point: next,
                    G:     tentativeG,
                    F:     tentativeG + heuristic(next, goal),
                })
            }
        }
    }

    return -1
}

func heuristic(a, b Point) int {
    return abs(a.X-b.X) + abs(a.Y-b.Y)
}
```

## 例题：二进制矩阵中的最短路径

如果允许八方向移动，就把启发函数改成更适合八连通的估计，比如切比雪夫距离。

```go
func shortestPathBinaryMatrix(grid [][]int) int {
    n := len(grid)
    if grid[0][0] == 1 || grid[n-1][n-1] == 1 {
        return -1
    }

    start := Point{0, 0}
    goal := Point{n - 1, n - 1}
    directions := [][2]int{
        {0, 1}, {0, -1}, {1, 0}, {-1, 0},
        {1, 1}, {1, -1}, {-1, 1}, {-1, -1},
    }

    pq := NewPriorityQueue()
    pq.Push(State{Point: start, G: 1, F: 1 + heuristic8(start, goal)})
    best := map[Point]int{start: 1}

    for pq.Len() > 0 {
        current := pq.Pop()
        if current.Point == goal {
            return current.G
        }
        if current.G > best[current.Point] {
            continue
        }

        for _, d := range directions {
            next := Point{current.Point.X + d[0], current.Point.Y + d[1]}
            if next.X < 0 || next.X >= n || next.Y < 0 || next.Y >= n || grid[next.X][next.Y] == 1 {
                continue
            }

            nextG := current.G + 1
            old, ok := best[next]
            if !ok || nextG < old {
                best[next] = nextG
                pq.Push(State{
                    Point: next,
                    G:     nextG,
                    F:     nextG + heuristic8(next, goal),
                })
            }
        }
    }

    return -1
}

func heuristic8(a, b Point) int {
    dx := abs(a.X - b.X)
    dy := abs(a.Y - b.Y)
    if dx > dy {
        return dx
    }
    return dy
}
```

## 和 Dijkstra 的关系

如果把 `h(n)` 恒等于 `0`：

```text
f(n) = g(n)
```

这时 A* 就退化成 Dijkstra。

所以你可以把 A* 看成：

- `Dijkstra + 启发式方向感`

## 什么时候值得用 A*

- 终点明确，且只关心单点到单点最短路。
- 状态空间很大，普通 BFS / Dijkstra 扩展太散。
- 能设计一个“便宜且不高估”的启发函数。

## 不适合的情况

- 根本没有明确终点。
- 难以设计靠谱的启发函数。
- 需要求全源最短路或大量终点。

## 易错点

- 启发函数高估真实距离，会破坏最优性。
- 使用最小堆时，堆里可能有过期状态，出堆后要做剪枝。
- `visited` 不能太早打，很多题更稳妥的做法是以 `gScore` 为准判断是否过期。
- 不同移动规则对应不同启发函数，不要把曼哈顿距离硬套到允许斜走的题目里。

## 相关主题

- [[../广度优先搜索/BFS基础模板|BFS基础模板]]
- [[双向BFS]]
- [[../../图算法/最短路径/Dijkstra算法|Dijkstra算法]]

---
返回：[[../_index|搜索算法]]
