---
title: "Rabin-Karp模板"
aliases:
  - Rabin-Karp Template
  - 滚动哈希模板
tags:
  - 算法
  - 算法/模板
  - 算法/字符串
difficulty: medium
created: 2026-08-08
updated: 2026-08-09
status: active
---

# Rabin-Karp 模板

> [!summary] 一句话说明
> Rabin-Karp 的核心是滑动窗口哈希：旧窗口删左端、整体乘基数、再加上新字符。

## 模板适用场景

- 定长子串匹配
- 子串判重
- 需要快速比较很多相同长度子串

如果题目要求严格线性且不想碰哈希冲突，优先 KMP / Z。

## Go 模板：查找所有匹配位置

```go
func RabinKarpSearch(text, pattern string) []int {
    if len(pattern) == 0 {
        result := make([]int, len(text)+1)
        for i := range result {
            result[i] = i
        }
        return result
    }
    if len(pattern) > len(text) {
        return nil
    }

    const base = 256
    const mod = 1000000007

    width := len(pattern)
    highest := 1
    for i := 0; i < width-1; i++ {
        highest = highest * base % mod
    }

    patternHash, windowHash := 0, 0
    for i := 0; i < width; i++ {
        patternHash = (patternHash*base + int(pattern[i])) % mod
        windowHash = (windowHash*base + int(text[i])) % mod
    }

    positions := []int{}
    for left := 0; left+width <= len(text); left++ {
        if windowHash == patternHash && text[left:left+width] == pattern {
            positions = append(positions, left)
        }

        if left+width < len(text) {
            windowHash = (windowHash - int(text[left])*highest) % mod
            if windowHash < 0 {
                windowHash += mod
            }
            windowHash = (windowHash*base + int(text[left+width])) % mod
        }
    }

    return positions
}
```

## 为什么哈希相等后还要再比一次

因为哈希可能碰撞。  
所以标准模板必须做：

- 先比哈希
- 哈希相等后再核对原串

## 最容易被忽略的一步

去掉窗口最高位字符后，哈希可能变成负数。  
因此要及时做：

```go
if windowHash < 0 {
    windowHash += mod
}
```

## 易错点

> [!warning] Rabin-Karp 模板最容易错的地方
> - 哈希相同不等于字符串一定相同，还要再次确认。
> - 去掉最高位贡献后要及时取模。
> - 如果非常在意碰撞率，可以上双哈希。

## 复杂度

| 场景 | 时间复杂度 |
|---|---:|
| 平均情况 | `O(n + m)` |
| 最坏情况 | `O(nm)` |

## 相关主题

- [[../../字符串算法/Rabin-Karp算法|Rabin-Karp算法]]
- [[KMP模板]]

---
返回：[[../_index|算法模板]]
