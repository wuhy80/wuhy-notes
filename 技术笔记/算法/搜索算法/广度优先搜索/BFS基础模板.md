---
title: "BFS基础模板"
aliases: ["Breadth-First Search", "广度优先搜索模板"]
tags:
  - 算法
  - 算法/搜索
  - 算法/搜索/BFS
difficulty: easy
created: 2025-01-11
updated: 2026-08-09
---

# BFS基础模板

> [!summary] BFS 的核心不是“用队列”，而是按层扩散，所以它天然适合求无权图最短步数和层序信息。

## 算法原理

广度优先搜索（Breadth-First Search, BFS）是一种**逐层扩散**的搜索策略。

### 核心思想
- 先访问离起点近的节点
- 按照距离由近到远的顺序访问
- 使用**队列**（FIFO）实现

### 关键特性
- **找到的第一条路径一定是最短路径**
- 适合求最少步数、最短距离等问题

### 时间复杂度
- O(V + E)，V为顶点数，E为边数

### 空间复杂度
- O(w)，w为最大宽度

## 动画演示

![[附件/算法可视化/bfs-layer-traversal.gif]]

> [!note] 看动画时重点盯住两件事
> 1. 队列里存的是“下一批将被扩展的节点”。
> 2. 节点第一次出现在搜索中时，它到起点的距离就已经确定了。

## 基础模板

### 模板1：标准BFS

```go
func bfs(start int, graph map[int][]int) map[int]bool {
    queue := []int{start}
    visited := map[int]bool{start: true}

    for head := 0; head < len(queue); head++ {
        node := queue[head]
        process(node)

        for _, neighbor := range graph[node] {
            if visited[neighbor] {
                continue
            }
            visited[neighbor] = true
            queue = append(queue, neighbor)
        }
    }

    return visited
}
```

### 模板2：层序遍历（记录层数）

```go
func bfsLevelOrder(start int, graph map[int][]int) int {
    queue := []int{start}
    visited := map[int]bool{start: true}
    level := 0

    for head := 0; head < len(queue); {
        size := len(queue) - head
        for i := 0; i < size; i++ {
            node := queue[head]
            head++
            processWithLevel(node, level)

            for _, neighbor := range graph[node] {
                if visited[neighbor] {
                    continue
                }
                visited[neighbor] = true
                queue = append(queue, neighbor)
            }
        }
        level++
    }

    return level
}
```

### 模板3：求最短路径

```go
func bfsShortestPath(start, end int, graph map[int][]int) int {
    if start == end {
        return 0
    }

    queue := []int{start}
    visited := map[int]bool{start: true}
    distance := 0

    for head := 0; head < len(queue); {
        size := len(queue) - head
        for i := 0; i < size; i++ {
            node := queue[head]
            head++
            if node == end {
                return distance
            }

            for _, neighbor := range graph[node] {
                if visited[neighbor] {
                    continue
                }
                visited[neighbor] = true
                queue = append(queue, neighbor)
            }
        }
        distance++
    }

    return -1
}
```

### 模板4：多源BFS

```go
func multiSourceBFS(sources []int, graph map[int][]int) int {
    queue := append([]int(nil), sources...)
    visited := make(map[int]bool, len(sources))
    for _, source := range sources {
        visited[source] = true
    }

    distance := 0
    for head := 0; head < len(queue); {
        size := len(queue) - head
        for i := 0; i < size; i++ {
            node := queue[head]
            head++

            for _, neighbor := range graph[node] {
                if visited[neighbor] {
                    continue
                }
                visited[neighbor] = true
                queue = append(queue, neighbor)
            }
        }
        distance++
    }

    return distance
}
```

## 为什么 BFS 第一次到达就是最短

因为它是一层一层往外扩：

- 第 0 层是起点自己。
- 第 1 层是一步能到的点。
- 第 2 层是两步能到的点。
- 以此类推。

所以某个节点第一次被访问到时，走到它的步数一定最少。

## 算法演示

对如下图进行 BFS 遍历：

```
    1
   / \
  2   3
 / \   \
4   5   6
```

### BFS访问顺序
```
层0: 1
层1: 2, 3
层2: 4, 5, 6

访问顺序：1 → 2 → 3 → 4 → 5 → 6
```

### 队列变化过程
```
初始：queue = [1]
步骤1：pop(1), 访问1, push(2,3)  → queue = [2, 3]
步骤2：pop(2), 访问2, push(4,5)  → queue = [3, 4, 5]
步骤3：pop(3), 访问3, push(6)    → queue = [4, 5, 6]
步骤4：pop(4), 访问4             → queue = [5, 6]
步骤5：pop(5), 访问5             → queue = [6]
步骤6：pop(6), 访问6             → queue = []
```

## BFS vs DFS

| 特性 | BFS | DFS |
|------|-----|-----|
| 数据结构 | 队列（Queue） | 栈（Stack）或递归 |
| 访问顺序 | 按层次（横向） | 按深度（纵向） |
| 空间复杂度 | O(w) 最大宽度 | O(h) 树高 |
| 找到路径 | 一定是最短 | 不一定最短 |
| 适用场景 | 最短路径、层次遍历 | 路径存在性、拓扑排序 |

```
BFS:                          DFS:
    1                             1
   / \                           / \
  2   3      访问顺序:          2   3      访问顺序:
 / \   \     1→2→3→4→5→6       / \   \     1→2→4→5→3→6
4   5   6                      4   5   6
```

## 易错点

> [!warning] BFS 最常见的 bug 不在模板本身，而在 visited 标记时机和层数统计。

- `visited` 最稳的写法是入队时标记，而不是出队时标记。
- 求最短步数时，层数通常按“当前层节点数”来推进。
- 网格题里状态不一定只有坐标，可能还要带钥匙、方向、剩余次数等信息。
- 如果边权不是全 1，就不能直接套普通 BFS。

## 经典应用

### 1. 二叉树层序遍历（LeetCode 102）

```go
func levelOrder(root *TreeNode) [][]int {
    if root == nil {
        return nil
    }

    result := make([][]int, 0)
    queue := []*TreeNode{root}

    for head := 0; head < len(queue); {
        size := len(queue) - head
        levelVals := make([]int, 0, size)
        for i := 0; i < size; i++ {
            node := queue[head]
            head++
            levelVals = append(levelVals, node.Val)

            if node.Left != nil {
                queue = append(queue, node.Left)
            }
            if node.Right != nil {
                queue = append(queue, node.Right)
            }
        }
        result = append(result, levelVals)
    }

    return result
}
```

### 2. 打开转盘锁（LeetCode 752）

```go
func openLock(deadends []string, target string) int {
    dead := make(map[string]bool, len(deadends))
    for _, state := range deadends {
        dead[state] = true
    }
    if dead["0000"] {
        return -1
    }

    queue := []string{"0000"}
    visited := map[string]bool{"0000": true}
    steps := 0

    for head := 0; head < len(queue); {
        size := len(queue) - head
        for i := 0; i < size; i++ {
            state := queue[head]
            head++
            if state == target {
                return steps
            }

            for pos := 0; pos < 4; pos++ {
                for _, delta := range []int{-1, 1} {
                    bytes := []byte(state)
                    digit := int(bytes[pos]-'0')
                    digit = (digit + delta + 10) % 10
                    bytes[pos] = byte(digit) + '0'
                    next := string(bytes)

                    if !visited[next] && !dead[next] {
                        visited[next] = true
                        queue = append(queue, next)
                    }
                }
            }
        }
        steps++
    }

    return -1
}
```

### 3. 腐烂的橘子（LeetCode 994）

```go
func orangesRotting(grid [][]int) int {
    m, n := len(grid), len(grid[0])
    type Point struct{ I, J int }
    queue := make([]Point, 0)
    fresh := 0

    for i := 0; i < m; i++ {
        for j := 0; j < n; j++ {
            if grid[i][j] == 2 {
                queue = append(queue, Point{i, j})
            } else if grid[i][j] == 1 {
                fresh++
            }
        }
    }
    if fresh == 0 {
        return 0
    }

    minutes := 0
    directions := [][2]int{{0, 1}, {0, -1}, {1, 0}, {-1, 0}}

    for head := 0; head < len(queue); {
        size := len(queue) - head
        for i := 0; i < size; i++ {
            point := queue[head]
            head++

            for _, d := range directions {
                ni, nj := point.I+d[0], point.J+d[1]
                if ni >= 0 && ni < m && nj >= 0 && nj < n && grid[ni][nj] == 1 {
                    grid[ni][nj] = 2
                    fresh--
                    queue = append(queue, Point{ni, nj})
                }
            }
        }
        minutes++
    }

    if fresh == 0 {
        return minutes - 1
    }
    return -1
}
```

## 实现技巧

### 1. visited集合的位置

```go
// 推荐：入队时标记（避免重复入队）
if !visited[neighbor] {
    visited[neighbor] = true
    queue = append(queue, neighbor)
}

// 不推荐：出队时标记（可能重复入队）
node := queue[head]
if !visited[node] {
    visited[node] = true
}
```

### 2. 网格的BFS

```go
func bfsGrid(grid [][]int, startI, startJ int) {
    m, n := len(grid), len(grid[0])
    type Point struct{ I, J int }
    queue := []Point{{startI, startJ}}
    visited := map[Point]bool{{startI, startJ}: true}
    directions := [][2]int{{0, 1}, {0, -1}, {1, 0}, {-1, 0}}

    for head := 0; head < len(queue); head++ {
        point := queue[head]
        for _, d := range directions {
            ni, nj := point.I+d[0], point.J+d[1]
            next := Point{ni, nj}
            if ni >= 0 && ni < m && nj >= 0 && nj < n &&
                !visited[next] && grid[ni][nj] == 1 {
                visited[next] = true
                queue = append(queue, next)
            }
        }
    }
}
```

## 相关主题

- [[../../图算法/经典问题/最短路径|最短路径问题]] - BFS求最短路径
- [[../深度优先搜索/DFS基础模板|DFS基础模板]] - 深度优先搜索对比

---
返回：[[../_index|搜索算法]]
