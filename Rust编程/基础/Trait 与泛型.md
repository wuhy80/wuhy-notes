---
tags:
  - Rust
  - Trait
  - 泛型
created: 2026-10-02
updated: 2026-10-02
status: 初稿
---

# Trait 与泛型

> [!summary] 一句话理解
> **Trait 是 Rust 的接口**（类似 Go 的 interface、Java 的 interface，但可以带默认实现，也能为已有类型补充实现）。
> **泛型是编译期参数化**，通过单态化生成专用代码，做到零运行时开销。
>
> 二者合起来构成 Rust 的抽象体系：`impl Trait` / 泛型 = 静态分发，`dyn Trait` = 动态分发。

## 1. 定义与实现 Trait

```rust
trait Summary {
    // 必须实现
    fn summarize_author(&self) -> String;

    // 带默认实现：实现者可以覆盖，也可以不写
    fn summarize(&self) -> String {
        format!("(阅读更多来自 {} 的内容...)", self.summarize_author())
    }
}

struct Article {
    title: String,
    author: String,
}

impl Summary for Article {
    fn summarize_author(&self) -> String {
        self.author.clone()
    }
    // summarize 用默认实现
}
```

要点：

- 默认方法**可以调用尚未实现的方法**（如上面的 `summarize_author`）
- 实现 trait 时**必须提供所有没有默认实现的方法**，否则编译不过
- trait 可以有**关联常量**（`const N: usize;`）和**关联类型**（`type Item;`）

## 2. 泛型与 Trait 约束

```rust
fn largest<T: PartialOrd + Copy>(list: &[T]) -> T {
    let mut largest = list[0];
    for &item in list.iter() {
        if item > largest {
            largest = item;
        }
    }
    largest
}
```

更复杂的约束用 `where`，可读性更好：

```rust
fn process<K, V>(map: &HashMap<K, V>) -> usize
where
    K: Eq + Hash + Display,
    V: Clone + Debug,
{
    map.len()
}
```

泛型也能用在结构体、枚举、方法上：

```rust
struct Point<T> { x: T, y: T }

impl<T: Display> Point<T> {
    fn show(&self) {
        println!("({}, {})", self.x, self.y);
    }
}
```

> [!note] 单态化（Monomorphization）
> 泛型在编译期会被**展开成针对每个具体类型的独立版本**。所以 `largest::<i32>` 和 `largest::<f64>` 是两份机器码。
>
> 好处：**零运行时开销**（没有虚表查找、可以内联）。代价：**二进制变大、编译变慢**。这是 Rust 泛型与 Java 泛型（类型擦除）最本质的区别。

## 3. `impl Trait` 与 `dyn Trait`

### 静态分发：泛型 / `impl Trait`

```rust
fn notify(item: &impl Summary) { ... }          // 参数位置：等价于泛型
fn notify<T: Summary>(item: &T) { ... }         // 完全等价

fn make_summary() -> impl Summary {             // 返回位置：不透明类型
    Article { title: "t".into(), author: "a".into() }
}
```

返回位置的 `impl Trait` 要求**只返回单一具体类型**——不能在 `if` 分支里返回不同类型。

### 动态分发：`dyn Trait`

```rust
fn notify_all(items: &[Box<dyn Summary>]) {
    for item in items {
        println!("{}", item.summarize());   // 运行时通过虚表查方法
    }
}
```

因为 `dyn Trait` 是**不定长类型（unsized）**，必须放在指针后面：`Box<dyn T>`、`&dyn T`、`Arc<dyn T>`。

### 怎么选

| | 泛型 / `impl Trait` | `dyn Trait` |
|---|---|---|
| 分发方式 | 静态（编译期确定） | 动态（虚表 vtable） |
| 性能 | 可内联，零开销 | 一次间接调用，通常不可内联 |
| 二进制 | 每种类型一份代码，会膨胀 | 一份代码 |
| 异构集合 | ❌ 不能混装不同类型 | ✅ `Vec<Box<dyn T>>` 可以 |
| 编译速度 | 较慢 | 较快 |
| 是否可用于 trait 方法返回 | — | 需满足 dyn 兼容性 |

**经验法则**：库的 API 用泛型（性能与灵活性都好）；需要在集合里装异构对象、或想减少代码膨胀时用 `dyn`。

> [!warning] 对象安全性 / dyn 兼容性
> 不是所有 trait 都能变成 `dyn Trait`。方法如果满足下列任一条件，就不能走动态分发：
> - 方法带**泛型类型参数**（`fn f<T>(&self)`）
> - 返回 `Self`
> - 使用了 `Self` 作为参数类型
> - 关联常量
>
> 可以通过给方法加 `where Self: Sized` 把该方法排除在虚表之外来挽救。新版本 Rust 把"对象安全"改称 **dyn 兼容（dyn-compatible）**，是同一个概念。

## 4. 关联类型 vs 泛型参数

```rust
// 关联类型：一个类型只能有一种 Item
trait Producer {
    type Item;
    fn produce(&self) -> Self::Item;
}

// 泛型参数：一个类型可以有多种实现
trait Converter<T> {
    fn convert(&self) -> T;
}
```

| | 关联类型 | 泛型参数 |
|---|---|---|
| 一个类型能有几种实现 | 只能一种 | 可以多种（`impl Converter<i32> for X` / `impl Converter<f64> for X`） |
| 调用处是否需要标注类型 | 不需要（`p.produce()`） | 常需要（`c.convert::<i32>()` 或靠推断） |
| 典型例子 | `Iterator::Item`、`Deref::Target` | `From<T>`、`AsRef<T>` |

**判断标准**：如果"每个实现者只有一种合理选择"，用关联类型；如果"同一类型要支持多种目标"，用泛型参数。

## 5. 值得认识的标准库 trait

| Trait | 作用 | 说明 |
|---|---|---|
| `Debug` / `Display` | 调试输出 / 用户可见输出 | `Debug` 可 `derive`，`Display` **不能** |
| `Clone` / `Copy` | 显式拷贝 / 隐式按位拷贝 | `Copy` 要求所有字段 `Copy`，且不能有 `Drop` |
| `PartialEq` / `Eq` | 相等比较 | 浮点数只能 `PartialEq`（NaN ≠ NaN） |
| `PartialOrd` / `Ord` | 排序 | `Ord` 要求全序 |
| `Hash` | 可作哈希键 | 与 `Eq` 必须**语义一致** |
| `Default` | 提供默认值 | `#[derive(Default)]` 很常用 |
| `From` / `Into` / `TryFrom` | 类型转换 | 实现 `From` 自动获得 `Into`；`?` 靠 `From` |
| `Iterator` / `IntoIterator` | 迭代 | `for` 循环靠 `IntoIterator` |
| `Drop` | 离开作用域时的清理 | 实现 `Drop` 就不能是 `Copy` |
| `Deref` / `DerefMut` | 解引用与自动解引用 | 智能指针的基础；别滥用做继承 |
| `AsRef` / `Borrow` | 廉价借用视图 | 写"接受多种输入"的 API 很有用 |
| `FromStr` | 从字符串解析 | `"1.5".parse::<f64>()` |
| `Error` | 标准错误接口 | 自定义错误实现它 |

可以 `derive` 的常用组合：

```rust
#[derive(Debug, Clone, PartialEq, Eq, Hash, Default)]
struct Config {
    name: String,
    retries: u32,
}
```

> [!tip] `derive` 是最省事的起点
> 先把 `Debug, Clone, PartialEq` 都 `derive` 上，等真需要自定义行为时再手写。`Display`、`Ord`、`Hash` 的自定义要与语义一致，别为了编译过而随便实现——尤其是 `Hash` 与 `Eq` 不一致会导致 `HashMap` 行为错乱。

## 6. 两个高频模式

### Newtype：绕过孤儿规则

孤儿规则要求：**要么 trait 是你的，要么类型是你的**，才能写 `impl`。想给外部类型实现外部 trait 时，包一层：

```rust
struct Meters(f64);

impl Display for Meters {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        write!(f, "{:.1} m", self.0)
    }
}
```

Newtype 还常用于把 `String`、`u64` 之类的裸类型赋予业务含义（`struct UserId(u64)`），让类型系统替你挡住参数顺序写错之类的 bug。

### 扩展 trait（Extension Trait）

给已有类型"外挂"方法：

```rust
trait VecExt<T> {
    fn second(&self) -> Option<&T>;
}

impl<T> VecExt<T> for Vec<T> {
    fn second(&self) -> Option<&T> {
        self.get(1)
    }
}
```

把 trait 放在作用域内即可使用；这也是 `itertools`、`tracing` 这类库的常见做法。

## 7. 泛型与生命周期（关联）

泛型参数和生命周期参数可以并存，**生命周期参数写在最前面**：

```rust
fn longest_with_ann<'a, T>(x: &'a str, y: &'a str, ann: T) -> &'a str
where
    T: Display,
{
    println!("公告：{}", ann);
    if x.len() > y.len() { x } else { y }
}
```

## 8. 小结

> [!summary] 关键判断
> 1. **Trait 是接口 + 默认实现 + 可对外部类型扩展**，这是它比多数语言的 interface 更灵活的地方
> 2. 泛型靠**单态化**换零运行时开销，代价是二进制膨胀与编译变慢
> 3. **默认用泛型，需要异构集合或控体积时用 `dyn`**
> 4. "每类型一种实现"用关联类型，"同一类型多种目标"用泛型参数
> 5. `derive` 打底，自定义实现要保证语义一致（尤其 `Hash` / `Eq` / `Ord`）

## 相关笔记

- [[Rust编程/基础/所有权与借用|所有权与借用]]
- [[Rust编程/基础/错误处理|错误处理]]
- [[Rust编程/基础/智能指针|智能指针]]
- [[Rust编程/README|Rust 编程]]
