---
🌻日期🌻: 2025-03-31
🌙星期🌙: 星期一
⌚️时间⌚️: 09:55:09
tags:
  - 大模型/工具
  - 大模型/HuggingFace
  - 实用技巧
aliases:
  - HuggingFace 国内访问
  - HF 镜像
---

# 如何在国内使用 HuggingFace

> [!abstract] 概述
> 在中国大陆访问 Hugging Face Hub (huggingface.co) 可能会遇到网络连接慢或不稳定的问题。本文介绍几种稳定下载和使用 HuggingFace 模型的方法。

---

## 问题背景

在中国大陆访问 Hugging Face Hub (huggingface.co) 可能会遇到网络连接慢或不稳定的问题，导致模型下载失败。有几种推荐的方法可以在国内更稳定地下载和使用 `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` 这个模型：

**方法一：使用 Hugging Face 官方中国镜像 (推荐)**

Hugging Face 提供了一个官方的镜像站点 `hf-mirror.com`，专门用于改善中国用户的访问体验。你可以通过设置环境变量来让 `transformers` 和 `sentence-transformers` 库自动从这个镜像下载。

1.  **设置环境变量**：
    在运行你的 Python 脚本之前，在终端中设置以下环境变量：
    ```bash
    export HF_ENDPOINT=https://hf-mirror.com
    ```
    *   **说明**：这个环境变量会告诉 Hugging Face 的库（包括 `transformers` 和 `sentence-transformers`）将所有对 `huggingface.co` 的请求重定向到 `hf-mirror.com`。

2.  **运行你的 Python 代码**：
    设置完环境变量后，**你的 Python 代码无需任何修改**。`SentenceTransformer` 在初始化时会自动尝试从镜像下载模型：
    ```python
    # qdrant_service.py 或其他需要加载模型的文件
    from sentence_transformers import SentenceTransformer
    import logging

    logger = logging.getLogger(__name__)

    # ... 其他代码 ...

    try:
        # 代码保持不变，库会自动使用 HF_ENDPOINT 指定的镜像
        model_name = 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2'
        logger.info(f"尝试从配置的端点加载嵌入模型：{model_name}...")
        embedding_model = SentenceTransformer(model_name)
        logger.info(f"模型 {model_name} 加载成功。")
        # vector_size = embedding_model.get_sentence_embedding_dimension() # 获取维度等后续操作
    except Exception as e:
        logger.error(f"加载模型 {model_name} 时出错: {e}", exc_info=True)
        # 这里可以根据需要决定是否抛出异常或进行其他处理
        raise  # 重新抛出异常，以便上层代码知道失败了

    # ... 后续使用 embedding_model 的代码 ...
    ```

3.  **持久化环境变量 (可选)**：
    *   如果你希望每次打开终端都自动设置这个环境变量，可以将其添加到你的 shell 配置文件中（如 `~/.bashrc` 或 `~/.zshrc`）：
        ```bash
        echo 'export HF_ENDPOINT=https://hf-mirror.com' >> ~/.bashrc
        source ~/.bashrc # 使更改立即生效
        ```
    *   如果你在 Docker 或其他服务环境中运行，请相应地配置环境变量。

**方法二：使用 ModelScope 镜像 (国内常用)**

ModelScope (魔搭社区) 是阿里巴巴达摩院推出的模型社区，也提供了 Hugging Face 模型的镜像。

1.  **安装 ModelScope (如果需要使用其库功能)**：
    虽然我们主要用它的镜像地址，但了解一下其库可能也有用。
    ```bash
    pip install modelscope -i https://pypi.tuna.tsinghua.edu.cn/simple
    ```

2.  **设置环境变量 (类似方法一)**：
    ModelScope 也可以通过 `HF_ENDPOINT` 环境变量来使用，或者有时会推荐设置 `MODELSCOPE_CACHE` 来管理缓存，但对于下载，`HF_ENDPOINT` 是关键。
    ```bash
    # 使用 ModelScope 提供的 HuggingFace 镜像地址（请查阅 ModelScope 最新文档确认地址）
    # 一个可能的地址是 (请验证)：
    # export HF_ENDPOINT=https://modelscope.oss-cn-beijing.aliyuncs.com
    # 或者查找 ModelScope 官方推荐的 HF 镜像方式

    # 更常见的是直接使用 ModelScope 库下载，见方法三
    ```
    *注意：直接将 ModelScope 的 OSS 地址设为 `HF_ENDPOINT` 可能不完全兼容所有 Hugging Face 库的功能，优先推荐官方镜像 `hf-mirror.com`。*

**方法三：手动下载模型文件，并从本地加载**

如果上述镜像方法仍有问题，或者你需要在完全离线的环境中使用，可以手动下载模型文件。

1.  **下载模型文件**：
    *   在**网络条件较好**的机器上，访问 Hugging Face 模型页面：
        [https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2/tree/main](https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2/tree/main)
        (或者通过镜像访问：`https://hf-mirror.com/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2/tree/main`)
    *   点击 "Files and versions" 标签页。
    *   下载该目录下**所有**文件（特别是 `pytorch_model.bin`、`config.json`、`tokenizer.json`、`vocab.txt`、`modules.json`、`sentence_bert_config.json` 等）。
    *   将所有下载的文件放在目标服务器上的一个**本地文件夹**内，例如：
        `/data/models/paraphrase-multilingual-MiniLM-L12-v2`

2.  **修改 Python 代码以加载本地模型**：
    在你的代码中，将模型名称替换为包含模型文件的**本地文件夹路径**。
    ```python
    # qdrant_service.py 或其他需要加载模型的文件
    from sentence_transformers import SentenceTransformer
    import logging
    import os # 引入 os 模块检查路径

    logger = logging.getLogger(__name__)

    # ... 其他代码 ...

    # --- 指定本地模型路径 ---
    local_model_path = "/data/models/paraphrase-multilingual-MiniLM-L12-v2" # <--- 修改为你实际存放模型的路径

    try:
        if not os.path.isdir(local_model_path):
             raise FileNotFoundError(f"指定的本地模型路径不存在或不是一个目录: {local_model_path}")

        logger.info(f"尝试从本地路径加载嵌入模型：{local_model_path}...")
        # 直接将本地路径传递给 SentenceTransformer
        embedding_model = SentenceTransformer(local_model_path)
        logger.info(f"模型从 {local_model_path} 加载成功。")
        # vector_size = embedding_model.get_sentence_embedding_dimension()
    except Exception as e:
        logger.error(f"从本地路径 {local_model_path} 加载模型时出错: {e}", exc_info=True)
        raise

    # ... 后续使用 embedding_model 的代码 ...
    ```

**总结与建议**：

1.  **首选方法一 (官方镜像)**：设置 `HF_ENDPOINT=https://hf-mirror.com` 环境变量。这是最简单且兼容性最好的方法，代码无需修改。
2.  **备选方法三 (手动下载)**：如果网络完全受限或需要在离线环境部署，手动下载模型到本地并修改代码指定本地路径是最可靠的方案。
3.  **关于 ModelScope (方法二/四)**：虽然 ModelScope 是国内重要的模型平台，但将其镜像地址直接用于 `HF_ENDPOINT` 的兼容性可能不如官方镜像。另一种方式是完全使用 ModelScope 的 Python SDK (`modelscope` 库) 来加载和使用模型，但这需要修改你的代码逻辑以适配 ModelScope 的 API，而不是 `sentence-transformers` 的 API。

请根据你的具体网络环境和需求选择最合适的方法。对于大多数情况，方法一应该是最方便有效的。