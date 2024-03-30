
## 如何忽略提交的文件
在.gitignore文件里面添加要忽略的文件，例如下面
```.gitignore
/.obsidian/workspace.json
/.obsidian/plugins/recent-files-obsidian/data.json
```
上面就是忽略GIT根目录下面的两个文件

如果这两个文件已经被git提交了，需要执行清除操作后再做提交
```bash
git rm --cached file.txt
git commit -m "Remove file.txt from repository"
```





| 网址                                                                                                                                                                       | 网址说明                                                | 备注          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- | ----------- |
| [https://zhuanlan.zhihu.com/p/607342100](https://zhuanlan.zhihu.com/p/607342100)                                                                                         | 关于k8s中ETCD集群备份灾难恢复的一些笔记                             |             |
| [https://blog.csdn.net/monarch91/article/details/127485986](https://blog.csdn.net/monarch91/article/details/127485986)                                                   | 故障排查：k8s集群中的Etcd启动失败（Failed to bring up Etcd Plane） | 由于镜像残留导致的问题 |
| [https://kubernetes.feisky.xyz/](https://kubernetes.feisky.xyz/)                                                                                                         | Kubernetes指南                                        |             |
| [https://kubernetes.io/zh-cn/](https://kubernetes.io/zh-cn/)                                                                                                             | Kubernetes官方中文站点                                    |             |
| [https://cloud.redhat.com/blog/kubernetes-deep-dive-code-generation-customresources](https://cloud.redhat.com/blog/kubernetes-deep-dive-code-generation-customresources) | 如何做Kubernetes的CRD代码生成                               |             |
| [https://blog.x2b.net/1964569963/#本地挂载](https://blog.x2b.net/1964569963/#%E6%9C%AC%E5%9C%B0%E6%8C%82%E8%BD%BD)                                                           | 使用 Longhorn 作为 K8s 后端储存                             |             |
| [http://www.mydlq.club/article/115/](http://www.mydlq.club/article/115/)                                                                                                 | 解决 Kubernetes 中节点经常性 DiskPressure(磁盘压力) 的问题         |             |
