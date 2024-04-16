# 调整副本数没有变化怎么办

不仅仅是副本数调整失败，遇到所有调度相关的问题，都可以直接查看 api-server 的日志

K8S 中调整副本数量没有反应，不论是从 0 改成 1 还是改成其他数字都没有反应

![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_1/202404161552764.png)

通过命令可以查看证书  kubectl logs kube-apiserver-pdl-1 -n kube-system -f

![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_1/202404161559331.png)

遇到这种情况就重置证书，直接查看证书发现没有过期，但是证书更新之后要重启静态 POD 才行的。这种情况下，需要先将 manifest 迁移出去然后再迁移回来
![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_1/202404161605293.png)
