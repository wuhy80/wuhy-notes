# Ubuntu 离线安装
仅执行 `apt-get download` 不会自动下载依赖，直接 `dpkg -i *.deb` 也不保证安装顺序。下面给出适合没有外网机器的 `apt-offline` 流程；在线机器和离线机器必须使用相同的 Ubuntu 版本、架构和软件源。

## 使用 apt-offline

在离线机器生成请求：

```bash
sudo apt-offline set nfs.sig --update --upgrade --install-packages nfs-kernel-server,nfs-common
```

把 `nfs.sig` 带到联网机器下载软件包和依赖：

```bash
apt-offline get nfs.sig --bundle nfs-bundle.zip
```

再把 bundle 带回离线机器安装：

```bash
sudo apt-offline install nfs-bundle.zip
sudo systemctl enable --now nfs-server
```

> [!warning] 常见误区
> `dpkg -i *.deb` 只适合依赖已经齐全且顺序可控的目录。不要在真正离线机器上执行会访问公网的软件源修复命令；安装前先确认 `dpkg --print-architecture`、发行版版本和本地仓库来源一致。
