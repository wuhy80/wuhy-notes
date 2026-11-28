https://dev.mysql.com/downloads/mysql/

# 如何安装 MySQL
## 官网下载mysql安装包

下载地址：[https://dev.mysql.com/downloads/mysql/](https://dev.mysql.com/downloads/mysql/)
![](https://img2022.cnblogs.com/blog/1031555/202207/1031555-20220707225639106-807826158.png)

## 将压缩包解压到安装目录

## 以管理员身份打开cmd命令窗口
![](https://img2022.cnblogs.com/blog/1031555/202207/1031555-20220707225833485-428488913.png)

## 执行初始化命令
进入安装目录下的bin目录，执行安装命令
`mysqld --initialize --console`
 ![](https://img2022.cnblogs.com/blog/1031555/202207/1031555-20220707225416114-994000558.png)
红框部分为初始化密码。

## 安装服务
```bat
mysqld --install MySQL
net start MySQL
```
![](https://img2022.cnblogs.com/blog/1031555/202207/1031555-20220707230122461-80521187.png)

![](https://img2022.cnblogs.com/blog/1031555/202207/1031555-20220707230242898-2128858070.png)

## 服务启动后我们就可以操作数据库了

1）登录数据库，密码为上面初始化生成的密码
`mysql -u root -p`

![](https://img2022.cnblogs.com/blog/1031555/202207/1031555-20220707230534193-969090296.png)

2）修改默认密码（请替换为符合密码策略的强密码，不要使用示例值）
```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY '<StrongPassword>';
```

![](https://img2022.cnblogs.com/blog/1031555/202207/1031555-20220707231004744-176286785.png)
