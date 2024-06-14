---
🌻日期🌻: 2024-06-14
🌙星期🌙: 星期五
⌚️时间⌚️: 18:17:08
tags: 
---
为了实现 MySQL 主备复制（实时同步），可以使用 `mysqldump` 或 `mysqlpump` 进行全量备份，然后启用 binlog 做实时同步。这种方法确保备库从主库获取最新的更改，实现高可用性和数据一致性。以下是详细步骤：

### 1. 配置主库（Master）

#### 配置主库的 `my.cnf`

在 MySQL 主库的配置文件 `my.cnf` 中启用 binlog 并配置服务器 ID：

```ini
[mysqld]
log-bin=mysql-bin
server-id=1
binlog-do-db=your_database  # 仅复制指定的数据库
```

重新启动 MySQL 服务以应用更改：

```bash
sudo systemctl restart mysql
```

### 2. 创建复制用户

在主库上创建一个用于复制的用户，并赋予 REPLICATION SLAVE 权限：

```sql
CREATE USER 'repl'@'%' IDENTIFIED BY 'your_password';
GRANT REPLICATION SLAVE ON *.* TO 'repl'@'%';
FLUSH PRIVILEGES;
```

### 3. 进行全量备份

使用 `mysqldump` 或 `mysqlpump` 进行全量备份，并包含 master 数据库的位置。

#### 使用 `mysqldump`

```bash
mysqldump -u root -p --all-databases --single-transaction --master-data=2 > all_databases_backup.sql
```

#### 使用 `mysqlpump`

```bash
mysqlpump -u root -p --all-databases --single-transaction --include-master-logs > all_databases_backup.sql
```

### 4. 配置备库（Slave）

#### 配置备库的 `my.cnf`

在 MySQL 备库的配置文件 `my.cnf` 中配置服务器 ID：

```ini
[mysqld]
server-id=2
relay-log=relay-log
```

重新启动 MySQL 服务以应用更改：

```bash
sudo systemctl restart mysql
```

### 5. 恢复全量备份到备库

将备份文件传输到备库并恢复：

```bash
mysql -u root -p < all_databases_backup.sql
```

### 6. 配置主从复制

在备库上执行以下命令，配置主从复制。使用全量备份文件中的 binlog 文件名和位置：

```sql
CHANGE MASTER TO 
MASTER_HOST='master_host_ip',
MASTER_USER='repl',
MASTER_PASSWORD='your_password',
MASTER_LOG_FILE='mysql-bin.000001',  # 替换为备份文件中的文件名
MASTER_LOG_POS=107;                 # 替换为备份文件中的位置
```

启动复制：

```sql
START SLAVE;
```

### 7. 验证复制状态

检查复制状态，确保配置正确且复制正在进行：

```sql
SHOW SLAVE STATUS\G;
```

确保以下两行显示为 `Yes`：

```
Slave_IO_Running: Yes
Slave_SQL_Running: Yes
```

### 8. 日常管理和维护

确保定期检查复制状态，及时处理任何错误。可以通过监控工具自动化这些检查。

### 总结

通过以上步骤，你可以实现 MySQL 主备复制，确保数据实时同步。这种配置不仅提高了数据的高可用性，还可以作为灾难恢复的一部分。使用 `mysqldump` 或 `mysqlpump` 进行全量备份，然后启用 binlog 做实时同步，可以确保备库与主库保持一致。

# 用 Go 实现备份
用 Go 实现 MySQL 主从复制的自动化操作，包括修改配置文件、执行 SQL 语句、以及在主从服务器之间传输数据，可以提高部署和管理的效率。以下是如何用 Go 编写一个自动化脚本，实现上述功能的步骤：

### 1. 安装 Go MySQL 驱动

首先，确保你的 Go 环境已安装，然后安装 MySQL 驱动：

```bash
go get -u github.com/go-sql-driver/mysql
```

### 2. 编写自动化脚本

下面是一个完整的 Go 脚本示例，用于配置 MySQL 主从复制。

#### 主函数和配置结构体

```go
package main

import (
    "database/sql"
    "fmt"
    "io/ioutil"
    "log"
    "os"
    "os/exec"
    "strings"
    "time"

    _ "github.com/go-sql-driver/mysql"
)

type Config struct {
    MasterHost     string
    MasterUser     string
    MasterPassword string
    SlaveHost      string
    SlaveUser      string
    SlavePassword  string
    Database       string
    BackupFile     string
}

func main() {
    config := Config{
        MasterHost:     "master_host_ip",
        MasterUser:     "repl",
        MasterPassword: "your_password",
        SlaveHost:      "slave_host_ip",
        SlaveUser:      "root",
        SlavePassword:  "your_password",
        Database:       "your_database",
        BackupFile:     "all_databases_backup.sql",
    }

    err := setupMaster(&config)
    if err != nil {
        log.Fatalf("Failed to setup master: %v", err)
    }

    err = backupDatabase(&config)
    if err != nil {
        log.Fatalf("Failed to backup database: %v", err)
    }

    err = setupSlave(&config)
    if err != nil {
        log.Fatalf("Failed to setup slave: %v", err)
    }

    fmt.Println("MySQL replication setup completed successfully.")
}
```

#### 设置主库

```go
func setupMaster(config *Config) error {
    dsn := fmt.Sprintf("%s:%s@tcp(%s)/", config.MasterUser, config.MasterPassword, config.MasterHost)
    db, err := sql.Open("mysql", dsn)
    if err != nil {
        return err
    }
    defer db.Close()

    _, err = db.Exec("SET GLOBAL log_bin = 'mysql-bin';")
    if err != nil {
        return err
    }
    _, err = db.Exec("SET GLOBAL server_id = 1;")
    if err != nil {
        return err
    }

    return nil
}
```

#### 备份数据库

```go
func backupDatabase(config *Config) error {
    backupCmd := fmt.Sprintf("mysqldump -u %s -p%s --single-transaction --all-databases --master-data=2 > %s",
        config.MasterUser, config.MasterPassword, config.BackupFile)
    cmd := exec.Command("bash", "-c", backupCmd)
    cmd.Stdout = os.Stdout
    cmd.Stderr = os.Stderr
    err := cmd.Run()
    if err != nil {
        return err
    }

    // 将备份文件复制到从库
    scpCmd := fmt.Sprintf("scp %s %s@%s:%s",
        config.BackupFile, config.SlaveUser, config.SlaveHost, config.BackupFile)
    cmd = exec.Command("bash", "-c", scpCmd)
    cmd.Stdout = os.Stdout
    cmd.Stderr = os.Stderr
    err = cmd.Run()
    if err != nil {
        return err
    }

    return nil
}
```

#### 设置从库

```go
func setupSlave(config *Config) error {
    dsn := fmt.Sprintf("%s:%s@tcp(%s)/", config.SlaveUser, config.SlavePassword, config.SlaveHost)
    db, err := sql.Open("mysql", dsn)
    if err != nil {
        return err
    }
    defer db.Close()

    // 恢复备份
    restoreCmd := fmt.Sprintf("mysql -u %s -p%s < %s",
        config.SlaveUser, config.SlavePassword, config.BackupFile)
    cmd := exec.Command("bash", "-c", restoreCmd)
    cmd.Stdout = os.Stdout
    cmd.Stderr = os.Stderr
    err = cmd.Run()
    if err != nil {
        return err
    }

    // 获取 binlog 文件和位置
    backupContent, err := ioutil.ReadFile(config.BackupFile)
    if err != nil {
        return err
    }
    binlogFile, binlogPos := parseBinlogInfo(string(backupContent))

    // 设置从库
    changeMasterCmd := fmt.Sprintf("CHANGE MASTER TO MASTER_HOST='%s', MASTER_USER='%s', MASTER_PASSWORD='%s', MASTER_LOG_FILE='%s', MASTER_LOG_POS=%d;",
        config.MasterHost, config.MasterUser, config.MasterPassword, binlogFile, binlogPos)
    _, err = db.Exec(changeMasterCmd)
    if err != nil {
        return err
    }
    _, err = db.Exec("START SLAVE;")
    if err != nil {
        return err
    }

    // 检查复制状态
    time.Sleep(2 * time.Second)
    rows, err := db.Query("SHOW SLAVE STATUS;")
    if err != nil {
        return err
    }
    defer rows.Close()

    var (
        SlaveIORunning  string
        SlaveSQLRunning string
    )
    for rows.Next() {
        err := rows.Scan(&SlaveIORunning, &SlaveSQLRunning)
        if err != nil {
            return err
        }
    }

    if SlaveIORunning != "Yes" || SlaveSQLRunning != "Yes" {
        return fmt.Errorf("Replication not running properly: IO running: %s, SQL running: %s", SlaveIORunning, SlaveSQLRunning)
    }

    return nil
}
```

#### 解析 binlog 信息

```go
func parseBinlogInfo(backupContent string) (string, int) {
    var binlogFile string
    var binlogPos int

    lines := strings.Split(backupContent, "\n")
    for _, line := range lines {
        if strings.Contains(line, "CHANGE MASTER TO MASTER_LOG_FILE") {
            fmt.Sscanf(line, "-- CHANGE MASTER TO MASTER_LOG_FILE='%s', MASTER_LOG_POS=%d;", &binlogFile, &binlogPos)
            binlogFile = strings.Trim(binlogFile, "'")
            break
        }
    }

    return binlogFile, binlogPos
}
```

### 运行脚本

确保所有配置正确，然后运行 Go 脚本：

```bash
go run main.go
```

### 总结

通过这个 Go 脚本，你可以自动化设置 MySQL 主从复制，包含修改配置文件、执行 SQL 语句、传输数据等步骤。这种自动化操作可以极大地提高效率，减少人为错误。你可以根据实际需求进一步扩展和优化脚本。