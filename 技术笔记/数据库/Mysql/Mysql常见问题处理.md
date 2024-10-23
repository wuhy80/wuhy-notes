---
🌻日期🌻: 2024-10-23
🌙星期🌙: 星期三
⌚️时间⌚️: 09:57:19
tags: 
---
# 如何修改 mysql 连接数限制
1. **查看当前连接数限制相关参数**
   - 在MySQL 5.7中，可以通过以下命令查看当前的最大连接数限制参数 `max_connections` 的值：
   ```sql
   SHOW VARIABLES LIKE 'max_connections';
   ```
   - 这个命令会返回一个包含变量名（`Variable_name`）和变量值（`Value`）的结果集，其中 `Value` 列显示的就是当前 `max_connections` 的值。

2. **修改配置文件来改变连接数限制（推荐方法）**
   - **找到配置文件位置**：
     - 在Linux系统中，MySQL 5.7的配置文件通常是 `/etc/my.cnf` 或 `/etc/mysql/my.cnf`。在Windows系统中，配置文件一般是 `C:\Program Files\MySQL\MySQL Server 5.7\my.ini` 或 `C:\ProgramData\MySQL\MySQL Server 5.7\my.ini`（注意，`ProgramData` 文件夹可能是隐藏的）。
   - **修改配置文件中的参数**：
     - 在配置文件的 `[mysqld]` 部分添加或修改 `max_connections` 参数。例如，将最大连接数设置为 500，可以这样写：
     ```
     [mysqld]
     max_connections = 500
     ```
     - 保存配置文件后，需要重启 MySQL 服务才能使新的连接数限制生效。在 Linux 系统中，可以使用以下命令重启 MySQL（具体命令可能因 Linux 发行版和安装方式而异）：
     ```
     service mysql restart
     ```
     - 在Windows系统中，可以通过服务管理器找到 `MySQL` 服务，然后右键选择“重启”。

3. **通过 SQL 命令临时修改连接数限制（不推荐长期使用）**
   - 可以使用以下 SQL 命令来临时修改最大连接数限制：
   ```sql
   SET GLOBAL max_connections = 500;
   ```
   - 这种方法可以在不重启服务器的情况下立即改变最大连接数限制，但这种修改是临时的。一旦MySQL服务重启，`max_connections` 参数会恢复到配置文件中设置的值或者默认值。所以这种方法通常用于临时测试或紧急情况，长期稳定的设置还是应该通过修改配置文件来完成。

# 解决连接长时间不释放的问题
1. **关于 `interactive_timeout` 和 `wait_timeout` 参数的作用**
   - 在MySQL 5.7中，`interactive_timeout`和`wait_timeout`这两个参数都用于控制连接的超时时间。
   - `interactive_timeout`主要应用于交互式连接，比如通过`mysql`命令行客户端建立的连接。当一个交互式连接处于空闲状态达到`interactive_timeout`设定的秒数后，MySQL服务器会自动断开该连接。
   - `wait_timeout`适用于非交互式连接，例如通过应用程序建立的数据库连接。如果一个非交互式连接空闲时间超过`wait_timeout`规定的秒数，服务器也会将其断开。

2. **执行这两个命令是否有用的分析**
   - **临时修改有效**：
     - 在MySQL 5.7中，执行`set global interactive_timeout = 120;`和`set global wait_timeout = 120;`这两个命令是有用的。这两个命令会临时改变MySQL服务器全局的`interactive_timeout`和`wait_timeout`参数值。这意味着新建立的连接（无论是交互式还是非交互式）将按照新设置的超时时间（120秒）来处理空闲连接。例如，如果有一个应用程序建立的数据库连接空闲超过120秒，服务器会根据`wait_timeout`的新设置断开该连接，以释放资源。
   - **持久化问题**：
     - 不过，这种修改是临时的。如果MySQL服务重启，这两个参数会恢复到原来的值（通常是默认值或者配置文件中设置的值）。要使修改永久生效，需要在MySQL的配置文件（通常是`my.cnf`或者`my.ini`）中添加或修改以下行：
     ```
     [mysqld]
     interactive_timeout = 120
     wait_timeout = 120
     ```
     - 然后重启MySQL服务，这样每次启动后，服务器都会按照配置文件中的设置来处理连接超时时间。