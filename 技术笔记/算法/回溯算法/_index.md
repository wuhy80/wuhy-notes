---
title: "回溯算法"
aliases: [Backtracking]
tags:
  - 算法
  - 算法/回溯
created: 2025-01-11
updated: 2026-08-09
type: index
---

# 回溯算法

> [!summary] 回溯就是在一棵决策树上做 DFS，边走边试，发现不合法或不值得继续时立刻回头。

## 核心思路

做回溯题时，不要上来就想代码，先把三件事想清楚：

1. 路径里现在装的是什么。
2. 每一层有哪些选择。
3. 什么情况下可以停。

所谓回溯，本质上就是这套固定动作：

1. 做选择。
2. 递归进入下一层。
3. 撤销选择。

如果你能把这三步稳定写出来，剩下无非就是加 `used`、加 `start`、加剪枝。

## 回溯题的三种基本形态

### 排列

- 顺序重要。
- 通常使用 `used[]` 防止一个元素重复使用。
- 代表题：[[全排列|全排列]]

### 组合 / 子集

- 顺序不重要。
- 通常使用 `start` 控制下一层从哪里开始枚举。
- 代表题：[[组合问题|组合问题]]、[[子集问题|子集问题]]

### 棋盘 / 路径搜索

- 每一步要先判断当前位置是否合法。
- 常配合访问标记、方向数组、约束检查。
- 代表题：[[N皇后|N 皇后]]、[[解数独|解数独]]、[[单词搜索|单词搜索]]

## 通用 Go 模板

```go
func backtrack(nums []int) [][]int {
	res := [][]int{}
	path := []int{}

	var dfs func(start int)
	dfs = func(start int) {
		// 这里根据题意决定何时收集答案
		res = append(res, append([]int{}, path...))

		for i := start; i < len(nums); i++ {
			path = append(path, nums[i])
			dfs(i + 1)
			path = path[:len(path)-1]
		}
	}

	dfs(0)
	return res
}
```

这个模板最适合子集 / 组合类问题。真正写题时，重点不是背模板，而是明确：

- 结果是在前序位置收集，还是叶子位置收集。
- 下一层是 `i+1`、`i`，还是从 `0` 重新开始。

## 两个高频变体

### 全排列

```go
func permute(nums []int) [][]int {
	res := [][]int{}
	path := make([]int, 0, len(nums))
	used := make([]bool, len(nums))

	var dfs func()
	dfs = func() {
		if len(path) == len(nums) {
			res = append(res, append([]int{}, path...))
			return
		}

		for i := 0; i < len(nums); i++ {
			if used[i] {
				continue
			}
			used[i] = true
			path = append(path, nums[i])
			dfs()
			path = path[:len(path)-1]
			used[i] = false
		}
	}

	dfs()
	return res
}
```

### 组合总和式剪枝

```go
import "sort"

func combinationSum(candidates []int, target int) [][]int {
	sort.Ints(candidates)
	res := [][]int{}
	path := []int{}

	var dfs func(start, sum int)
	dfs = func(start, sum int) {
		if sum == target {
			res = append(res, append([]int{}, path...))
			return
		}

		for i := start; i < len(candidates); i++ {
			next := sum + candidates[i]
			if next > target {
				break
			}
			path = append(path, candidates[i])
			dfs(i, next)
			path = path[:len(path)-1]
		}
	}

	dfs(0, 0)
	return res
}
```

这里最关键的优化就是“先排序，再剪枝”，否则搜索树会大很多。

## 易错点

> [!warning] 回溯题大多数 bug 都不是算法错了，而是状态没恢复干净。

- `path` 加了元素之后，递归回来一定要弹出。
- `used[i] = true` 之后，回溯回来一定要复原。
- 组合题和排列题不要混用 `start` 与 `used`。
- 去重题要分清“树枝去重”和“树层去重”。
- 收集答案时要拷贝当前路径，不能直接把 `path` 引用塞进结果。

## 学习顺序

1. 先做 [[子集问题|子集]]，理解“每个节点都可收集答案”。
2. 再做 [[组合问题|组合]]，理解 `start` 的作用。
3. 再做 [[全排列|全排列]]，理解 `used` 的作用。
4. 最后做 [[N皇后|N 皇后]]、[[解数独|数独]] 这类强剪枝题。

## 相关主题

- [[../分治算法/_index|分治算法]]
- [[../动态规划/_index|动态规划]]
- [[../搜索算法/深度优先搜索/DFS基础模板|深度优先搜索]]
- [[../搜索算法/广度优先搜索/BFS基础模板|广度优先搜索]]

---
返回：[[../算法学习导航|算法学习导航]]
