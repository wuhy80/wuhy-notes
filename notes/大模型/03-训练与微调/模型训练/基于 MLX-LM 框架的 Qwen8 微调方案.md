---
🌻日期🌻: 2025-07-12
🌙星期🌙: 星期六
⌚️时间⌚️: 21:53:19
tags:
  - 大模型/模型训练
  - 大模型/微调
  - 大模型/MLX
  - 大模型/LoRA
  - 大模型/QLoRA
  - 大模型/DoRA
  - 大模型/Qwen
  - Mac/AppleSilicon
aliases:
  - MLX微调指南
  - Qwen微调方案
  - Apple Silicon微调
---

# 基于 MLX-LM 框架的 Qwen 系列微调完整指南

> [!abstract] 文档概述
> 本文档是 Apple Silicon Mac 上使用 MLX-LM 框架微调 Qwen 系列模型的完整指南，涵盖 LoRA/QLoRA/DoRA 等多种微调方法。
>
> **更新时间**: 2025-12-30
> **适用模型**: Qwen2.5 / Qwen3 系列
> **适用硬件**: Apple Silicon M3/M4/M5 系列
>
> **相关文档**：
> - [[1. 使用Mac Book Pro本地部署大模型（Ollama+Llama3.1_8B+Docker+OpenWebUI）|Mac 本地部署大模型]]
> - [[训练的数据集构造方式]]

---

## 目录

- [[#一、MLX-LM 框架概述与 2025 年最新进展|一、MLX-LM 框架概述]]
- [[#二、硬件要求与性能预期|二、硬件要求与性能预期]]
- [[#三、数据集设计与生成|三、数据集设计与生成]]
- [[#四、模型准备与转换|四、模型准备与转换]]
- [[#五、微调方法选择|五、微调方法选择]]
- [[#六、训练配置与优化|六、训练配置与优化]]
- [[#七、训练监控与调优|七、训练监控与调优]]
- [[#八、模型评估与部署|八、模型评估与部署]]
- [[#九、最佳实践与故障排查|九、最佳实践与故障排查]]

---

## 一、MLX-LM 框架概述与 2025 年最新进展

### 1.1 MLX-LM 简介

**MLX-LM** 是基于 Apple MLX 框架的大语言模型推理和微调工具包，专为 Apple Silicon 芯片优化。

**核心优势**:
- 充分利用统一内存架构
- Metal GPU 加速
- 神经引擎支持 (M5+)
- 内存效率高
- 易于使用的 Python API

### 1.2 2025 年最新功能

根据 [MLX-LM 官方文档](https://github.com/ml-explore/mlx-lm/blob/main/mlx_lm/LORA.md) 和最新发布的 [mlx-lm-lora 包](https://pypi.org/project/mlx-lm-lora/)，MLX-LM 现已支持:

#### 微调方法

| 方法 | 描述 | 内存需求 | 性能 |
|------|------|---------|------|
| **LoRA** | 低秩适配器 | ~14GB (7B模型) | 标准 |
| **QLoRA** | 量化 LoRA | ~7GB (7B模型) | 节省 50% 内存 |
| **DoRA** | 权重分解 LoRA | ~15GB (7B模型) | 性能提升 5-10% |
| **Full** | 全参数微调 | ~28GB (7B模型) | 最高精度 |

#### 量化支持

- **4-bit 量化**: 减少 75% 内存占用
- **6-bit 量化**: 平衡性能与内存
- **8-bit 量化**: 接近全精度性能

#### M5 芯片优化

根据 [Apple 机器学习研究](https://machinelearning.apple.com/research/exploring-llms-mlx-m5)，M5 芯片带来:

- **首 Token 延迟**: 相比 M4 快 **4 倍**
- **内存带宽**: 153GB/s (vs M4 的 120GB/s)
- **性能提升**: 19-27% 综合性能提升

### 1.3 Qwen 系列模型支持

**支持的模型**:
- Qwen2.5 (1.5B - 72B)
- Qwen3 (0.5B - 32B)
- Qwen2.5-VL (多模态)
- Qwen2.5-Coder (代码专用)

**MLX Community 模型库**:
- [mlx-community/Qwen2.5-7B-Instruct-4bit](https://huggingface.co/mlx-community/Qwen2.5-7B-Instruct-4bit)
- [mlx-community/Qwen3-8B-4bit](https://huggingface.co/mlx-community/Qwen3-8B-4bit)
- [mlx-community/Qwen2.5-VL-7B-Instruct-8bit](https://huggingface.co/mlx-community/Qwen2.5-VL-7B-Instruct-8bit)

---

## 二、硬件要求与性能预期

### 2.1 硬件配置建议

基于 [Apple Silicon 微调最佳实践](https://medium.com/@neevdeb26/the-hitchhikers-guide-to-fine-tune-llms-on-a-mac-85174455457a)：

#### 不同配置性能

| 硬件配置 | 统一内存 | 推荐模型 | 训练速度 | 推理速度 |
|---------|---------|---------|---------|---------|
| **Mac Mini M4** | 16-24GB | Qwen2.5 1.5B-3B | 100 samples ~5min | 40-60 tok/s |
| **MacBook Pro M3 Pro** | 18-36GB | Qwen2.5 7B-14B | 100 samples ~10min | 15-22 tok/s |
| **MacBook Pro M4 Max** | 36-128GB | Qwen2.5 32B-72B | 100 samples ~20min | 30-45 tok/s |
| **Mac Studio M3 Ultra** | 192-512GB | Qwen3 32B + 多任务 | 100 samples ~15min | 40-60 tok/s |

### 2.2 内存需求计算

**Qwen2.5-7B 模型为例**:

```plaintext
训练方法对比:
┌─────────────────────────────────┐
│ 全精度训练:  ~28GB              │
│ LoRA (r=8):  ~14GB              │
│ QLoRA 4-bit: ~7GB               │
│ DoRA:        ~15GB              │
└─────────────────────────────────┘
```

**实用建议**:
- 16GB Mac: 适合微调 3B 模型 (QLoRA)
- 24GB Mac: 适合微调 7B 模型 (LoRA/QLoRA)
- 36GB+ Mac: 适合微调 14B-32B 模型
- 64GB+ Mac: 适合微调 72B 模型 (4-bit)

---

## 三、数据集设计与生成

### 3.1 API 调用场景数据集设计

**目标**: 训练模型准确调用特定 API 接口

#### 数据集结构

构建 **5000+ 样本**的高质量数据集：

| 数据类型 | 样本数量 | 设计要点 |
|---------|---------|---------|
| **正常参数组合** | 3000 | 覆盖所有有效参数组合 |
| **边界参数值** | 1000 | 测试极端值和边界条件 |
| **错误处理** | 500 | 无效参数、缺失字段 |
| **多轮对话** | 500 | 上下文理解能力 |

### 3.2 数据格式要求

MLX-LM 支持三种数据格式（参考 [MLX 微调教程](https://apeatling.com/articles/simple-guide-to-local-llm-fine-tuning-on-a-mac-with-mlx/)）：

#### 格式 1: Chat 格式 (推荐)

```jsonl
{
  "messages": [
    {
      "role": "system",
      "content": "你是一个精通指标查询的API助手，能够理解用户需求并生成正确的cURL命令。"
    },
    {
      "role": "user",
      "content": "查询OEE指标的关联指标，使用中文名"
    },
    {
      "role": "assistant",
      "content": "curl -X GET 'http://127.0.0.1:8000/indicator/queryRelateIndicator?indicatorNameCn=OEE'"
    }
  ]
}
```

#### 格式 2: Completion 格式

```jsonl
{
  "prompt": "查询日周期下产线A的OEE及其关联指标，时间范围为2025-07-01至2025-07-10",
  "completion": "curl -X POST 'http://127.0.0.1:8000/indicator/queryRelateIndicatorData?period=2' -H 'Content-Type: application/json' -d '{\"line\": \"A\", \"start_time\": \"2025-07-01\", \"end_time\": \"2025-07-10\"}'"
}
```

#### 格式 3: Text 格式 (适用于续写任务)

```jsonl
{
  "text": "User: 获取成本标签下2025年1月至6月的所有指标数据\nAssistant: curl -X POST 'http://127.0.0.1:8000/indicator/queryIndicatorDataByTag?period=3&tag_name=成本' -H 'Content-Type: application/json' -d '{\"start_time\": \"2025-01-01\", \"end_time\": \"2025-06-30\"}'"
}
```

### 3.3 数据生成工具

#### 方案 1: 使用 Python 脚本生成

```python
import json
import random
from datetime import datetime, timedelta

# API 模板定义
API_TEMPLATES = {
    "queryRelateIndicator": {
        "method": "GET",
        "endpoint": "http://127.0.0.1:8000/indicator/queryRelateIndicator",
        "params": ["indicatorNameCn", "indicatorNameEn", "indicatorId"]
    },
    "queryRelateIndicatorData": {
        "method": "POST",
        "endpoint": "http://127.0.0.1:8000/indicator/queryRelateIndicatorData",
        "params": ["period", "line", "start_time", "end_time"]
    },
    "queryIndicatorDataByTag": {
        "method": "POST",
        "endpoint": "http://127.0.0.1:8000/indicator/queryIndicatorDataByTag",
        "params": ["period", "tag_name", "start_time", "end_time"]
    }
}

# 指标和标签库
INDICATORS = ["OEE", "产量", "良品率", "设备利用率", "能耗"]
TAGS = ["成本", "效率", "质量", "安全"]
LINES = ["A", "B", "C", "D"]
PERIODS = {"日": 2, "周": 1, "月": 3}

def generate_time_range():
    """生成随机时间范围"""
    start = datetime(2025, random.randint(1, 12), random.randint(1, 28))
    end = start + timedelta(days=random.randint(1, 90))
    return start.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d")

def generate_api_sample(api_type):
    """生成单个 API 调用样本"""
    if api_type == "queryRelateIndicator":
        indicator = random.choice(INDICATORS)
        param_type = random.choice(["indicatorNameCn", "indicatorNameEn", "indicatorId"])

        if param_type == "indicatorId":
            param_value = random.randint(1, 100)
        else:
            param_value = indicator

        user_prompt = f"查询{indicator}指标的关联指标"
        curl_cmd = f"curl -X GET '{API_TEMPLATES[api_type]['endpoint']}?{param_type}={param_value}'"

    elif api_type == "queryRelateIndicatorData":
        indicator = random.choice(INDICATORS)
        line = random.choice(LINES)
        period_name = random.choice(list(PERIODS.keys()))
        period_value = PERIODS[period_name]
        start_time, end_time = generate_time_range()

        user_prompt = f"查询{period_name}周期下产线{line}的{indicator}及其关联指标，时间范围为{start_time}至{end_time}"
        curl_cmd = f"curl -X POST '{API_TEMPLATES[api_type]['endpoint']}?period={period_value}' -H 'Content-Type: application/json' -d '{{\"line\": \"{line}\", \"start_time\": \"{start_time}\", \"end_time\": \"{end_time}\"}}'"

    else:  # queryIndicatorDataByTag
        tag = random.choice(TAGS)
        period_name = random.choice(list(PERIODS.keys()))
        period_value = PERIODS[period_name]
        start_time, end_time = generate_time_range()

        user_prompt = f"获取{tag}标签下{start_time}至{end_time}的所有指标数据"
        curl_cmd = f"curl -X POST '{API_TEMPLATES[api_type]['endpoint']}?period={period_value}&tag_name={tag}' -H 'Content-Type: application/json' -d '{{\"start_time\": \"{start_time}\", \"end_time\": \"{end_time}\"}}'"

    return {
        "messages": [
            {
                "role": "system",
                "content": "你是一个精通指标查询的API助手，能够理解用户需求并生成正确的cURL命令调用API。"
            },
            {
                "role": "user",
                "content": user_prompt
            },
            {
                "role": "assistant",
                "content": curl_cmd
            }
        ]
    }

# 生成数据集
def generate_dataset(num_samples=5000):
    """生成完整数据集"""
    samples = []
    api_types = list(API_TEMPLATES.keys())

    for _ in range(num_samples):
        api_type = random.choice(api_types)
        sample = generate_api_sample(api_type)
        samples.append(sample)

    # 保存为 JSONL 文件
    with open("api_finetune_data.jsonl", "w", encoding="utf-8") as f:
        for sample in samples:
            f.write(json.dumps(sample, ensure_ascii=False) + "\n")

    print(f"✅ 已生成 {num_samples} 条样本，保存到 api_finetune_data.jsonl")

# 运行生成
if __name__ == "__main__":
    generate_dataset(5000)
```

#### 方案 2: 使用大模型辅助生成

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:11434/v1",  # Ollama 本地服务
    api_key="not-required"
)

SYSTEM_PROMPT = """
你是一个数据集生成助手。请根据以下API规范生成训练样本：

API 1: GET /queryRelateIndicator
参数: indicatorNameCn, indicatorNameEn, indicatorId (三选一)

API 2: POST /queryRelateIndicatorData
参数: period (1=周, 2=日, 3=月), line, start_time, end_time

API 3: POST /queryIndicatorDataByTag
参数: period, tag_name, start_time, end_time

请生成多样化的查询指令和对应的 cURL 命令。
"""

def generate_with_llm(num_samples=100):
    """使用大模型生成样本"""
    samples = []

    for i in range(num_samples):
        response = client.chat.completions.create(
            model="qwen2.5:7b",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"生成第 {i+1} 个API调用样本，格式为JSON"}
            ],
            temperature=0.8
        )

        # 解析响应并添加到样本列表
        try:
            sample = json.loads(response.choices[0].message.content)
            samples.append(sample)
        except:
            continue

    return samples
```

### 3.4 数据质量检查

```python
def validate_dataset(file_path):
    """验证数据集质量"""
    with open(file_path, "r", encoding="utf-8") as f:
        samples = [json.loads(line) for line in f]

    issues = []

    for idx, sample in enumerate(samples):
        # 检查必需字段
        if "messages" not in sample:
            issues.append(f"样本 {idx}: 缺少 messages 字段")
            continue

        messages = sample["messages"]

        # 检查角色完整性
        roles = [msg["role"] for msg in messages]
        if "user" not in roles or "assistant" not in roles:
            issues.append(f"样本 {idx}: 缺少必要角色")

        # 检查 cURL 命令格式
        assistant_msg = next((m for m in messages if m["role"] == "assistant"), None)
        if assistant_msg and not assistant_msg["content"].startswith("curl"):
            issues.append(f"样本 {idx}: assistant 响应不是 cURL 命令")

    print(f"📊 数据集统计:")
    print(f"  总样本数: {len(samples)}")
    print(f"  问题样本: {len(issues)}")
    print(f"  合格率: {(1 - len(issues)/len(samples)) * 100:.2f}%")

    if issues:
        print("\n⚠️ 发现的问题:")
        for issue in issues[:10]:  # 仅显示前10个
            print(f"  - {issue}")

    return len(issues) == 0

# 运行验证
validate_dataset("api_finetune_data.jsonl")
```

---

## 四、模型准备与转换

### 4.1 模型下载

#### 方式 1: 从 Hugging Face 下载原始模型

```bash
# 设置国内镜像加速
export HF_ENDPOINT=https://hf-mirror.com

# 下载 Qwen2.5-7B-Instruct
huggingface-cli download \
  --resume-download \
  Qwen/Qwen2.5-7B-Instruct \
  --local-dir ./models/Qwen2.5-7B-Instruct

# 下载 Qwen3-8B
huggingface-cli download \
  --resume-download \
  Qwen/Qwen3-8B \
  --local-dir ./models/Qwen3-8B
```

#### 方式 2: 直接使用 MLX Community 模型 (推荐)

```bash
# MLX Community 提供预转换的模型
huggingface-cli download \
  mlx-community/Qwen2.5-7B-Instruct-4bit \
  --local-dir ./models/Qwen2.5-7B-Instruct-MLX
```

### 4.2 模型转换 (如使用原始模型)

```bash
# 安装转换工具
pip install mlx-lm transformers

# 转换为 MLX 格式 (FP16)
mlx_lm.convert \
  --hf-path ./models/Qwen2.5-7B-Instruct \
  --mlx-path ./models/Qwen2.5-7B-Instruct-MLX \
  --dtype float16

# 转换并量化为 4-bit
mlx_lm.convert \
  --hf-path ./models/Qwen2.5-7B-Instruct \
  --mlx-path ./models/Qwen2.5-7B-Instruct-MLX-4bit \
  --quantize \
  --q-bits 4 \
  --q-group-size 64
```

### 4.3 量化性能对比

根据 [4-bit vs 8-bit 量化对比](https://www.newline.co/@zaoyang/4-bit-vs-8-bit-quantization-key-differences--842272c7)：

| 量化精度 | 模型大小 | 内存占用 | 质量损失 | 推理速度 |
|---------|---------|---------|---------|---------|
| **FP16** | ~14GB | ~16GB | 0% | 基准 |
| **8-bit** | ~7GB | ~9GB | <1% | +10% |
| **6-bit** | ~5.25GB | ~7GB | ~1-2% | +15% |
| **4-bit** | ~3.5GB | ~5GB | ~2-3% | +20% |

**选择建议**:
- **追求精度**: 使用 FP16 或 8-bit
- **内存受限**: 使用 4-bit (MacBook 16GB)
- **平衡选择**: 使用 6-bit

---

## 五、微调方法选择

### 5.1 微调方法对比

基于 [MLX LoRA 官方文档](https://github.com/ml-explore/mlx-examples/blob/main/lora/README.md)：

#### LoRA (Low-Rank Adaptation)

**原理**: 在预训练模型的权重矩阵旁添加低秩分解矩阵

```plaintext
W' = W + BA
其中:
- W: 原始权重 (frozen)
- B: 低秩矩阵 (r × d)
- A: 低秩矩阵 (d × r)
- r: 秩参数 (通常 4-64)
```

**优势**:
- 参数量减少 99%+
- 训练速度快 2-3 倍
- 内存占用减少 50%
- 可插拔,支持多任务

**配置示例**:
```python
lora_config = {
    "r": 8,                          # 秩参数
    "alpha": 32,                     # 缩放因子 (通常 2*r)
    "dropout": 0.05,                 # Dropout 率
    "target_modules": ["q_proj", "v_proj", "k_proj", "o_proj"]
}
```

#### QLoRA (Quantized LoRA)

**原理**: LoRA + 4-bit 量化

**优势**:
- 内存占用减少 75%
- 7B 模型仅需 7GB 内存
- 可在 16GB Mac 上训练 13B 模型

**适用场景**:
- 内存受限设备 (Mac Mini 16GB)
- 大模型微调 (32B+)

#### DoRA (Weight-Decomposed LoRA)

**原理**: 将权重分解为幅度和方向两部分

**优势**:
- 性能提升 5-10%
- 收敛更稳定
- 适合复杂任务

**劣势**:
- 内存占用略高于 LoRA
- 训练速度略慢

#### 全参数微调

**适用场景**:
- 数据量大 (100K+ 样本)
- 领域差异大
- 有足够硬件资源 (64GB+)

### 5.2 方法选择决策树

```plaintext
开始
  │
  ├─ 内存 < 24GB? ──→ Yes ──→ QLoRA 4-bit
  │                   │
  │                   No
  │                   ↓
  ├─ 模型 > 30B? ──→ Yes ──→ QLoRA 4-bit
  │                   │
  │                   No
  │                   ↓
  ├─ 追求最高精度? ──→ Yes ──→ DoRA
  │                   │
  │                   No
  │                   ↓
  └─ 标准场景 ──────────────→ LoRA
```

---

## 六、训练配置与优化

### 6.1 基础训练命令

#### LoRA 微调

```bash
mlx_lm.lora \
  --model mlx-community/Qwen2.5-7B-Instruct-4bit \
  --train \
  --data ./api_finetune_data.jsonl \
  --batch-size 4 \
  --lora-layers 16 \
  --iters 1000 \
  --steps-per-report 10 \
  --steps-per-eval 100 \
  --val-batches 25 \
  --learning-rate 1e-5 \
  --adapter-path ./adapters/qwen_api_lora
```

#### QLoRA 微调 (4-bit)

```bash
mlx_lm.lora \
  --model mlx-community/Qwen2.5-7B-Instruct-4bit \
  --train \
  --data ./api_finetune_data.jsonl \
  --batch-size 2 \
  --lora-layers 16 \
  --iters 1000 \
  --steps-per-report 10 \
  --learning-rate 1e-4 \
  --use-dora False \
  --adapter-path ./adapters/qwen_api_qlora
```

### 6.2 关键参数详解

#### 参数配置表

| 参数 | 推荐值 | 说明 |
|------|--------|------|
| **--model** | mlx-community/Qwen2.5-7B-Instruct-4bit | 模型路径 |
| **--data** | ./data.jsonl | 训练数据路径 |
| **--batch-size** | 2-8 | 批大小,根据内存调整 |
| **--lora-layers** | 16 | LoRA 层数 |
| **--lora-rank** | 8-16 | LoRA 秩参数 |
| **--lora-alpha** | 16-32 | LoRA 缩放因子 |
| **--lora-dropout** | 0.05 | Dropout 率 |
| **--learning-rate** | 1e-5 ~ 1e-4 | 学习率 |
| **--iters** | 1000-5000 | 训练迭代次数 |
| **--steps-per-report** | 10 | 报告间隔 |
| **--steps-per-eval** | 100 | 评估间隔 |
| **--grad-checkpoint** | True | 梯度检查点 (节省内存) |

### 6.3 高级优化技术

#### 梯度累积

```bash
# 模拟更大的批大小
mlx_lm.lora \
  --batch-size 2 \
  --grad-accumulation-steps 4 \  # 等效 batch-size=8
  ...
```

#### 学习率调度

```bash
# 余弦退火学习率
mlx_lm.lora \
  --learning-rate 1e-4 \
  --lr-schedule cosine \
  --warmup-steps 100 \  # 预热步数
  ...
```

#### 混合精度训练

```bash
# 在支持的硬件上使用 BF16
mlx_lm.lora \
  --dtype bfloat16 \
  ...
```

### 6.4 不同硬件的最佳配置

#### Mac Mini M4 (16GB)

```bash
mlx_lm.lora \
  --model mlx-community/Qwen2.5-3B-Instruct-4bit \
  --batch-size 2 \
  --lora-layers 8 \
  --lora-rank 4 \
  --grad-checkpoint True \
  --learning-rate 1e-4
```

#### MacBook Pro M3 Pro (24GB)

```bash
mlx_lm.lora \
  --model mlx-community/Qwen2.5-7B-Instruct-4bit \
  --batch-size 4 \
  --lora-layers 16 \
  --lora-rank 8 \
  --learning-rate 1e-5
```

#### MacBook Pro M4 Max (64GB)

```bash
mlx_lm.lora \
  --model mlx-community/Qwen2.5-32B-Instruct-4bit \
  --batch-size 8 \
  --lora-layers 32 \
  --lora-rank 16 \
  --use-dora True \
  --learning-rate 5e-5
```

---

## 七、训练监控与调优

### 7.1 训练进度监控

#### 实时监控

```bash
# 启用详细输出
mlx_lm.lora \
  --steps-per-report 10 \
  --verbose \
  ...
```

**输出示例**:
```plaintext
Iter 10: Train loss 2.453, Val loss 2.389, It/s 3.2
Iter 20: Train loss 2.127, Val loss 2.156, It/s 3.4
Iter 30: Train loss 1.894, Val loss 1.932, It/s 3.3
...
```

#### 性能指标

| 指标 | 说明 | 正常范围 |
|------|------|---------|
| **Train loss** | 训练损失 | 持续下降 |
| **Val loss** | 验证损失 | 与训练损失接近 |
| **It/s** | 迭代速度 | 2-5 (根据硬件) |
| **Tokens/s** | Token 处理速度 | 500-2000 |

### 7.2 损失曲线分析

```python
import json
import matplotlib.pyplot as plt

# 解析训练日志
def parse_training_log(log_file):
    """解析训练日志"""
    train_losses = []
    val_losses = []

    with open(log_file, "r") as f:
        for line in f:
            if "Train loss" in line:
                # 提取损失值
                parts = line.split(",")
                train_loss = float(parts[0].split(":")[2].strip())
                val_loss = float(parts[1].split(":")[1].strip())

                train_losses.append(train_loss)
                val_losses.append(val_loss)

    return train_losses, val_losses

# 绘制损失曲线
def plot_loss_curve(train_losses, val_losses):
    """绘制损失曲线"""
    plt.figure(figsize=(10, 6))
    plt.plot(train_losses, label="Train Loss", linewidth=2)
    plt.plot(val_losses, label="Val Loss", linewidth=2)
    plt.xlabel("Iterations")
    plt.ylabel("Loss")
    plt.title("Training Progress")
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.savefig("loss_curve.png", dpi=300)
    print("📊 损失曲线已保存到 loss_curve.png")

# 运行
train_losses, val_losses = parse_training_log("training.log")
plot_loss_curve(train_losses, val_losses)
```

### 7.3 过拟合检测

**过拟合信号**:
- 训练损失持续下降,但验证损失上升
- 训练损失与验证损失差距 > 0.5
- 模型在测试集上表现差

**解决方案**:
1. **增加 Dropout**
```bash
mlx_lm.lora --lora-dropout 0.1  # 从 0.05 增加到 0.1
```

2. **降低学习率**
```bash
mlx_lm.lora --learning-rate 5e-6  # 从 1e-5 降低到 5e-6
```

3. **早停 (Early Stopping)**
```python
# 自定义训练脚本
best_val_loss = float('inf')
patience = 0
max_patience = 5

for iteration in range(max_iters):
    train_loss = train_step()
    val_loss = validate()

    if val_loss < best_val_loss:
        best_val_loss = val_loss
        patience = 0
        save_checkpoint()
    else:
        patience += 1

    if patience >= max_patience:
        print("⚠️ 验证损失不再下降,停止训练")
        break
```

4. **增加数据**
```bash
# 使用数据增强
python augment_data.py --input data.jsonl --output data_aug.jsonl --factor 2
```

### 7.4 训练调优检查清单

- [ ] 损失曲线平滑下降
- [ ] 训练损失与验证损失接近 (差距 < 0.3)
- [ ] 迭代速度稳定 (2-5 it/s)
- [ ] GPU 利用率高 (Activity Monitor 查看)
- [ ] 内存占用在安全范围内 (< 90%)
- [ ] 定期保存检查点
- [ ] 在验证集上周期性评估

---

## 八、模型评估与部署

### 8.1 模型评估

#### 方式 1: 使用测试集评估

```bash
# 在测试集上评估
mlx_lm.lora \
  --model mlx-community/Qwen2.5-7B-Instruct-4bit \
  --adapter-path ./adapters/qwen_api_lora \
  --test \
  --data ./test_data.jsonl \
  --batch-size 4
```

#### 方式 2: 交互式测试

```python
from mlx_lm import load, generate

# 加载微调后的模型
model, tokenizer = load(
    "mlx-community/Qwen2.5-7B-Instruct-4bit",
    adapter_path="./adapters/qwen_api_lora"
)

# 测试样例
test_prompts = [
    "查询OEE指标的关联指标",
    "查询日周期下产线A的OEE及其关联指标，时间范围为2025-07-01至2025-07-10",
    "获取成本标签下2025年1月至6月的所有指标数据"
]

for prompt in test_prompts:
    response = generate(
        model,
        tokenizer,
        prompt=prompt,
        max_tokens=200,
        verbose=False
    )

    print(f"📝 用户: {prompt}")
    print(f"🤖 助手: {response}")
    print("-" * 80)
```

#### 方式 3: 自动化评估脚本

```python
import json
from mlx_lm import load, generate

def evaluate_api_accuracy(model, tokenizer, test_file):
    """评估 API 调用准确率"""
    with open(test_file, "r", encoding="utf-8") as f:
        test_samples = [json.loads(line) for line in f]

    correct = 0
    total = len(test_samples)

    for sample in test_samples:
        # 提取用户指令和期望响应
        user_msg = next(m for m in sample["messages"] if m["role"] == "user")
        expected_msg = next(m for m in sample["messages"] if m["role"] == "assistant")

        prompt = user_msg["content"]
        expected = expected_msg["content"]

        # 生成模型响应
        generated = generate(
            model, tokenizer,
            prompt=prompt,
            max_tokens=200,
            verbose=False
        ).strip()

        # 比较响应
        if generated == expected:
            correct += 1
        else:
            # 记录错误样本
            print(f"❌ 期望: {expected}")
            print(f"   实际: {generated}")
            print()

    accuracy = correct / total * 100
    print(f"📊 评估结果:")
    print(f"  总样本数: {total}")
    print(f"  正确数: {correct}")
    print(f"  准确率: {accuracy:.2f}%")

    return accuracy

# 运行评估
model, tokenizer = load(
    "mlx-community/Qwen2.5-7B-Instruct-4bit",
    adapter_path="./adapters/qwen_api_lora"
)

accuracy = evaluate_api_accuracy(model, tokenizer, "test_data.jsonl")
```

### 8.2 适配器融合

**融合的优势**:
- 部署更简单 (单一模型文件)
- 推理速度提升 5-10%
- 内存占用略微减少

```bash
# 融合适配器到基础模型
mlx_lm.fuse \
  --model mlx-community/Qwen2.5-7B-Instruct-4bit \
  --adapter-path ./adapters/qwen_api_lora \
  --save-path ./models/Qwen2.5-7B-API-Fused \
  --de-quantize  # 可选: 反量化为 FP16
```

### 8.3 模型部署

#### 部署方案 1: Python API

```python
# api_server.py
from flask import Flask, request, jsonify
from mlx_lm import load, generate

app = Flask(__name__)

# 加载模型
model, tokenizer = load(
    "mlx-community/Qwen2.5-7B-Instruct-4bit",
    adapter_path="./adapters/qwen_api_lora"
)

@app.route("/generate", methods=["POST"])
def generate_api():
    """API 调用生成端点"""
    data = request.json
    prompt = data.get("prompt", "")
    max_tokens = data.get("max_tokens", 200)

    response = generate(
        model, tokenizer,
        prompt=prompt,
        max_tokens=max_tokens,
        verbose=False
    )

    return jsonify({
        "response": response,
        "prompt": prompt
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
```

```bash
# 启动服务
python api_server.py

# 测试调用
curl -X POST http://localhost:8080/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "查询OEE指标的关联指标", "max_tokens": 200}'
```

#### 部署方案 2: 命令行工具

```bash
# 创建便捷脚本
cat > api_query.sh << 'EOF'
#!/bin/bash

PROMPT="$1"

python -c "
from mlx_lm import load, generate

model, tokenizer = load(
    'mlx-community/Qwen2.5-7B-Instruct-4bit',
    adapter_path='./adapters/qwen_api_lora'
)

response = generate(model, tokenizer, prompt='$PROMPT', max_tokens=200)
print(response)
"
EOF

chmod +x api_query.sh

# 使用
./api_query.sh "查询OEE指标的关联指标"
```

#### 部署方案 3: Swift 集成 (iOS/macOS)

```swift
// Swift 代码示例
import MLX

class APIQueryModel {
    let model: LLM

    init() {
        // 加载 MLX 模型
        self.model = LLM.load(
            modelPath: "path/to/Qwen2.5-7B-API-Fused"
        )
    }

    func generateAPICall(prompt: String) -> String {
        let response = model.generate(
            prompt: prompt,
            maxTokens: 200
        )
        return response
    }
}

// 使用示例
let apiModel = APIQueryModel()
let result = apiModel.generateAPICall(
    prompt: "查询OEE指标的关联指标"
)
print(result)
```

---

## 九、最佳实践与故障排查

### 9.1 最佳实践

#### 数据准备

1. **数据质量优先于数量**
   - 5000 条高质量样本优于 50000 条低质量样本
   - 确保指令-响应对的一致性
   - 覆盖所有边界情况

2. **数据格式规范**
   - 统一使用 Chat 格式
   - 保持 system prompt 一致
   - 避免混合多种任务

3. **数据划分**
   - 训练集: 80%
   - 验证集: 10%
   - 测试集: 10%

#### 训练配置

1. **学习率选择**
   - LoRA: 1e-5 ~ 5e-5
   - QLoRA: 1e-4 ~ 5e-4
   - 全参数: 1e-6 ~ 5e-6

2. **批大小调整**
   ```plaintext
   规则: batch_size × grad_accumulation_steps = 有效批大小

   16GB Mac: batch=2, accum=4 → 有效批=8
   24GB Mac: batch=4, accum=2 → 有效批=8
   64GB Mac: batch=8, accum=1 → 有效批=8
   ```

3. **训练迭代次数**
   - 小数据集 (< 1000): 5-10 epochs
   - 中数据集 (1000-10000): 3-5 epochs
   - 大数据集 (> 10000): 1-3 epochs

#### 模型评估

1. **多维度评估**
   - API 调用准确率
   - 参数识别准确率
   - 格式一致性
   - 错误处理能力

2. **A/B 测试**
   - 对比微调前后效果
   - 在真实场景中测试
   - 收集用户反馈

### 9.2 常见问题排查

#### 问题 1: 内存溢出

**症状**:
```
RuntimeError: Failed to allocate memory
```

**解决方案**:
```bash
# 1. 降低批大小
mlx_lm.lora --batch-size 1 ...

# 2. 启用梯度检查点
mlx_lm.lora --grad-checkpoint True ...

# 3. 使用更低的量化精度
mlx_lm.lora --model mlx-community/Qwen2.5-7B-Instruct-4bit ...

# 4. 减少 LoRA 层数
mlx_lm.lora --lora-layers 8 ...
```

#### 问题 2: 训练速度慢

**症状**:
- 迭代速度 < 1 it/s
- Token 处理速度 < 100 tok/s

**排查步骤**:
```bash
# 1. 检查 GPU 利用率
# 打开 Activity Monitor > GPU History

# 2. 关闭后台应用
# 释放系统资源

# 3. 使用更小的模型
mlx_lm.lora --model mlx-community/Qwen2.5-3B-Instruct-4bit ...

# 4. 增加批大小
mlx_lm.lora --batch-size 8 ...
```

#### 问题 3: 损失不下降

**症状**:
- 训练损失在高位震荡
- 验证损失不变

**解决方案**:
```bash
# 1. 提高学习率
mlx_lm.lora --learning-rate 1e-4 ...

# 2. 检查数据质量
python validate_dataset.py

# 3. 增加训练迭代次数
mlx_lm.lora --iters 5000 ...

# 4. 调整 LoRA 参数
mlx_lm.lora --lora-rank 16 --lora-alpha 32 ...
```

#### 问题 4: 模型生成格式错误

**症状**:
- 生成的 cURL 命令格式不正确
- 参数缺失或错误

**解决方案**:
1. **检查训练数据格式**
```python
# 确保所有样本格式一致
validate_dataset("training_data.jsonl")
```

2. **增加格式相关样本**
```python
# 添加更多正确格式的示例
generate_format_examples(num=1000)
```

3. **使用后处理**
```python
def post_process_curl(generated_text):
    """后处理生成的 cURL 命令"""
    # 提取 cURL 命令
    if "curl" in generated_text:
        start = generated_text.find("curl")
        end = generated_text.find("\n", start)
        curl_cmd = generated_text[start:end if end != -1 else None]
        return curl_cmd.strip()
    return generated_text
```

#### 问题 5: 适配器加载失败

**症状**:
```
FileNotFoundError: adapter_config.json not found
```

**解决方案**:
```bash
# 1. 检查适配器路径
ls -la ./adapters/qwen_api_lora/

# 应该包含:
# - adapters.safetensors
# - adapter_config.json

# 2. 重新训练
mlx_lm.lora --train --adapter-path ./adapters/qwen_api_lora_v2 ...

# 3. 验证适配器
python -c "
from mlx_lm import load
model, tokenizer = load(
    'mlx-community/Qwen2.5-7B-Instruct-4bit',
    adapter_path='./adapters/qwen_api_lora'
)
print('✅ 适配器加载成功')
"
```

### 9.3 性能优化检查清单

#### 训练阶段

- [ ] 使用 4-bit 量化模型
- [ ] 启用梯度检查点
- [ ] 合理设置批大小和梯度累积
- [ ] 使用学习率调度
- [ ] 定期保存检查点
- [ ] 监控内存使用率
- [ ] 关闭不必要的后台应用

#### 评估阶段

- [ ] 使用独立测试集
- [ ] 计算多维度指标
- [ ] 在真实场景测试
- [ ] 对比基线模型
- [ ] 收集错误样本

#### 部署阶段

- [ ] 融合适配器 (可选)
- [ ] 测试推理速度
- [ ] 验证内存占用
- [ ] 添加错误处理
- [ ] 实现日志记录
- [ ] 准备回滚方案

---

## 参考资源

### 官方文档
- [MLX-LM GitHub](https://github.com/ml-explore/mlx-lm)
- [MLX-LM LoRA 文档](https://github.com/ml-explore/mlx-lm/blob/main/mlx_lm/LORA.md)
- [MLX Examples](https://github.com/ml-explore/mlx-examples)
- [Apple MLX 研究 - M5 优化](https://machinelearning.apple.com/research/exploring-llms-mlx-m5)

### 教程与指南
- [Fine-Tuning LLMs with LoRA and MLX-LM](https://medium.com/@levchevajoana/fine-tuning-llms-with-lora-and-mlx-lm-c0b143642deb)
- [The Hitchhiker's Guide to Fine Tune LLMs on a Mac](https://medium.com/@neevdeb26/the-hitchhikers-guide-to-fine-tune-llms-on-a-mac-85174455457a)
- [Fine-Tuning LLMs Locally Using MLX LM](https://dzone.com/articles/fine-tuning-llms-locally-using-mlx-lm-guide)
- [A Simple Guide to Local LLM Fine-tuning on Mac](https://apeatling.com/articles/simple-guide-to-local-llm-fine-tuning-on-a-mac-with-mlx/)

### Qwen 相关
- [Qwen3 官方博客](https://qwenlm.github.io/blog/qwen3/)
- [Fine-Tuning Qwen3 - DataCamp](https://www.datacamp.com/tutorial/fine-tuning-qwen3)
- [Qwen GitHub](https://github.com/QwenLM/Qwen3)

### 社区资源
- [MLX Community on Hugging Face](https://huggingface.co/mlx-community)
- [4-bit vs 8-bit Quantization Guide](https://www.newline.co/@zaoyang/4-bit-vs-8-bit-quantization-key-differences--842272c7)

---

## 更新日志

### 2025-12-30
- 更新 M5 芯片优化信息
- 补充 Qwen2.5/Qwen3 支持
- 添加 DoRA 微调方法
- 完善 QLoRA 4/6/8-bit 量化
- 更新硬件性能基准
- 优化文档结构和排版
- 新增完整代码示例
- 添加故障排查指南

### 2025-07-12
- 初始版本发布

---

**维护者**: wuhy80
**最后更新**: 2025-12-30
**文档状态**: 已验证

---

> [!tip] 快速导航
> - 新手入门 - [[#一、MLX-LM 框架概述与 2025 年最新进展|一、MLX-LM 框架概述]]
> - 硬件选择 - [[#二、硬件要求与性能预期|二、硬件要求与性能预期]]
> - 数据准备 - [[#三、数据集设计与生成|三、数据集设计与生成]]
> - 开始训练 - [[#六、训练配置与优化|六、训练配置与优化]]
> - 问题排查 - [[#九、最佳实践与故障排查|九、最佳实践与故障排查]]