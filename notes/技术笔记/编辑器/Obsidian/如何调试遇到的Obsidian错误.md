---
🌻日期🌻: 2024-04-08
🌙星期🌙: 星期一
⌚️时间⌚️: 09:19:00
tags:
  - obsidian
  - 调试
  - 故障排除
---

# 如何调试 Obsidian 错误

当 Obsidian 出现问题时，可以通过开发者工具查看错误信息，快速定位问题原因。

## 相关笔记

- [[一些小技巧|Obsidian 使用技巧]]

---

## 打开开发者控制台

参考文章：[Obsidian 调试指南](https://juejin.cn/post/7181595295086542909)

通过 `Ctrl+Shift+I` 打开控制台，就可以看到报错信息。

![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_1/202404080919648.png)

上面是打开一个日志文件失败后的打印，可以看到是插件obsidian-icon报错导致的，关闭这个插件之后功能可以正常使用
