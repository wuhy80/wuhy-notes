# Log 实例封装

```go
package comm

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"time"

	rotatelogs "github.com/lestrrat-go/file-rotatelogs"
	"github.com/sirupsen/logrus"
)

// 全局日志记录器
var Log *logrus.Logger

func init() {
	if Log != nil {
		return
	}

	// 获取日志文件路径
	logFilePath := getLogFilePath()

	// 创建一个新的 TextFormatter 实例
	formatter := &logrus.TextFormatter{
		CallerPrettyfier: func(f *runtime.Frame) (string, string) {
			_, filename := filepath.Split(f.File)

			return fmt.Sprintf("%s()", f.Function), fmt.Sprintf("%s:%d", filename, f.Line)
		},
		TimestampFormat:        "2006-01-02 15:04:05",
		FullTimestamp:          true,
		DisableLevelTruncation: true,
	}

	Log = logrus.New()
	Log.SetFormatter(formatter)
	Log.SetReportCaller(true)
	Log.SetLevel(logrus.InfoLevel)

	// 创建并添加Hook，根据不同模块名记录到不同文件
	Log.AddHook(NewModuleHook(logFilePath))
}

// getLogFilePath 根据不同操作系统和模块名生成日志文件路径
func getLogFilePath() string {
	var logFilePath string

	switch runtime.GOOS {
	case "windows":
		logFilePath = filepath.Join("d:", "fgap_log")
	case "linux":
		logFilePath = filepath.Join("/home/wuhy/FGAP/", "fgap_log")
	default:
		fmt.Println("getLogFilePath OS not supported")
	}

	os.MkdirAll(logFilePath, 0755)
	return logFilePath
}

// ModuleHook 根据模块将日志记录到不同的文件中
type ModuleHook struct {
	LogFilePath  string
	ModuleLevels []logrus.Level
}

// NewModuleHook 创建一个ModuleHook实例
func NewModuleHook(logFilePath string) *ModuleHook {
	return &ModuleHook{
		LogFilePath:  logFilePath,
		ModuleLevels: []logrus.Level{logrus.InfoLevel, logrus.ErrorLevel},
	}
}

// Fire 实现Hook接口的Fire方法，用于实际记录日志
func (hook *ModuleHook) Fire(entry *logrus.Entry) error {
	module, ok := entry.Data["module"].(string)
	if !ok {
		module = "default"
	}

	filename := filepath.Join(hook.LogFilePath, module, module+".log")
	writer, err := rotatelogs.New(
		filename+".%Y%m%d%H%M%S",
		rotatelogs.WithLinkName(filename),
		rotatelogs.WithMaxAge(time.Duration(86400)*time.Second),
		rotatelogs.WithRotationTime(time.Duration(604800)*time.Second),
	)
	if err != nil {
		return err
	}

	logger := logrus.New()
	logger.SetFormatter(&logrus.JSONFormatter{})
	logger.SetOutput(writer)
	logger.SetLevel(entry.Level)

	logger.WithField("module", module).Log(entry.Level, entry.Message)
	return nil
}

// Levels 实现Hook接口的Levels方法，返回支持的日志级别
func (hook *ModuleHook) Levels() []logrus.Level {
	return hook.ModuleLevels
}
```
## 如何调用写入日志
```go
comm.Log.WithField("module", "transfer_ftp").Errorf("sendConn.Write failed, err:%v", err)
comm.Log.WithField("module", "transfer_ftp").Infof("停止接收UDP数据 PolicyName:%s Port:%+v", s.PolicyName, s.Port)
```

# 如何将 Logrus 记录到 Influx 数据库

## 写入 Influx
记录到 Influx 之后查询就很方便了
```go
package main

import (
	"fmt"
	"os"
	"runtime"
	"time"

	"github.com/influxdata/influxdb-client-go/v2"
	"github.com/influxdata/influxdb-client-go/v2/api"
	"github.com/sirupsen/logrus"
)

type InfluxDBHook struct {
	client   influxdb.Client
	writeAPI api.WriteAPI
	module   string
}

func NewInfluxDBHook(url, token, org, bucket, module string) (*InfluxDBHook, error) {
	client := influxdb.NewClient(url, token)
	writeAPI := client.WriteAPI(org, bucket)

	return &InfluxDBHook{
		client:   client,
		writeAPI: writeAPI,
		module:   module,
	}, nil
}

func (hook *InfluxDBHook) Fire(entry *logrus.Entry) error {
	funcName, funcFile, funcLine := getCallerInfo()
	point := influxdb2.NewPoint("logs",
		map[string]string{
			"level":   entry.Level.String(),
			"module":  hook.module,
			"func":    funcName,
			"file":    funcFile,
			"line":    fmt.Sprintf("%d", funcLine),
			"message": entry.Message,
		},
		map[string]interface{}{},
		time.Now())
	hook.writeAPI.WritePoint(point)

	return nil
}

func (hook *InfluxDBHook) Levels() []logrus.Level {
	return logrus.AllLevels
}

func getCallerInfo() (string, string, int) {
	pc, file, line, ok := runtime.Caller(3) // Skip 3 levels to get caller info
	if !ok {
		return "unknown", "unknown", 0
	}
	fn := runtime.FuncForPC(pc)
	if fn == nil {
		return "unknown", file, line
	}
	return fn.Name(), file, line
}

func main() {
	hook, err := NewInfluxDBHook("http://localhost:8086", "your-token", "your-org", "your-bucket", "your-module")
	if err != nil {
		fmt.Printf("Failed to create InfluxDB hook: %s\n", err)
		return
	}
	defer hook.client.Close()

	logger := logrus.New()
	logger.SetOutput(os.Stdout)
	logger.SetLevel(logrus.DebugLevel)
	logger.AddHook(hook)

	logger.Info("This is an info message")
	logger.Warn("This is a warning message")
}
```

## 查询以及显示
```go
package main

import (
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/influxdata/influxdb-client-go/v2"
	"github.com/influxdata/influxdb-client-go/v2/api"
)

func main() {
	r := gin.Default()
	r.GET("/logs", getLogs)
	r.Run(":8080")
}

func getLogs(c *gin.Context) {
	url := "http://localhost:8086"
	token := "your-token"
	org := "your-org"
	bucket := "your-bucket"

	client := influxdb.NewClient(url, token)
	queryAPI := client.QueryAPI(org)

	query := fmt.Sprintf(`from(bucket:"%s")
	|> range(start: -1h)
	|> filter(fn: (r) => r["_measurement"] == "logs")
	|> filter(fn: (r) => r["module"] == "%s" or r["func"] == "%s" or r["level"] == "%s" or strings.contains(value: r["message"], search: "%s"))`,
		bucket, c.Query("module"), c.Query("func"), c.Query("level"), c.Query("message"))

	result, err := queryAPI.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var logs []map[string]interface{}
	for result.Next() {
		record := result.Record()
		log := make(map[string]interface{})
		for k, v := range record.Values() {
			log[k] = v
		}
		logs = append(logs, log)
	}

	c.JSON(http.StatusOK, logs)
}
```

```vue
<template>
  <div>
    <el-input v-model="module" placeholder="Module"></el-input>
    <el-input v-model="func" placeholder="Function"></el-input>
    <el-input v-model="level" placeholder="Level"></el-input>
    <el-input v-model="message" placeholder="Message"></el-input>
    <el-button @click="searchLogs">Search</el-button>
    <el-table :data="logs" style="width: 100%">
      <el-table-column prop="time" label="Time"></el-table-column>
      <el-table-column prop="module" label="Module"></el-table-column>
      <el-table-column prop="func" label="Function"></el-table-column>
      <el-table-column prop="level" label="Level"></el-table-column>
      <el-table-column prop="message" label="Message"></el-table-column>
    </el-table>
  </div>
</template>

<script>
import { ref } from 'vue'
import axios from 'axios'

export default {
  setup() {
    const module = ref('')
    const func = ref('')
    const level = ref('')
    const message = ref('')
    const logs = ref([])

    const searchLogs = async () => {
      try {
        const response = await axios.get('/logs', {
          params: {
            module: module.value,
            func: func.value,
            level: level.value,
            message: message.value
          }
        })
        logs.value = response.data
      } catch (error) {
        console.error(error)
      }
    }

    return { module, func, level, message, logs, searchLogs }
  }
}
</script>

<style>
/* Add your custom styles here */
</style>
```

# 如何做日志轮转
![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_1/202404231041885.png)
写成上面的样子会导致总是报错，提示日志已经存在，那是由于在每次记录日志的时候都去创建日志，当然会有问题。正确的是下面的写法，只做一次初始化，后面获取初始化的内容

```go
package comm

import (
    "path/filepath"
    "sync"
    "time"

    rotatelogs "github.com/lestrrat-go/file-rotatelogs"
    "github.com/sirupsen/logrus"
)

// ModuleHook 根据模块将日志记录到不同的文件中
type ModuleHook struct {
    LogFilePath  string
    Loggers      map[string]*logrus.Logger
    lock         sync.Mutex
    ModuleLevels []logrus.Level
}

// NewModuleHook 创建一个ModuleHook实例
func NewModuleHook(logFilePath string) *ModuleHook {
    return &ModuleHook{
        LogFilePath:  logFilePath,
        Loggers:      make(map[string]*logrus.Logger),
        ModuleLevels: []logrus.Level{logrus.InfoLevel, logrus.ErrorLevel},
    }
}

// GetLogger 如果存在则返回对应的logger，否则创建一个新的
func (hook *ModuleHook) GetLogger(module string) (*logrus.Logger, error) {
    hook.lock.Lock()
    defer hook.lock.Unlock()
    if logger, ok := hook.Loggers[module]; ok {
        return logger, nil
    }

    filename := filepath.Join(hook.LogFilePath, module, module+".log")
    writer, err := rotatelogs.New(
        filename+".%Y%m%d%H%M%S",
        rotatelogs.WithLinkName(filename),
        rotatelogs.WithMaxAge(time.Duration(86400)*time.Second),
        rotatelogs.WithRotationTime(time.Duration(604800)*time.Second),
    )
    if err != nil {
        return nil, err
    }

    logger := logrus.New()
    logger.SetFormatter(&logrus.JSONFormatter{})
    logger.SetOutput(writer)
    hook.Loggers[module] = logger // 在字典中存储新的logger，以便稍后使用
    return logger, nil
}

// Fire 实现Hook接口的Fire方法，用于实际记录日志
func (hook *ModuleHook) Fire(entry *logrus.Entry) error {
    module, ok := entry.Data["module"].(string)
    if !ok {
        module = "default"
    }

    logger, err := hook.GetLogger(module)
    if err != nil {
        return err // 如果有错误（例如，无法创建日志轮询），则返回
    }

    logger.SetLevel(entry.Level)
    logger.WithField("module", module).Log(entry.Level, entry.Message)
    return nil
}

// Levels 实现Hook接口的Levels方法，返回支持的日志级别
func (hook *ModuleHook) Levels() []logrus.Level {
    return hook.ModuleLevels
}
```