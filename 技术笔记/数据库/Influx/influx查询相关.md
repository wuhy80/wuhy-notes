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

