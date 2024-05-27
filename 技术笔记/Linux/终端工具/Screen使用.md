---
🌻日期🌻: 2024-05-27
🌙星期🌙: 星期一
⌚️时间⌚️: 09:31:00
tags: 
---
`screen` 是一个强大的终端复用器，允许你在一个单个终端会话中运行多个命令行会话。以下是如何在 Ubuntu 上安装和使用 `screen` 的基本步骤。

### 安装 `screen`

如果 `screen` 尚未安装，可以通过以下命令安装：

```bash
sudo apt-get update
sudo apt-get install screen
```

### 基本使用

#### 1. 启动一个新 `screen` 会话

启动一个新的 `screen` 会话：

```bash
screen
```

你会进入一个新的 `screen` 会话，通常看起来像一个普通的终端。你可以在这个会话中运行任何你想运行的命令。

#### 2. 命名一个 `screen` 会话

启动一个带有名称的 `screen` 会话，以便以后更容易识别和恢复：

```bash
screen -S mysession
```

#### 3. 分离（Detach）`screen` 会话

当你需要暂时离开 `screen` 会话，但希望会话保持运行时，可以使用以下命令分离会话：

```bash
Ctrl-a d
```

这会将你带回到原始终端，而 `screen` 会话仍在后台运行。

#### 4. 恢复（Reattach）`screen` 会话

列出所有当前运行的 `screen` 会话：

```bash
screen -ls
```

你会看到类似如下的输出：

```plaintext
There is a screen on:
    12345.mysession   (Detached)
1 Socket in /var/run/screen/S-username.
```

恢复一个特定的 `screen` 会话：

```bash
screen -r 12345
```

或者使用会话名称恢复：

```bash
screen -r mysession
```

#### 5. 退出 `screen` 会话

在 `screen` 会话中输入 `exit` 命令来终止该会话：

```bash
exit
```

如果你在多个窗口中使用 `screen`，这个命令只会关闭当前窗口。关闭所有窗口后，`screen` 会话会自动终止。

### 多窗口管理

`screen` 允许你在一个会话中创建多个窗口。

#### 1. 创建一个新窗口

在当前 `screen` 会话中创建一个新窗口：

```bash
Ctrl-a c
```

#### 2. 在窗口之间切换

在不同窗口之间切换：

- 下一个窗口：`Ctrl-a n`
- 上一个窗口：`Ctrl-a p`
- 特定窗口编号：`Ctrl-a 1` (切换到窗口 1)，`Ctrl-a 2` (切换到窗口 2) 等

#### 3. 列出所有窗口

列出所有当前窗口：

```bash
Ctrl-a "
```

#### 4. 关闭当前窗口

关闭当前窗口（和退出 `screen` 会话一样）：

```bash
exit
```

### 常用快捷键

以下是一些常用的 `screen` 快捷键：

- `Ctrl-a d`：分离会话
- `Ctrl-a c`：创建新窗口
- `Ctrl-a n`：切换到下一个窗口
- `Ctrl-a p`：切换到上一个窗口
- `Ctrl-a "`：列出所有窗口
- `Ctrl-a 0` ... `Ctrl-a 9`：切换到指定编号的窗口
- `Ctrl-a k`：杀死当前窗口
- `Ctrl-a A`：重命名当前窗口
- `Ctrl-a S`：水平拆分屏幕
- `Ctrl-a |`：垂直拆分屏幕
- `Ctrl-a tab`：在拆分的区域之间切换

### 自定义 `screen` 配置

你可以通过修改 `~/.screenrc` 文件来自定义 `screen` 的配置。例如，添加以下内容到 `~/.screenrc` 以启用屏幕状态栏：

```bash
hardstatus alwayslastline
hardstatus string '%{= kG}[%H] %l %{= kW}%?%-Lw%?%{= kw}[%n*%f %t]%{= kW}%?%+Lw%? %= %{= kG}[%Y-%m-%d %c]%{= kG}'
```

这些配置选项将使 `screen` 在底部显示一个状态栏，包含主机名、窗口列表和时间等信息。

通过这些步骤和技巧，你可以在 Ubuntu 上有效地使用 `screen` 来管理多个终端会话，增强你的命令行工作流程。