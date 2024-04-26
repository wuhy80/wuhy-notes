最近一个老板付费咨询在 xp 系统运行 ffmpeg 的问题。编译环境是 Windows10，但是编译出来的 ffmpeg.exe 要在 xp 系统运行，同时需要要把 freetype2， fontconfig 两个扩展库编译进去 FFmpeg

因此编译工具 只能用 vs2017 ，因为 vs2017 有 **v141_xp** 工具集，而 vs2019 已经不支持了，在官网文档[《Configuring Programs for Windows XP》](https://docs.microsoft.com/en-us/cpp/build/configuring-programs-for-windows-xp?view=msvc-170)有介绍，如下：

![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_1/202404261600725.png)


vs2017 默认是没有安装 **v141_xp** 工具集的，需要 点击 Tool ➔ Get Tools And Features 打开 Visual Studio Installer，

然后选择 **Windows XP support for C++** ，如下：
![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_1/202404261601991.png)

下载安装完 Windows XP support for C++ 之后，在 项目属性 ➔ 平台工具集里面， 就会出现 Visual Studio 2017 - Windows XP (v141_xp) 选项。

![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_1/202404261601519.png)

我们现在用一个简单的 hello world 程序来测试一下 Platform Toolset 这个属性会影响编译过程的哪些地方。

用 vs2017 创建一个空项目 c-single，新建 hello.c 文件，内容如下：

```
#include <stdio.h>
int main()
{
    printf("hello ffmpeg \\r\\n");
    return 0;
}
```

然后点击 菜单栏的 Tool ➔ Options，配置 MSBuild 的日志开到最大。这样就能看到更详细的信息，包括 cl.exe 编译器的路径跟具体参数。

![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_1/202404261601351.png)

通过 切换 Platform Toolset （平台工具集） 编译 hello.c 发现，这个 v141_xp 属性主要影响两个地方。

**1，**cl.exe 的时候不使用 `/D _USING_V110_SDK71_`， /D 是定义一个宏。

![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_1/202404261601895.png)

**2，** link.exe 链接的时候加上了一个参数 ，指定子系统版本是 5.01，这是 xp 的内部版本号。

![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_1/202404261602196.png)

然后 用 v141_xp 编译出来的 c-single.exe 是可以放到 xp 系统运行的，如下：

![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_1/202404261602767.png)

我们可以用 dumpbin 或者 eXeScope 来查看 这个 exe 的头部信息，如下：

![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_1/202404261602378.png)

上图中 注意看 操作系统主版本号跟 版本号，这是因为 xp 的内部版本号是 5.1 ，所以这个 exe 可以在 5.1 及以上的系统运行。而 win7 的内部版本号是 6.1 。

各个Windows 系统的内部版本号在《[Windows Internals](https://union-click.jd.com/jdc?e=618%7Cpc%7C&p=JF8BANIJK1olXDYCVl1dCUsSBF9MRANLAjZbERscSkAJHTdNTwcKBlMdBgABFksVAG8JG14SQl9HCANtdR11eW9hTRB2XVpWJyoqCE50QTQNe1cZbQcyV19dCE4fBm8OGGslXQEyAjBdCUoWAm4NH1wSbQcyVFlZCkkUAGYAGlgSXTYFVFdtUx55Bm9dGQsRWAVXUF0OXXsnM2w4HFscSQBwFQxJDjknM284GGtXM1JSUVxUCUpEUW8LE15GXVRRBAtVDEkUCm1bGF0XVAQFZFxcCU8eM18)》第一页就有一个列表。如下：

![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_1/202404261602741.png)

了解了 Platform Toolset 设置为 v141_xp 的原理之后，在 msys2 里面调 link.exe 的时候也是这样加参数就行，configure 命令如下：

```
./configure \\
--prefix=/home/loken/ffmpeg/build32/ffmepg-3.4-msvc8 \\
--enable-gpl \\
--enable-nonfree \\
--enable-shared \\
--toolchain=msvc \\
--enable-libfontconfig \\
--enable-libfreetype \\
--extra-cflags="-MTd" \\
--extra-ldflags="-SUBSYSTEM:CONSOLE,"5.01""
```

上面的命令通过 **--extra-cflags** 跟 **--extra-ldflags** 传递参数 给 cl.exe 跟 link.exe。

切记，一定要使用以下的 x86 Native Tools Command Prompt for VS 2017 来打开 msys2 的命令行，这样 msys2 里面的 cl.exe 编译器才会跟 vs2017 一样。

![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_1/202404261603260.png)

上面这些命令行的具体意义可以看微软的文档[《通过命令行使用 Microsoft C++ 工具集》](https://docs.microsoft.com/zh-cn/cpp/build/building-on-the-command-line?view=msvc-170)，如下：

![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_1/202404261603035.png)

上面的 configure 跑完之后，直接把相关的 DLL 拷贝到 xp 就行，主要的问题是 libiconv 这个DLL 依赖 ucrtbased.dll，ucrtbased.dll 又依赖很多DLL，所以需要一起拷贝，如下：

![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_1/202404261603877.png)

上面这些 dll 全部拷贝到 XP 系统，ffmpeg.exe 就能正常运行了，如下：

![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_1/202404261603619.png)

正常添加文字水印，如下：

![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_1/202404261603587.png)

相关阅读：

1，[《Configuring Programs for Windows XP》](https://docs.microsoft.com/en-us/cpp/build/configuring-programs-for-windows-xp?view=msvc-170)

2，[《通过命令行使用 Microsoft C++ 工具集》](https://docs.microsoft.com/zh-cn/cpp/build/building-on-the-command-line?view=msvc-170)

5，[《MSBuild 命令行参考》](https://docs.microsoft.com/zh-cn/visualstudio/msbuild/msbuild?view=vs-2017)

由于笔者的水平有限，文中难免会出现一些错误或者不准确的地方，恳请读者批评指正。如果读者有任何宝贵意见，可以加我微信 Loken1。