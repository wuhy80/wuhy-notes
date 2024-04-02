
## linux上用svn，如何忽略 src/node_modules 目录内容，这个目录已经有一些内容被提交了，只需要改成后面不提交即可

要忽略已经提交的 `src/node_modules` 目录内容，可以使用 SVN 的 `svn propset` 命令设置 `svn:ignore` 属性。首先，确保您已经安装了 SVN 客户端。然后，进入 `src/node_modules` 目录，并执行以下命令：
`svn propset svn:ignore '*' .`
这将设置 `src/node_modules` 目录下所有内容为忽略状态。然后，提交这个更改到版本库：
`svn commit -m "Ignore node_modules directory"`
这样就可以确保 `src/node_modules` 目录内容不会被提交到版本库中。




