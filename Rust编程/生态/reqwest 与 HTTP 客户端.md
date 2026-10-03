---
tags:
  - Rust
  - reqwest
  - HTTP
  - 网络
created: 2026-10-02
updated: 2026-10-02
status: 初稿
---

# reqwest 与 HTTP 客户端

> [!summary] 一句话理解
> reqwest 是 Rust 的 HTTP 客户端事实标准：异步（默认）+ 阻塞（`blocking` feature）双模式，基于 hyper。
>
> **最重要的一条纪律：`Client` 要长期复用，不要每次请求都 `Client::new()`。** 每次新建都会丢掉连接池、TLS 会话复用和 DNS 缓存。

## 1. 依赖配置

```toml
[dependencies]
reqwest = { version = "0.12", default-features = false, features = [
    "json",
    "rustls-tls",     # 纯 Rust TLS，交叉编译与容器部署省事
    "gzip",
    "brotli",
    "stream",         # 流式下载
    "multipart",      # 文件上传
] }
tokio = { version = "1", features = ["macros", "rt-multi-thread"] }
serde = { version = "1", features = ["derive"] }
anyhow = "1"
```

> [!note] 为什么关掉 default-features
> 默认会拉 `native-tls`（依赖系统 OpenSSL / SChannel）。Linux 容器里这会引入 OpenSSL 版本与证书库问题。**改用 `rustls-tls` 后静态链接、交叉编译都干净得多。**

## 2. 复用 `Client`：正确姿势

```rust
use std::time::Duration;
use reqwest::Client;

#[derive(Clone)]
struct ApiClient {
    http: Client,
    base: String,
    token: String,
}

impl ApiClient {
    fn new(base: impl Into<String>, token: impl Into<String>) -> anyhow::Result<Self> {
        let http = Client::builder()
            .connect_timeout(Duration::from_secs(5))   // 建连超时
            .timeout(Duration::from_secs(30))          // 整个请求超时
            .pool_max_idle_per_host(8)                 // 每主机空闲连接数
            .user_agent(concat!("mytool/", env!("CARGO_PKG_VERSION")))
            .build()?;

        Ok(Self { http, base: base.into(), token: token.into() })
    }

    async fn get_items(&self, page: u32) -> anyhow::Result<Vec<Item>> {
        let resp = self.http
            .get(format!("{}/items", self.base))
            .query(&[("page", page), ("size", 20)])
            .bearer_auth(&self.token)
            .header("accept", "application/json")
            .send()
            .await?
            .error_for_status()?;      // 4xx/5xx → Err

        Ok(resp.json().await?)
    }
}
```

`Client` 内部是 `Arc`，**clone 是廉价的**，可以放心塞进结构体到处传。

## 3. 超时的三层

| 层级 | 方法 | 说明 |
|---|---|---|
| 建连 | `.connect_timeout(d)` | TCP + TLS 握手，建议 3~5 秒 |
| 整个请求 | `.timeout(d)` | 从发出到读完 body；**不设就可能永久挂住** |
| 单次请求覆盖 | `.timeout(d)` on `RequestBuilder` | 某个慢接口单独放宽 |

> [!warning] 不设超时是最常见的生产事故
> 默认情况下 reqwest 没有总超时。对端"半开连接"（收到请求但不响应）会让任务永远挂着，配合 `join_all` 直接把服务拖垮。**任何面向网络的代码都必须显式设超时。**

## 4. 常见请求形态

```rust
// POST JSON
let resp = client.post(url).json(&payload).send().await?;

// 表单
let resp = client.post(url).form(&[("user", "a"), ("pass", "b")]).send().await?;

// 自定义头
let resp = client.post(url).header("x-api-key", key).body(bytes).send().await?;

// 文件上传
let part = reqwest::multipart::Part::bytes(buf).file_name("a.bin");
let form = reqwest::multipart::Form::new().part("file", part);
let resp = client.post(url).multipart(form).send().await?;

// 流式下载（大文件不要 read 进内存）
use futures::StreamExt;
let mut resp = client.get(url).send().await?.error_for_status()?;
let mut file = tokio::fs::File::create("out.bin").await?;
while let Some(chunk) = resp.chunk().await? {
    tokio::io::AsyncWriteExt::write_all(&mut file, &chunk).await?;
}
```

> [!note] body 只能读一次
> `resp.text()`、`resp.json()`、`resp.bytes()` 都会**消耗** body。想要先看内容再按类型解析，就 `let text = resp.text().await?;` 然后自己 `serde_json::from_str(&text)`。
>
> 反过来，只在解析失败时才需要看到原文的场景，应该**先取 text 再解析**——否则错误信息里就只有 "expected value at line 1"。

## 5. 状态码与错误处理

```rust
let resp = client.get(url).send().await?;

// 方式一：非 2xx 直接转 Err（最常用）
let resp = resp.error_for_status()?;

// 方式二：手动分支，能读到错误响应体
if !resp.status().is_success() {
    let status = resp.status();
    let body = resp.text().await.unwrap_or_default();
    anyhow::bail!("HTTP {status}: {body}");
}
```

| 检查 | 含义 |
|---|---|
| `.error_for_status()` | 4xx/5xx → `Err` |
| `.error_for_status_ref()` | 不消耗 body，只检查并保留 `Response` |
| `resp.status()` | 拿到 `StatusCode`，可 `.is_success()` / `.is_server_error()` |

reqwest 的错误类型 `reqwest::Error` 有几个有用的方法：

```rust
match err {
    e if e.is_timeout() => { /* 超时 */ }
    e if e.is_connect() => { /* 连不上 */ }
    e if e.is_status()  => { /* 4xx/5xx */ }
    e if e.is_decode()  => { /* JSON 解析失败 */ }
    _ => {}
}
```

## 6. 重试

**reqwest 默认不重试**（这是对的：重试策略依赖业务语义）。用 middleware 做：

```toml
reqwest-middleware = "0.4"
reqwest-retry = "0.7"
```

```rust
use reqwest_middleware::ClientBuilder;
use reqwest_retry::{policies::ExponentialBackoff, RetryTransientMiddleware};

let retry = ExponentialBackoff::builder().build_with_max_retries(3);
let client = ClientBuilder::new(reqwest::Client::new())
    .with(RetryTransientMiddleware::new_with_policy(retry))
    .build();
```

自己写重试时注意：

- **只重试幂等请求**（GET/PUT/DELETE），或业务上确认安全
- 只重试**超时、连接错误、429、5xx**；4xx（除 429）通常重试无意义
- 指数退避 + 抖动（jitter），避免惊群
- 尊重 `Retry-After` 头

## 7. 代理与证书

```rust
let client = reqwest::Client::builder()
    .proxy(reqwest::Proxy::all("http://127.0.0.1:7890")?)
    .danger_accept_invalid_certs(false)
    .build()?;
```

读取环境变量：reqwest 默认认 `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY`（可通过 `.no_proxy()` 关闭）。

> [!warning] `danger_accept_invalid_certs(true)` 不要进生产
> 它会关闭证书校验，等于放弃 TLS 的安全保证。自签证书场景应该用 `.add_root_certificate(cert)` 显式信任。

## 8. 阻塞模式

不想引入异步运行时时：

```toml
reqwest = { version = "0.12", features = ["blocking", "json"] }
```

```rust
let client = reqwest::blocking::Client::builder()
    .timeout(std::time::Duration::from_secs(30))
    .build()?;
let body = client.get(url).send()?.text()?;
```

> [!warning] 阻塞客户端不能在 async 里用
> `blocking` 版本内部会自己建运行时，在 Tokio 上下文里调用会 panic（"Cannot drop a runtime in a context where blocking is not allowed"）。异步环境里必须用异步 API；确实要调同步代码，用 `tokio::task::spawn_blocking`。

## 9. 常见坑速查

| 现象 | 原因 | 修法 |
|---|---|---|
| 请求偶尔永久挂住 | 没设超时 | `.timeout()` + `.connect_timeout()` |
| 高并发下报连接错误 | 每次请求 `Client::new()`，没复用连接池 | 复用同一个 `Client` |
| `error decoding response body` | 响应不是 JSON / 结构不匹配 | 先 `text()` 看原文 |
| 容器里报 TLS 错误 | 用 `native-tls` 且镜像缺 CA 证书 | 换 `rustls-tls` |
| 拿到的中文是乱码 | 响应未声明编码 | `resp.text()` 按 charset 处理，或手动 `bytes()` 后 `encoding_rs` 解码 |
| 上传大文件内存爆掉 | 整个文件读进了 `Vec` | 用 `multipart` 的流式 part 或分片上传 |
| CRLF / 头注入报错 | header 值含非法字符 | 校验并清洗输入 |
| 429 打得更多 | 无退避地重试 | 指数退避 + 尊重 `Retry-After` |

## 10. 小结

> [!summary] 关键判断
> 1. **复用 `Client`**（它内部是 `Arc`），这样才能用上连接池与 TLS 复用
> 2. **必须设超时**：`connect_timeout` + `timeout` 两层
> 3. **body 只能读一次**；解析失败想看到原文，就先 `text()` 再 `from_str`
> 4. **默认不重试**，重试要自己加，且只针对幂等 + 可恢复错误
> 5. 生产容器里用 **`rustls-tls`**，避开系统 OpenSSL
> 6. 阻塞 API **不能**在 async 上下文里调用

## 相关笔记

- [[Rust编程/并发/async 与 Tokio 入门|async 与 Tokio 入门]]
- [[Rust编程/生态/serde 序列化|serde 序列化]]
- [[Rust编程/生态/常用 crate 选型|常用 crate 选型]]
- [[Rust编程/基础/错误处理|错误处理]]
- [[Rust编程/README|Rust 编程]]
