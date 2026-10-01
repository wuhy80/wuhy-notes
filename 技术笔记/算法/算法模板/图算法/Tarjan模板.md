---
title: "Tarjan模板"
aliases:
  - Tarjan Template
  - 强连通分量模板
  - 割点与桥模板
tags:
  - 算法
  - 算法/模板
  - 算法/图论
difficulty: hard
created: 2026-08-08
updated: 2026-08-09
status: active
---

# Tarjan 模板

> [!summary] 一句话说明
> Tarjan 的核心只有两个数组：`dfn` 记录首次访问时间，`low` 记录最早能回到的祖先时间。

## 先记两个定义

- `dfn[u]`：节点 `u` 第一次被 DFS 访问到的时间戳
- `low[u]`：从 `u` 出发，沿 DFS 树边向下，再加最多一条返祖边，最早能回到哪个时间戳

这两个量是整套模板的核心。

## Go 模板：强连通分量

```go
func TarjanSCC(graph [][]int) [][]int {
    n := len(graph)
    dfn := make([]int, n)
    low := make([]int, n)
    inStack := make([]bool, n)
    for i := range dfn {
        dfn[i] = -1
        low[i] = -1
    }

    stack := []int{}
    timestamp := 0
    sccs := [][]int{}

    var dfs func(u int)
    dfs = func(u int) {
        dfn[u] = timestamp
        low[u] = timestamp
        timestamp++

        stack = append(stack, u)
        inStack[u] = true

        for _, v := range graph[u] {
            if dfn[v] == -1 {
                dfs(v)
                low[u] = min(low[u], low[v])
            } else if inStack[v] {
                low[u] = min(low[u], dfn[v])
            }
        }

        if dfn[u] == low[u] {
            component := []int{}
            for {
                x := stack[len(stack)-1]
                stack = stack[:len(stack)-1]
                inStack[x] = false
                component = append(component, x)
                if x == u {
                    break
                }
            }
            sccs = append(sccs, component)
        }
    }

    for i := 0; i < n; i++ {
        if dfn[i] == -1 {
            dfs(i)
        }
    }

    return sccs
}

func min(a, b int) int {
    if a < b {
        return a
    }
    return b
}
```

## 为什么 `inStack` 不能省

因为 Tarjan 只允许用“当前递归栈里仍未结案的点”去更新 `low`。  
已经弹出栈的点，所属 SCC 已经确定，不能再作为当前回溯目标。

## Go 模板：无向图桥

```go
func FindBridges(n int, edges [][2]int) [][2]int {
    graph := make([][][2]int, n)
    for id, e := range edges {
        u, v := e[0], e[1]
        graph[u] = append(graph[u], [2]int{v, id})
        graph[v] = append(graph[v], [2]int{u, id})
    }

    dfn := make([]int, n)
    low := make([]int, n)
    for i := range dfn {
        dfn[i] = -1
    }

    timestamp := 0
    bridges := [][2]int{}

    var dfs func(u, parentEdge int)
    dfs = func(u, parentEdge int) {
        dfn[u] = timestamp
        low[u] = timestamp
        timestamp++

        for _, item := range graph[u] {
            v, edgeID := item[0], item[1]
            if edgeID == parentEdge {
                continue
            }

            if dfn[v] == -1 {
                dfs(v, edgeID)
                low[u] = min(low[u], low[v])
                if low[v] > dfn[u] {
                    bridges = append(bridges, [2]int{u, v})
                }
            } else {
                low[u] = min(low[u], dfn[v])
            }
        }
    }

    for i := 0; i < n; i++ {
        if dfn[i] == -1 {
            dfs(i, -1)
        }
    }

    return bridges
}
```

## 易错点

> [!warning] Tarjan 模板最容易错的地方
> - SCC 模板里，返祖边更新用的是 `dfn[v]`，不是 `low[v]`。
> - 桥条件是 `low[v] > dfn[u]`，不要写成 `>=`。
> - 根节点、返祖边、是否仍在栈中，这三个判断很容易混。

## 复杂度

| 应用 | 时间复杂度 | 空间复杂度 |
|---|---:|---:|
| SCC | `O(V + E)` | `O(V)` |
| 桥 / 割点 | `O(V + E)` | `O(V)` |

## 相关主题

- [[../../图算法/连通性问题/强连通分量|强连通分量]]
- [[../../图算法/图的遍历/DFS与BFS|DFS与BFS]]

---
返回：[[../_index|算法模板]]
