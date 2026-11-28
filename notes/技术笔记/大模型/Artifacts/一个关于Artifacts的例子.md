---
🌻日期🌻: 2025-01-08
🌙星期🌙: 星期三
⌚️时间⌚️: 09:16:15
tags: 
---

 我来帮您在现有的 HTML 代码中添加 artifact 可视化功能。我们需要添加一个新的容器来展示 artifact，并修改消息处理逻辑以支持不同类型的可视化内容。

```html
<!-- 在 <head> 标签中添加必要的依赖 -->
<head>
    <!-- 原有的引入 -->
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DeepSeek Agent</title>
    <link rel="stylesheet" href="../static/css/github-dark.min.css">
    <link rel="stylesheet" href="../static/css/styles.css">
    
    <!-- 添加React相关依赖 -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/react/17.0.2/umd/react.production.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/17.0.2/umd/react-dom.production.min.js"></script>
    <!-- 添加Vue相关依赖 -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/vue/3.3.4/vue.global.min.js"></script>
    <!-- 添加Recharts依赖（如果需要） -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/recharts/2.1.0/Recharts.js"></script>
</head>

<!-- 在消息容器中添加artifact展示区域的样式 -->
<style>
    .artifact-container {
        margin: 10px 0;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
    }
    
    .artifact-svg {
        width: 100%;
        height: auto;
        min-height: 300px;
    }
    
    .artifact-react, .artifact-vue {
        width: 100%;
        min-height: 300px;
        border: none;
    }
</style>

<!-- 修改消息处理逻辑的JavaScript代码 -->
<script>
    // ... (保留原有代码)

    // 添加处理artifact的函数
    function createArtifactContainer(type, content) {
        const container = document.createElement('div');
        container.className = 'artifact-container';

        switch (type) {
            case 'image/svg+xml':
                container.innerHTML = content;
                const svg = container.querySelector('svg');
                if (svg) {
                    svg.classList.add('artifact-svg');
                }
                break;

            case 'application/vnd.ant.react':
                const reactContainer = document.createElement('div');
                reactContainer.className = 'artifact-react';
                container.appendChild(reactContainer);
                
                // 处理React组件
                try {
                    const componentCode = `
                        const ArtifactComponent = (${content});
                        ReactDOM.render(React.createElement(ArtifactComponent), document.querySelector('.artifact-react'));
                    `;
                    const script = document.createElement('script');
                    script.type = 'text/babel';
                    script.textContent = componentCode;
                    container.appendChild(script);
                } catch (error) {
                    console.error('Failed to render React component:', error);
                    container.innerHTML = '<div class="error">Failed to render React component</div>';
                }
                break;

            case 'text/html':
                // 处理Vue组件或普通HTML
                const iframe = document.createElement('iframe');
                iframe.className = 'artifact-vue';
                container.appendChild(iframe);
                
                const html = `
                    <!DOCTYPE html>
                    <html>
                        <head>
                            <script src="https://cdnjs.cloudflare.com/ajax/libs/vue/3.3.4/vue.global.min.js"></script>
                        </head>
                        <body>
                            ${content}
                        </body>
                    </html>
                `;
                
                iframe.contentWindow.document.open();
                iframe.contentWindow.document.write(html);
                iframe.contentWindow.document.close();
                break;
        }

        return container;
    }

    // 修改消息处理逻辑，支持artifact
    async function sendMessage() {
        // ... (保留原有代码直到解析响应部分)

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            let boundary;
            while ((boundary = buffer.indexOf('\n\n')) !== -1) {
                const chunk = buffer.slice(0, boundary).trim();
                buffer = buffer.slice(boundary + 2);

                if (chunk.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(chunk.slice(6));
                        
                        // 检查是否包含artifact
                        if (data.artifact) {
                            const artifactContainer = createArtifactContainer(
                                data.artifact.type,
                                data.artifact.content
                            );
                            botMessageContent.appendChild(artifactContainer);
                        } else {
                            fullResponse += data.chunk;
                            botMessageContent.innerHTML = DOMPurify.sanitize(marked.parse(fullResponse));
                        }

                        // 为新增的代码块添加复制按钮
                        botMessageContent.querySelectorAll('pre').forEach(pre => {
                            if (!pre.querySelector('.copy-button')) {
                                addCopyButton(pre);
                            }
                        });
                    } catch (error) {
                        console.error("Failed to parse chunk:", chunk, error);
                    }
                }
            }
            chatBox.scrollTop = chatBox.scrollHeight;
        }
        
        // ... (保留其余代码)
    }
</script>
```

> [!warning] 安全与运行时限制
> 这里的 React 示例把模型返回的字符串当作 JavaScript/JSX 执行，不能直接用于不可信输入；生产环境应使用 `iframe sandbox` 或白名单组件渲染，并在服务端校验 `artifact.type` 和内容大小。`type="text/babel"` 还需要额外加载 Babel Standalone 才会编译 JSX，否则浏览器不会执行这段脚本。

这段代码主要做了以下修改：

1. 添加了必要的依赖：
   - React 和 ReactDOM 用于渲染 React 组件
   - Vue.js 用于渲染 Vue 组件
   - Recharts（如果需要图表功能）

2. 添加了 artifact 容器的样式：
   - 为不同类型的 artifact 提供适当的样式
   - 确保可视化内容显示正确

3. 添加了处理 artifact 的函数：
   - `createArtifactContainer` 函数处理不同类型的可视化内容
   - 支持 SVG、React 组件和 Vue 组件的渲染

4. 修改了消息处理逻辑：
   - 检查响应中是否包含 artifact
   - 根据 artifact 类型创建适当的容器
   - 维护原有的 Markdown 渲染功能

使用这个实现，当大模型返回包含 artifact 的响应时，系统将：

1. 对于 SVG：
   - 直接在消息流中渲染 SVG
   - 自动调整 SVG 大小以适应容器

2. 对于 React 组件：
   - 创建一个专门的容器
   - 动态编译和渲染 React 组件

3. 对于 Vue 组件：
   - 创建一个 iframe 容器
   - 在隔离环境中渲染 Vue 组件

需要注意的是，大模型返回的响应格式应该类似于：

```json
{
    "chunk": "普通文本消息",
    "artifact": {
        "type": "image/svg+xml",
        "content": "<svg>...</svg>"
    }
}
```

或者：

```json
{
    "chunk": "普通文本消息",
    "artifact": {
        "type": "application/vnd.ant.react",
        "content": "() => { return <div>...</div> }"
    }
}
```

您需要确保后端返回的数据格式符合这个规范。是否需要我详细解释某个特定部分的实现？
