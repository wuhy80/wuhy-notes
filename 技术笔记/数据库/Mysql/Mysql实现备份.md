---
🌻日期🌻: 2024-06-14
🌙星期🌙: 星期五
⌚️时间⌚️: 18:17:08
tags: 
---
为了实现 MySQL 主备复制（实时同步），可以使用 `mysqldump`（或 MySQL Shell）进行带日志坐标的全量备份，然后启用 binlog 做实时同步。`mysqlpump` 不提供与 `mysqldump --master-data` 等价的通用日志坐标选项，不能直接套用下面的复制初始化步骤。

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
CREATE USER 'repl'@'10.%' IDENTIFIED BY 'your_password';
GRANT REPLICATION REPLICA ON *.* TO 'repl'@'10.%';
-- MySQL 5.7 或更早版本使用 REPLICATION SLAVE；按备库网段收紧来源地址
```

### 3. 进行全量备份

使用 `mysqldump` 进行全量备份，并包含 source 的 binlog 位置。

#### 使用 `mysqldump`

```bash
mysqldump -u root -p --all-databases --single-transaction --source-data=2 > all_databases_backup.sql
```

MySQL 5.7/8.0.22 及更早版本使用同义的 `--master-data=2`。

> [!warning] 备份一致性
> 只有在备份包含准确的 binlog 文件和位置（或 GTID 集合）时，备库才能从正确位置开始复制；导入后应先确认坐标，再执行复制初始化。

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
CHANGE REPLICATION SOURCE TO
SOURCE_HOST='master_host_ip',
SOURCE_USER='repl',
SOURCE_PASSWORD='your_password',
SOURCE_LOG_FILE='mysql-bin.000001',  -- 替换为备份文件中的文件名
SOURCE_LOG_POS=107;                 -- 替换为备份文件中的位置
```

启动复制：

```sql
START REPLICA;
```

### 7. 验证复制状态

检查复制状态，确保配置正确且复制正在进行：

```sql
SHOW REPLICA STATUS\G
```

确保以下两行显示为 `Yes`：

```
Replica_IO_Running: Yes
Replica_SQL_Running: Yes
```

### 8. 日常管理和维护

确保定期检查复制状态，及时处理任何错误。可以通过监控工具自动化这些检查。

### 总结

通过以上步骤，你可以实现 MySQL 主备复制，确保数据实时同步。这种配置不仅提高了数据的高可用性，还可以作为灾难恢复的一部分。MySQL 5.7/8.0.22 及更早版本需将 `CHANGE REPLICATION SOURCE TO`、`SOURCE_*` 和 `START REPLICA` 替换为旧版 `CHANGE MASTER TO`、`MASTER_*` 和 `START SLAVE`。

# 用 Go 实现备份
用 Go 实现 MySQL 主从复制的自动化操作，包括修改配置文件、执行 SQL 语句、以及在主从服务器之间传输数据，可以提高部署和管理的效率。以下是如何用 Go 编写一个自动化脚本，实现上述功能的步骤：

### 1. 安装 Go MySQL 驱动

首先，确保你的 Go 环境已安装，然后安装 MySQL 驱动：

```bash
go get -u github.com/go-sql-driver/mysql
```

### 2. 编写自动化脚本

下面是一个教学用的 Go 脚本骨架，用于说明调用顺序；生产使用前还应改用安全的进程调用、从密钥管理系统读取密码，并处理 GTID、TLS、超时和幂等性。示例按 MySQL 8.0.23+ 使用 `REPLICA` 命令，旧版本需替换为兼容命令。

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
    "regexp"
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

    // log_bin 和 server_id 是启动时配置，不能通过 SET GLOBAL 动态开启；
    // 应先修改 my.cnf 并重启实例，再连接执行后续复制步骤。

    return nil
}
```

#### 备份数据库

```go
func backupDatabase(config *Config) error {
    backupCmd := fmt.Sprintf("mysqldump -u %s -p%s --single-transaction --all-databases --source-data=2 > %s",
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
    changeMasterCmd := fmt.Sprintf("CHANGE REPLICATION SOURCE TO SOURCE_HOST='%s', SOURCE_USER='%s', SOURCE_PASSWORD='%s', SOURCE_LOG_FILE='%s', SOURCE_LOG_POS=%d;",
        config.MasterHost, config.MasterUser, config.MasterPassword, binlogFile, binlogPos)
    _, err = db.Exec(changeMasterCmd)
    if err != nil {
        return err
    }
    _, err = db.Exec("START REPLICA;")
    if err != nil {
        return err
    }

    // 检查复制状态
    time.Sleep(2 * time.Second)
    rows, err := db.Query("SHOW REPLICA STATUS;")
    if err != nil {
        return err
    }
    defer rows.Close()

    columns, err := rows.Columns()
    if err != nil {
        return err
    }
    values := make([]any, len(columns))
    dest := make([]any, len(columns))
    for i := range values { dest[i] = &values[i] }
    if !rows.Next() { return fmt.Errorf("replica status is empty") }
    if err := rows.Scan(dest...); err != nil { return err }
    status := make(map[string]string, len(columns))
    for i, name := range columns { status[name] = sqlValueString(values[i]) }
    ioRunning := status["Replica_IO_Running"]
    sqlRunning := status["Replica_SQL_Running"]

    if ioRunning != "Yes" || sqlRunning != "Yes" {
        return fmt.Errorf("replication not running properly: IO running: %s, SQL running: %s", ioRunning, sqlRunning)
    }

    return nil
}

func sqlValueString(value any) string {
    if bytes, ok := value.([]byte); ok { return string(bytes) }
    if value == nil { return "" }
    return fmt.Sprint(value)
}
```

#### 解析 binlog 信息

```go
func parseBinlogInfo(backupContent string) (string, int) {
    var binlogFile string
    var binlogPos int

    re := regexp.MustCompile(`(?i)CHANGE (?:MASTER TO|REPLICATION SOURCE TO).*?(?:MASTER|SOURCE)_LOG_FILE='([^']+)'.*?(?:MASTER|SOURCE)_LOG_POS=([0-9]+)`)
    match := re.FindStringSubmatch(backupContent)
    if len(match) == 3 {
        binlogFile = match[1]
        fmt.Sscanf(match[2], "%d", &binlogPos)
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
