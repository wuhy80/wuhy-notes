---
🌻日期🌻: 2024-06-03
🌙星期🌙: 星期一
⌚️时间⌚️: 09:45:53
tags: 
---
## 如何创建 Secret
用下面的方式将要保存的信息通过 base64 编码
```shell
$ echo -n "admin" | base64
YWRtaW4=
$ echo -n "1f2d1e2e67df" | base64
MWYyZDFlMmU2N2Rm
```
将编码后的内容保存到 secret 里面去，最后 `kubectl apply -f secrets.yml` 生效
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

## 如何使用 Secret
### 挂载文件
通过下面的方式将
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