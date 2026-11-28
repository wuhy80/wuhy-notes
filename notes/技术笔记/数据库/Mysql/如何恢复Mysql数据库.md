---
🌻日期🌻: 2024-09-30
🌙星期🌙: 星期一
⌚️时间⌚️: 16:48:25
tags:
  - mysql
---
如果数据库已经无法启动，只剩下了.ibd 和.frm 文件，还是可以尝试进行恢复，步骤如下
![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_2/202409301649559.png)

选择一个用于保存恢复后数据的数据库，执行下面的命令创建数据库
```sql
CREATE DATABASE tm CHARACTER SET utf8 COLLATE utf8_general_ci;
USE tm;
```

获取要导入表的结构，要求这个结构和要恢复数据的表结构一致。例如要导入 `tm_device_definition` 表，就需要将这个表的结构复制一份用于创建，例子如下
```sql
CREATE TABLE `tm_device_definition`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `identifier` varchar(40) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `initialState` int(11) NULL DEFAULT NULL,
  `modelNumber` int(11) NULL DEFAULT NULL,
  `type` int(11) NULL DEFAULT NULL,
  `ip` varchar(30) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `mac` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `createTime` datetime(6) NOT NULL,
  `updateTime` datetime(6) NOT NULL,
  `description` varchar(200) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `districtId` int(11) NULL DEFAULT NULL,
  `firmwareId` int(11) NULL DEFAULT NULL,
  `gatewayId` int(11) NULL DEFAULT NULL,
  `groupId` int(11) NULL DEFAULT NULL,
  `productId` int(11) NOT NULL,
  `customNumber` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `version` varchar(40) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `gray` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `customNumber`(`customNumber`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 356 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;
```
如果这个表还有一些外部关联的键配置，都可以删除，因为我们当前只是要恢复一个表，不需要考虑关联的事情

之后执行 `ALTER TABLE tm_device_definition DISCARD TABLESPACE; ` 这个命令，将创建好的表的.ibd 文件清理掉
将要恢复的 `tm_device_definition.ibd` 文件拷贝到 tm 数据库目录下方，需要检查用户权限信息，如果权限信息不对需要改对权限
![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_2/202409301655152.png)
例如上面的一开始拷贝过来的权限就不正确，需要手动修正，然后执行 `ALTER TABLE tm_device_definition IMPORT TABLESPACE;` 去导入这个表空间，导入之后数据库就可以使用了

