# 如何登录并上传文件
```go
package main

import (
	"fmt"
	"os"

	"github.com/jlaffaye/ftp"
)

func main() {
	// FTP服务器地址
	ftpServer := "ftp.example.com"
	// 用户名和密码
	ftpUser := "username"
	ftpPass := "password"

	// 连接FTP服务器
	client, err := ftp.Connect(ftpServer)
	if err != nil {
		fmt.Println("Failed to connect to FTP server:", err)
		return
	}
	defer client.Quit()

	// 登录FTP服务器
	err = client.Login(ftpUser, ftpPass)
	if err != nil {
		fmt.Println("Failed to login to FTP server:", err)
		return
	}

	// 要上传的文件路径
	filePath := "/path/to/local/file.txt"
	// 远程目录路径
	remoteDir := "/path/to/remote/directory/"

	// 检查远程目录是否存在，不存在则创建
	_, err = client.List(remoteDir)
	if err != nil {
		errMkdir := client.MakeDir(remoteDir)
		if errMkdir != nil {
			fmt.Println("Failed to create remote directory:", errMkdir)
			return
		}
	}

	// 打开本地文件
	file, err := os.Open(filePath)
	if err != nil {
		fmt.Println("Failed to open local file:", err)
		return
	}
	defer file.Close()

	// 获取文件信息
	info, err := file.Stat()
	if err != nil {
		fmt.Println("Failed to get file info:", err)
		return
	}

	// 上传文件
	err = client.Stor(remoteDir+info.Name(), file)
	if err != nil {
		fmt.Println("Failed to upload file:", err)
		return
	}

	fmt.Println("File uploaded successfully.")
}
```

