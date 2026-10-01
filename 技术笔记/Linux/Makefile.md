---
title: "Makefile"
tags:
  - Linux
  - 构建工具
type: reference
---

# Makefile

Makefile 用目标、依赖和配方描述构建关系。执行 `make target` 时，只有目标不存在或依赖比目标更新才会重新执行配方。

## 最小示例

```makefile
.PHONY: all clean

all: app

app: main.o
	$(CC) $^ -o $@

main.o: main.c
	$(CC) -Wall -Wextra -c $< -o $@

clean:
	rm -f app main.o
```

常用自动变量：`$@` 是当前目标，`$<` 是第一个依赖，`$^` 是全部依赖。命令行前必须使用 Tab；`.PHONY` 用于声明不对应真实文件的目标。

## 网络资料
[Makefile.pdf (seisman.github.io)](https://seisman.github.io/how-to-write-makefile/Makefile.pdf)
上面的是跟我一起写Makefile (PDF 重制版) 作者: 陈皓

