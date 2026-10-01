---
title: "复原IP地址"
aliases: ["Restore IP Addresses", "LeetCode 93"]
tags:
  - 算法
  - 算法/回溯
  - LeetCode
difficulty: medium
created: 2025-01-11
updated: 2026-08-09
---

# 复原IP地址

## 📌 定义

有效 IP 地址正好由四个整数（每个整数位于 0 到 255 之间组成，且不能含有前导 0），整数之间用 '.' 分隔。

给定一个只包含数字的字符串 `s`，用以表示一个 IP 地址，返回所有可能的有效 IP 地址，这些地址可以通过在 `s` 中插入 '.' 来形成。

```
示例:
输入: s = "25525511135"
输出: ["255.255.11.135","255.255.111.35"]

输入: s = "0000"
输出: ["0.0.0.0"]

输入: s = "101023"
输出: ["1.0.10.23","1.0.102.3","10.1.0.23","10.10.2.3","101.0.2.3"]
```

## 核心思路

使用**回溯算法**进行字符串分割，需要满足：
1. 恰好分成4段
2. 每段是0-255的整数
3. 不能有前导0（除了"0"本身）

## Go 代码

### Go 实现

```go
func restoreIpAddresses(s string) []string {
    result := []string{}
    path := []string{}

    var backtrack func(start int)
    backtrack = func(start int) {
        if len(path) == 4 {
            if start == len(s) {
                result = append(result, strings.Join(path, "."))
            }
            return
        }

        // 剪枝
        remaining := len(s) - start
        needed := 4 - len(path)
        if remaining < needed || remaining > needed*3 {
            return
        }

        for length := 1; length <= 3 && start+length <= len(s); length++ {
            segment := s[start : start+length]
            if isValid(segment) {
                path = append(path, segment)
                backtrack(start + length)
                path = path[:len(path)-1]
            }
        }
    }

    backtrack(0)
    return result
}

func isValid(segment string) bool {
    if len(segment) > 3 {
        return false
    }
    if len(segment) > 1 && segment[0] == '0' {
        return false
    }
    num, _ := strconv.Atoi(segment)
    return num >= 0 && num <= 255
}
```

## 思路展开

```
s = "25525511135"

backtrack(0, []):
  切割"2" ✓
    backtrack(1, ["2"]):
      切割"5" ✓
        backtrack(2, ["2","5"]):
          切割"5" ✓
            backtrack(3, ["2","5","5"]):
              切割"25511135" ✗ (>255)
          切割"52" ✓
            ...
          切割"525" ✗ (>255)

  切割"25" ✓
    ...

  切割"255" ✓
    backtrack(3, ["255"]):
      切割"255" ✓
        backtrack(6, ["255","255"]):
          切割"11" ✓
            backtrack(8, ["255","255","11"]):
              切割"135" ✓
                backtrack(11, ["255","255","11","135"]) → 收集
```

## 经典题目

- [x] [复原IP地址](https://leetcode.cn/problems/restore-ip-addresses/) - LeetCode 93

## 相关主题

- [[分割回文串|分割回文串]] - 类似的字符串分割问题
- [[_index|回溯算法]] - 返回回溯算法总览

---
返回：[[_index|回溯算法]] | [[../算法学习导航|算法学习导航]]
