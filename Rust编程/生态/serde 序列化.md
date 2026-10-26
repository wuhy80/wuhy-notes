---
tags:
  - Rust
  - serde
  - 序列化
  - JSON
created: 2026-10-02
updated: 2026-10-02
status: 初稿
---

# serde 序列化

> [!summary] 一句话理解
> **serde 是框架，格式库是后端。** 你只给数据结构加 `#[derive(Serialize, Deserialize)]`，具体是 JSON、TOML、YAML 还是二进制，由后端 crate 决定。
>
> 换格式不用改结构体定义——这是 serde 最大的价值。

## 1. 依赖与最小示例

```toml
[dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = "1"
toml = "0.8"
```

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct Config {
    name: String,
    retries: u32,
}

fn main() -> anyhow::Result<()> {
    let cfg = Config { name: "demo".into(), retries: 3 };

    // 结构体 → 字符串
    let json = serde_json::to_string_pretty(&cfg)?;
    println!("{json}");

    // 字符串 → 结构体
    let back: Config = serde_json::from_str(&json)?;
    println!("{back:?}");

    Ok(())
}
```

> [!tip] 直接看文档的方式
> `serde` 的属性很多，别背。写结构体时打开 [serde.rs/field-attrs](https://serde.rs/field-attrs.html) 和 [serde.rs/container-attrs](https://serde.rs/container-attrs.html) 对照查最快。

## 2. 最常用的字段/容器属性

| 属性 | 位置 | 作用 |
|---|---|---|
| `#[serde(rename = "camelName")]` | 字段 | 单个字段改名 |
| `#[serde(rename_all = "camelCase")]` | 容器 | 批量改名（`snake_case`/`kebab-case`/`SCREAMING_SNAKE_CASE` 等） |
| `#[serde(alias = "old_name")]` | 字段 | 反序列化时接受别名（**做兼容用**） |
| `#[serde(default)]` | 字段/容器 | 缺失时用 `Default` |
| `#[serde(default = "path::to::fn")]` | 字段 | 缺失时用指定函数 |
| `#[serde(skip)]` | 字段 | 双向都跳过 |
| `#[serde(skip_serializing_if = "Option::is_none")]` | 字段 | 条件跳过（省略 `null`） |
| `#[serde(flatten)]` | 字段 | 把内层结构体字段提升到外层 |
| `#[serde(deny_unknown_fields)]` | 容器 | 遇到未知字段直接报错 |
| `#[serde(transparent)]` | 容器 | 单字段结构体退化为内层类型 |
| `#[serde(with = "module")]` | 字段 | 自定义序列化模块 |
| `#[serde(borrow)]` | 字段 | 借用反序列化（零拷贝） |

```rust
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct ApiResponse {
    request_id: String,

    #[serde(default)]
    retry_count: u32,

    #[serde(skip_serializing_if = "Option::is_none")]
    error_message: Option<String>,

    #[serde(alias = "data")]
    payload: Option<serde_json::Value>,
}
```

> [!warning] `deny_unknown_fields` 与 `flatten` 冲突
> 这两个一起用会编译报错（`flatten` 需要收集未知字段，而 `deny_unknown_fields` 要拒绝它们）。做 API 兼容时通常**不加** `deny_unknown_fields`——宽容接收新字段，减少对接方的升级压力。

## 3. 枚举的四种表示

这是 serde 里最容易踩坑的地方。

```rust
#[derive(Serialize, Deserialize)]
enum Event {
    Click { x: u32, y: u32 },
    Key(String),
}
```

**① 默认：externally tagged（外部标记）**

```json
{ "Click": { "x": 1, "y": 2 } }
{ "Key": "a" }
```

**② internally tagged：`#[serde(tag = "type")]`**

```json
{ "type": "Click", "x": 1, "y": 2 }
```

⚠️ 只支持结构体变体（和 unit 变体），**不支持内部含基本类型的 newtype 变体**。

**③ adjacently tagged：`#[serde(tag = "t", content = "c")]`**

```json
{ "t": "Click", "c": { "x": 1, "y": 2 } }
```

**④ untagged：`#[serde(untagged)]`**

```json
{ "x": 1, "y": 2 }
```

按声明顺序**依次尝试**，第一个成功的生效。

> [!warning] untagged 的两个代价
> 1. **错误信息极差**：全部失败时只会说 “data did not match any variant”
> 2. **可能静默匹配错变体**：结构相似的变体容易互相吞掉
>
> 只在对接没有判别字段的外部接口时用，并且**一定要为它写测试**。

## 4. `Option` 与 `null`

```rust
#[derive(Serialize, Deserialize)]
struct S {
    // 默认：None → null；JSON null → None
    a: Option<String>,

    // 序列化时完全省略这个键
    #[serde(skip_serializing_if = "Option::is_none")]
    b: Option<String>,

    // 反序列化时 null 会报错，必须提供值或缺失
    #[serde(default)]
    c: String,
}
```

想要“字段可以缺失，也可以是 `null`，两者都映射到 `None`”→ `Option<T>` + 不加 `default` 就够（serde 对 `Option` 默认容忍缺失）。

## 5. 零拷贝反序列化

能借用就不复制——对高频解析很有价值：

```rust
#[derive(Deserialize)]
struct Row<'a> {
    #[serde(borrow)]
    name: &'a str,
    #[serde(borrow)]
    tags: Vec<&'a str>,
}

fn parse(input: &str) -> Result<Row<'_>, serde_json::Error> {
    serde_json::from_str(input)   // 只有转义字符才会触发分配
}
```

代价：结构体带上了生命周期参数，会传染给使用它的代码。**别在业务层到处用它**——留给解析边界。

## 6. 动态结构：`serde_json::Value`

字段名不固定、或只想取一小部分时：

```rust
let v: serde_json::Value = serde_json::from_str(r#"{"a":{"b":[1,2]}}"#)?;

// 用索引语法 + 返回 Option
let first = v["a"]["b"][0].as_i64();     // Some(1)

// 取不到时给默认值（比 unwrap 安全）
let missing = v["x"]["y"].as_str().unwrap_or("default");
```

`Value` 的取舍：**方便但慢**（每层都是 `BTreeMap`/`Vec` 装箱）。类型固定的结构首选 `derive`。

## 7. 流式与大文件

```rust
// ❌ 先把整个文件读成 String 再解析 → 内存翻倍
let text = std::fs::read_to_string("big.json")?;
let data: Data = serde_json::from_str(&text)?;

// ✅ 直接从 Reader 解析
let file = std::fs::File::open("big.json")?;
let data: Data = serde_json::from_reader(std::io::BufReader::new(file))?;

// ✅ 写出去也一样
let out = std::fs::File::create("out.json")?;
serde_json::to_writer(std::io::BufWriter::new(out), &data)?;
```

> [!tip] 两个性能习惯
> 1. **读用 `BufReader`，写用 `BufWriter`**——不加缓冲的逐字节 IO 会慢一个数量级
> 2. **别用 `to_string_pretty` 做机器间传输**，它体积大且慢；`to_writer` + 紧凑格式更合适

超大文件（GB 级）用流式解析库：`serde_json::StreamDeserializer`（一行一个 JSON）或 `simd-json`、`sonic-rs`。

## 8. 常见坑

| 症状 | 原因 | 修法 |
|---|---|---|
| `missing field 'x'` | 字段缺失且无默认 | 加 `#[serde(default)]`，或让类型是 `Option<T>` |
| `unknown field 'x'` | 开了 `deny_unknown_fields` | 去掉该属性，或加 `alias` |
| 大整数丢精度 | JSON number 用 `f64` 中转 | 用 `String` 或 `u64`/`i128`（serde_json 支持 `arbitrary_precision` feature） |
| 时间字段解析失败 | `chrono`/`time` 类型没有开 feature | `serde = { features = ["derive"] }` + `chrono = { features = ["serde"] }` |
| `key must be a string` | `HashMap` 的键不是字符串类型 | 键改成 `String`，或自定义序列化为数组 |
| 枚举报 “did not match any variant” | 用了 `untagged` | 改用 `tag = "type"`，或补测试定位 |
| 字段顺序变了就解析失败 | 用了 `bincode` 这类非自描述格式 | 二进制格式**必须保持字段顺序与类型不变** |

> [!warning] bincode / postcard 的版本兼容
> 它们是**非自描述**格式：按字段顺序逐字节读取。给结构体加一个字段、改一个类型，旧数据就再也读不出来。用二进制格式做持久化时**必须自己管理版本**（例如整体包一层 `enum Version { V1(...), V2(...) }`）。

## 9. 兼容性策略（对接外部系统时）

按“从安全到危险”排序：

1. **加字段** → 安全，但要给 `#[serde(default)]`，否则旧数据读不出来
2. **加别名** → 安全，`#[serde(alias = "old")]` 同时接受新旧名字
3. **改字段名** → 危险，用 `alias` 过渡，观察一段时间再删
4. **改类型** → 危险，往往需要自定义 `deserialize_with`
5. **删字段** → 对反序列化安全（未知字段默认忽略），但对接方可能在读

> [!tip] 对接第三方接口的稳妥做法
> 用**专用于该接口的 DTO 结构体**，不要直接拿业务模型去 `derive`。DTO 变化时只改映射层，业务层不受影响。

## 10. 其他格式

| 格式 | crate | 特点 |
|---|---|---|
| JSON | `serde_json` | 通用、生态最全 |
| TOML | `toml` | 配置文件首选，人可读可写 |
| YAML | `serde_yaml`（已停维护）/ `serde_yml` | 缩进敏感，配置与 CI 常见 |
| RON | `ron` | Rust 风格，支持枚举与注释 |
| MessagePack | `rmp-serde` | 紧凑二进制，自描述 |
| bincode / postcard | `bincode` / `postcard` | 极小极快，**非自描述**；postcard 适合嵌入式与 no_std |
| protobuf | `prost` | 跨语言契约，需要 schema |

> [!note] 配置文件该用哪个
> **TOML** > YAML：TOML 没有缩进陷阱，解析器行为明确，适合人工维护。YAML 的隐式类型转换（`NO` 变成布尔、`1.10` 变成数字）是长期踩坑来源。

## 11. 小结

> [!summary] 关键判断
> 1. **serde 框架 + 格式后端**，换格式不改结构体
> 2. 枚举的**四种表示**要记牢，`untagged` 是最后手段（错误信息差、易静默错配）
> 3. **`Option` + `skip_serializing_if`** 控制 `null` 与字段省略
> 4. 大文件用 **`from_reader` / `to_writer` + 缓冲**，不要先读成 `String`
> 5. 二进制格式（bincode/postcard）**必须自己管版本**
> 6. 对接外部系统用**专用 DTO**，别把业务模型直接 `derive`

## 相关笔记

- [[Rust编程/基础/错误处理|错误处理]]
- [[Rust编程/生态/常用 crate 选型|常用 crate 选型]]
- [[Rust编程/工程/Cargo 工作区与依赖管理|Cargo 工作区与依赖管理]]
- [[Rust编程/README|Rust 编程]]
