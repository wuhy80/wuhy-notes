---
tags:
  - 数据库
  - MySQL
  - InfluxDB
  - 存储引擎
created: 2026-10-15
updated: 2026-10-15
status: 入口
---

# 数据库技术笔记

关系型数据库（MySQL）、时序数据库（InfluxDB）、底层存储索引原理（B树）与中间件架构资料总览。

## 专题目录

- `存储原理/`：B 树索引演进、扇出比率与底层存储引擎设计。
- `MySQL/`：问题排查、备份恢复（PITR）、主从复制与高可用集群架构。
- `时序数据库 (InfluxDB)/`：Tag/Field 数据建模最佳实践、时间窗口查询、保留策略与备份。
- `其他关系型与驱动/`：SQL Server（FreeTDS 跨平台连接）与代理中间件。

---

## 快速入口

### 存储引擎与索引底层原理

- [[技术笔记/数据库/B树：为什么每个数据库都在使用它|B树：为什么每个数据库都在使用它]] —— 磁盘 I/O 局部性、扇出与经典存储引擎基石
- [[技术笔记/数据库/B树深入解析：扇出与其他索引结构|B树深入解析：扇出与其他索引结构]] —— 扇出比率、B+树演进与 LSM-Tree / 哈希对比

### 关系型数据库：MySQL

- [[技术笔记/数据库/Mysql/Mysql常见问题处理|MySQL 常见问题处理]] —— 锁冲突、慢查询、死锁与性能排查排错手册
- [[技术笔记/数据库/Mysql/Mysql实现备份|MySQL 备份方案]] —— mysqldump、物理备份与企业级备份策略
- [[技术笔记/数据库/Mysql/如何恢复Mysql数据库|MySQL 数据恢复实操]] —— 全量备份结合 Binlog 进行时间点（PITR）精准恢复
- [[技术笔记/数据库/Mysql/Mysql主从备份|MySQL 主从复制]] —— Binlog 机制、主从同步与读写分离基础
- [[技术笔记/数据库/Mysql/Mysql高可用|MySQL 高可用架构]] —— MHA、Orchestrator 与多副本选举高可用
- [[技术笔记/数据库/Mysql/Mycat 和 ProxySQL对比|Mycat 与 ProxySQL 对比]] —— 分库分表中间件与流量路由选型
- [[技术笔记/数据库/Mysql/Windows上如何安装Mysql|Windows 安装 MySQL]] —— 服务初始化与基础环境配置

### 时序数据库：InfluxDB

- [[技术笔记/数据库/Influx/Influx的最佳实践|InfluxDB 最佳实践]] —— 时序数据 Tag/Field 设计规范与高基数避坑
- [[技术笔记/数据库/Influx/influx查询相关|InfluxDB 查询语言实操]] —— InfluxQL / Flux 常用聚合与时间窗口计算
- [[技术笔记/数据库/Influx/如何设置保留策略|InfluxDB 保留策略]] —— Retention Policy 与冷热数据自动淘汰
- [[技术笔记/数据库/Influx/如何实现Influx的备份恢复|InfluxDB 备份与恢复]] —— 元数据与时序 shard 备份恢复实战
- [[技术笔记/数据库/Influx/Windows Influx|Windows 下 InfluxDB 部署]] —— 本机服务安装与配置说明

### 其他数据库与协议驱动

- [[技术笔记/数据库/SQL Server/Linux下使用FreeTds注意事项|FreeTDS 连接 SQL Server]] —— Linux 环境下 ODBC/TDS 协议连接 SQL Server
