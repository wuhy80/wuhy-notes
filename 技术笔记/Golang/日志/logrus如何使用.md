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

