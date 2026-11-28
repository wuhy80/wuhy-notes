---
title: "DFS基础模板"
aliases: ["Depth-First Search", "深度优先搜索模板"]
tags:
  - 算法
  - 算法/搜索
  - 算法/搜索/DFS
difficulty: easy
created: 2025-01-11
updated: 2026-08-09
---

# DFS基础模板

## 📌 算法原理

深度优先搜索（Depth-First Search, DFS）是一种**沿着一条路径走到底，再回溯**的搜索策略。

### 核心思想
- 尽可能深地搜索分支
- 遇到死路则回溯，探索其他分支
- 使用**栈**（或递归调用栈）实现

### 时间复杂度
- O(V + E)，V为顶点数，E为边数

### 空间复杂度
- O(h)，h为搜索深度（递归栈深度）

## 💻 递归实现

### 模板1：图/树的DFS

```go
func dfsRecursive(node int, graph map[int][]int, visited map[int]bool) {
    if visited[node] {
        return
    }

    visited[node] = true
    process(node)

    for _, neighbor := range graph[node] {
        dfsRecursive(neighbor, graph, visited)
    }
}
```

### 模板2：网格DFS（岛屿问题）

```go
func dfsGrid(grid [][]byte, i, j int, visited map[[2]int]bool) {
    if i < 0 || i >= len(grid) || j < 0 || j >= len(grid[0]) {
        return
    }

    key := [2]int{i, j}
    if visited[key] || grid[i][j] == '0' {
        return
    }

    visited[key] = true
    directions := [][2]int{{0, 1}, {1, 0}, {0, -1}, {-1, 0}}
    for _, d := range directions {
        dfsGrid(grid, i+d[0], j+d[1], visited)
    }
}
```

### 模板3：路径搜索DFS

```go
func dfsPath(node, target int, graph map[int][]int, path *[]int, visited map[int]bool) bool {
    if visited[node] {
        return false
    }

    visited[node] = true
    *path = append(*path, node)
    if node == target {
        return true
    }

    for _, neighbor := range graph[node] {
        if dfsPath(neighbor, target, graph, path, visited) {
            return true
        }
    }

    *path = (*path)[:len(*path)-1]
    return false
}
```

## 💻 迭代实现（显式栈）

```go
func dfsIterative(start int, graph map[int][]int) map[int]bool {
    stack := []int{start}
    visited := make(map[int]bool)

    for len(stack) > 0 {
        node := stack[len(stack)-1]
        stack = stack[:len(stack)-1]
        if visited[node] {
            continue
        }

        visited[node] = true
        process(node)

        neighbors := graph[node]
        for i := len(neighbors) - 1; i >= 0; i-- {
            if !visited[neighbors[i]] {
                stack = append(stack, neighbors[i])
            }
        }
    }

    return visited
}
```

## 🎯 算法演示

对如下图进行DFS遍历：

```
    1
   / \
  2   3
 / \   \
4   5   6
```

### 递归DFS访问顺序
```
1 → 2 → 4 → 5 → 3 → 6
```

### 过程详解
```
调用栈：                访问顺序：
dfs(1)                  访问1
  dfs(2)                访问2
    dfs(4)              访问4
    返回
    dfs(5)              访问5
    返回
  返回
  dfs(3)                访问3
    dfs(6)              访问6
    返回
  返回
返回
```

## 💡 DFS特点

### 优点
1. **空间效率高**：只需O(h)空间（h为深度）
2. **代码简洁**：递归实现非常优雅
3. **适合路径搜索**：天然记录路径

### 缺点
1. **找不到最短路径**：可能先找到较长路径
2. **可能栈溢出**：递归深度过大时
3. **可能陷入死循环**：需要标记visited

## 🔗 经典应用场景

### 1. 连通性判断
```go
func isConnected(graph map[int][]int, start, end int) bool {
    visited := make(map[int]bool)

    var dfs func(node int) bool
    dfs = func(node int) bool {
        if node == end {
            return true
        }
        visited[node] = true

        for _, neighbor := range graph[node] {
            if !visited[neighbor] && dfs(neighbor) {
                return true
            }
        }
        return false
    }

    return dfs(start)
}
```

### 2. 岛屿数量（LeetCode 200）
```go
func numIslands(grid [][]byte) int {
    if len(grid) == 0 {
        return 0
    }

    var dfs func(i, j int)
    dfs = func(i, j int) {
        if i < 0 || i >= len(grid) || j < 0 || j >= len(grid[0]) {
            return
        }
        if grid[i][j] == '0' {
            return
        }

        grid[i][j] = '0'
        dfs(i+1, j)
        dfs(i-1, j)
        dfs(i, j+1)
        dfs(i, j-1)
    }

    count := 0
    for i := 0; i < len(grid); i++ {
        for j := 0; j < len(grid[0]); j++ {
            if grid[i][j] == '1' {
                dfs(i, j)
                count++
            }
        }
    }

    return count
}
```

### 3. 路径总和（LeetCode 112）
```go
func hasPathSum(root *TreeNode, targetSum int) bool {
    if root == nil {
        return false
    }
    if root.Left == nil && root.Right == nil {
        return targetSum == root.Val
    }

    targetSum -= root.Val
    return hasPathSum(root.Left, targetSum) || hasPathSum(root.Right, targetSum)
}
```

## 📚 相关主题

- [[岛屿问题]] - DFS在网格中的应用
- [[拓扑排序]] - DFS检测环和拓扑排序
- [[../回溯算法/回溯框架|回溯算法]] - DFS + 撤销选择

---
返回：[[../_index|搜索算法]]
