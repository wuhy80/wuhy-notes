---
title: "MD5"
aliases: ["Message-Digest Algorithm 5", "MD5摘要算法"]
tags:
  - 算法
  - 算法/哈希
  - 密码学
difficulty: easy
created: 2026-01-11
updated: 2026-08-09
---

# MD5

> [!summary] 一句话说明
> MD5 的价值现在主要不在“安全”，而在“快速生成一个固定长度的历史兼容指纹”。

## 先说结论

MD5 可以把任意长度输入映射成固定的 `128 bit` 摘要，通常写成 `32` 位十六进制字符串。

```text
MD5("hello") = 5d41402abc4b2a76b9719d911017c592
```

但更重要的结论是：

> [!warning] 安全结论
> MD5 已经不适合用于密码存储、数字签名、证书、防篡改校验等依赖抗碰撞能力的场景。

## 它还能做什么

可以谨慎用于：

- 非安全用途的文件指纹
- 缓存 key
- 数据去重的第一层快速筛选
- 老系统兼容

不该用于：

- 密码存储
- 签名校验
- 安全完整性验证
- 任何需要强抗碰撞的场景

## Go 代码：字符串 MD5

```go
func MD5Hex(text string) string {
    sum := md5.Sum([]byte(text))
    return hex.EncodeToString(sum[:])
}
```

## Go 代码：文件 MD5

```go
func FileMD5(path string) (string, error) {
    file, err := os.Open(path)
    if err != nil {
        return "", err
    }
    defer file.Close()

    h := md5.New()
    if _, err := io.Copy(h, file); err != nil {
        return "", err
    }
    return hex.EncodeToString(h.Sum(nil)), nil
}
```

## Go 代码：完整示例

```go
func main() {
    fmt.Println(MD5Hex("hello"))

    hash, err := FileMD5("demo.txt")
    if err != nil {
        panic(err)
    }
    fmt.Println(hash)
}
```

## 为什么它不等于“加密”

MD5 是哈希，不是加密。

- 加密强调可逆
- 哈希强调压缩映射和快速摘要

所以“MD5 解密”这种说法本身就不准确。  
网上所谓“解密 MD5”，本质上通常是撞库、字典表或彩虹表匹配。

## 为什么加盐也不够

给 MD5 加盐，确实能让预计算攻击更难。  
但它解决不了两个根问题：

- MD5 太快，暴力枚举成本低
- MD5 抗碰撞能力已经不够

所以密码存储应该直接上：

- Argon2
- bcrypt
- scrypt
- PBKDF2

## 和 SHA-256 的区别

| 算法 | 输出长度 | 当前安全性 | 常见用途 |
|---|---:|---|---|
| MD5 | `128 bit` | 不安全 | 历史兼容、非安全指纹 |
| SHA-1 | `160 bit` | 不推荐 | 历史兼容 |
| SHA-256 | `256 bit` | 当前常用 | 完整性校验、签名相关 |

## 什么时候还会碰到它

- 老接口签名协议
- 下载页里的文件摘要
- 历史系统数据库字段
- 某些缓存 / 去重脚本

也就是说，你现在更多是“要会识别和兼容它”，而不是“主动选它做安全方案”。

## 易错点

> [!warning] 关于 MD5 的常见误区
> - MD5 不是加密算法。
> - 两个文件 MD5 相同，不代表在密码学意义上绝对安全地“相同”。
> - 加盐 MD5 也不适合作为现代密码存储方案。

## 相关笔记

- [[SHA-256]]
- [[../哈希表|哈希表]]

---
返回：[[../_index|数据结构]]
