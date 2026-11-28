---
🌻日期🌻: 2024-06-07
🌙星期🌙: 星期五
⌚️时间⌚️: 09:49:07
tags: 
---

## 检查集群健康状态
`GET /_cluster/health?pretty`

```json
#! Elasticsearch built-in security features are not enabled. Without authentication, your cluster could be accessible to anyone. See https://www.elastic.co/guide/en/elasticsearch/reference/7.13/security-minimal-setup.html to enable security.
{
  "cluster_name" : "elasticsearch",
  "status" : "green",
  "timed_out" : false,
  "number_of_nodes" : 1,
  "number_of_data_nodes" : 1,
  "active_primary_shards" : 118,
  "active_shards" : 118,
  "relocating_shards" : 0,
  "initializing_shards" : 0,
  "unassigned_shards" : 0,
  "delayed_unassigned_shards" : 0,
  "number_of_pending_tasks" : 0,
  "number_of_in_flight_fetch" : 0,
  "task_max_waiting_in_queue_millis" : 0,
  "active_shards_percent_as_number" : 100.0
}

```

## 查询 index 副本信息
`curl -X GET "localhost:9200/_cat/indices?v"`

```json
#! Elasticsearch built-in security features are not enabled. Without authentication, your cluster could be accessible to anyone. See https://www.elastic.co/guide/en/elasticsearch/reference/7.13/security-minimal-setup.html to enable security.
health status index                           uuid                   pri rep docs.count docs.deleted store.size pri.store.size
green  open   logs-2024.04.02                 bvpEwIUpT5qkev1XURKdKw   1   0          2            0     63.6kb         63.6kb
green  open   other-logs-2024.05.10           wOHbUL6ST_Cq_hd-s0Zhyw   1   0       1435            0    731.8kb        731.8kb
green  open   other-logs-2024.05.12           r3lpCqPARamc6z9fBh8tpA   1   0       1435            0    743.4kb        743.4kb
green  open   other-logs-2024.05.11           V0jukmTNQOG2pzkabMkWNg   1   0       1435            0    852.4kb        852.4kb
green  open   other-logs-2024.05.14           KN_k4nJbQgOxfr4oPP0kIw   1   0       1435            0    722.1kb        722.1kb
green  open   other-logs-2024.05.13           nmYGTlaFSmijV-dw_RHJNQ   1   0       1435            0    488.6kb        488.6kb
green  open   other-logs-2024.05.07           EeWYekSYSiuaUvMcFRCcag   1   0       1106            0    355.4kb        355.4kb
green  open   .apm-custom-link                TeMWBhHNQTum24cK4LTC3g   1   0          0            0       208b           208b
green  open   other-logs-2024.05.09           eTNZhcIuQzy2407PaErgNw   1   0       1435            0    647.8kb        647.8kb
green  open   other-logs-2024.05.08           ED6wIAnISla_f7aaiTPb1w   1   0       1435            0      487kb          487kb
green  open   logs-2024.03.29                 SPUd1RaCSNmjT2pbDz5FWA   1   0          2            0     63.6kb         63.6kb
green  open   logs-2024.03.27                 6i4zVdz5R4SQ0okUdXyB5A   1   0          6            0     71.7kb         71.7kb
```

