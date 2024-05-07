---
🌻日期🌻: 2024-05-07
🌙星期🌙: 星期二
⌚️时间⌚️: 13:39:05
tags: 
---
/etc/docker/daemon.json

```json 
{
        "registry-mirrors": ["https://ake33s4p.mirror.aliyuncs.com"],
        "insecure-registries": ["192.0.2.201:5000", "192.0.2.90", "192.0.2.90:80"],
        "exec-opts": ["native.cgroupdriver=systemd"]
}
```

修改了 daemon 文件之后需要执行 systemctl restart docker 来生效，执行这个配置后会将 192.0.2.90 不再强制使用 https


