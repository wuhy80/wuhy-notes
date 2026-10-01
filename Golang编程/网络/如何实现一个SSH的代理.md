---
🌻日期🌻: 2024-05-31
🌙星期🌙: 星期五
⌚️时间⌚️: 11:20:49
tags: 
---
如果你希望不仅通过 Vue3 的界面访问 SSH，还希望在其他地方使用普通的 SSH 客户端通过临时设置的密码登录，可以在 Windows 跳板机上实现一个中间代理，接收 SSH 连接并将其转发到内部的 Linux 机器。以下是如何实现这一目标的详细步骤：

### 后端（Go 语言实现）

这个 Go 程序将充当 SSH 代理服务器，它会接收来自外部的 SSH 连接，验证临时密码，并将连接转发到内部的 Linux 机器上。

#### 1. 安装依赖

使用 Go 编写后端程序之前，需要安装一些依赖包：

```sh
go get -u golang.org/x/crypto/ssh
go get -u github.com/gin-gonic/gin
```

#### 2. 编写 Go 程序

下面是一个简单的 Go 程序示例，它通过 HTTP API 接收请求，设置临时密码，并建立 SSH 会话。

```go
package main

import (
	"bytes"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/ssh"
)

type SSHRequest struct {
	Username     string `json:"username"`
	Password     string `json:"password"`
	Host         string `json:"host"`
}

var tempPassword string

func main() {
	r := gin.Default()

	r.POST("/set-temp-password", func(c *gin.Context) {
		var req SSHRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		tempPassword = req.Password
		c.JSON(http.StatusOK, gin.H{"status": "temporary password set"})
	})

	go startSSHProxy(":2222", "root", "actual-root-password", "internal-linux-host:22")

	r.Run(":8080")
}

func startSSHProxy(listenAddr, username, actualPassword, targetAddr string) {
	listener, err := net.Listen("tcp", listenAddr)
	if err != nil {
		log.Fatalf("failed to listen on %s: %v", listenAddr, err)
	}
	log.Printf("Listening on %s...", listenAddr)

	for {
		conn, err := listener.Accept()
		if err != nil {
			log.Printf("failed to accept connection: %v", err)
			continue
		}

		go handleSSHConnection(conn, username, actualPassword, targetAddr)
	}
}

func handleSSHConnection(conn net.Conn, username, actualPassword, targetAddr string) {
	defer conn.Close()

	config := &ssh.ServerConfig{
		PasswordCallback: func(c ssh.ConnMetadata, pass []byte) (*ssh.Permissions, error) {
			if string(pass) == tempPassword {
				return nil, nil
			}
			return nil, fmt.Errorf("password rejected for %q", c.User())
		},
	}

	privateBytes, err := ssh.GenerateKey("rsa", 2048)
	if err != nil {
		log.Fatalf("failed to generate private key: %v", err)
	}
	private, err := ssh.ParsePrivateKey(privateBytes)
	if err != nil {
		log.Fatalf("failed to parse private key: %v", err)
	}
	config.AddHostKey(private)

	sshConn, chans, reqs, err := ssh.NewServerConn(conn, config)
	if err != nil {
		log.Printf("failed to handshake: %v", err)
		return
	}
	defer sshConn.Close()

	go ssh.DiscardRequests(reqs)

	for newChannel := range chans {
		go handleChannel(newChannel, username, actualPassword, targetAddr)
	}
}

func handleChannel(newChannel ssh.NewChannel, username, actualPassword, targetAddr string) {
	if newChannel.ChannelType() != "session" {
		newChannel.Reject(ssh.UnknownChannelType, "unknown channel type")
		return
	}

	channel, requests, err := newChannel.Accept()
	if err != nil {
		log.Printf("could not accept channel: %v", err)
		return
	}
	defer channel.Close()

	conn, err := ssh.Dial("tcp", targetAddr, &ssh.ClientConfig{
		User:            username,
		Auth:            []ssh.AuthMethod{ssh.Password(actualPassword)},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:         5 * time.Second,
	})
	if err != nil {
		log.Printf("failed to dial target: %v", err)
		return
	}
	defer conn.Close()

	session, err := conn.NewSession()
	if err != nil {
		log.Printf("failed to create session: %v", err)
		return
	}
	defer session.Close()

	go io.Copy(channel, session.Stdout)
	go io.Copy(channel.Stderr, session.Stderr)
	go io.Copy(session.Stdin, channel)
	go ssh.DiscardRequests(requests)

	if err := session.Shell(); err != nil {
		log.Printf("failed to start shell: %v", err)
		return
	}
	session.Wait()
}
```

### 前端（Vue3 实现）

前端程序使用 Vue3 创建用户界面，允许管理员设置临时密码，并通过 HTTP 请求发送到后端。

#### 1. 创建 Vue 项目并安装依赖

如果没有 Vue CLI，可以先安装：

```sh
npm install -g @vue/cli
```

创建新的 Vue 项目：

```sh
vue create ssh-client
cd ssh-client
```

#### 2. 创建 Vue 组件

编辑 `src/components/SetTempPassword.vue`，创建一个表单，让管理员设置临时密码：

```vue
<template>
  <div>
    <h1>Set Temporary Password</h1>
    <form @submit.prevent="setTempPassword">
      <div>
        <label for="username">Username:</label>
        <input type="text" v-model="username" id="username" required>
      </div>
      <div>
        <label for="password">Temporary Password:</label>
        <input type="password" v-model="password" id="password" required>
      </div>
      <div>
        <label for="host">Host:</label>
        <input type="text" v-model="host" id="host" required>
      </div>
      <button type="submit">Set Password</button>
    </form>
    <div v-if="status">
      <h2>Status:</h2>
      <pre>{{ status }}</pre>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      username: '',
      password: '',
      host: '',
      status: ''
    };
  },
  methods: {
    async setTempPassword() {
      const response = await fetch('http://localhost:8080/set-temp-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: this.username,
          password: this.password,
          host: this.host
        })
      });
      const data = await response.json();
      if (response.ok) {
        this.status = data.status;
      } else {
        this.status = `Error: ${data.error}`;
      }
    }
  }
};
</script>

<style>
/* Add some basic styling */
form div {
  margin-bottom: 10px;
}
</style>
```

#### 2.2. 配置 Vue 路由

编辑 `src/router/index.js`，添加路由配置：

```javascript
import { createRouter, createWebHistory } from 'vue-router';
import SetTempPassword from '../components/SetTempPassword.vue';

const routes = [
  {
    path: '/',
    name: 'SetTempPassword',
    component: SetTempPassword
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;
```

#### 2.3. 在 App.vue 中添加路由视图

编辑 `src/App.vue`，添加路由视图：

```vue
<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script>
export default {
  name: 'App'
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
```

#### 2.4. 运行 Vue 项目

启动 Vue 开发服务器：

```sh
npm run serve
```

### 使用和验证

1. 启动 Go 后端程序，这将开启 HTTP 服务器监听端口 8080 以及 SSH 代理服务器监听端口 2222。
2. 通过浏览器访问 Vue 应用（通常是 `http://localhost:8080`），通过界面设置临时密码。
3. 通过 SSH 客户端连接到跳板机的 SSH 代理端口，使用临时密码登录：

```sh
ssh -p 2222 tempuser@<bastion-host-ip>
```

这样，跳板机将验证临时密码，并将连接转发到目标 Linux 机器的 root 账号。

### 总结

通过上述步骤，你可以在 Windows 跳板机上实现一个 SSH 代理程序，并通过 Vue3 前端界面设置临时密码，从而安全地管理对内部 Linux 机器的访问。用户只能通过临时密码登录，root 账号的真实密码不会被暴露。如果有任何进一步的问题或需要更多的配置指导，请告诉我！
