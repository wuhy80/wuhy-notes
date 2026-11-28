---
title: "组合数取模与Lucas定理"
aliases:
  - Combination Mod Prime
  - Lucas Theorem
  - 组合数取模
  - Lucas定理
tags:
  - 算法
  - 算法/数学
  - 算法/数学/组合数学
difficulty: hard
created: 2026-08-09
updated: 2026-08-09
status: active
---

# 组合数取模与Lucas定理

> [!summary] 一句话说明
> 组合数题真正麻烦的通常不是 `C(n,k)` 本身，而是“`n` 很大，还要求对质数 `p` 取模”。

## 什么时候该想到它

- 题目要求 `C(n,k) mod p`
- `n` 很大，不能直接算完整阶乘
- `p` 是质数
- 显式提示 Lucas 定理

## 普通组合数为什么不能直接照公式写

组合数公式是：

```text
C(n, k) = n! / (k! * (n-k)!)
```

麻烦有两个：

- 阶乘增长太快
- 模意义下不能直接做除法，要改成乘逆元

所以模质数时，真正写法是：

```text
C(n, k) mod p
= n! * (k!)^(-1) * ((n-k)!)^(-1) mod p
```

## 情况一：`n` 不大，直接预处理阶乘和逆阶乘

如果 `n` 规模可以接受，最稳的做法就是：

1. 预处理 `fact[i] = i! mod p`
2. 预处理 `invFact[i] = (i!)^(-1) mod p`
3. 查询时 `O(1)` 套公式

## Go 模板：小范围组合数取模

```go
func PrepareComb(limit, mod int) ([]int, []int) {
    fact := make([]int, limit+1)
    invFact := make([]int, limit+1)
    fact[0] = 1

    for i := 1; i <= limit; i++ {
        fact[i] = fact[i-1] * i % mod
    }

    invFact[limit] = FastPow(fact[limit], mod-2, mod)
    for i := limit; i >= 1; i-- {
        invFact[i-1] = invFact[i] * i % mod
    }

    return fact, invFact
}

func CombModSmall(n, k, mod int, fact, invFact []int) int {
    if k < 0 || k > n {
        return 0
    }
    return fact[n] * invFact[k] % mod * invFact[n-k] % mod
}

func FastPow(a, b, mod int) int {
    result := 1
    a %= mod
    for b > 0 {
        if b&1 == 1 {
            result = result * a % mod
        }
        a = a * a % mod
        b >>= 1
    }
    return result
}
```

## 情况二：`n` 很大，Lucas 定理登场

Lucas 定理适用于：

```text
p 是质数
```

它把一个大组合数拆成很多个“小于 `p` 的组合数”。

如果把 `n` 和 `k` 写成 `p` 进制：

```text
n = ... n2 n1 n0
k = ... k2 k1 k0
```

那么：

```text
C(n, k) ≡ Π C(ni, ki) (mod p)
```

## 一个直觉例子

以 `p = 5` 为例：

```text
23 = 4 * 5 + 3
11 = 2 * 5 + 1
```

所以：

```text
C(23,11) mod 5
= C(4,2) * C(3,1) mod 5
```

这就是 Lucas 的拆位思想。

## Go 模板：Lucas

```go
func Lucas(n, k, p int) int {
    if k == 0 {
        return 1
    }
    return CombPrime(n%p, k%p, p) * Lucas(n/p, k/p, p) % p
}

func CombPrime(n, k, p int) int {
    if k < 0 || k > n {
        return 0
    }

    fact := make([]int, p)
    invFact := make([]int, p)
    fact[0] = 1
    for i := 1; i < p; i++ {
        fact[i] = fact[i-1] * i % p
    }

    invFact[p-1] = FastPow(fact[p-1], p-2, p)
    for i := p - 1; i >= 1; i-- {
        invFact[i-1] = invFact[i] * i % p
    }

    return fact[n] * invFact[k] % p * invFact[n-k] % p
}
```

## 为什么 Lucas 能工作

它本质上是在说：

- 大问题拆成每一位的小问题
- 每一位都只处理 `0..p-1` 范围内的组合数

所以当 `n` 大得根本预处理不到时，Lucas 才有价值。

## 易错点

> [!warning] 组合数取模与 Lucas 最容易错的地方
> - Lucas 要求模数 `p` 是质数。
> - 如果某一位上 `ki > ni`，那一位组合数就是 `0`，整体直接为 `0`。
> - 模意义下“除法”本质是乘逆元，不要直接写整数除法。
> - `p` 很小时可以反复现算，小心常数；如果查询很多次，可以把 `0..p-1` 预处理复用。

## 复杂度

### 预处理方案

- 预处理：`O(n)`
- 单次查询：`O(1)`

### Lucas

- 拆位层数：`O(log_p n)`
- 每层计算一个小组合数

## 相关笔记

- [[同余与模运算]]
- [[扩展欧几里得与模逆元]]
- [[卡特兰数]]

---
返回：[[../_index|数学算法]]
