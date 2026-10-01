---
title: Unsloth微调Qwen3实战教程
created: 2026-01-11
tags:
  - 大模型/实战
  - Unsloth
  - Qwen3
  - LoRA
  - 量化
source: https://www.aivi.fyi/llms/Fine-Tuning-Qwen3-14B
aliases:
  - Unsloth
  - Qwen3微调
---

# Unsloth微调Qwen3实战教程

> [!abstract] 概述
> 使用 Unsloth 框架微调 Qwen3-14B 模型，从数据处理到 LoRA 微调，包含 4 比特量化配置和 LM Studio 运行指南。

## Unsloth 优势

### 性能提升

| 指标 | 改进程度 |
|------|----------|
| **训练速度** | 提高 2 倍 |
| **VRAM 使用** | 减少 70% |
| **上下文长度** | 支持 8 倍长的上下文 |
| **内存需求** | Qwen3-30B-A3B 仅需 17.5GB VRAM |

### 技术特点

- **Dynamic 2.0 量化**：在 5-shot MMLU 和 KL 散度基准测试中提供最佳性能
- **原生 128K 上下文**：支持原生 128K 上下文长度
- **多种微调技术**：支持 4bit 和 16bit 的 QLoRA/LoRA 微调
- **手动优化**：手写 GPU 核心，不更改硬件情况下提高训练速度

---

## 环境配置

### 支持的硬件

- **NVIDIA GPU**：2018 年以后（CUDA 7.0+）
- **Transformer 风格模型**：Phi-4 推理、Mixtral、MOE、Cohere 等
- **任何训练算法**：包括带 VLM 的 GRPO

### 安装 Unsloth

```bash
# 非Colab环境
pip install unsloth

# Colab环境特殊安装
pip install --no-deps bitsandbytes accelerate xformers==0.0.29.post3 \
    peft trl==0.15.2 triton cut_cross_entropy unsloth_zoo \
    sentencepiece protobuf datasets huggingface_hub hf_transfer \
    --no-deps unsloth
```

---

## 模型加载

```python
from unsloth import FastLanguageModel
import torch

fourbit_models = [
    "unsloth/Qwen3-1.7B-unsloth-bnb-4bit",
    "unsloth/Qwen3-4B-unsloth-bnb-4bit",
    "unsloth/Qwen3-8B-unsloth-bnb-4bit",
    "unsloth/Qwen3-14B-unsloth-bnb-4bit",
    "unsloth/Qwen3-32B-unsloth-bnb-4bit",
]

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="unsloth/Qwen3-14B",
    max_seq_length=2048,  # 可扩展到 40960，但使用更多内存
    load_in_4bit=True,    # 4bit 使用更少内存
    load_in_8bit=False,   # 更准确但使用2倍内存
    full_finetuning=False, # 支持全量微调
    token="",             # 使用自己的 token
)
```

---

## LoRA 配置

```python
model = FastLanguageModel.get_peft_model(
    model,
    r=32,  # LoRA秩，建议值：8, 16, 32, 64, 128
    target_modules=[
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj",
    ],
    lora_alpha=32,    # LoRA alpha值
    lora_dropout=0,    # 优化后的0值
    bias="none",       # 优化后的"none"
    use_gradient_checkpointing="unsloth",  # 梯度检查点，长上下文
    random_state=3407,
    use_rslora=False,
    loftq_config=None,
)
```

---

## 数据集准备

### Qwen3 数据集特点

Qwen3 具有**推理和非推理模式**，因此使用两种数据集：

1. **OpenMathReasoning 数据集**：用于数学推理能力
2. **FineTome-100k 数据集**：用于一般对话能力

### 数据集加载

```python
from datasets import load_dataset

# 加载数学推理数据集
reasoning_dataset = load_dataset("unsloth/OpenMathReasoning-mini",
                               split="cot", token="")

# 加载对话数据集
non_reasoning_dataset = load_dataset("mlabonne/FineTome-100k",
                                    split="train", token="")
```

### 数据转换函数

```python
def generate_conversation(examples):
    """将数学问题转换为对话格式"""
    problems = examples["problem"]
    solutions = examples["generated_solution"]

    conversations = []
    for problem, solution in zip(problems, solutions):
        conversation = [
            {"role": "user", "content": f"### Question:\n{problem}\n### Answer:"},
            {"role": "assistant", "content": f"Think step by step and put your final answer within \\boxed{{}}.\n{solution}"}
        ]
        conversations.append(conversation)

    return {"conversations": conversations}
```

---

## 训练参数配置

### 优化参数

```python
from trl import SFTTrainer
from transformers import TrainingArguments
from unsloth import is_bfloat16_supported

trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=combined_dataset,
    dataset_text_field="text",
    max_seq_length=max_seq_length,
    dataset_num_proc=2,
    packing=False,
    args=TrainingArguments(
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        warmup_steps=5,
        max_steps=60,
        learning_rate=2e-4,
        fp16=not is_bfloat16_supported(),
        bf16=is_bfloat16_supported(),
        logging_steps=1,
        optim="adamw_8bit",
        weight_decay=0.01,
        lr_scheduler_type="linear",
        seed=3407,
        output_dir="outputs",
    ),
)
```

---

## 微调后的能力

### 双模式操作

1. **普通对话模式**：适用于日常聊天场景
2. **思考模式 (Thinking Mode)**：用于解决需要推理的问题

### 数学推理能力

能够解决数学问题并展示详细的推理过程，如：

```
问题：解方程 (x + 2)^2 = 0
解答：让我逐步思考
1. (x + 2)^2 = 0
2. x + 2 = 0
3. x = -2
4. 验证：(-2 + 2)^2 = 0^2 = 0 ✓
答案：x = -2
```

---

## 量化配置

### 4bit 量化参数

```yaml
max_seq_length: 2048    # 控制上下文长度
load_in_4bit: True      # 启用4位量化，内存使用减少至1/4
load_in_8bit: False     # 稍更准确但使用2倍内存
```

### 支持的格式

- **Dynamic 2.0 GGUF**
- **动态4位**格式
- **原生128K上下文长度**版本

---

## 模型推理

### LM Studio 运行

1. **模型格式**：支持合并后的 HF 格式
2. **量化选项**：4bit/8bit/16bit 可选
3. **推理接口**：兼容 OpenAI API

### API 调用

```python
# 使用微调后的模型
response = model.chat.completions.create(
    model="qwen3-14b-legal",
    messages=[
        {"role": "system", "content": "你是一个法律助手"},
        {"role": "user", "content": "请解释合同法中的违约责任"}
    ]
)
```

---

## 实际应用优势

### vs 纯检索系统

1. **能力覆盖**：微调几乎可以做 RAG 的一切
2. **上下文保持**：外部知识直接嵌入模型，无需外部检索
3. **混合设置**：微调 + RAG 提供可靠后备方案

### 领域应用

- **医疗保健**：视觉问答 (VQA) 任务
- **法律文档**：合同分析、法规解读
- **技术文档**：API 文档解释

### 效果提升

- **精确度**：明显优于零样本预测
- **召回率**：显著改善
- **领域理解**：更好地理解领域特定细微差别

---

## 最佳实践

### 数据集建议

1. **结构化数据**：理想情况下是问答对形式
2. **高质量样本**：增强学习、理解和响应准确性
3. **领域覆盖**：涵盖目标领域的典型场景

### 资源优化

| 资源类型 | 推荐配置 |
|----------|----------|
| **GPU内存** | 16GB+ (4bit) / 32GB+ (8bit) |
| **CPU内存** | 32GB+ |
| **存储空间** | 100GB+ (模型 + 数据) |
| **网络带宽** | 充足 (模型下载) |

---

## 相关资料

- [[大模型/03-训练与微调/模型训练/微调技术/大模型微调技术综述|微调技术全景]]
- [[大模型/03-训练与微调/模型训练/微调实战/Axolotl微调法律大模型实战|Axolotl 实战]]
- [Unsloth GitHub](https://github.com/unslothai/unsloth)
- [Hugging Face 模型](https://huggingface.co/unsloth)

---

## 参考链接

- [视频教程](https://www.bilibili.com/video/BV17jGdzAETg/)
- [YouTube版本](https://youtu.be/opk1f-XtIsw)
- [开源项目](https://github.com/win4r/AISuperDomain)
- [微信联系](mailto:stoeng)
