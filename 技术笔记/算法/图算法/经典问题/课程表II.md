---
title: "课程表 II"
aliases: ["Course Schedule II", "LeetCode 210"]
tags:
  - 算法
  - 算法/图论
  - LeetCode
difficulty: medium
created: 2025-01-11
updated: 2026-08-09
---

# 课程表 II

> [!summary] 课程表 II 和课程表 I 的区别只有一句：前者不只问“有没有环”，还要求你真的构造出一条合法拓扑序。

## 问题描述

**LeetCode 210 - 课程表 II**

现在你总共有n门课需要选，记为0到n-1。给定课程总数和先修课程列表，返回你为了学完所有课程所安排的学习顺序。如果不可能完成所有课程，返回空数组。

```
输入: numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]]
输出: [0,1,2,3] 或 [0,2,1,3]

输入: numCourses = 2, prerequisites = [[1,0],[0,1]]
输出: []
说明: 存在循环依赖
```

## 解题思路

- **拓扑排序**：返回拓扑序列
- **Kahn算法**：BFS实现
- **DFS算法**：后序遍历逆序
- **环检测**：如果有环返回空数组

## 为什么直接返回队列弹出顺序就行

Kahn 算法每次取出的都是当前入度为 `0` 的课程，也就是“前置条件已经满足”的课程。  
所以只要整个过程能顺利弹完所有课程，这个弹出顺序本身就是一条合法学习顺序。

## Go 代码

### Go 实现

```go
func findOrder(numCourses int, prerequisites [][]int) []int {
    graph := make([][]int, numCourses)
    inDegree := make([]int, numCourses)

    for _, prereq := range prerequisites {
        course, pre := prereq[0], prereq[1]
        graph[pre] = append(graph[pre], course)
        inDegree[course]++
    }

    queue := []int{}
    for i := 0; i < numCourses; i++ {
        if inDegree[i] == 0 {
            queue = append(queue, i)
        }
    }

    result := []int{}
    for len(queue) > 0 {
        node := queue[0]
        queue = queue[1:]
        result = append(result, node)

        for _, neighbor := range graph[node] {
            inDegree[neighbor]--
            if inDegree[neighbor] == 0 {
                queue = append(queue, neighbor)
            }
        }
    }

    if len(result) != numCourses {
        return []int{}
    }
    return result
}
```

## 易错点

> [!warning] 课程表 II 最容易错的是把“判环”和“构造答案”拆开写得不一致。

- 边方向仍然是 `pre -> course`。
- 只有入度变成 `0` 才能入队。
- 最后如果结果长度小于课程总数，必须返回空数组。
- 题目允许多种正确顺序，不要误以为答案唯一。

## 复杂度分析

| 指标 | 复杂度 | 说明 |
|------|--------|------|
| 时间复杂度 | O(V+E) | V是课程数，E是依赖关系数 |
| 空间复杂度 | O(V+E) | 图和队列 |

## 相关主题

- [[../拓扑排序/Kahn算法|Kahn算法]] - Kahn算法实现
- [[../拓扑排序/DFS拓扑排序|DFS拓扑排序]] - DFS实现
- [[课程表|课程表]] - 相关问题
- [[../_index|图算法]] - 返回图算法总览

---
返回：[[../_index|图算法]] | [[../../算法学习导航|算法学习导航]]
