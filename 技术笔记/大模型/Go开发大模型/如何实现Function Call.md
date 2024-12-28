---
🌻日期🌻: 2024-12-28
🌙星期🌙: 星期六
⌚️时间⌚️: 14:56:05
tags: 
---
为了实现一个支持多个函数调用的聊天程序，我们可以按照以下步骤进行：

### 1. 定义多个函数

首先，定义多个函数，例如计算和平方根函数：

```go
func calculate(a, b float64, operator string) (float64, error) {
    switch operator {
    case "+":
        return a + b, nil
    case "-":
        return a - b, nil
    case "*":
        return a * b, nil
    case "/":
        if b == 0 {
            return 0, errors.New("除数不能为零")
        }
        return a / b, nil
    default:
        return 0, errors.New("不支持的操作符")
    }
}

func sqrt(a float64) (float64, error) {
    if a < 0 {
        return 0, errors.New("不能对负数开平方")
    }
    return math.Sqrt(a), nil
}
```

### 2. 在请求中包含多个函数描述

在 `ChatCompletionRequest` 中添加多个函数描述：

```go
request := openai.ChatCompletionRequest{
    Model: "gpt-3.5-turbo",
    Messages: []openai.ChatCompletionMessage{
        {Role: "user", Content: "计算3加4的结果是多少？"},
    },
    Functions: []openai.ChatCompletionFunction{
        {
            Name:        "calculate",
            Description: "进行简单的加减乘除计算",
            Parameters: openai.ChatCompletionFunctionParameters{
                Type: "object",
                Properties: map[string]openai.Schema{
                    "a": {
                        Type:        "number",
                        Description: "第一个操作数",
                    },
                    "b": {
                        Type:        "number",
                        Description: "第二个操作数",
                    },
                    "operator": {
                        Type:        "string",
                        Description: "操作符，可以是+、-、*、/",
                    },
                },
                Required: []string{"a", "b", "operator"},
            },
        },
        {
            Name:        "sqrt",
            Description: "求一个数的平方根",
            Parameters: openai.ChatCompletionFunctionParameters{
                Type: "object",
                Properties: map[string]openai.Schema{
                    "a": {
                        Type:        "number",
                        Description: "被开方的数",
                    },
                },
                Required: []string{"a"},
            },
        },
    },
    FunctionCall: "auto",
}
```

### 3. 处理多个函数调用

使用函数映射表来处理不同的函数调用：

```go
funcMap := map[string]func([]byte) (float64, error){
    "calculate": func(args []byte) (float64, error) {
        var params struct {
            A        float64 `json:"a"`
            B        float64 `json:"b"`
            Operator string  `json:"operator"`
        }
        err := json.Unmarshal(args, &params)
        if err != nil {
            return 0, err
        }
        return calculate(params.A, params.B, params.Operator)
    },
    "sqrt": func(args []byte) (float64, error) {
        var params struct {
            A float64 `json:"a"`
        }
        err := json.Unmarshal(args, &params)
        if err != nil {
            return 0, err
        }
        return sqrt(params.A)
    },
}
```

在处理响应时，根据函数名调用对应的处理函数：

```go
response, err := client.CreateChatCompletion(context.Background(), request)
if err != nil {
    log.Fatalf("Error creating chat completion: %v", err)
}

if response.Choices[0].Message.FunctionCall != nil {
    funcName := response.Choices[0].Message.FunctionCall.Name
    args, err := json.Marshal(response.Choices[0].Message.FunctionCall.Arguments)
    if err != nil {
        log.Fatalf("Error marshaling function call arguments: %v", err)
    }

    handler, exists := funcMap[funcName]
    if !exists {
        log.Fatalf("Unknown function: %s", funcName)
    }

    result, err := handler(args)
    if err != nil {
        log.Fatalf("Function %s execution error: %v", funcName, err)
    }
    fmt.Printf("%s 的结果是: %v\n", funcName, result)
} else {
    fmt.Println("模型没有调用任何函数。")
}
```

### 4. 测试程序

确保程序能够正确调用不同的函数并得到正确的结果。例如：

- 询问模型“计算3加4的结果”，检查是否调用 `calculate` 函数并返回 7。
- 询问模型“求16的平方根”，检查是否调用 `sqrt` 函数并返回 4。

通过以上步骤，我们实现了一个支持多个函数调用的聊天程序，代码整洁且具有良好的扩展性。