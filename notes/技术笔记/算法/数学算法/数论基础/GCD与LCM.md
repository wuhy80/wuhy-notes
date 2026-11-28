---
title: "GCD与LCM"
aliases: ["Greatest Common Divisor", "Least Common Multiple", "最大公约数", "最小公倍数"]
tags:
  - 算法
  - 算法/数学
  - 算法/数学/数论
difficulty: easy
created: 2025-01-11
updated: 2026-08-09
---

# GCD与LCM

## 📌 核心概念

- **GCD（Greatest Common Divisor）**：最大公约数
- **LCM（Least Common Multiple）**：最小公倍数

**关系**：`LCM(a, b) = a * b / GCD(a, b)`

> [!tip] 如何和周边知识区分
> 这一篇先解决“最大公约数和最小公倍数本身怎么求”。如果你要继续处理逆元、线性同余和模意义下的除法，请顺着看：
> - [[扩展欧几里得与模逆元]]
> - [[同余与模运算]]

## 💻 算法实现

## 🎯 经典应用

## 💡 数学性质

### GCD性质

1. **交换律**：`gcd(a, b) = gcd(b, a)`
2. **结合律**：`gcd(a, gcd(b, c)) = gcd(gcd(a, b), c)`
3. **分配律**：`gcd(k*a, k*b) = k * gcd(a, b)`
4. **线性组合**：若 `d = gcd(a, b)`，则存在整数x, y使得 `d = ax + by`

### LCM性质

1. **交换律**：`lcm(a, b) = lcm(b, a)`
2. **结合律**：`lcm(a, lcm(b, c)) = lcm(lcm(a, b), c)`
3. **与GCD关系**：`gcd(a, b) * lcm(a, b) = a * b`

## 🎯 优化技巧

## Go 代码

```go
// 欧几里得算法
func gcd(a, b int) int {
    for b != 0 {
        a, b = b, a%b
    }
    return a
}

// 最小公倍数
func lcm(a, b int) int {
    return a * b / gcd(a, b)
}

// 扩展欧几里得算法
func extendedGCD(a, b int) (int, int, int) {
    if b == 0 {
        return a, 1, 0
    }

    gcdVal, x1, y1 := extendedGCD(b, a%b)

    x := y1
    y := x1 - (a/b)*y1

    return gcdVal, x, y
}

// 模逆元
func modInverse(a, m int) int {
    gcdVal, x, _ := extendedGCD(a, m)

    if gcdVal != 1 {
        return -1
    }

    return ((x % m) + m) % m
}
```

## 🎯 经典题目

| 题目 | LeetCode | 关键点 |
|------|----------|--------|
| 分数加减法 | 592 | GCD化简 |
| 直线上最多的点 | 149 | GCD化简斜率 |
| X的平方根 | 69 | 二分/牛顿法 |
| 完美数 | 507 | 因数分解 |

## 🔗 相关笔记

- [[扩展欧几里得与模逆元]]
- [[同余与模运算]]

---
返回：[[../_index|数学算法]]
