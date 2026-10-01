---
🌻日期🌻: 2024-06-03
🌙星期🌙: 星期一
⌚️时间⌚️: 09:45:53
tags:
  - kubernetes
  - secrets
  - 安全
  - 配置管理
---

# Kubernetes Secrets 使用指南

> [!abstract] 概述
> Kubernetes Secrets 用于存储和管理敏感信息，如密码、OAuth 令牌和 SSH 密钥。Secret 的 `data` 字段只是 Base64 编码，不是加密；应配合最小权限 RBAC、API Server 的静态加密（EncryptionConfiguration）和安全的备份策略使用。

## 参考文档

- [Kubernetes Secrets 官方文档](https://kubernetes.feisky.xyz/concepts/objects/secret)

## 创建 Secret

### 1. 编码敏感数据（仅用于 YAML `data` 字段）

首先将要保存的信息通过 Base64 编码：

```bash
# 编码用户名
echo -n "admin" | base64
# 输出: YWRtaW4=

# 编码密码
echo -n "1f2d1e2e67df" | base64
# 输出: MWYyZDFlMmU2N2Rm
```

> [!warning] 注意
> `-n` 参数很重要，它防止 echo 在字符串末尾添加换行符。
> Base64 值可以被任何拿到 Secret 对象读取权限的人还原，不能把它当作密码保护或脱敏手段。更推荐用 `kubectl create secret ... --from-literal`，或在 GitOps 中使用 Sealed Secrets、SOPS 等方案。

### 2. 创建 Secret 配置文件

将编码后的内容保存到 YAML 文件中：

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: mysecret
type: Opaque
data:
  password: MWYyZDFlMmU2N2Rm
  username: YWRtaW4=
```

### 3. 应用配置

```bash
kubectl apply -f secrets.yml
```

## 使用 Secret

### 方式一：挂载为文件

通过 Volume 将 Secret 挂载到 Pod 中：

```yaml
apiVersion: v1
kind: Pod
metadata:
  labels:
    name: db
  name: db
spec:
  volumes:
    - name: secrets
      secret:
        secretName: mysecret
  containers:
    - image: gcr.io/my_project_id/pg:v1
      name: db
      volumeMounts:
        - name: secrets
          mountPath: "/etc/secrets"
          readOnly: true
      ports:
        - name: cp
          containerPort: 5432
          hostPort: 5432
```

### 验证挂载结果

进入容器后查看挂载的 Secret 文件：

```bash
# 列出 Secret 文件
ls /etc/secrets
# 输出: password  username

# 查看用户名
cat /etc/secrets/username
# 输出: admin

# 查看密码
cat /etc/secrets/password
# 输出: 1f2d1e2e67df
```

> [!tip] 自动解码
> 挂载后的文件内容已经自动解码，无需手动 Base64 解码。

### 方式二：作为环境变量

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secret-env-pod
spec:
  containers:
    - name: mycontainer
      image: redis
      env:
        - name: SECRET_USERNAME
          valueFrom:
            secretKeyRef:
              name: mysecret
              key: username
        - name: SECRET_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mysecret
              key: password
```

## Secret 类型

| 类型 | 说明 |
|------|------|
| `Opaque` | 通用类型，用于存储任意数据 |
| `kubernetes.io/service-account-token` | ServiceAccount 令牌 |
| `kubernetes.io/dockerconfigjson` | Docker 镜像仓库认证 |
| `kubernetes.io/tls` | TLS 证书 |

## 相关链接

- [[Kubernetes常见问题]] - K8S 常见问题
- [[如何进行K8S的备份恢复]] - 备份恢复方案

**返回**: [[Kubernetes]]
