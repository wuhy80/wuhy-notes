---
🌻日期🌻: 2024-05-11
🌙星期🌙: 星期六
⌚️时间⌚️: 14:07:41
tags: 
---
# etcd 启动的证书配置
```bash
/usr/local/bin/etcd \\
--cert-file=/etc/etcd/kube-etcd.pem \\                   # 对外提供服务的服务器证书
--key-file=/etc/etcd/kube-etcd-key.pem \\                # 服务器证书对应的私钥
--peer-cert-file=/etc/etcd/kube-etcd-peer.pem \\         # peer 证书，用于 etcd 节点之间的相互访问
--peer-key-file=/etc/etcd/kube-etcd-peer-key.pem \\      # peer 证书对应的私钥
--trusted-ca-file=/etc/etcd/cluster-root-ca.pem \\       # 用于验证访问 etcd 服务器的客户端证书的 CA 根证书
--peer-trusted-ca-file=/etc/etcd/cluster-root-ca.pem\\   # 用于验证 peer 证书的 CA 根证书
...
```

# 一个集群的例子
集群包含 master-one(192.0.2.201) 和 master-two(192.0.2.201) 和 node-one(192.0.2.201) 三个节点

192.0.2.201 上的 etcd 启动配置
```bash
etcd --advertise-client-urls=https://192.0.2.201:2379 
--cert-file=/etc/kubernetes/pki/etcd/server.crt 
--client-cert-auth=true 
--data-dir=/var/lib/etcd 
--experimental-initial-corrupt-check=true 
--initial-advertise-peer-urls=https://192.0.2.201:2380 
--initial-cluster=master-one=https://192.0.2.201:2380 
--key-file=/etc/kubernetes/pki/etcd/server.key 
--listen-client-urls=https://127.0.0.1:2379,https://192.0.2.201:2379 
--listen-metrics-urls=http://127.0.0.1:2381 
--listen-peer-urls=https://192.0.2.201:2380 
--name=master-one 
--peer-cert-file=/etc/kubernetes/pki/etcd/peer.crt 
--peer-client-cert-auth=true 
--peer-key-file=/etc/kubernetes/pki/etcd/peer.key 
--peer-trusted-ca-file=/etc/kubernetes/pki/etcd/ca.crt 
--snapshot-count=10000 
--trusted-ca-file=/etc/kubernetes/pki/etcd/ca.crt
```

192.0.2.201 的 etcd 启动配置
```bash
etcd --advertise-client-urls=https://192.0.2.201:2379 
--cert-file=/etc/kubernetes/pki/etcd/server.crt 
--client-cert-auth=true 
--data-dir=/var/lib/etcd 
--experimental-initial-corrupt-check=true 
--initial-advertise-peer-urls=https://192.0.2.201:2380 
--initial-cluster=master-one=https://192.0.2.201:2380,master-two=https://192.0.2.201:2380 
--initial-cluster-state=existing 
--key-file=/etc/kubernetes/pki/etcd/server.key 
--listen-client-urls=https://127.0.0.1:2379,https://192.0.2.201:2379 
--listen-metrics-urls=http://127.0.0.1:2381 
--listen-peer-urls=https://192.0.2.201:2380 
--name=master-two 
--peer-cert-file=/etc/kubernetes/pki/etcd/peer.crt 
--peer-client-cert-auth=true 
--peer-key-file=/etc/kubernetes/pki/etcd/peer.key 
--peer-trusted-ca-file=/etc/kubernetes/pki/etcd/ca.crt 
--snapshot-count=10000 
--trusted-ca-file=/etc/kubernetes/pki/etcd/ca.crt
```

211 和 214 的配置对比
![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_1/202405111410330.png)
