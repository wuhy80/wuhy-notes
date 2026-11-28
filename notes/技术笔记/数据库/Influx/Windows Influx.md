
# Windows 安装与 Go 客户端示例

[InfluxData Downloads](https://www.influxdata.com/downloads/)
下载 Influx 数据库，Windows 下载链接  https://dl.influxdata.com/influxdb/releases/influxdb2-2.7.5-windows.zip 。下载完成后解压缩即可通过命令行打开

首次启动后在 `http://127.0.0.1:8086/` 完成初始化，示例中的 URL、组织、Bucket 和 Token 都是占位符。生产环境应启用 HTTPS，并通过环境变量或密钥管理系统提供 Token，不要将真实 Token 写入笔记或代码仓库。

```powershell
$env:INFLUX_URL = "https://influx.example.com"
$env:INFLUX_TOKEN = "<token-from-secret-store>"
```

https://docs.influxdata.com/influxdb/v2/get-started/
InfluxDB 的官方站点

[influxdata/influxdb-client-go: InfluxDB 2 Go Client (github.com)](https://github.com/influxdata/influxdb-client-go)
Go 的Influx 库地址

```go
package main

import (
    "context"
    "fmt"
    "os"
    "time"

    "github.com/influxdata/influxdb-client-go/v2"
)

func main() {
    // 示例凭据仅作占位；生产环境请从环境变量或密钥管理系统读取，并优先使用 HTTPS。
    client := influxdb2.NewClient(os.Getenv("INFLUX_URL"), os.Getenv("INFLUX_TOKEN"))
    defer client.Close()
    // Use blocking write client for writes to desired bucket
    writeAPI := client.WriteAPIBlocking("my-org", "my-bucket")
    // Create point using full params constructor
    p := influxdb2.NewPoint("stat",
        map[string]string{"unit": "temperature"},
        map[string]interface{}{"avg": 24.5, "max": 45.0},
        time.Now())
    // write point immediately
    if err := writeAPI.WritePoint(context.Background(), p); err != nil {
        panic(err)
    }
    // Create point using fluent style
    p = influxdb2.NewPointWithMeasurement("stat").
        AddTag("unit", "temperature").
        AddField("avg", 23.2).
        AddField("max", 45.0).
        SetTime(time.Now())
    err := writeAPI.WritePoint(context.Background(), p)
	if err != nil {
		panic(err)
	}
    // Or write directly line protocol
    line := fmt.Sprintf("stat,unit=temperature avg=%f,max=%f", 23.5, 45.0)
    err = writeAPI.WriteRecord(context.Background(), line)
	if err != nil {
		panic(err)
	}

    // Get query client
    queryAPI := client.QueryAPI("my-org")
    // Get parser flux query result
    result, err := queryAPI.Query(context.Background(), `from(bucket:"my-bucket")|> range(start: -1h) |> filter(fn: (r) => r._measurement == "stat")`)
    if err == nil {
        // Use Next() to iterate over query result lines
        for result.Next() {
            // Observe when there is new grouping key producing new table
            if result.TableChanged() {
                fmt.Printf("table: %s\n", result.TableMetadata().String())
            }
            // read result
            fmt.Printf("row: %s\n", result.Record().String())
        }
        if result.Err() != nil {
            fmt.Printf("Query error: %s\n", result.Err().Error())
        }
    } else {
		panic(err)
    }
    // Ensures background processes finishes
    client.Close()
}
```


# 如何将 Influx 部署为 Windows 服务
https://www.123pan.com/s/gAEZVv-aXKeh.html
下载 nssm2.24 版本，用于将 Influxd 做成服务

执行 nssm install E:\influxdb\influxdb2-2.4.0\influxdb2_windows_amd64\influxd.exe
用上面的命令可以将指定位置的程序添加为系统服务
![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_1/202404281157644.png)


将 Influx 作为服务安装完成后，访问http://127.0.0.1:8086/开始配置数据库

![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_1/202404281156292.png)


![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_1/202404281156863.png)
