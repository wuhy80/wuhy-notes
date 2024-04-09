
![Untitled.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/04/202404092047032.png)

## 物理卷(PV)相关操作

1. 通过lvmdiskscan命令列出可被用作pv的设备
![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/04/202404092048309.png)
注：如果系统引导程序不支持LVM，则/boot不能置于LVM中。此刻必须创建一个独立的/boot分区并直接格式化后挂载到/boot。已知支持LVM的引导程序只有GRUB。

从上图可以看到//dev/sda2已经是PV了，所以只有dev/sda1、/dev/sdb1、/dev/sdb2可以用于创建PV，又因为/dev/sda1是boot引导区，所以下面我们可以对/dev/sdb1、/dev/sdb2创建PV

1. 使用pvcreate命令创建pv

```bash
root# pvcreate device1 device2 ...
```

1. 查看当前所有PV信息 可以通过pvs、pvscan、pvdisplay这三个命令查看pv信息

注意： 如果你用的是未格式化过且擦除块（erase block）大小小于1M的SSD，请采用以下命令pvcreate --dataalignment 1m /dev/sda来设置对齐（alignment）。
![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/04/202404092048828.png)
