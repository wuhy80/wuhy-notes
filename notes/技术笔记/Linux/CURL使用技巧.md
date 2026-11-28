---
🌻日期🌻: 2024-05-24
🌙星期🌙: 星期五
⌚️时间⌚️: 08:59:43
tags: 
---
`curl` 是一个非常强大的命令行工具，主要用于从命令行或脚本中进行各种网络请求。以下是一些常用的 `curl` 用法示例：

### 基本用法
1. **GET 请求**：发送一个基本的 GET 请求：
    ```sh
    curl http://example.com
    ```

### 显示 HTTP 响应头
2. **显示响应头**：使用 `-i` 选项显示响应头：
    ```sh
    curl -i http://example.com
    ```

### 添加 HTTP 请求头
3. **添加请求头**：使用 `-H` 选项添加自定义请求头：
    ```sh
    curl -H "Authorization: Bearer YOUR_TOKEN" http://example.com
    ```

### POST 请求
4. **发送 POST 请求**：使用 `-X POST` 和 `-d` 选项发送 POST 请求：
    ```sh
    curl -X POST -d "param1=value1&param2=value2" http://example.com
    ```

5. **发送 JSON 数据**：发送 JSON 数据时需要指定内容类型：
    ```sh
    curl -X POST -d '{"key1":"value1", "key2":"value2"}' -H "Content-Type: application/json" http://example.com
    ```

### PUT 请求
6. **发送 PUT 请求**：
    ```sh
    curl -X PUT -d '{"key1":"value1"}' -H "Content-Type: application/json" http://example.com
    ```

### 文件上传
7. **上传文件**：使用 `-F` 选项上传文件：
    ```sh
    curl -F "file=@/path/to/file" http://example.com/upload
    ```

### 保存响应到文件
8. **保存响应**：使用 `-o` 选项将响应保存到文件：
    ```sh
    curl -o output.txt http://example.com
    ```

### 显示详细信息
9. **显示详细信息**：使用 `-v` 选项显示详细的请求和响应信息：
    ```sh
    curl -v http://example.com
    ```

### Basic 认证
10. **Basic 认证**：使用 `-u` 选项提供用户名和密码进行 Basic 认证：
    ```sh
    curl -u username:password http://example.com
    ```

### 下载文件
11. **下载文件**：使用 `-O` 选项下载文件，保留原文件名：
    ```sh
    curl -O http://example.com/file.zip
    ```

### 限制带宽
12. **限制下载速度**：使用 `--limit-rate` 选项限制下载速度：
    ```sh
    curl --limit-rate 100k http://example.com/file.zip
    ```

### 代理
13. **通过代理发送请求**：使用 `-x` 选项设置代理：
    ```sh
    curl -x http://proxyserver:port http://example.com
    ```

### 跟踪重定向
14. **跟踪重定向**：使用 `-L` 选项跟踪重定向：
    ```sh
    curl -L http://example.com
    ```

### 示例综合
15. **综合示例**：结合多个选项的请求示例：
    ```sh
    curl -X POST -d '{"key1":"value1"}' -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_TOKEN" http://example.com -o response.json
    ```

以上是 `curl` 的一些常用用法，涵盖了从基本请求到高级功能的各种场景。根据你的具体需求，可以组合使用这些选项来完成不同的任务。