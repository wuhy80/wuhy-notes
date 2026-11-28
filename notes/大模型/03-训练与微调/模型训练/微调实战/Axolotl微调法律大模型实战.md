---
title: Axolotl微调法律大模型实战
created: 2026-01-11
tags:
  - 大模型/实战
  - Axolotl
  - 法律AI
  - 文本分块
  - 数据集生成
source: https://blog.stoeng.site/20240801.html
aliases:
  - Axolotl
  - 法律大模型
---

# Axolotl微调法律大模型实战

> [!abstract] 概述
> 使用 Axolotl 框架微调 Llama3.1 实现法律大模型，包括文本分块、数据集生成等完整流程。

## 项目概述

### Axolotl 简介

**Axolotl** 是一款极简开源框架，具有以下特点：

- **极简易用**：提供直观接口和丰富文档
- **高效率**：支持分布式训练，充分加速训练过程
- **快速上手**：没有深度学习背景也能快速掌握

### 应用场景

本实战项目专注于**法律文档辅助**：
- 合同分析
- 案例法研究
- 合规支持

---

## 技术架构

### 文本分块 (Text Chunking)

> [!info] 文本分块的作用
> - **控制输入长度**：确保每个输入都在模型处理能力范围内
> - **提高效率**：较小文本块处理更快，显著减少训练时间
> - **增加多样性**：增加训练样本数量和多样性
> - **保持上下文**：合理的分块确保每个块包含足够上下文信息
> - **优化内存使用**：减少内存占用，处理大型数据集

### BERT 分块技术

使用 `google-bert/bert-base-chinese` 进行**语义分块**：

```python
import torch
from transformers import BertTokenizer, BertModel
import re
import os
from scipy.spatial.distance import cosine

def get_sentence_embedding(sentence, model, tokenizer):
    """获取句子的嵌入表示"""
    inputs = tokenizer(sentence, return_tensors="pt", padding=True,
                     truncation=True, max_length=512)
    with torch.no_grad():
        outputs = model(**inputs)
    return outputs.last_hidden_state.mean(dim=1).squeeze().numpy()

def split_text_by_semantic(text, max_length, similarity_threshold=0.5):
    """基于语义相似度对文本进行分块"""
    tokenizer = BertTokenizer.from_pretrained('bert-base-chinese')
    model = BertModel.from_pretrained('bert-base-chinese')
    model.eval()

    # 按句子分割文本
    sentences = re.split(r'(。|！|？|；)', text)
    sentences = [s + p for s, p in zip(sentences[::2], sentences[1::2]) if s]

    chunks = []
    current_chunk = sentences[0]
    current_embedding = get_sentence_embedding(current_chunk, model, tokenizer)

    for sentence in sentences[1:]:
        sentence_embedding = get_sentence_embedding(sentence, model, tokenizer)
        similarity = 1 - cosine(current_embedding, sentence_embedding)

        if (similarity > similarity_threshold and
            len(tokenizer.tokenize(current_chunk + sentence)) <= max_length):
            current_chunk += sentence
            current_embedding = (current_embedding + sentence_embedding) / 2
        else:
            chunks.append(current_chunk)
            current_chunk = sentence
            current_embedding = sentence_embedding

    if current_chunk:
        chunks.append(current_chunk)

    return chunks
```

---

## 数据集生成

### 基于 API 的数据集生成

```python
import json
import os
import time
import re
from typing import List, Dict
from openai import OpenAI
import logging
import backoff

# 设置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 初始化 OpenAI 客户端
client = OpenAI(base_url="https://api.together.xyz/v1",
               api_key="your_api_key")

@backoff.on_exception(backoff.expo, Exception, max_tries=3)
def generate_single_entry(text: str) -> Dict:
    """生成单个指令数据集条目"""
    prompt = f"""
    基于以下文本，生成1个用于指令数据集的高质量条目：

    文本内容：
    {text}

    请确保生成多样化的指令类型，例如：
    - 分析类："分析..."
    - 比较类："比较..."
    - 解释类："解释..."
    - 评价类："评价..."
    - 问答类："为什么..."

    格式：
    {{
        "instruction": "具体的指令",
        "input": "额外上下文信息",
        "output": "详细回答"
    }}
    """

    try:
        response = client.chat.completions.create(
            model="meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=4098
        )

        json_match = re.search(r'\{.*\}', response.choices[0].message.content, re.DOTALL)
        if json_match:
            entry = json.loads(json_match.group())
            if entry.get('input', '').strip():
                entry['text'] = f"Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.\n### Instruction: {entry['instruction']}\n### Input: {entry['input']}\n### Response: {entry['output']}"
            else:
                entry['text'] = f"Below is an instruction that describes a task. Write a response that appropriately completes the request.\n### Instruction: {entry['instruction']}\n### Input: {entry['input']}\n### Response: {entry['output']}"

            return entry

    except Exception as e:
        logger.error(f"生成条目时发生错误: {str(e)}")
        raise

def generate_dataset(folder_path: str, entries_per_file: int = 10) -> List[Dict]:
    """生成完整数据集"""
    dataset = []
    for filename in os.listdir(folder_path):
        if filename.endswith(".txt"):
            file_path = os.path.join(folder_path, filename)
            logger.info(f"正在处理文件: {filename}")
            text = read_file(file_path)

            for j in range(entries_per_file):
                logger.info(f"  生成第 {j+1}/{entries_per_file} 个条目")
                entry = generate_single_entry(text)
                if entry:
                    dataset.append(entry)
                    logger.info(f"  成功生成 1 个完整条目")
                time.sleep(2)  # 请求间隔

    return dataset
```

---

## Axolotl 微调流程

### 1. 环境准备

```bash
# 将用户添加到docker组
sudo usermod -aG docker $USER

# 运行Axolotl容器
sudo docker run --gpus '"all"' --rm -it winglian/axolotl:main-latest

# 下载配置文件
wget -P examples/llama-3/ https://raw.githubusercontent.com/win4r/mytest/main/qlora.yml
```

### 2. 配置文件 (qlora.yml)

```yaml
base_model: NousResearch/Meta-Llama-3.1-8B
model_type: LlamaForCausalLM

# 数据集
datasets:
  - path: leo009/lawdata
    type: alpaca

# 训练参数
batch_size: 2
micro_batch_size: 1
num_epochs: 3
learning_rate: 0.0002
lr_scheduler: cosine
warmup_ratio: 0.03

# LoRA参数
lora_r: 16
lora_alpha: 32
lora_dropout: 0.1
lora_target_modules:
  - q_proj
  - v_proj
  - k_proj
  - o_proj
  - gate_proj
  - up_proj
  - down_proj

# 保存配置
save_steps: 100
logging_steps: 10
eval_steps: 100
save_total_limit: 3

# 其他配置
gradient_accumulation_steps: 8
gradient_checkpointing: true
warmup_steps: 100
max_seq_length: 2048
```

### 3. 微调命令

```bash
# 预处理数据集
CUDA_VISIBLE_DEVICES="" python -m axolotl.cli.preprocess examples/llama-3/qlora.yml

# 训练
accelerate launch -m axolotl.cli.train examples/llama-3/qlora.yml

# 推理
accelerate launch -m axolotl.cli.inference examples/llama-3/qlora.yml \
    --lora_model_dir="./outputs/qlora-out"

# Gradio界面
accelerate launch -m axolotl.cli.inference examples/llama-3/qlora.yml \
    --lora_model_dir="./outputs/qlora-out" --gradio

# 合并模型
python3 -m axolotl.cli.merge_lora examples/llama-3/qlora.yml \
    --lora_model_dir="./outputs/qlora-out"
```

---

## qLoRA 优势

### 主要优点

1. **显著降低内存需求**：通过量化模型参数并仅训练低秩适应矩阵
2. **保持模型性能**：在许多任务中可与全精度微调相媲美
3. **加快训练速度**：减少需要更新的参数数量
4. **适用于各种规模**：从较小到非常大的语言模型
5. **便于部署和共享**：微调后的模型更小、更易分享
6. **支持增量学习**：不影响原始预训练权重

### 实际效果

| 指标 | 改进程度 |
|------|----------|
| 内存使用 | 减少70% |
| 训练速度 | 提高2倍 |
| 精度保持 | 接近无损 |
| 部署成本 | 显著降低 |

---

## 相关资料

- [[大模型/03-训练与微调/模型训练/微调技术/大模型微调技术综述|微调技术全景]]
- [[大模型/03-训练与微调/模型训练/微调实战/Unsloth微调Qwen3实战|Qwen3 微调教程]]
- [Axolotl GitHub](https://github.com/OpenAccess-AI-Collective/axolotl)
- [Hugging Face数据集](https://huggingface.co/datasets/leo009/lawdata)
