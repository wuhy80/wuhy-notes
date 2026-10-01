UDP 通讯的一个要点是收到的数据一定要先进行缓存，放到队列中等后续处理。如果在接收的同时进行处理会导致消息处理不过来，最后导致堵塞的问题

# 通过一个 Deque 的开源组件
[edwingeng/deque: A highly optimized double-ended queue (github.com)](https://github.com/edwingeng/deque)
一个队列的实现，使用这个解决 UDP 发送数据快导致的接收处理不过来的问题
```go
dq := deque.NewDeque[int]()
dq.PushBack(100)
dq.PushBack(200)
dq.PushBack(300)
for !dq.IsEmpty() {
    fmt.Println(dq.PopFront())
}

dq.PushFront(100)
dq.PushFront(200)
dq.PushFront(300)
for i, n := 0, dq.Len(); i < n; i++ {
    fmt.Println(dq.PopFront())
}

// Output:
// 100
// 200
// 300
// 300
// 200
// 100
```

## 通过 Go消息队列的方案
这是一个比较推荐的方案，使用消息队列是 Go 自带的功能，而且不用担心并发的问题
```go
// 创建消息队列
queue := make(chan interface{}, 1024)

// 接收数据
go func() {
    // 监听UDP端口
    conn, err := net.ListenUDP("udp", &net.UDPAddr{
        IP:   net.ParseIP("0.0.0.0"),
        Port: 8080,
    })
    if err != nil {
        panic(err)
    }

    defer conn.Close()

    // 接收包
    for {
        buf := make([]byte, 1024)
        n, _, err := conn.ReadFromUDP(buf)
        if err != nil {
            panic(err)
        }

        // 将包放入消息队列
        queue <- buf[:n]
    }
}()

// 处理数据
go func() {
    for {
        // 从消息队列中取出数据
        buf := <-queue

        // 处理数据
        // ...
    }
}()
```