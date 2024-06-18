---
🌻日期🌻: 2024-06-07
🌙星期🌙: 星期五
⌚️时间⌚️: 17:06:04
tags:
  - mysql
---
# 如何做 Mysql 的主备处理
## 修改 Master 的 MySQL 配置
![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_2/202406180904581.png)
编辑配置文件，添加下面两行配置
```ini
log_bin=mysql-bin
expire_logs_days = 7
server_id=1
```
![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_2/202406180904762.png)

## 重启 Mysql POD
修改 Mysql 的 Deploy，将本地的 /data/zhanwan_backup/default_mysql 挂载到 POD 内的 /data/backup，这样执行导出到 /data/backup 目录下面的就是导出到主机上，可以防止由于数据库太大导致的 POD 内空间不足的问题。修改完成后 POD 就会重启，这样就可以同时解决修改 configmap 重启和修改本地路径挂载重启

## 创建复制用户
```sql
CREATE USER 'repl'@'%' IDENTIFIED BY 'repl_password';
GRANT REPLICATION SLAVE ON *.* TO 'repl'@'%';
FLUSH PRIVILEGES;
```
![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_2/202406180903241.png)
## 备份 MasterDB 的数据
执行下面的雨具进行备份，其中用户名密码需要根据实际进行修改
`mysqldump -u zeusroot -pzhanwanzhanchi --all-databases --single-transaction --master-data=2 > /data/backup/master_dump.sql`

> [!note] master-data
> master-data 如果不配置或者配置为 1，会自动添加 -- CHANGE MASTER TO MASTER_LOG_FILE='mysql-bin.000001', MASTER_LOG_POS=154; 的语句，但是我们实际上希望可以手动配置例如主服务器访问地址信息，所以推荐使用 master-data=2

进入 mysql 的 POD 内部
![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_2/202406180914660.png)
将导出的文件 master_dump.sql 复制到备份数据库所在节点的目录 `/data/zhanwan_backup/data-backup_mysql/` 目录下去
![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_2/202406180936917.png)
复制过去后，就可以在备份 Mysql POD 内部直接访问这个 SQL 备份文件

## 导入数据到备份数据库
执行 `mysql -u zeusroot -p < /data/backup/master_dump.sql` 可以把导出的文件恢复到新数据库中，恢复完成后可以使用 `show databases` 查看恢复的数据库情况
![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_2/202406180942940.png)
## 查看恢复的位置
`head -n 30 /data/backup/master_dump.sql | grep "CHANGE MASTER TO"`
![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_2/202406180944552.png)
## 配置实时备份功能
备份数据库 configmap 里面的 my.cnf 要配置 server_id 为唯一值，这一点已经在对应的 yaml 配置完成，所以不需要再执行
```ini
[mysqld]
server_id=2
```

根据上面查询的 MASTER_LOG_FILE 和 MASTER_LOG_POS 修改下面的配置，然后在备份 Mysql 中执行
注意其中的 MASTER_HOST，要配置对应的 service 带上 namespace，如果不是备份默认的数据库要跟着修改
```mysql
CHANGE MASTER TO
    MASTER_HOST='mysql-service.default',  -- Master 的服务地址
    MASTER_USER='repl',
    MASTER_PASSWORD='repl_password',
    MASTER_LOG_FILE='mysql-bin.000001',  -- 从导出的 SQL 文件中获取
    MASTER_LOG_POS=2426352;                -- 从导出的 SQL 文件中获取

START SLAVE;
```

![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_2/202406180947239.png)

## 检查备份状态
`SHOW SLAVE STATUS\G`
确认 Slave_IO_Running 和 Slave_SQL_Running 都是 Yes，并检查是否有任何错误。
![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_2/202406180950427.png)
