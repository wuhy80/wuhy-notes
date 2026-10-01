---
🌻日期🌻: 2024-05-07
🌙星期🌙: 星期二
⌚️时间⌚️: 09:19:30
tags:
  - vscode
  - ai
  - 编程工具
---

# VSCode AI 辅助编程

本文档介绍在 VSCode 中使用 AI 辅助编程的几种方式。

## 相关笔记

- [[如何实现免密登录|VSCode 远程免密登录]]

---

# Continue 插件

## 自定义大模型

配置文件如下，使用 deepseek 的大模型，这个大模型的效果好而且价格很便宜。

## 使用 Continue 进行 AI 辅助代码编写

Continue 主要有两种使用方式：

> [! tip] Ctrl + L 选中代码
> 选中需要的代码，按下 Ctrl+L 快捷键后，Continue 界面就会弹出来，并将选中的代码插入到聊天框中，这时候你可以让它帮你编写单元测试，或者检查可能存在的 bug。

> [!tip] Ctrl + I 插入代码
> 在代码的任意位置按下 Ctrl + I，会弹出一个小的 prompt 输入框，你可以输入需求让它快速生成。

## 配置文件
```json
{
  "models": [
    {
      "title": "deepseek",
      "provider": "openai",
      "model": "deepseek-coder",
      "apiBase": "https://api.deepseek.com",
      "apiKey": "***REMOVED***",
      "apiType": "openai"
    }
  ],
  "customCommands": [
    {
      "name": "test",
      "prompt": "{{{ input }}}\n\nWrite a comprehensive set of unit tests for the selected code. It should setup, run tests that check for correctness including important edge cases, and teardown. Ensure that the tests are complete and sophisticated. Give the tests just as chat output, don't edit any file.",
      "description": "Write unit tests for highlighted code"
    }
  ],
  "tabAutocompleteModel": {
    "title": "deepseek",
    "provider": "deepseek",
    "model": "deepseek-coder"
  },
  "allowAnonymousTelemetry": true,
  "contextProviders": [
    {
      "name": "code",
      "params": {}
    },
    {
      "name": "docs",
      "params": {}
    }
  ]
}
```

# 通义灵码
https://tongyi.aliyun.com/lingma/
![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_1/202405070921415.png)

# FittenCode
https://code.fittentech.com/
![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_1/202405070921717.png)
