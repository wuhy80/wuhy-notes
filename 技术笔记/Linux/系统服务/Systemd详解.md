---
🌻日期🌻: 2024-10-31
🌙星期🌙: 星期四
⌚️时间⌚️: 09:51:08
tags: 
---
## 配置文件的目录

1. `/lib/systemd/system/`：
    - 这个目录通常存放系统自带的服务单元文件以及由软件包安装的服务配置。
    - 这些配置文件是系统默认的，一般不建议直接修改。如果需要对某个服务进行定制化配置，可以通过创建 Drop-in 文件或者在`/etc/systemd/system/`目录下创建覆盖配置文件的方式来实现。
2. `/etc/systemd/system/`：
    - 这个目录用于存放管理员自定义的服务单元文件或者对系统默认服务单元文件的覆盖配置。
    - 管理员可以在这里创建新的服务配置文件，或者对已有的服务进行定制化修改。例如，可以创建一个名为`mycustom.service`的文件来定义一个自定义服务，或者创建一个覆盖配置文件来修改系统默认服务的参数。
3. `/run/systemd/system/`：
    - 这个目录通常用于存放运行时生成的服务单元文件或者临时的配置。
    - 一些动态生成的服务或者在运行时修改的配置可能会出现在这个目录下。不过，这些配置通常是临时的，在系统重启后可能会丢失。

Drop In 文件路径 `/etc/systemd/system/<service_name>.service.d/` 位置，“Drop-in” 是一种 Systemd 的配置扩展机制，允许在不直接修改原始服务单元文件的情况下，对服务的配置进行局部调整。

## Kubelet 举例
Service 文件 `/lib/systemd/system/kubelet.service`
```ini
[Unit]
Description=kubelet: The Kubernetes Node Agent
Documentation=https://kubernetes.io/docs/home/
Wants=network-online.target
After=network-online.target

[Service]
ExecStart=/usr/bin/kubelet
Restart=always
StartLimitInterval=0
RestartSec=10

[Install]
WantedBy=multi-user.target
```
Drop In 配置 `/etc/systemd/system/kubelet.service.d` 
```ini
# Note: This dropin only works with kubeadm and kubelet v1.11+
[Service]
Environment="KUBELET_KUBECONFIG_ARGS=--bootstrap-kubeconfig=/etc/kubernetes/bootstrap-kubelet.conf --kubeconfig=/etc/kubernetes/kubelet.conf"
Environment="KUBELET_CONFIG_ARGS=--config=/var/lib/kubelet/config.yaml"
# This is a file that "kubeadm init" and "kubeadm join" generates at runtime, populating the KUBELET_KUBEADM_ARGS variable dynamically
EnvironmentFile=-/var/lib/kubelet/kubeadm-flags.env
# This is a file that the user can use for overrides of the kubelet args as a last resort. Preferably, the user should use
# the .NodeRegistration.KubeletExtraArgs object in the configuration files instead. KUBELET_EXTRA_ARGS should be sourced from this file.
EnvironmentFile=-/etc/default/kubelet
ExecStart=
ExecStart=/usr/bin/kubelet $KUBELET_KUBECONFIG_ARGS $KUBELET_CONFIG_ARGS $KUBELET_KUBEADM_ARGS $KUBELET_EXTRA_ARGS
```

上面的配置会导致 ps aux 看到的 kubelet 是这样的 `/usr/bin/kubelet --bootstrap-kubeconfig=/etc/kubernetes/bootstrap-kubelet.conf --kubeconfig=/etc/kubernetes/kubelet.conf --config=/var/lib/kubelet/config.yaml --container-runtime=remote --container-runtime-endpoint=unix:///var/run/containerd/containerd.sock --pod-infra-container-image=zhanwan.com:5000/pause:3.7`


