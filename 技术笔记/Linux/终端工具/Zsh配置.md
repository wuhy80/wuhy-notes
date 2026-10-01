---
🌻日期🌻: 2024-05-24
🌙星期🌙: 星期五
⌚️时间⌚️: 18:20:32
tags: 
---
# 如何在 MAC 环境安装 zsh

```
# 使用 Gitee 镜像安装
sh -c "$(curl -fsSL https://gitee.com/mirrors/oh-my-zsh/raw/master/tools/install.sh)"

## 更换主题（改变视觉外观）
# 添加 Homebrew 国内镜像（如果还没配置）
export HOMEBREW_BREW_GIT_REMOTE="https://mirrors.ustc.edu.cn/brew.git"
export HOMEBREW_CORE_GIT_REMOTE="https://mirrors.ustc.edu.cn/homebrew-core.git"

# 使用 brew 安装 starship
brew install starship

# 然后初始化
echo 'eval "$(starship init zsh)"' >> ~/.zshrc
source ~/.zshrc

## 安装必备插件（增强功能）
# 安装 zsh-autosuggestions（命令建议）
git clone https://gitee.com/mirrors/zsh-autosuggestions.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions

# 安装 zsh-syntax-highlighting（语法高亮）
git clone https://gitee.com/mirrors/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting

code ~/.zshrc # 用 VS Code 打开，或者用 nano ~/.zshrc
plugins=(
    git
    zsh-autosuggestions
    zsh-syntax-highlighting
)
source ~/.zshrc
```

# 如何在 Ubuntu 上面安装 zsh
```bash
# 更换 Ubuntu 软件源为国内镜像（如阿里云）
sudo sed -i 's/archive.ubuntu.com/mirrors.aliyun.com/g' /etc/apt/sources.list
sudo sed -i 's/security.ubuntu.com/mirrors.aliyun.com/g' /etc/apt/sources.list

# 安装必要依赖
sudo apt update && sudo apt install -y curl git zsh

# 使用 Gitee 镜像安装 oh-my-zsh
sh -c "$(curl -fsSL https://gitee.com/mirrors/oh-my-zsh/raw/master/tools/install.sh)" --unattended

# 将 zsh 设为默认 shell
chsh -s $(which zsh)

# 使用国内镜像安装 Starship（通过脚本）
# 如果以下方式不可用，可以尝试手动下载二进制文件
curl -o /tmp/starship.tar.gz -L "https://cdn.jsdelivr.net/gh/starship/starship@latest/x86_64-unknown-linux-gnu/starship-x86_64-unknown-linux-gnu.tar.gz"
tar -xzf /tmp/starship.tar.gz -C /tmp
sudo install -m 755 /tmp/starship /usr/local/bin/starship
rm /tmp/starship.tar.gz /tmp/starship

# 或者使用备用下载地址（清华源）
# curl -o /tmp/starship.tar.gz -L "https://mirrors.tuna.tsinghua.edu.cn/github-release/starship/starship/LatestRelease/starship-x86_64-unknown-linux-gnu.tar.gz"

# 初始化 Starship
echo 'eval "$(starship init zsh)"' >> ~/.zshrc

# 安装必备插件
# 1. zsh-autosuggestions（命令建议）
git clone https://gitee.com/mirrors/zsh-autosuggestions.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions

# 2. zsh-syntax-highlighting（语法高亮）
git clone https://gitee.com/mirrors/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting

# 配置插件
# 使用 sed 命令自动修改配置文件
sed -i 's/^plugins=(.*)$/plugins=(git zsh-autosuggestions zsh-syntax-highlighting)/' ~/.zshrc

# 应用配置
source ~/.zshrc

echo "安装完成！请重新启动终端或执行 'exec zsh' 使配置生效"
```

# 离线安装 OhMyZsh
从你的截图中可以看到，运行 `install.sh` 脚本时尝试克隆 Oh My Zsh 仓库失败。这是因为离线环境无法访问互联网。

为了在离线环境中安装 Oh My Zsh，需要绕过 `install.sh` 脚本的在线下载步骤，直接使用之前从有网络的环境中下载并传输过来的文件。下面是具体步骤：

### 步骤 1: 下载 Oh My Zsh 并打包

在有网络的环境中，执行以下命令下载 Oh My Zsh 仓库：

```bash
git clone https://github.com/ohmyzsh/ohmyzsh.git
tar -czvf oh-my-zsh.tar.gz ohmyzsh
```

### 步骤 2: 传输文件到目标离线环境

将 `oh-my-zsh.tar.gz` 文件传输到目标离线环境。

### 步骤 3: 解压并安装 Oh My Zsh

1. **解压文件**

   在离线环境中，使用 `tar` 命令解压 `oh-my-zsh.tar.gz` 文件：

   ```bash
   tar -xzvf oh-my-zsh.tar.gz -C $HOME
   ```

   这会在你的 `HOME` 目录中创建一个 `ohmyzsh` 目录。

2. **手动创建 Zsh 配置文件**

   如果没有 `.zshrc` 文件，你可以手动创建一个并添加基本配置：

   ```bash
   cp $HOME/ohmyzsh/templates/zshrc.zsh-template $HOME/.zshrc
   ```

   确保 `.zshrc` 文件包含 Oh My Zsh 的初始化配置：

   ```bash
   # ~/.zshrc

   export ZSH="$HOME/ohmyzsh"
   ZSH_THEME="robbyrussell"  # 你可以选择其他主题
   plugins=(git)  # 你可以根据需要启用其他插件
   source $ZSH/oh-my-zsh.sh
   ```

3. **将 Oh My Zsh 目录重命名为 .oh-my-zsh**

   ```bash
   mv $HOME/ohmyzsh $HOME/.oh-my-zsh
   ```

4. **更新 .zshrc 文件中的 ZSH 变量**

   打开 `.zshrc` 文件并确保 `ZSH` 变量指向 `.oh-my-zsh` 目录：

   ```bash
   export ZSH="$HOME/.oh-my-zsh"
   ```

5. **设置 Zsh 为默认 Shell**

   你可以通过以下命令将 Zsh 设置为默认 Shell：

   ```bash
   chsh -s $(which zsh)
   ```

6. **重新加载 Zsh 配置**

   运行以下命令重新加载 Zsh 配置：

   ```bash
   source ~/.zshrc
   ```

### 总结

通过上述步骤，你可以在离线环境中成功安装 Oh My Zsh。首先在有网络的环境中下载并打包 Oh My Zsh 文件，然后将这些文件传输到离线环境并进行安装和配置。这样你就能在离线环境中享受 Oh My Zsh 提供的增强功能了。

# 安装 Auto Complete
在 Zsh 中启用自动补全功能非常简单，尤其是在使用 Oh My Zsh 的情况下。以下是启用自动补全功能的具体步骤：

### 步骤 1: 安装 Oh My Zsh

确保你已经按照之前的步骤成功安装了 Oh My Zsh。如果还没有安装，请按照之前的步骤进行离线安装。

### 步骤 2: 启用自动补全插件

Oh My Zsh 自带一个非常强大的自动补全插件 `zsh-autosuggestions`。你需要通过以下步骤启用它。

1. **下载 `zsh-autosuggestions` 插件**

   由于你的环境是离线的，你需要先在有网络的环境中下载 `zsh-autosuggestions` 插件：

   ```bash
   git clone https://github.com/zsh-users/zsh-autosuggestions.git
   tar -czvf zsh-autosuggestions.tar.gz zsh-autosuggestions
   ```

   然后将 `zsh-autosuggestions.tar.gz` 文件传输到目标离线环境。

2. **解压并安装 `zsh-autosuggestions` 插件**

   在离线环境中，使用 `tar` 命令解压 `zsh-autosuggestions.tar.gz` 文件：

   ```bash
   tar -xzvf zsh-autosuggestions.tar.gz -C $ZSH_CUSTOM/plugins
   ```

   这会在 `$ZSH_CUSTOM/plugins` 目录中创建一个 `zsh-autosuggestions` 目录。

3. **启用 `zsh-autosuggestions` 插件**

   编辑你的 `~/.zshrc` 文件，在 `plugins` 数组中添加 `zsh-autosuggestions`：

   ```bash
   # ~/.zshrc

   plugins=(
     git
     zsh-autosuggestions
   )

   source $ZSH/oh-my-zsh.sh
   ```

### 步骤 3: 安装并启用 `zsh-syntax-highlighting` 插件（可选）

另一个常用的插件是 `zsh-syntax-highlighting`，它可以为你的命令提供语法高亮。你可以按照类似的步骤安装和启用这个插件。

1. **下载 `zsh-syntax-highlighting` 插件**

   在有网络的环境中下载：

   ```bash
   git clone https://github.com/zsh-users/zsh-syntax-highlighting.git
   tar -czvf zsh-syntax-highlighting.tar.gz zsh-syntax-highlighting
   ```

   然后将 `zsh-syntax-highlighting.tar.gz` 文件传输到目标离线环境。

2. **解压并安装 `zsh-syntax-highlighting` 插件**

   在离线环境中，使用 `tar` 命令解压：

   ```bash
   tar -xzvf zsh-syntax-highlighting.tar.gz -C $ZSH_CUSTOM/plugins
   ```

3. **启用 `zsh-syntax-highlighting` 插件**

   编辑你的 `~/.zshrc` 文件，在 `plugins` 数组中添加 `zsh-syntax-highlighting`：

   ```bash
   # ~/.zshrc

   plugins=(
     git
     zsh-autosuggestions
     zsh-syntax-highlighting
   )

   source $ZSH/oh-my-zsh.sh
   ```

### 步骤 4: 重新加载 Zsh 配置

运行以下命令重新加载 Zsh 配置：

```bash
source ~/.zshrc
```

### 验证

打开一个新的终端窗口，或者重新加载当前终端的 Zsh 会话后，开始输入命令。你应该会看到自动补全建议和语法高亮功能生效。

通过这些步骤，你可以在 Zsh 中启用自动补全功能，显著提高命令行的使用体验。