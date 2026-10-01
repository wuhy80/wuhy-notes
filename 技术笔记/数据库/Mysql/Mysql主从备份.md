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
# MySQL 8.0. expire_logs_days 已弃用；保留 7 天可写成 604800 秒
binlog_expire_logs_seconds = 604800
server_id=1
```
MySQL 5.7 使用 `expire_logs_days = 7`；两者不要同时配置为不同值。
![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_2/202406180904762.png)

## 重启 Mysql POD
修改 Mysql 的 Deploy，将本地的 /data/zhanwan_backup/default_mysql 挂载到 POD 内的 /data/backup，这样执行导出到 /data/backup 目录下面的就是导出到主机上，可以防止由于数据库太大导致的 POD 内空间不足的问题。修改完成后 POD 就会重启，这样就可以同时解决修改 configmap 重启和修改本地路径挂载重启

## 创建复制用户
```sql
CREATE USER 'repl'@'10.%' IDENTIFIED BY 'repl_password';
GRANT REPLICATION REPLICA ON *.* TO 'repl'@'10.%';
-- MySQL 5.7 或较早版本使用 REPLICATION SLAVE；不要把复制用户暴露给任意来源
```
![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_2/202406180903241.png)
## 备份 MasterDB 的数据
执行下面的命令进行备份，其中用户名和密码需要根据实际环境修改。不要把密码直接写在命令行中，以免进入 shell 历史记录。
`mysqldump -u zeusroot -p --all-databases --single-transaction --source-data=2 > /data/backup/master_dump.sql`

> [!note] master-data
> `source-data=2` 会把日志坐标以注释写入备份，不会在导入时自动执行；旧版本对应参数为 `master-data=2`。这样可以先补充主库地址和 TLS 等参数，再初始化复制。

进入 mysql 的 POD 内部
![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_2/202406180914660.png)
将导出的文件 master_dump.sql 复制到备份数据库所在节点的目录 `/data/zhanwan_backup/data-backup_mysql/` 目录下去
![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_2/202406180936917.png)
复制过去后，就可以在备份 Mysql POD 内部直接访问这个 SQL 备份文件

## 导入数据到备份数据库
执行 `mysql -u zeusroot -p < /data/backup/master_dump.sql` 可以把导出的文件恢复到新数据库中，恢复完成后可以使用 `show databases` 查看恢复的数据库情况
![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_2/202406180942940.png)
## 查看恢复的位置
`head -n 30 /data/backup/master_dump.sql | grep -E "CHANGE (MASTER TO|REPLICATION SOURCE TO)"`
![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_2/202406180944552.png)
## 配置实时备份功能
备份数据库 configmap 里面的 my.cnf 要配置 server_id 为唯一值，这一点已经在对应的 yaml 配置完成，所以不需要再执行
```ini
[mysqld]
server_id=2
```

根据上面查询的日志文件和位置修改下面的配置，然后在备份 MySQL 中执行。MySQL 8.0.23+ 使用 `CHANGE REPLICATION SOURCE TO` / `START REPLICA`；旧版本才使用下方兼容语法。
注意其中的 `SOURCE_HOST` 要配置对应的 Service（包含 namespace）；如果不是默认数据库服务，需要按实际名称修改。
```mysql
-- MySQL 8.0.23+
CHANGE REPLICATION SOURCE TO
    SOURCE_HOST='mysql-service.default',  -- Master 的服务地址
    SOURCE_USER='repl',
    SOURCE_PASSWORD='repl_password',
    SOURCE_LOG_FILE='mysql-bin.000001',  -- 从导出的 SQL 文件中获取
    SOURCE_LOG_POS=2426352;              -- 从导出的 SQL 文件中获取

START REPLICA;
```

MySQL 5.7/8.0.22 及更早版本将上述语句中的 `CHANGE REPLICATION SOURCE TO`、`SOURCE_*` 和 `START REPLICA` 分别替换为 `CHANGE MASTER TO`、`MASTER_*` 和 `START SLAVE`。

![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_2/202406180947239.png)

## 检查备份状态
MySQL 8.0.23+ 使用 `SHOW REPLICA STATUS\G`（旧版本为 `SHOW SLAVE STATUS\G`，命令末尾不要再加分号）。确认 `Replica_IO_Running` 和 `Replica_SQL_Running` 都是 `Yes`，并检查 `Last_IO_Error`、`Last_SQL_Error`。
![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_2/202406180950427.png)
