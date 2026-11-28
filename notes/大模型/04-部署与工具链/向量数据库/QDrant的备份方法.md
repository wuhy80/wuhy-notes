---
🌻日期🌻: 2025-05-08
🌙星期🌙: 星期四
⌚️时间⌚️: 09:16:55
tags: 
---

Qdrant 数据备份与恢复指南

快照是完整的数据保存的内容

Qdrant 是一个向量搜索引擎，提供多种方式进行数据备份和恢复。以下是几种主要方法：
1. 查看 collection 集合
```bash
curl http://localhost:6333/collections
```
2. 快照备份与恢复

创建快照
```bash
# 创建整个集群的快照
curl -X POST http://localhost:6333/snapshots

# 创建特定集合的快照
curl -X POST http://localhost:6333/collections/{collection_name}/snapshots
```
列出可用快照
```bash
# 列出集群快照
curl http://localhost:6333/snapshots

# 列出集合快照
curl http://localhost:6333/collections/{collection_name}/snapshots
```
下载快照
```bash
# 下载集群快照
curl -o snapshot.tar http://localhost:6333/snapshots/{snapshot_name}

# 下载集合快照
curl -o snapshot.tar http://localhost:6333/collections/{collection_name}/snapshots/{snapshot_name}
```
恢复快照
```bash
# 恢复集群快照（需要停止服务）
# 将快照文件放在Qdrant的snapshots目录下，然后启动服务时会自动恢复

# 恢复集合快照
curl -X PUT http://localhost:6333/collections/{collection_name}/snapshots/recover \
  -H 'Content-Type: application/json' \
  -d '{
    "location": "file:///path/to/snapshot/file.snapshot"
  }'
```
2. 文件系统备份

直接备份Qdrant的数据目录（默认在 `/var/lib/qdrant`）：
```bash
# 停止Qdrant服务
sudo systemctl stop qdrant

# 备份数据目录
tar -czvf qdrant_backup.tar.gz /var/lib/qdrant

# 恢复时解压到相同位置
tar -xzvf qdrant_backup.tar.gz -C /

# 启动服务
sudo systemctl start qdrant
```
3. 使用 Qdrant 客户端备份数据

通过 Python 客户端导出和导入数据：
```python
from qdrant_client import QdrantClient
import json

client = QdrantClient("localhost")

# 导出集合数据
collection_name = "my_collection"
points = client.scroll(collection_name, limit=10000)  # 调整limit获取所有数据
with open(f"{collection_name}_backup.json", "w") as f:
    json.dump(points, f)

# 恢复数据
with open(f"{collection_name}_backup.json", "r") as f:
    points = json.load(f)
    
client.upsert(collection_name, points)
```
最佳实践建议

1. 定期备份：设置定时任务自动创建快照
2. 异地存储：将快照文件备份到云存储或其他服务器
3. 测试恢复：定期验证备份文件的可恢复性
4. 版本控制：为快照命名包含日期时间信息（如 `backup_20240101.tar`）

对于生产环境，建议结合快照和文件系统备份两种方式，确保数据安全。

在 Qdrant 中删除快照以释放磁盘空间，可以通过以下方法操作：

---

1. **删除单个快照（推荐方式）**
通过 HTTP API 删除：
```bash
# 删除集群级快照
curl -X DELETE http://localhost:6333/snapshots/{snapshot_name}

# 删除集合级快照
curl -X DELETE http://localhost:6333/collections/{collection_name}/snapshots/{snapshot_name}
```
示例：
```bash
# 删除名为 "qdrant-snapshot-2024-01-01.tar" 的集群快照
curl -X DELETE http://localhost:6333/snapshots/qdrant-snapshot-2024-01-01.tar

# 删除集合 "products" 的快照 "products-2024-01-01.snapshot"
curl -X DELETE http://localhost:6333/collections/products/snapshots/products-2024-01-01.snapshot
```
---

2. **批量删除旧快照（自动化脚本）**
```bash
# 获取所有集群快照列表
SNAPSHOTS=$(curl -s http://localhost:6333/snapshots | jq -r '.snapshots[].name')

# 保留最近2个快照，删除其他（按时间排序）
echo "$SNAPSHOTS" | sort | head -n -2 | while read -r snap; do
  echo "正在删除旧快照: $snap"
  curl -X DELETE http://localhost:6333/snapshots/"$snap"
done
```
需要先安装 `jq`：
```bash
sudo apt-get install jq  # Ubuntu/Debian
sudo yum install jq      # CentOS/RHEL
```
---

3. **手动删除文件系统快照（紧急情况）**
如果 API 不可用，可直接删除快照文件：
```bash
# 默认快照存储位置
cd /var/lib/qdrant/snapshots

# 安全删除（先确认再删除）
ls -lh *.snapshot *.tar
sudo rm -v old_snapshot.tar  # 手动指定删除
```
---

4. **自动清理策略（预防性维护）**
在 `config.yaml` 中配置自动保留策略：
```yaml
snapshots:
  keep_last: 3  # 只保留最近3个快照
  cleanup_on_success: true  # 创建新快照后自动清理旧的
```
---

⚠️ 注意事项
1. 删除前确认：
   ```bash
   # 查看快照占用空间
   du -sh /var/lib/qdrant/snapshots/*
   ```

2. 服务影响：
   • 删除操作不会影响正在运行的集合
   • 大型快照删除可能短暂增加 IO 负载


3. 权限问题：
   • API删除需要 `admin` 权限
   • 文件删除需要 `qdrant` 用户或 `root` 权限

---

空间监控建议
设置监控告警（示例 PromQL）：
```promql
# 监控快照目录空间使用率
100 * (disk_used_bytes{mountpoint="/var/lib/qdrant/snapshots"} / disk_total_bytes{mountpoint="/var/lib/qdrant/snapshots"}) > 80
```
通过以上方法，你可以安全有效地管理 Qdrant 快照的磁盘空间。
