---
tags:
  - 大模型/算子开发
  - 大模型/推理优化
  - AI芯片
created: 2026-10-01
updated: 2026-10-01
status: 整理
aliases:
  - TileLang
  - tile-lang
  - TileLang-Ascend
source:
  - https://github.com/tile-ai/tilelang
  - https://github.com/tile-ai/tilelang-ascend
  - https://arxiv.org/abs/2504.17577
  - https://www.deepseek.com/news/v3-2-exp/
  - https://www.qbitai.com/2026/09/499263.html
---

# TileLang：GPU/NPU 通用算子 DSL

> [!summary] 一句话
> TileLang 是「用 Python 写 tile 级数据流、把调度交给编译器」的算子 DSL，编译器基础设施基于 TVM。它把手工调优 CUDA 的经验固化成编译器能力，并已扩展到英伟达、AMD、Apple Metal、CPU，以及华为昇腾 950 和一批国产卡。
> **它不是 CUDA 翻译器**——没有 CUDA 前端，不解析 `.cu`，不能把现有 CUDA 代码“翻译”成昇腾。

## 一、它解决什么问题

AI 算子（GEMM、Attention、量化）的数据流结构其实很清晰：在存储层级之间搬 tile、在 tile 上做计算。但写出高性能实现要手工处理四件事：

1. **线程绑定**：tile 运算和数据映射到 block / warp / thread；
2. **内存布局**：swizzle、padding，避免 bank conflict；
3. **指令特化**：Tensor Core、MMA、dp4a、cp.async、TMA；
4. **流水线**：让搬运和计算重叠。

TileLang 的核心主张是 **把「调度空间」从「数据流」里拆出来**：

- 你只写数据流：`T.copy` / `T.gemm` / `T.reduce` / `T.atomic`，并用 `T.alloc_shared` / `T.alloc_fragment` 显式声明 buffer 放在哪一级存储；
- 编译器负责：Layout Inference 推断布局与线程绑定、自动软件流水线推导、动态 shape 的 loop tail splitting；
- 需要极致性能时才下潜：`T.annotate_layout`、`T.use_swizzle`、`T.Pipelined(num_stages=...)`，甚至注入 C++ / 内联 PTX。

编译链是五段：Python AST → TileLang AST → TVM IR → 优化 pass → codegen（CUDA C / HIP C / LLVM IR / Ascend 等）。

与邻居的差别：比 TVM 好用（不用手写 schedule），比 Triton **更够得着下面**——Triton 把 thread behavior、memory layout、address space 隐藏起来，遇到量化权重矩阵乘这类活就得靠 inline asm 和 workaround 硬绕。

## 二、三次「发布」与各自的意义

> [!warning] 日期容易混
> 昇腾相关的两个关键日期**同月同日、相差一年**，媒体稿和仓库 changelog 各说一半，混起来会得出错误结论。

| 时间 | 事件 | 意义 |
|---|---|---|
| 2025-01-20 | TileLang 开源 | 项目公开 |
| 2025-02-12 | v0.1.0 | 第一个正式版本 |
| 2025-04 | 论文 [arXiv:2504.17577](https://arxiv.org/abs/2504.17577)（北大 × 微软亚研） | 方法论确立：dataflow / scheduling 解耦 |
| 2025-09-29 | [DeepSeek-V3.2-Exp](https://www.deepseek.com/news/v3-2-exp/) 发布，同时开源 TileLang 与 CUDA 两种算子实现；同日 Ascend 适配工作以独立仓库 [tilelang-ascend](https://github.com/tile-ai/tilelang-ascend) 开源 | 大模型厂背书，进入生产工作流 |
| 2026-09-30 | 主仓库加入 **Ascend 950 后端**（官方支持级别）；媒体同日报道 DeepSeek 开源整套昇腾基础设施组件 | 从“英伟达生态里的 DSL”变成“跨芯片算子层” |
| 据 ICLR 2026 会议页面 | 论文以 *Bridge Programmability and Performance in Modern Neural Kernels* 为题入选 oral | 学术认可 |

### 三层意义

**技术层**：把“资深工程师的手感”变成可复用的编译器 pass。同一个 tile 数据流，可以让编译器去决定布局与流水线，而不是每个 kernel 重写一遍。

**产业层**：DeepSeek 把“双实现”范式制度化了——先用 TileLang 快速原型，**以 TileLang 版本作为精度基线**，再手写底层语言追峰值性能，两个版本一起开源。这解决了“探索速度 vs 峰值性能”的长期矛盾。

**生态层**：昇腾侧开放 Ascend C API 与 PTO ISA 底层指令体系来承接 TileLang 后端；华为为 DeepSeek 定制 SuperPoD Flex / UBL128 组网（128 卡 3.2Tbps 单层 Scale-up、256K 卡两层 Scale-out），DeepSeek 反过来把算子库开源进 CANN 社区。**分工顺序反了**：过去 DSL + ISA 是芯片厂的地盘，现在模型厂定义上层语言、芯片厂做适配。

> [!note] 媒体口径的性能数字（华为供稿，未经独立验证）
> DeepEP 实测 Dispatch **375 GB/s**、Combine **347 GB/s**；DeepSeek-V4.1-Flash 在昇腾 950 超节点上 TPOT=5ms 时每卡 **2469 tokens/s**、TPOT=10ms 时 **5102 tokens/s**。注意这些是**离线推理**模式、指定 EP32 部署、Context 128K、投机接受率 0.85 的设定，不含 Serving 调度与框架负载均衡。

> [!warning] 边界
> 昇腾 950 后端在主仓库，但 A2/A3 走的是独立仓库（`ascendc` / `pto` / `npuir` 三个 target），**不进 release wheel**，兼容节奏独立。“同一个 DSL”在这两条线之间不能直接搬代码。

## 三、怎么用

### 3.1 安装

```bash
pip install tilelang
python -c "import tilelang; print(tilelang.__version__)"
```

昇腾 950 需要源码构建（需 CANN，含 `bisheng` 与支持 CCE 的 `ld.lld`，以及 `torch_npu`）：

```bash
git submodule update --init --recursive
USE_ASCEND=ON USE_CUDA=OFF python -m pip install -v .
```

### 3.2 GPU 最小例子

```python
import torch, tilelang
import tilelang.language as T

@tilelang.jit
def matmul_relu(A, B, block_M: int = 128, block_N: int = 128, block_K: int = 32):
    M, N, K = T.const("M, N, K")
    A: T.Tensor((M, K), T.float16)
    B: T.Tensor((K, N), T.float16)
    C = T.empty((M, N), T.float16)

    with T.Kernel(T.ceildiv(N, block_N), T.ceildiv(M, block_M), threads=128) as (bx, by):
        A_shared = T.alloc_shared((block_M, block_K), T.float16)
        B_shared = T.alloc_shared((block_K, block_N), T.float16)
        C_local = T.alloc_fragment((block_M, block_N), T.float32)

        T.clear(C_local)
        for k in T.Pipelined(T.ceildiv(K, block_K), num_stages=3):
            T.copy(A[by * block_M, k * block_K], A_shared)
            T.copy(B[k * block_K, bx * block_N], B_shared)
            T.gemm(A_shared, B_shared, C_local)

        for i, j in T.Parallel(block_M, block_N):
            C_local[i, j] = T.max(C_local[i, j], 0)

        T.copy(C_local, C[by * block_M, bx * block_N])
    return C
```

`@tilelang.jit` 在首次调用时按输入形状特化编译；`T.Pipelined` 负责多级缓冲与搬运/计算重叠；`T.gemm` 映射到目标后端的矩阵指令。

### 3.3 同一个 GEMM 的昇腾 950 版

```python
import torch, torch_npu, tilelang
import tilelang.ascend.language as T      # 注意：独立 dialect

@tilelang.jit(target="ascend")
def matmul_relu(A, B, block_M: int = 256, block_N: int = 224, block_K: int = 128):
    M, N, K = T.const("M, N, K")
    A: T.Tensor((M, K), T.bfloat16)
    B: T.Tensor((N, K), T.bfloat16)
    C = T.empty((M, N), T.float32)
    num_blocks, n_tiles = 32, N // block_N

    with T.Kernel(num_blocks) as bx:
        A_l1 = T.alloc_l1((block_M, block_K), T.bfloat16)
        B_l1 = T.alloc_l1((block_N, block_K), T.bfloat16)
        C_l0c = T.alloc_l0c((block_M, block_N), T.float32)
        C_ub = T.alloc_shared((block_M // 2, block_N), T.float32)

        for tile in T.Persistent([M // block_M * n_tiles], num_blocks, bx):
            m, n = tile // n_tiles * block_M, tile % n_tiles * block_N
            for k in T.Pipelined(K // block_K, num_stages=2):
                T.copy(A[m, k * block_K], A_l1)
                T.copy(B[n, k * block_K], B_l1, l2_cache_ctrl="NOTALLOC_KEEP")
                T.gemm(A_l1, B_l1, C_l0c, transpose_B=True, clear_accum=(k == 0))
            T.dual_copy(C_l0c, C_ub)                 # L0C → UB
            with T.SimtVF(threads=128):              # 向量核 SIMT 区
                for i, j in T.Parallel(block_M // 2, block_N):
                    C_ub[i, j] = T.max(C_ub[i, j], 0)
            T.dual_copy(C_ub, C[m : m + block_M, n : n + block_N], l2_cache_ctrl="NOTALLOC_PW")
    return C
```

### 3.4 GPU 与昇腾的差异对照

骨架是同一套（`T.Kernel` / `T.copy` / `T.gemm` / `T.Pipelined` / `T.Parallel` / `@tilelang.jit`），但**存储层级、并行模型、拷贝原语都要换**，连 import 路径都不同。

| 维度 | 英伟达（`tilelang.language`） | 昇腾 950（`tilelang.ascend.language`） |
|---|---|---|
| 存储 | `alloc_shared` / `alloc_fragment` | `alloc_l1` / `alloc_l0*` / `alloc_shared`（实为 UB） |
| 调度 | 2D grid，`threads=` 定线程 | `T.Persistent` 持久化块遍历 work tile |
| 向量计算 | `T.Parallel` 直接写 | `T.SimtVF(threads=)` / `T.SimdVF()` 圈出 SIMT/SIMD 区 |
| 核间搬运 | 不需要 | `T.dual_copy`（L0C → UB → GM） |
| 同步 | 基本不用管 | **也不用管**：编译器推断流水与 Cube/Vector 依赖、插配对 flag |
| 缓存提示 | TMA / WGMMA 等 | `l2_cache_ctrl="NOTALLOC_KEEP"` |

官方描述最准：*"The Ascend dialect **reuses TileLang's shared frontend**, with Ascend-specific lowering, scheduling, synchronization, and code generation."* —— 复用**共享前端**，不是同一份源码原样双编译。

昇腾 950 后端替你省掉的 Ascend C 工作（官方给的对照表，节选）：

| 领域 | 你用 TileLang 写 | 可以跳过的 Ascend C 代码 |
|---|---|---|
| 缓冲与搬运 | `T.alloc_*`、`T.copy`、`T.dual_copy` | `TPipe` / `TQue` 搭建与 DMA 调用 |
| 切分与 tile 算子 | 形状/dtype、tile 尺寸、`T.gemm` 等 | 底层算子实现 |
| SIMT 计算 | `T.SimtVF` 内的标量代码与 `T.Parallel` | 线程映射与 barrier 插入 |
| 调度与流水 | 按需 `T.Pipelined(...)` | 手工调度与 buffer 轮转 |
| 同步 | **什么都不用写** | set/wait flag 与 flag ID 管理 |

### 3.5 后端矩阵（官方支持级别）

| 后端 | Target | 级别 |
|---|---|---|
| NVIDIA CUDA（SM70–SM120） | `cuda` | **Primary** |
| AMD ROCm / HIP | `hip` | Supported |
| 华为昇腾 950 | `ascend` | **Supported** |
| Apple Metal | `metal` | Supported |
| LLVM CPU | `llvm` | Experimental |
| NVIDIA CuTe DSL | `cutedsl` | Experimental |
| WebGPU | `webgpu` | Experimental |
| 华为昇腾 A2/A3 | `ascendc` / `pto` / `npuir` | Ecosystem |
| 沐曦 MetaX | `maca` | Ecosystem |
| 摩尔线程 MUSA | `musa` | Ecosystem |
| 海光 HYGON | `hcu` | Ecosystem |
| 曦望 Sunrise TANG | `tang` | Ecosystem |

- `auto` target 会自动探测 CUDA / HIP / Metal / Ascend；跨架构编译时显式指定。
- **Ecosystem 那批不在 release wheel 里**，要各自装，兼容节奏独立。
- 一个有意思的细节：主仓库 README 指引「移植新后端」时，让你去用 `.agents/skills/tilelang-backend/SKILL.md` —— **“给 TileLang 加一个后端”已经做成喂给 coding agent 的 skill 了**。这也解释了为何国产卡厂商愿意接这个生态。

### 3.6 昇腾的两条线（最容易踩坑）

| 路线 | Target | 硬件 | 位置与状态 |
|---|---|---|---|
| 新 | `ascend` | **Ascend 950** | 主仓库，Supported，源码构建 `USE_ASCEND=ON`，默认 arch `dav-3510` |
| 旧 | `ascendc` / `pto` / `npuir` | **A2 / A3** | `tilelang-ascend` 独立仓库；另有 MLIR 路线 `tilelang-mlir-ascend` |

旧路线的写法是 `T.gemm_v0`、`T.mma`、`T.Scope("C")`、`T.Kernel(..., is_npu=True)`，并且区分 **Developer 模式**（编译器自动切 Cube/Vector 并插同步）与 **Expert 模式**（手写 `set_flag` / `wait_flag`）。主仓库 950 后端这条路则把同步彻底交给编译器。

## 四、能力边界：原来 CUDA 写的东西，能都用 TileLang 写吗

> [!question] 结论
> 分三堆：**AI 计算算子绝大多数可以**（而且 DeepSeek 已经在这么干）；**DSL 本身有硬语法边界**；**非内核的那一半 CUDA，TileLang 完全不管**。

### 4.1 可以的那一堆

官方 examples 已覆盖 GEMM、分组 GEMM、FP8 GEMM、反量化 GEMM、block-scaled GEMM、FlashAttention、Flash Decoding、块稀疏注意力、线性注意力、GDN、DeepSeek MLA / V3.2 / V4 / mHC、softmax、归一化、激活、sort、scan、conv、dispatch-combine。

而且边界在持续外扩——这些原本“只能手写”的能力逐个被吃进来：

| 时间 | 补上的能力 |
|---|---|
| 2025-07 | 2:4 结构化稀疏 tensor core（`T.gemm_sp`） |
| 2026-02 | CUDA cluster 原语；TCGEN5 MMA tensor-shared 路径 |
| 2026-03 | 生产者-消费者 warp specialization、`T.tma_copy`、两 SM Blackwell kernel |
| 2026-04 | INT4 `T.gemm`、MXFP8 block-scaled GEMM、**`T.CUDASourceCodeKernel`** |
| 2026-05 | `T.copy_cluster`、TMA gather/scatter、scan 算子、CDNA4 MXFP4 |
| 2026-07 | 多后端 dialect、SM120 NVF4、Metal 4 cooperative tensor、LLVM 后端 |
| 2026-09 | Ascend 950 后端进主仓库 |

### 4.2 DSL 的硬语法边界

官方 Python 兼容性文档明确列出内核脚本内**不支持**的语法：

| 特性 | 支持 | 替代 |
|---|:--:|---|
| `for i in range(n)` / `while` / `if-elif-else` / 三元表达式 | ✅ | 映射到 `T.serial` 等 |
| `break` / `continue` | ✅ | 但**编译期循环里**由运行期决定的 break/continue 尚不支持 |
| `enumerate()` / `zip()` / 推导式 | ✅ | 编译期展开 |
| **函数、类定义** | ❌ | 用 `@T.macro`，编译期内联（类似 `__device__`） |
| `a = b = c` 链式赋值 | ❌ | 拆成两条 |
| `len()` | ❌ | `buffer.shape[dim]` |
| `type()` / `isinstance()` | ❌ | — |
| `with` | ⚠️ | 只认 `T.Kernel`、`T.ws` |
| `assert` / `print()` | ⚠️ | `T.device_assert` / `T.assert`、`T.print()` |

还有一条隐蔽的坑：**Python list 不是设备 buffer**——用运行期 TIR 变量索引列表，不会生成设备端查找表，必须用 buffer 或直接算索引表达式。

「内核里不能定义函数和类」这条最能说明定位：**TileLang 是内核脚本语言，不是通用编程语言**，虽然它是 Python 嵌入的。

### 4.3 逃生舱

TileLang 自己留了后门，这恰恰证明边界真实存在：

```python
T.import_source(...)      # 注入 C++ 源码（可接 CUTLASS / cute / CK）
T.call_extern(...)        # 调外部函数
T.ptx("mma.m16n8k32...")  # 直接吐内联 PTX
T.CUDASourceCodeKernel    # 2026-04 新增：整个内核直接嵌 CUDA 源码
```

代价很直接：**这些只在 CUDA 后端有效，用了它，跨到昇腾的能力当场归零**。所以「能不能写」和「值不值得用 TileLang 写」是两个独立问题——只要一下潜到 PTX，你就已经回到 CUDA 世界了。

### 4.4 不能 / 不该用的

1. **非内核的 CUDA 部分**：Runtime/Driver API、stream/event/graph、显存管理、多卡通信（那是 NCCL / DeepEP 的活）、cuFFT / cuSPARSE / cuRAND / CUB / Thrust 这些库。TileLang **只负责生成内核**，host 侧仍然是 PyTorch 那一套。
2. **已经榨干的库**：cuBLAS / cuDNN / CUTLASS 里那些成熟 kernel，重写没有收益，只有回归风险。
3. **不适合 tile 模型的不规则计算**：不规则访存、数据依赖的复杂控制流、动态并行、逐线程动态分配、图遍历类。
4. **新硬件特性有滞后**：每个后端要单独实现 lowering，新指令集通常滞后数周到数月（见 4.1 的时间线）。

### 4.5 决策规则

| 场景 | 建议 |
|---|---|
| 新算子 / 研究性算子 / 要快速迭代 | **TileLang 先写**（DeepSeek 官方做法） |
| 要追峰值性能 | 以 TileLang 版作**精度基线**，再手写底层版本 |
| 要同时跑英伟达和昇腾 | TileLang（目前唯一现实选择），但避开所有逃生舱 |
| 已有成熟库能覆盖 | 别动 |
| 不规则计算 / 非内核部分 | 别硬套 |

## 五、关键认知

> [!important] 它不是一个 CUDA 替代品，而是 CUDA 之上的一层生成器
> TileLang 最终生成的就是 CUDA C（也有 HIP C、Ascend C、Metal、LLVM IR）。所以真正的取舍不是“用不用 CUDA”，而是：
> **你愿不愿意把 layout inference、自动流水、自动同步、tile 调度的控制权交给编译器 pass。**
> 交出去，换来跨平台和开发速度；不交，就得自己手写——而 TileLang 也留好了台阶：注解、原语、autotune、IR dump、pass diff、escape hatch。

> [!note] 迁移是增量的，不是重写一遍
> 现实中没人为了迁而迁：新算子用 TileLang 写、老算子在需要改动时顺手迁、性能关键的保持手写。DeepSeek 在 V3.2-Exp 上就是**每个算子同时开源 TileLang 版和 CUDA 版、TileLang 版当基准**——这本身就是对“能不能全用 TileLang 写”最诚实的回答：能写出正确且性能不错的版本，但峰值那一档仍然留给手写。

## 六、学习与上手

- 文档站：<https://tilelang.com/>
- 练习：[tilelang-puzzles](https://github.com/tile-ai/tilelang-puzzles)（十道递进练习题）
- IDE：[tilelang-lsp](https://github.com/tile-ai/tilelang-lsp)（buffer 形状/dtype/scope/推断布局的 inlay hints）
- 昇腾 950：[Ascend 后端指南](https://github.com/tile-ai/tilelang/blob/main/tilelang/ascend/README.md)
- 昇腾 A2/A3：[tilelang-ascend](https://github.com/tile-ai/tilelang-ascend)，含编程指南与 5 讲 B 站视频课

## 附录：国内获取 GitHub 资料

> [!warning] 踩过的坑
> 直连 `github.com` 与 `raw.githubusercontent.com` 在这台机器上全部 `fetch failed`，而 `infoq.cn`、`qbitai.com`、`deepseek.com` 正常——典型的 DNS 污染或 TLS SNI 阻断，**不是“没网”**。
> 诊断三连：`nslookup github.com`（解析到 127.0.0.1/0.0.0.0 即污染）、`Test-NetConnection github.com -Port 443`、`curl.exe -v https://github.com`（TLS 阶段 reset 即 SNI 阻断）。

实测可用的镜像前缀（2026-09-30 验证，返回 200）：

```bash
curl -O https://ghproxy.net/https://raw.githubusercontent.com/owner/repo/main/file.py
git clone https://gh-proxy.com/https://github.com/owner/repo.git
# 固化到 git 配置
git config --global url."https://ghproxy.net/https://github.com/".insteadOf "https://github.com/"
```

- 同类加速前缀不止这两个（`gh-proxy.com`、`ghproxy.net` 等），**生命周期通常只有几个月，要会换**。
- `cdn.jsdelivr.net/gh/...` 这次对该仓库 302 跳回 raw.githubusercontent.com，**不能当万能替代**。
- ⚠️ 免费镜像站**只用于读**：不要 push、不要带 token 或私有仓库凭证（请求全程经过第三方）；下载二进制后校验哈希。

更稳的方案：

1. **代理 + git 走代理**：`git config --global http.proxy http://127.0.0.1:7890`；注意 `git@github.com:...`（SSH 22 端口）**不吃 http.proxy**，要么给 SSH 配 `ProxyCommand`，要么改用 `ssh.github.com:443`。其他 CLI 用 `HTTPS_PROXY` / `ALL_PROXY`。
2. **自建 Gitea 做 pull mirror**：让服务器去拉 GitHub，本地只跟 Gitea 说话（见 私密库：Gitea 私有 Git 服务），本地完全不需要代理，多设备与 CI 都友好；缺点是不能反向推。
3. **依赖层各自换源**：pip → 清华源；npm → npmmirror；HuggingFace → `hf-mirror.com`（见 [[大模型/04-部署与工具链/HuggingFace/如何在国内使用huggingface|如何在国内使用 HuggingFace]]）。

> [!danger] 已失效的老办法
> [[大模型/07-教程与课程/5分钟手把手/2. 本地部署Graphrag（Pycharm+Ollama+LM Studio）|本地部署 GraphRAG]] 里记的 hosts 写死 IP（`199.232.96.133 raw.githubusercontent.com` 等）**现在基本无效**：Fastly 的 IP 会漂移，而且 HTTPS 有 SNI 阻断，改 hosts 治不了 RST。

## 参考资料

- [tile-ai/tilelang](https://github.com/tile-ai/tilelang)（主仓库 README、changelog、后端矩阵）
- [tilelang/ascend/README.md](https://github.com/tile-ai/tilelang/blob/main/tilelang/ascend/README.md)（Ascend 950 后端指南）
- [tile-ai/tilelang-ascend](https://github.com/tile-ai/tilelang-ascend)（A2/A3 适配，ascendc / pto / npuir 三条路线）
- [TileLang: A Composable Tiled Programming Model for AI Systems](https://arxiv.org/abs/2504.17577)
- [Python Compatibility（语言边界）](https://tilelang.com/programming_guides/python_compatibility.html)
- [DeepSeek-V3.2-Exp 发布（TileLang 使用与双实现说明）](https://www.deepseek.com/news/v3-2-exp/)
- [DeepSeek 官方开源昇腾基础组件（量子位，2026-09-30）](https://www.qbitai.com/2026/09/499263.html)
- [DeepSeek 开源昇腾平台基础设施组件（InfoQ）](https://www.infoq.cn/article/t5i2Yv2z0LwIbK36lteR)

---

> [!tip] 相关笔记
> [[大模型/00-大模型学习导航|大模型学习导航]] · [[大模型/04-部署与工具链/本地部署/M3 ULTRA部署|M3 ULTRA 部署]] · [[大模型/06-论文与报告/论文学习/2025年LLM年度回顾 - Simon Willison|2025 年 LLM 年度回顾]] · [[Home|Home]]
