---
🌻日期🌻: 2024-06-03
🌙星期🌙: 星期一
⌚️时间⌚️: 22:22:56
tags:
  - cpp
  - thread
---
要在Windows上使用C++记录通过 `CreateThread` 创建的线程的创建和消失，包括处理线程异常退出的情况，你可以采取以下步骤：

1. **创建线程时记录信息**
2. **在线程入口函数中记录开始和结束**
3. **使用 `SetUnhandledExceptionFilter` 捕获未处理的异常**

以下是一个示例，展示如何实现上述步骤：

### 示例代码

```cpp
#include <windows.h>
#include <iostream>
#include <fstream>
#include <vector>
#include <mutex>

std::mutex logMutex;
std::vector<HANDLE> threadHandles;

void Log(const std::string& message) {
    std::lock_guard<std::mutex> lock(logMutex);
    std::ofstream logFile("thread_log.txt", std::ios::app);
    if (logFile.is_open()) {
        logFile << message << std::endl;
    }
}

DWORD WINAPI ThreadFunc(LPVOID lpParam) {
    int threadId = GetCurrentThreadId();
    Log("Thread started: " + std::to_string(threadId));
    
    __try {
        // Simulate work
        for (int i = 0; i < 10; ++i) {
            Sleep(500);
        }
    }
    __except (EXCEPTION_EXECUTE_HANDLER) {
        Log("Thread exception caught: " + std::to_string(threadId));
    }
    
    Log("Thread ended: " + std::to_string(threadId));
    return 0;
}

LONG WINAPI CustomUnhandledExceptionFilter(EXCEPTION_POINTERS* ExceptionInfo) {
    int threadId = GetCurrentThreadId();
    Log("Unhandled exception in thread: " + std::to_string(threadId));
    return EXCEPTION_EXECUTE_HANDLER;
}

int main() {
    SetUnhandledExceptionFilter(CustomUnhandledExceptionFilter);
    
    const int numThreads = 5;
    for (int i = 0; i < numThreads; ++i) {
        DWORD threadId;
        HANDLE threadHandle = CreateThread(
            NULL, 
            0, 
            ThreadFunc, 
            NULL, 
            0, 
            &threadId
        );
        
        if (threadHandle != NULL) {
            threadHandles.push_back(threadHandle);
            Log("Thread created: " + std::to_string(threadId));
        } else {
            Log("Failed to create thread: " + std::to_string(i));
        }
    }
    
    // Wait for all threads to finish
    WaitForMultipleObjects(threadHandles.size(), threadHandles.data(), TRUE, INFINITE);
    
    // Clean up handles
    for (HANDLE handle : threadHandles) {
        CloseHandle(handle);
    }
    
    Log("All threads have completed.");
    return 0;
}
```

### 解释

1. **Log 函数**：
   - 使用互斥锁保护日志文件的写入，确保线程安全。

2. **ThreadFunc 函数**：
   - 每个线程在启动时记录其 ID。
   - 使用 `__try` 和 `__except` 捕获异常并记录。

3. **CustomUnhandledExceptionFilter 函数**：
   - 捕获未处理的异常并记录。通过 `SetUnhandledExceptionFilter` 设置为全局异常处理函数。

4. **main 函数**：
   - 创建多个线程，并记录每个线程的创建。
   - 使用 `WaitForMultipleObjects` 等待所有线程完成。
   - 清理线程句柄。

这样做可以确保在 Windows 上使用 C++创建的线程，其创建和销毁过程都被记录下来，包括处理异常退出的情况。

在Windows平台上，`__try` 和 `__except` 是特定于Windows的结构化异常处理（Structured Exception Handling，SEH）机制，而 `try` 和 `catch` 是标准C++的异常处理机制。使用SEH和标准C++异常处理机制的原因和区别如下：

### SEH (`__try` 和 `__except`)

- **系统级异常**：SEH可以捕获系统级的异常，例如访问违规、除零错误、堆栈溢出等。这些异常通常不会被标准C++的 `try` 和 `catch` 捕获到。
- **性能**：SEH的异常处理机制是内嵌在操作系统内核中的，处理效率高，适用于捕获低级别的异常。
- **平台特定**：SEH是Windows平台特有的，因此代码的可移植性较差。

### 标准C++异常处理 (`try` 和 `catch`)

- **用户级异常**：标准C++的异常处理机制主要用于处理用户级异常（例如，逻辑错误、无效输入等），它不能捕获所有的系统级异常。
- **可移植性**：C++的 `try` 和 `catch` 是跨平台的，代码可移植性好。
- **类型安全**：标准C++异常处理是类型安全的，可以捕获特定类型的异常。

### 为什么使用`__try` 和 `__except` 而不是 `try` 和 `catch`？

在某些情况下，我们需要捕获系统级的异常，这些异常可能会导致程序崩溃。这时，使用 `__try` 和 `__except` 更合适。例如，当你创建多个线程并希望记录线程异常退出的情况时，如果这些异常是由于访问无效内存或除零等系统级错误引起的，标准的 `try` 和 `catch` 是无法捕获的。因此，使用 `__try` 和 `__except` 更为合适。