---
🌻日期🌻: 2024-05-24
🌙星期🌙: 星期五
⌚️时间⌚️: 13:45:54
tags: 
---
# 如何实现免密登录
PuTTY 是一个流行的 SSH 客户端，通常用于登录远程服务器。虽然 PuTTY 本身不支持通过命令行参数实现完全自动化登录，但可以通过以下几种方式来实现自动登录：

## 使用 PuTTY 的 Session 配置
1. **保存会话**：首先，打开 PuTTY，输入远程服务器的 IP 地址或主机名以及端口号。
2. **设置自动登录用户名**：在“Connection -> Data”选项卡下，填写“Auto-login username”。
3. **保存会话**：返回“Session”选项卡，输入会话名称并点击“Save”按钮。

通过保存会话配置，你可以双击会话名称来自动登录，而不需要每次输入用户名。

## 使用 PuTTYgen 生成密钥对
1. **生成 SSH 密钥对**：使用 PuTTYgen 生成一对 SSH 密钥。打开 PuTTYgen，点击“Generate”按钮，然后按照提示生成密钥。
2. **保存密钥**：保存生成的私钥到本地计算机，并将公钥添加到远程服务器的 `~/.ssh/authorized_keys` 文件中。
3. **配置 PuTTY 使用私钥**：在 PuTTY 中，打开“Connection -> SSH -> Auth”选项卡，选择你保存的私钥文件。
4. **保存会话**：返回“Session”选项卡，保存会话配置。

这样，你可以通过密钥认证实现自动登录，而不需要输入密码。

## 使用 PuTTY 命令行和批处理文件
可以通过批处理文件结合 PuTTY 命令行参数来实现自动登录。

```batch
@echo off
start putty.exe -ssh user@hostname -pw password
```

将上述内容保存为 `.bat` 文件，双击运行即可实现自动登录。

**注意**：使用明文密码有安全风险，建议使用 SSH 密钥认证方式。

通过上述方法，可以实现 PuTTY 的自动登录。建议使用 SSH 密钥认证方式，以保证安全性。

# 支持中文
## 设置 PuTTY 的字符编码

1. **打开 PuTTY**：启动 PuTTY 客户端。
2. **选择会话**：输入服务器的主机名或 IP 地址，并选择合适的连接类型（如 SSH）。
3. **设置字符编码**：
    - 在左侧菜单中，展开 “Window” -> “Translation”。
    - 在 “Character set translation on received data” 下拉菜单中选择 “UTF-8”。
    - 这是因为大多数现代系统和应用程序都使用 UTF-8 编码，能够很好地支持中文。

## 设置字体

1. **选择字体**：
    - 在左侧菜单中，展开 “Window” -> “Appearance”。
    - 点击 “Change...” 按钮，选择一个支持中文的字体，如 “SimSun” 或 “Microsoft YaHei”。
    - 确保字体大小合适，可以在窗口中清晰地显示中文字符。

# 如何美化 Putty
美化 PuTTY 界面可以通过以下几种方法来提升其视觉效果和使用体验：

## 设置颜色方案
1. **选择配色方案**：
   - 在左侧菜单中，展开 “Window” -> “Colours”。
   - 勾选 “Use system colours” 以使用系统的默认颜色方案。
   - 你也可以自定义颜色，点击 “Select a colour to adjust” 下拉菜单中的各项（例如“Default Foreground”、“Default Background”），然后点击 “Modify” 选择你喜欢的颜色。

2. **使用预设的配色方案**：
   - 你可以使用网上的配色方案配置文件，来导入漂亮的配色方案。一个流行的配色方案是 Solarized。
   - 下载 [Solarized for PuTTY](https://github.com/altercation/solarized/tree/master/putty-colors-solarized) 配置文件。
   - 运行注册表文件（例如 `solarized_dark.reg`），应用颜色配置。

## 自定义字体
1. **选择字体**：
   - 在左侧菜单中，展开 “Window” -> “Appearance”。
   - 点击 “Change...” 按钮，选择你喜欢的字体。推荐使用等宽字体（monospaced font），如 “Consolas”、“Courier New” 或者 “Fira Code”。
   - 设置合适的字体大小，确保字符显示清晰。

## 调整窗口大小和滚动设置
1. **调整窗口大小**：
   - 在左侧菜单中，展开 “Window”。
   - 你可以设置默认的列数和行数来调整窗口的初始大小。
   - 选择 “Behaviour” 选项，勾选 “Resize the font” 以在调整窗口大小时动态调整字体大小。

2. **启用滚动条**：
   - 在 “Window” -> “Scrollback” 中，调整 “Lines of scrollback” 的值，增加可回滚查看的行数。默认值为 200 行，你可以根据需要增加此值，例如 1000 行。

## 启用透明背景
PuTTY 本身不支持背景透明，但是可以使用 KiTTY 来实现。

1. **下载并安装 KiTTY**：
   - KiTTY 是 PuTTY 的一个增强版本，提供了更多的功能。
   - 访问 [KiTTY 官网](http://www.9bis.net/kitty/) 下载并安装 KiTTY。

2. **启用背景透明**：
   - 打开 KiTTY，输入服务器信息。
   - 在左侧菜单中，选择 “Window” -> “Transparency”。
   - 勾选 “Transparency” 选项，并调整滑块以设置透明度。

## 保存配置
1. **保存会话配置**：
   - 在左侧菜单中，返回 “Session”。
   - 输入会话名称，然后点击 “Save” 按钮，保存配置以便下次直接使用。

## 参考资料
- [PuTTY Documentation](https://www.chiark.greenend.org.uk/~sgtatham/putty/docs.html)
- [Solarized for PuTTY](https://github.com/altercation/solarized/tree/master/putty-colors-solarized)
- [KiTTY 官网](http://www.9bis.net/kitty/)

通过这些设置，你可以显著美化 PuTTY 界面，提升使用体验。如果你需要更多高级功能，可以尝试使用 KiTTY，它是 PuTTY 的增强版本，提供了更多的自定义选项。