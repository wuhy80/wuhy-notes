---
🌻日期🌻: 2024-10-23
🌙星期🌙: 星期三
⌚️时间⌚️: 09:57:19
tags: 
---
# 如何修改 mysql 连接数限制
1. **查看当前连接数限制相关参数**
   - MySQL 5.7 和 8.0 都可以通过以下命令查看最大连接数、当前连接和历史峰值：
   ```sql
   SHOW VARIABLES LIKE 'max_connections';
   SHOW GLOBAL STATUS LIKE 'Threads_connected';
   SHOW GLOBAL STATUS LIKE 'Max_used_connections';
   ```
   - 这个命令会返回一个包含变量名（`Variable_name`）和变量值（`Value`）的结果集，其中 `Value` 列显示的就是当前 `max_connections` 的值。

2. **修改配置文件来改变连接数限制（推荐方法）**
   - **找到配置文件位置**：
     - Linux 常见位置是 `/etc/my.cnf`、`/etc/mysql/my.cnf` 或 `/etc/mysql/mysql.conf.d/mysqld.cnf`；Windows 常见位置是 `C:\ProgramData\MySQL\MySQL Server 8.0\my.ini`。可执行 `mysqld --verbose --help` 查看配置文件搜索顺序。
   - **修改配置文件中的参数**：
     - 在配置文件的 `[mysqld]` 部分添加或修改 `max_connections` 参数。例如，将最大连接数设置为 500，可以这样写：
     ```
     [mysqld]
     max_connections = 500
     ```
     - 保存配置文件后，需要重启 MySQL 服务才能使新的连接数限制生效。在 Linux 系统中，可以使用以下命令重启 MySQL（具体命令可能因 Linux 发行版和安装方式而异）：
     ```
     sudo systemctl restart mysql
     ```
     - 在Windows系统中，可以通过服务管理器找到 `MySQL` 服务，然后右键选择“重启”。

3. **通过 SQL 命令临时修改连接数限制（不推荐长期使用）**
   - 可以使用以下 SQL 命令来临时修改最大连接数限制：
   ```sql
   SET GLOBAL max_connections = 500;
   ```
   - `SET GLOBAL` 只影响后续新连接，实例重启后失效。MySQL 8.0 可使用 `SET PERSIST max_connections = 500;` 写入 `mysqld-auto.cnf`；采用配置管理时仍建议在主配置文件中维护唯一来源。

> [!warning] 不要只提高数字
> 每个连接都会消耗内存、线程和文件描述符。调整前应结合 `Max_used_connections`、连接池规模、`open_files_limit` 和服务器内存评估；连接耗尽通常还需要排查慢查询、事务未提交和连接泄漏。

# 解决连接长时间不释放的问题
1. **关于 `interactive_timeout` 和 `wait_timeout` 参数的作用**
   - MySQL 5.7 和 8.0 中，`interactive_timeout` 和 `wait_timeout` 都用于控制空闲连接超时。
   - `interactive_timeout`主要应用于交互式连接，比如通过`mysql`命令行客户端建立的连接。当一个交互式连接处于空闲状态达到`interactive_timeout`设定的秒数后，MySQL服务器会自动断开该连接。
   - `wait_timeout`适用于非交互式连接，例如通过应用程序建立的数据库连接。如果一个非交互式连接空闲时间超过`wait_timeout`规定的秒数，服务器也会将其断开。

2. **执行这两个命令是否有用的分析**
   - **临时修改有效**：
     - 执行 `SET GLOBAL interactive_timeout = 120;` 和 `SET GLOBAL wait_timeout = 120;` 会影响之后创建的连接，不会回写已有会话的 session 变量。应用连接主要受 `wait_timeout` 控制。
   - **持久化问题**：
     - 不过，这种修改是临时的。如果MySQL服务重启，这两个参数会恢复到原来的值（通常是默认值或者配置文件中设置的值）。要使修改永久生效，需要在MySQL的配置文件（通常是`my.cnf`或者`my.ini`）中添加或修改以下行：
     ```
     [mysqld]
     interactive_timeout = 120
     wait_timeout = 120
     ```
     - 然后重启MySQL服务，这样每次启动后，服务器都会按照配置文件中的设置来处理连接超时时间。

> [!warning] 连接池注意事项
> `120` 秒并不是通用推荐值。数据库超时短于连接池的最大空闲时间时，应用可能复用已被服务端关闭的连接。应同时配置连接池的健康检查、最大生命周期和空闲时间，并修复未关闭 ResultSet/事务等根因。
