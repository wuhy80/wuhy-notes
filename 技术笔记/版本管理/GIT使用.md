
## 如何忽略提交的文件
在.gitignore文件里面添加要忽略的文件，例如下面
```.gitignore
/.obsidian/workspace.json
/.obsidian/plugins/recent-files-obsidian/data.json
```
上面就是忽略GIT根目录下面的两个文件

如果这两个文件已经被git提交了，需要执行清除操作后再做提交
```bash
git rm --cached file.txt
git commit -m "Remove file.txt from repository"
```
