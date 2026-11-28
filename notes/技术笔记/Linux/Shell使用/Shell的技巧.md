---
🌻日期🌻: 2024-10-28
🌙星期🌙: 星期一
⌚️时间⌚️: 17:34:00
tags: 
---
## 如何执行批量杀进程
`ps aux | grep '/ZW' | grep -v grep | awk '{print $2}' | xargs kill -9`
可以批量的杀死进程名称包含 ZW 的

## 如何压缩的时候忽略目录
`tar czvf client.tar.gz --exclude='omp_client/.svn/*' omp_client/`

