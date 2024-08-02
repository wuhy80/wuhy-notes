---
🌻日期🌻: 2024-08-02
🌙星期🌙: 星期五
⌚️时间⌚️: 15:40:13
tags: 
---
https://docs.rancher.cn/docs/k3s/quick-start/_index/

```bash
# 
curl -sfL https://rancher-mirror.rancher.cn/k3s/k3s-install.sh | INSTALL_K3S_MIRROR=cn sh -
# 添加节点
curl -sfL https://rancher-mirror.rancher.cn/k3s/k3s-install.sh | INSTALL_K3S_MIRROR=cn K3S_URL=https://myserver:6443 K3S_TOKEN=mynodetoken sh -
```

启动后修改/etc/systemd/system/k3s.service 文件，添加--pause-image 参数 `ExecStart=/usr/local/bin/k3s server --pause-image=192.0.2.90/library/pause:3.7 --kubelet-arg="--insecure-registry=192.0.2.90"`

编辑 /etc/rancher/k3s/registries.yaml 配置私有仓库信息
```yaml
mirrors:
192.0.2.90:
  endpoint:
    - "http://192.0.2.90"
docker.io:
  endpoint:
    - "http://192.0.2.90"
```

