---
🌻日期🌻: 2024-09-18
🌙星期🌙: 星期三
⌚️时间⌚️: 09:24:42
tags: 
---
# Windows 版本
```go
package main

import (
	"bytes"
	"fmt"
	"os/exec"
	"regexp"
	"strconv"
	"strings"
)

// ConnectionInfo 存储连接信息
type ConnectionInfo struct {
	Protocol  string
	LocalAddr string
	RemoteAddr string
	PID       int
	Path      string
}

func main() {
	conns, err := getConnections()
	if err != nil {
		fmt.Printf("Error getting connections: %v\n", err)
		return
	}

	fmt.Println("Connections:")
	for _, conn := range conns {
		fmt.Printf("Protocol: %s, Local Address: %s, Remote Address: %s, PID: %d, Path: %s\n",
			conn.Protocol, conn.LocalAddr, conn.RemoteAddr, conn.PID, conn.Path)
	}
}

func getConnections() ([]ConnectionInfo, error) {
	cmd := exec.Command("netstat", "-ano")
	var out bytes.Buffer
	cmd.Stdout = &out
	if err := cmd.Run(); err != nil {
		return nil, err
	}

	return parseNetstatOutput(out.String()), nil
}

func parseNetstatOutput(output string) []ConnectionInfo {
	var connections []ConnectionInfo
	lines := strings.Split(output, "\n")
	re := regexp.MustCompile(`(?P<Proto>\S+)\s+(?P<LocalAddr>\S+)\s+(?P<RemoteAddr>\S+)\s+(?P<Pid>\d+)`)

	for _, line := range lines {
		if line == "" || strings.Contains(line, "Proto") {
			continue // 跳过空行和标题行
		}
		matches := re.FindStringSubmatch(line)
		if matches != nil {
			pid, _ := strconv.Atoi(matches[4])
			connections = append(connections, ConnectionInfo{
				Protocol:  matches[1],
				LocalAddr: matches[2],
				RemoteAddr: matches[3],
				PID:       pid,
				Path:      getProcessPath(pid),
			})
		}
	}
	return connections
}

func getProcessPath(pid int) string {
	cmd := exec.Command("tasklist", "/fo", "csv", "/nh")
	var out bytes.Buffer
	cmd.Stdout = &out
	if err := cmd.Run(); err != nil {
		return "Unknown"
	}

	lines := strings.Split(out.String(), "\n")
	for _, line := range lines {
		if line == "" {
			continue
		}
		// 解析 CSV 格式的输出
		parts := strings.Split(line, "\",\"")
		if len(parts) > 1 {
			pidStr := strings.Trim(parts[1], "\"")
			if pidStr == strconv.Itoa(pid) {
				return strings.Trim(parts[0], "\"")
			}
		}
	}
	return "Unknown"
}

```


# Linux 版本
```go
package main

import (
	"bytes"
	"fmt"
	"os/exec"
	"regexp"
	"strconv"
	"strings"
)

// ConnectionInfo 存储连接信息
type ConnectionInfo struct {
	Protocol string
	LocalAddr string
	RemoteAddr string
	PID int
	Path string
}

func main() {
	udpConns, err := getConnections("udp")
	if err != nil {
		fmt.Printf("Error getting UDP connections: %v\n", err)
		return
	}

	tcpConns, err := getConnections("tcp")
	if err != nil {
		fmt.Printf("Error getting TCP connections: %v\n", err)
		return
	}

	fmt.Println("UDP Connections:")
	for _, conn := range udpConns {
		fmt.Printf("Protocol: %s, Local Address: %s, Remote Address: %s, PID: %d, Path: %s\n",
			conn.Protocol, conn.LocalAddr, conn.RemoteAddr, conn.PID, conn.Path)
	}

	fmt.Println("\nTCP Connections:")
	for _, conn := range tcpConns {
		fmt.Printf("Protocol: %s, Local Address: %s, Remote Address: %s, PID: %d, Path: %s\n",
			conn.Protocol, conn.LocalAddr, conn.RemoteAddr, conn.PID, conn.Path)
	}
}

func getConnections(protocol string) ([]ConnectionInfo, error) {
	var cmd *exec.Cmd
	if protocol == "udp" {
		cmd = exec.Command("ss", "-u", "-p", "-n")
	} else {
		cmd = exec.Command("ss", "-t", "-p", "-n")
	}

	var out bytes.Buffer
	cmd.Stdout = &out
	if err := cmd.Run(); err != nil {
		return nil, err
	}

	return parseSSOutput(out.String(), protocol), nil
}

func parseSSOutput(output string, protocol string) []ConnectionInfo {
	var connections []ConnectionInfo
	lines := strings.Split(output, "\n")
	re := regexp.MustCompile(`(?P<Proto>\S+)\s+(?P<RecvQ>\S+)\s+(?P<SndQ>\S+)\s+(?P<LocalAddr>\S+)\s+(?P<PeerAddr>\S+)\s+(?P<Pid>\d+)/(?P<Path>.+)`)

	for _, line := range lines {
		if line == "" {
			continue
		}
		matches := re.FindStringSubmatch(line)
		if matches != nil {
			pid, _ := strconv.Atoi(matches[6])
			connections = append(connections, ConnectionInfo{
				Protocol:  protocol,
				LocalAddr: matches[4],
				RemoteAddr: matches[5],
				PID:       pid,
				Path:      matches[7],
			})
		}
	}
	return connections
}

```

# 跨平台方案
```go
package main

import (
	"fmt"
	"log"

	"github.com/shirou/gopsutil/net"
	"github.com/shirou/gopsutil/process"
)

// ConnectionInfo 存储连接信息
type ConnectionInfo struct {
	Protocol  string
	LocalAddr string
	RemoteAddr string
	PID       int32
	Path      string
}

func main() {
	conns, err := getConnections()
	if err != nil {
		log.Fatalf("Error getting connections: %v\n", err)
	}

	fmt.Println("Connections:")
	for _, conn := range conns {
		fmt.Printf("Protocol: %s, Local Address: %s, Remote Address: %s, PID: %d, Path: %s\n",
			conn.Protocol, conn.LocalAddr, conn.RemoteAddr, conn.PID, conn.Path)
	}
}

func getConnections() ([]ConnectionInfo, error) {
	// 获取网络连接信息
	connections, err := net.Connections("all")
	if err != nil {
		return nil, err
	}

	var connInfos []ConnectionInfo
	for _, conn := range connections {
		// 获取进程信息
		pid := conn.Pid
		var path string
		if pid > 0 {
			p, err := process.NewProcess(pid)
			if err == nil {
				path, _ = p.Exe() // 获取进程的路径
			}
		}

		connInfos = append(connInfos, ConnectionInfo{
			Protocol:  conn.Type, // TCP/UDP
			LocalAddr: conn.Laddr.String(),
			RemoteAddr: conn.Raddr.String(),
			PID:       pid,
			Path:      path,
		})
	}

	return connInfos, nil
}

```

