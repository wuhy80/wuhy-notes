---
🌻日期🌻: 2024-10-08
🌙星期🌙: 星期二
⌚️时间⌚️: 10:45:50
tags:
  - kubernetes
  - longhorn
  - 存储
  - 数据恢复
---

# Longhorn 镜像文件直接读取

> [!abstract] 概述
> Longhorn 是 Kubernetes 的分布式块存储系统。当需要直接访问 Longhorn 卷中的数据（如数据恢复场景）时，可以通过 Linux 循环设备（loop device）挂载 `.img` 文件来读取内容。

## 快速参考

```bash
# 快速挂载流程
losetup -fP volume-head-000.img   # 创建循环设备
losetup -a                         # 查看设备映射
mount /dev/loop0 /mnt/img_mount   # 挂载分区
umount /mnt/img_mount             # 卸载
losetup -d /dev/loop0             # 释放设备
```

## 详细操作步骤

### 1. 创建循环设备

使用 `losetup` 命令将镜像文件关联到循环设备：

```bash
sudo losetup -fP /path/to/volume-snap-29847432-9fad-4358-8658-1cb6ab636cff.img
```

> [!tip] 参数说明
> - `-f`：自动分配一个可用的循环设备
> - `-P`：自动扫描并创建分区设备

### 2. 查看分配的循环设备

```bash
sudo losetup -a
```

输出示例：
```
/dev/loop0: [64769]:12345678 (/path/to/volume-snap-xxx.img)
```

### 3. 挂载分区

根据镜像中的分区情况挂载对应设备：

```bash
# 如果镜像包含分区表，挂载第一个分区
sudo mount /dev/loop0p1 /mnt

# 如果镜像不包含分区表，直接挂载
sudo mount /dev/loop0 /mnt
```

> [!warning] 挂载目录
> 确保挂载目录存在，如不存在需先创建：
> ```bash
> sudo mkdir -p /mnt/img_mount
> ```

### 4. 访问文件

挂载成功后，可以直接访问镜像中的文件：

```bash
ls /mnt
cp /mnt/important_data /backup/
```

### 5. 清理资源

完成操作后，务必正确卸载和释放资源：

```bash
# 卸载文件系统
sudo umount /mnt

# 释放循环设备
sudo losetup -d /dev/loop0
```

## 操作示意图

![Longhorn 镜像挂载示意](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_2/202409301155394.png)

## 常见问题

> [!faq] 无法挂载怎么办？
> - 检查镜像文件是否完整
> - 使用 `file` 命令检查镜像类型
> - 使用 `parted` 或 `fdisk` 查看分区信息
> - 确认文件系统类型，可能需要指定 `-t` 参数

## 相关链接

- [[如何进行K8S的备份恢复]] - K8S 备份恢复方案
- [[Kubernetes常见问题]] - 常见问题汇总

**返回**: [[Kubernetes]]
