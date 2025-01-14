---
🌻日期🌻: 2025-01-14
🌙星期🌙: 星期二
⌚️时间⌚️: 10:31:12
tags: 
---
```python
pip install ollama

from ollama import OpenAI

client = OpenAI(
    base_url='http://localhost:11434/v1/',
    api_key='ollama',  # 此处的api_key为必填项，但在ollama中会被忽略
)

chat_completion = client.chat.completions.create(
    messages=[
        {
            'role': 'user',
            'content': 'Say this is a test',
        }
    ],
    model='llama2',
)

```