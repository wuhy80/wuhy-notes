---
🌻日期🌻: 2024-07-02
🌙星期🌙: 星期二
⌚️时间⌚️: 17:34:18
tags: 
---
> [!note] 服务器状态
> https://status.deepseek.com/   

> [!note] 更新日志
> https://platform.deepseek.com/api-docs/zh-cn/updates 

> [!note] 价格信息
> https://platform.deepseek.com/api-docs/zh-cn/pricing/  

> [!note] 用量信息
> https://platform.deepseek.com/usage  

## 版本：2024-09-05[​](https://platform.deepseek.com/api-docs/zh-cn/updates#版本2024-09-05 "版本：2024-09-05的直接链接")

### `deepseek-coder` & `deepseek-chat` 升级为 DeepSeek V2.5 模型[​](https://platform.deepseek.com/api-docs/zh-cn/updates#deepseek-coder--deepseek-chat-升级为-deepseek-v25-模型 "deepseek-coder--deepseek-chat-升级为-deepseek-v25-模型的直接链接")

DeepSeek V2 Chat 和 DeepSeek Coder V2 两个模型已经合并升级，升级后的新模型为 DeepSeek V2.5。

为向前兼容，API 用户通过 `deepseek-coder` 或 `deepseek-chat` 均可以访问新的模型。

新模型在通用能力、代码能力上，都显著超过了旧版本的两个模型。

**新模型更好的对齐了人类的偏好，在写作任务、指令跟随等多方面进行了优化：**

- ArenaHard winrate从 68.3% 提升至 76.3%
- AlpacaEval 2.0 LC winrate从 46.61% 提升至 50.52%
- MT-Bench 分数从 8.84 提升至 9.02
- AlignBench 分数从 7.88 提升至 8.04

**新模型在原Coder模型的基础上进一步提升了代码生成能力，对常见编程应用场景进行了优化，并在标准测试集上取得了以下成绩：**

- HumanEval: 89%
- LiveCodeBench (1-9月): 41%

## 版本：2024-08-02[​](https://platform.deepseek.com/api-docs/zh-cn/updates#版本2024-08-02 "版本：2024-08-02的直接链接")

### API 上线硬盘缓存技术[​](https://platform.deepseek.com/api-docs/zh-cn/updates#api-上线硬盘缓存技术 "API 上线硬盘缓存技术的直接链接")

DeepSeek API 创新采用硬盘缓存，价格再降一个数量级

更新详情请跳转文档 [API 上线硬盘缓存 2024/08/02](https://platform.deepseek.com/api-docs/zh-cn/news/news0802)
## 版本：2024-07-25[​](https://platform.deepseek.com/api-docs/zh-cn/updates#版本2024-07-25 "版本：2024-07-25的直接链接")

### API 接口更新[​](https://platform.deepseek.com/api-docs/zh-cn/updates#api-接口更新 "API 接口更新的直接链接")

- **更新接口 `/chat/completions`**
    - JSON 输出
    - Function 调用
    - 对话前缀续写（Beta）
    - 8K 最长输出（Beta）
- **新增接口 `/completions`**
    - FIM 补全（Beta）

更新详情请跳转文档 [API 升级新功能 2024/07/25](https://platform.deepseek.com/api-docs/zh-cn/news/news0725)

## 版本：2024-07-24[​](https://platform.deepseek.com/api-docs/zh-cn/updates#版本2024-07-24 "版本：2024-07-24的直接链接")

### deepseek-coder[​](https://platform.deepseek.com/api-docs/zh-cn/updates#deepseek-coder "deepseek-coder的直接链接")

deepseek-coder 模型升级为 DeepSeek-Coder-V2-0724。

## 版本：2024-06-28[​](https://platform.deepseek.com/api-docs/zh-cn/updates#版本2024-06-28 "版本：2024-06-28的直接链接")

### deepseek-chat[​](https://platform.deepseek.com/api-docs/zh-cn/updates#deepseek-chat "deepseek-chat的直接链接")

模型推理能力提升，相关基准测试：

- 代码，HumanEval Pass@1 79.88% -> 84.76%
- 数学，MATH ACC@1 55.02% -> 71.02%
- 推理，BBH 78.56% -> 83.40%

在 Arena-Hard 测评中，与 GPT-4-0314 的对战胜率从 41.6% 提升到了 68.3%。

模型角色扮演能力显著增强，可以在对话中按要求扮演不同角色。

## 版本：2024-06-14[​](https://platform.deepseek.com/api-docs/zh-cn/updates#版本2024-06-14 "版本：2024-06-14的直接链接")

### deepseek-coder[​](https://platform.deepseek.com/api-docs/zh-cn/updates#deepseek-coder "deepseek-coder的直接链接")

`deepseek-coder` 模型升级为 DeepSeek-Coder-V2 Instruct，代码能力显著提升，在代码生成、代码理解、代码修复和代码补全上达到了 GPT-4-Turbo-0409 的水平，并拥有卓越的数学和推理能力，其通用能力与 DeepSeek-V2 Chat 持平。

## 版本：2024-05-17[​](https://platform.deepseek.com/api-docs/zh-cn/updates#版本2024-05-17 "版本：2024-05-17的直接链接")

### deepseek-chat[​](https://platform.deepseek.com/api-docs/zh-cn/updates#deepseek-chat-1 "deepseek-chat的直接链接")

模型在指令跟随方面的性能得到了显著提升，IFEval Benchmark Prompt-Level 准确率从 63.9% 跃升至 77.6%。此外，我们对API端的“system”区域指令跟随能力进行了优化，显著增强了沉浸式翻译、RAG 等任务的用户体验。

模型对于 JSON 格式输出的准确性得到了提升。在内部测试集中，JSON 解析率从 78% 提高到了85%。通过引入恰当的正则表达式，JSON 解析率进一步提高至 97%。