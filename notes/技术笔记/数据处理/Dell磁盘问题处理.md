---
🌻日期🌻: 2024-08-27
🌙星期🌙: 星期二
⌚️时间⌚️: 11:50:38
tags:
  - 磁盘
---
1. 问题是通过更新磁盘控制器的驱动解决的，结论是 Dell 官方客户给的，尚不清楚具体原因
2. 更新后磁盘自检的时候报错，需要修复文件系统
3. fsck /dev/mapper/ubuntu--vg-ubuntu--lv 执行这个命令去修复文件系统，最后执行  `echo b > /proc/sysrq-trigger` 重启操作系统
4. 更新操作是客户联系的 Dell 客户执行的，不需要我们处理


![21256985355_149205725111_89D1AB12-9221-4750-95E5-08904A11AB28.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_2/202408271148804.png)
![21256985355_149205632666_DFAAA121-828B-4d9c-BA90-F4B08CD38A0F.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_2/202408271148038.png)

![24889695152_150979804427_5nb7dwfgkdtrpjuql9y7cb6g1_0.jpg](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_2/202408271147683.jpg)

