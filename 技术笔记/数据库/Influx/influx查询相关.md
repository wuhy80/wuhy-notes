---
🌻日期🌻: 2024-05-17
🌙星期🌙: 星期五
⌚️时间⌚️: 09:35:35
tags: influx
---
要查看 InfluxDB 数据库中的内容，你可以使用以下命令：

### 1. 查看所有数据库
```sh
SHOW DATABASES
```

### 2. 切换到特定数据库
```sh
USE <database_name>
```

### 3. 查看所有保留策略
```sh
SHOW RETENTION POLICIES ON <database_name>
```

### 4. 查看所有测量（Measurements）
```sh
SHOW MEASUREMENTS
```

### 5. 查看特定测量中的所有 series
```sh
SHOW SERIES FROM "<measurement>"
```

### 6. 查看特定测量中的所有字段（Fields）
```sh
SHOW FIELD KEYS FROM "<measurement>"
```

### 7. 查看特定测量中的所有标签（Tags）
```sh
SHOW TAG KEYS FROM "<measurement>"
```

### 示例
假设数据库名为 `mydb`，测量名为 `cpu`：

```sh
USE mydb
SHOW MEASUREMENTS
SHOW SERIES FROM "cpu"
SHOW FIELD KEYS FROM "cpu"
SHOW TAG KEYS FROM "cpu"
```

这些命令将帮助你全面了解数据库中的内容。

## 指定范围查询
下面的查询是指定了开始时间和结束时间的查询，查询结果按时间倒排，且限制最多 500 条
startAt 和 endAt 是 Unix 时间戳
```go
func GetLogs(startAt, endAt int64, func_name, level, message string) []map[string]interface{} {
		var logs []map[string]interface{}
	query := fmt.Sprintf(`from(bucket:"%s")
	|> range(start: %d, stop: %d)
	|> filter(fn: (r) => r["_measurement"] == "logs"`,
		comm.InfluxDBInfo.Bucket, startAt, endAt)

	// -5m, -10m
	if func_name != "" {
		query += fmt.Sprintf(` and r["func"] == "%s"`, func_name)
	}
	if level != "" {
		query += fmt.Sprintf(` and r["level"] == "%s"`, level)
	}
	if message != "" {
		query += fmt.Sprintf(` and strings.contains(value: r["message"], search: "%s")`, message)
	}

	query += `)
|> sort(columns: ["_time"], desc: true)
|> limit(n: 500)`

	result, err := queryAPI.Query(context.Background(), query)
	if err != nil {
		comm.Log.Errorf("Error querying InfluxDB: %v", err)
	}

	for result.Next() {
		record := result.Record()
		logs = append(logs, record.Values())
	}

	if err := result.Err(); err != nil {
		comm.Log.Errorf("Error reading query result: %v", err)
	}

	return logs
}

```

## 如何删除数据
InfluxDB 2.0 默认情况下并不鼓励直接删除数据，因为这可能会影响数据的完整性和查询的一致性。在某些情况下，你可能需要使用 `delete` 函数，但这通常需要特定的权限和谨慎的操作。

如果就是要删除历史数据，可以执行下面的命令，将历史记录保留修改为 3 天，超过 3 天的都自动进行删除
```flux
option retentionPolicy = (bucket) =>
bucket
|> to(bucket: bucket, org: "my-org", retentionPolicy: "3d")
```
