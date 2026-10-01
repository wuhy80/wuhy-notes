---
🌻日期🌻: 2024-04-28
🌙星期🌙: 星期日
⌚️时间⌚️: 22:29:34
tags: 
---
# 通过检查 IP 最大访问数进行限制

```go
package main

import (
    "sync"
    "github.com/gin-gonic/gin"
)

var (
    connections = make(map[string]int)
    mutex       sync.Mutex
    maxConnPerIP = 100
)

func main() {
    r := gin.Default()

    r.Use(func(c *gin.Context) {
        clientIP := c.ClientIP()
        mutex.Lock()
        defer mutex.Unlock()
        if connections[clientIP] >= maxConnPerIP {
            c.AbortWithStatusJSON(429, gin.H{"error": "Too many connections from your IP"})
            return
        }
        connections[clientIP]++
        defer func() {
            mutex.Lock()
            defer mutex.Unlock()
            connections[clientIP]--
        }()
        c.Next()
    })

    // 路由和处理程序
    r.GET("/", func(c *gin.Context) {
        c.JSON(200, gin.H{"message": "Hello, World!"})
    })

    r.Run()
}
```

