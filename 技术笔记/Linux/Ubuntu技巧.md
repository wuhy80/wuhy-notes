# Ubuntu 离线安装
用下面的命令可以实现离线安装 NFS 的功能
```bash
apt-get download nfs-kernel-server nfs-common
dpkg -i *.deb
```
