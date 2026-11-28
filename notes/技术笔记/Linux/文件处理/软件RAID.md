---
🌻日期🌻: 2024-09-04
🌙星期🌙: 星期三
⌚️时间⌚️: 18:17:12
tags:
  - mdadm
---
# 如何调整同步速度
### 1. **调整RAID同步优先级**

某些RAID软件或操作系统允许你设置同步操作的优先级。可以将同步操作的优先级设置为低，以减少对其他应用程序的影响。例如，在Linux中，可以使用`nice`命令来调整进程的优先级。

### 2. **使用调度选项**

某些RAID管理工具提供了调度选项，可以在低负载时段进行同步。例如，使用`mdadm`（Linux下的RAID管理工具）时，可以通过设置`--delay`选项来控制同步的速度：

```bash
echo "1000" > /proc/sys/dev/raid/speed_limit_min 
echo "10000" > /proc/sys/dev/raid/speed_limit_max
```

- `speed_limit_min`：设置最小同步速度（以KB/s为单位）。
- `speed_limit_max`：设置最大同步速度（以KB/s为单位）。

# 如何定期执行同步

![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_2/202409041821060.png)
