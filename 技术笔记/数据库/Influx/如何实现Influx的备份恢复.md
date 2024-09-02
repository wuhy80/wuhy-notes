---
🌻日期🌻: 2024-08-29
🌙星期🌙: 星期四
⌚️时间⌚️: 10:18:29
tags:
  - influx
  - 备份
---


```bash
#!/bin/bash

# 定义变量
URL="http://192.0.2.201:30012"
DB="backup"
BACKUP_DIR="/data/zhanwan_backup/influx_backup"

# 获取昨天的日期
YESTERDAY=$(date -d "yesterday" '+%Y-%m-%d')
START_TIME="${YESTERDAY}T00:00:00.000Z"
END_TIME="${YESTERDAY}T23:59:59.999Z"

# 执行备份命令
zhanwan_tool influx backup --url "$URL" --db "$DB" --start_time "$START_TIME" --end_time "$END_TIME" --backup_dir "$BACKUP_DIR"

# 输出备份结果
if [ $? -eq 0 ]; then
    echo "备份成功: $START_TIME 到 $END_TIME"
else
    echo "备份失败"
fi
```

使用 crontab -e 编辑 `25 0 * * * /path/to/your/backup_script.sh >> /var/log/influx_backup.log 2>&1` 设置每天凌晨 0:25的时候执行前一天的数据库备份操作