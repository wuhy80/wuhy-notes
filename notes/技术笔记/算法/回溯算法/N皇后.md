---
title: "N皇后问题"
aliases: [N-Queens]
tags:
  - 算法
  - 算法/回溯
difficulty: hard
created: 2025-01-11
updated: 2026-08-09
---

# N皇后问题

## 📌 定义

在 n×n 的棋盘上放置 n 个皇后，使得它们互不攻击。皇后可以攻击同一行、同一列、同一对角线上的棋子。

```
示例: n = 4
输出:
[
 [".Q..",  // 解法 1
  "...Q",
  "Q...",
  "..Q."],

 ["..Q.",  // 解法 2
  "Q...",
  "...Q",
  ".Q.."]
]
```

## 核心思路

使用**回溯算法**逐行放置皇后：
- **选择**：在当前行的某一列放置皇后
- **约束**：检查是否与已放置的皇后冲突
- **探索**：递归处理下一行
- **撤销**：回溯，尝试其他列

```
决策树示例 (4皇后):

第0行: 尝试列0,1,2,3
第1行: 在合法列中尝试
第2行: 在合法列中尝试
第3行: 在合法列中尝试

剪枝: 如果当前位置不合法，直接跳过
```

## 复杂度分析

| 方法 | 时间复杂度 | 空间复杂度 | 说明 |
|------|-----------|-----------|------|
| **回溯法** | **O(n!)** | **O(n)** | 每行选择递减 |
| 位运算优化 | O(n!) | O(n) | 常数优化 |

## Go 代码

### Go 实现

```go
package main

import "fmt"

func solveNQueens(n int) [][]string {
    result := [][]string{}
    board := make([][]byte, n)
    for i := range board {
        board[i] = make([]byte, n)
        for j := range board[i] {
            board[i][j] = '.'
        }
    }

    cols := make(map[int]bool)
    diag1 := make(map[int]bool)
    diag2 := make(map[int]bool)

    var backtrack func(row int)
    backtrack = func(row int) {
        if row == n {
            solution := make([]string, n)
            for i := range board {
                solution[i] = string(board[i])
            }
            result = append(result, solution)
            return
        }

        for col := 0; col < n; col++ {
            if cols[col] || diag1[row-col] || diag2[row+col] {
                continue
            }

            board[row][col] = 'Q'
            cols[col] = true
            diag1[row-col] = true
            diag2[row+col] = true

            backtrack(row + 1)

            board[row][col] = '.'
            delete(cols, col)
            delete(diag1, row-col)
            delete(diag2, row+col)
        }
    }

    backtrack(0)
    return result
}

func main() {
    n := 4
    solutions := solveNQueens(n)
    fmt.Printf("%d皇后共有 %d 个解\n", n, len(solutions))
}
```

## 思路展开

### 冲突检查详解

```
皇后的攻击范围:
- 同一行: row相同
- 同一列: col相同
- 主对角线: row - col 相同
- 副对角线: row + col 相同

示例 (4×4棋盘):
在(1,1)放置皇后Q

列冲突:
. Q . .
. Q . .  ← col=1
. Q . .
. Q . .

主对角线冲突 (row-col=0):
Q . . .  ← (0,0)
. Q . .  ← (1,1)
. . Q .  ← (2,2)
. . . Q  ← (3,3)

副对角线冲突 (row+col=2):
. . Q .  ← (0,2)
. Q . .  ← (1,1)
Q . . .  ← (2,0)
```

### 回溯过程详解

```
4皇后问题:

第0行:
  尝试col=0: 放置Q
    第1行:
      col=0: 冲突(列) ✗
      col=1: 冲突(对角线) ✗
      col=2: 合法 ✓ 放置Q
        第2行:
          col=0: 冲突 ✗
          col=1: 冲突 ✗
          col=2: 冲突 ✗
          col=3: 冲突 ✗
        回溯到第1行
      col=3: 合法 ✓ 放置Q
        第2行:
          col=0: 冲突 ✗
          col=1: 合法 ✓ 放置Q
            第3行:
              col=0: 冲突 ✗
              col=1: 冲突 ✗
              col=2: 冲突 ✗
              col=3: 冲突 ✗
            回溯
        回溯
    回溯到第0行
  尝试col=1: 放置Q
    ...
```

## 经典题目

### LeetCode 问题
- [x] [N皇后](https://leetcode.cn/problems/n-queens/) - LeetCode 51
- [x] [N皇后 II](https://leetcode.cn/problems/n-queens-ii/) - LeetCode 52
- [ ] 八皇后问题（n=8的特例）

### 扩展问题
- [ ] 在给定位置放置皇后
- [ ] 最少皇后覆盖棋盘

## ⚖️ 优缺点

### 优点
- ✅ **保证找到所有解**
- ✅ **空间复杂度低**：O(n)
- ✅ **经典问题**：面试常考

### 缺点
- ❌ **时间复杂度高**：O(n!)
- ❌ **大规模问题**：n > 15时很慢

## 🎨 应用场景

- **约束满足问题**：把变量逐个赋值，每次只保留满足当前约束的选择。
- **排班与布局**：行、列、对角线可以抽象成资源冲突约束，和会议排班、棋盘布局的建模方式相似。
- **回溯框架练习**：适合训练“做选择、递归、撤销选择”的完整闭环。

## 💡 优化技巧

- 用 `cols`、`diag1`、`diag2` 三个整数的位表示已占用列和对角线，把冲突判断从扫描 `O(n)` 降为 `O(1)`。
- 对称棋盘可以只枚举第一行的一半列，再把得到的解镜像，减少重复搜索。
- 如果只求解的数量，不必保存完整棋盘，只维护计数器即可降低空间开销。

## 相关主题

- [[解数独|解数独]] - 另一个经典棋盘问题
- [[_index|回溯算法]] - 返回回溯算法总览
- [[../搜索算法/深度优先搜索/DFS基础模板|深度优先搜索]] - DFS应用

---
返回：[[_index|回溯算法]] | [[../算法学习导航|算法学习导航]]
