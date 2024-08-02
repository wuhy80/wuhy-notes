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

