---
🌻日期🌻: 2024-11-06
🌙星期🌙: 星期三
⌚️时间⌚️: 09:42:23
tags: 
---
**Mycat** 和 **ProxySQL** 都是常用的数据库代理工具，主要用于 MySQL 或 MariaDB 数据库的负载均衡、故障转移、读写分离等场景。尽管它们都能为分布式数据库架构提供中间层服务，但它们的设计理念、功能特性、性能优化等方面有所不同。下面是它们的详细优缺点对比：

### **Mycat vs ProxySQL 优缺点对比**

| **特性/工具**     | **Mycat**                                    | **ProxySQL**                              |
| ------------- | -------------------------------------------- | ----------------------------------------- |
| **架构类型**      | 基于 Java 的分布式数据库中间件，支持 MySQL、MariaDB、Oracle 等 | 基于 C 语言的高性能 MySQL 代理层，专为 MySQL 设计         |
| **负载均衡**      | 支持读写分离、轮询、加权等多种负载均衡策略                        | 支持高级的读写分离、SQL 路由、连接池等负载均衡方式               |
| **支持的数据库**    | 支持 MySQL、MariaDB、Oracle、PostgreSQL（通过插件）     | 主要支持 MySQL、MariaDB，部分支持 PostgreSQL（通过插件）  |
| **性能**        | 由于是基于 Java 的中间件，性能相对较低                       | 性能优越，特别适合高并发场景，因其基于 C 语言开发                |
| **高可用性**      | 支持集群部署、故障转移、主从复制、双主等高可用方案                    | 支持高可用性，具有自动故障转移机制，支持基于心跳的健康检查             |
| **配置方式**      | 配置较复杂，依赖于 XML 配置文件和管理界面                      | 配置灵活，支持通过 SQL 动态管理，无需重启                   |
| **负载均衡策略**    | 支持读写分离、轮询、加权等，且支持 SQL 路由                     | 支持多种负载均衡策略，如基于权重的负载均衡、查询类型路由等             |
| **连接池管理**     | 支持连接池管理，但性能和扩展性相对较弱                          | 高效的连接池管理，支持线程池和查询缓存，大幅提升性能                |
| **故障转移和重试机制** | 支持主备切换和故障转移，但不如 ProxySQL 灵活                  | 支持快速故障转移和连接重试机制，且能自动恢复                    |
| **SQL 路由**    | 支持复杂的 SQL 路由（例如分库分表）                         | 支持基于规则的 SQL 路由，尤其适合多种不同的 SQL 路由需求         |
| **分布式支持**     | 提供分布式数据库集群和分片支持，支持垂直、水平分库分表                  | 不直接支持分布式数据库，但可通过多个代理实例间接支持                |
| **扩展性**       | 可通过插件扩展，但由于是 Java 架构，扩展性受限                   | 高度可扩展，且与 MySQL 的集成非常紧密，能够轻松扩展更多功能         |
| **支持的协议**     | MySQL 协议，部分支持 PostgreSQL 和其他数据库              | 完全兼容 MySQL 协议，支持 MariaDB 和 Percona Server |
| **监控与管理**     | 提供了 Web 界面和命令行管理界面，但使用不如 ProxySQL 灵活         | 提供强大的管理和监控功能，支持 Web 界面、命令行、SQL 命令接口       |
| **社区支持**      | 有一定的社区支持，主要是中文社区，开发较为活跃                      | 社区活跃，支持广泛，尤其是英语社区支持较好                     |
| **文档与资源**     | 中文文档较为完善，英文文档相对较少                            | 英文文档非常详细，广泛的用户和开发者支持                      |
| **容错性**       | 支持故障转移和负载均衡，但相较 ProxySQL 配置较为复杂              | 容错性强，支持自动重试和故障转移，简化了配置                    |
| **资源消耗**      | 相对较高，尤其是在大规模分布式环境中，需要较多内存和 CPU 资源            | 较低，资源消耗优化较好，适合高负载、高并发的场景                  |
| **部署和使用简便性**  | 部署相对复杂，配置较为繁琐，适用于更复杂的应用场景                    | 部署简单，适用于大多数生产环境，提供多种灵活配置选项                |

---

### **Mycat 优点**：
1. **多数据库支持**：Mycat 不仅支持 MySQL、MariaDB，还可以通过插件支持其他数据库（例如 Oracle、PostgreSQL）。
2. **分布式数据库集群**：内置支持分布式数据库架构，支持数据分片、主从复制等。
3. **灵活的路由功能**：提供强大的 SQL 路由功能，支持复杂的分库分表、读写分离等策略。
4. **高度可定制化**：通过插件可以扩展更多功能，如支持不同类型的数据库。

### **Mycat 缺点**：
1. **性能较差**：由于是基于 Java 实现的，因此在高并发环境下性能相对较差。
2. **配置复杂**：配置相对较为复杂，管理和使用较为困难。
3. **社区支持较弱**：主要是中文社区，英文文档和支持较少。

---

### **ProxySQL 优点**：
1. **高性能**：由于是用 C 语言编写，ProxySQL 在高并发环境下的性能非常优秀，适合大规模的数据库代理。
2. **易于配置和管理**：支持动态 SQL 配置，通过 SQL 命令可以实时更改配置，不需要重启。
3. **支持多种负载均衡策略**：提供了多种负载均衡和路由策略，支持更加复杂的路由需求。
4. **连接池优化**：连接池和缓存机制非常高效，有助于减少数据库连接数，提高性能。
5. **灵活的故障转移机制**：支持基于健康检查的自动故障转移和自动恢复。

### **ProxySQL 缺点**：
1. **仅支持 MySQL 和 MariaDB**：ProxySQL 主要支持 MySQL 和 MariaDB，不像 Mycat 那样支持多种数据库。
2. **功能相对较为单一**：虽然功能强大，但在一些复杂的分布式场景中，ProxySQL 的功能相比 Mycat 稍显单一。
3. **配置较为高级**：虽然配置灵活，但对于新手来说，ProxySQL 的配置和使用可能较为复杂。

---

### **总结**
- **Mycat** 更适合需要多种数据库支持、复杂的分布式架构和分库分表需求的场景。它适用于中大型企业的数据库中间件解决方案，尤其是在复杂的 SQL 路由和分布式数据库方面表现较好。
- **ProxySQL** 则非常适合高性能、高并发的 MySQL 或 MariaDB 环境，特别是在需要高效连接池、负载均衡和故障转移机制的场景中表现优异。它简单易用，适合对 MySQL 环境有较高要求的企业。

# 如何使用 ProxySQL 实现负载均衡

要实现 **主库既支持读也支持写，而从库只支持读** 的配置，你需要调整 **ProxySQL** 的配置，使得主库既能处理写请求（`INSERT`、`UPDATE` 等），也能处理读取请求（`SELECT`），而从库只能处理读取请求（`SELECT`）。

### 关键点：
- **主库**：处理读写请求。
- **从库**：只处理读请求（`SELECT`）。

### 具体步骤：

1. **调整 ProxySQL 配置**：你需要将主库配置为处理读写请求，从库配置为只处理读请求。
2. **更新路由规则**：配置 SQL 路由规则来确保写请求路由到主库，读请求可以同时路由到主库和从库。

### 配置方案

#### 1. **配置 MySQL 主从架构**

首先，确保你已经有一个 **MySQL 主从架构** 部署在 Kubernetes 中，主库可以处理读写请求，从库只能处理读请求。

- **mysql-master**：主库，支持读写操作。
- **mysql-slave**：从库，只支持读操作。

#### 2. **创建 ProxySQL 配置**

使用以下的 ProxySQL 配置，可以让 **主库支持读写**，**从库只支持读**。

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: proxysql-config
data:
  proxysql.cnf: |
    # MySQL 读写分离配置
    mysql_servers = (
      # 主库配置，支持读写操作
      { address = "mysql-master-service:3306", port = 3306, hostgroup = 0, max_connections = 100 },
      # 从库配置，只支持读操作
      { address = "mysql-slave-service:3306", port = 3306, hostgroup = 1, max_connections = 100 }
    )

    # 配置用户，设置默认的主库和从库
    mysql_users = (
      { username = "root", password = "root_password", default_hostgroup = 0, active = 1 }
    )

    # SQL 路由规则：
    # 1. 所有写操作（INSERT、UPDATE、DELETE）都路由到主库（hostgroup = 0）
    # 2. 只读操作（SELECT）路由到主库和从库（hostgroup = 0 和 hostgroup = 1）
    mysql_query_rules = (
      # 路由所有的 SELECT 查询到主库和从库
      { rule_id = 1, active = 1, match_pattern = "^SELECT", destination_hostgroup = 0, flagIN = 0 },
      { rule_id = 2, active = 1, match_pattern = "^SELECT", destination_hostgroup = 1, flagIN = 0 },
      
      # 路由所有的写操作（INSERT、UPDATE、DELETE）到主库
      { rule_id = 3, active = 1, match_pattern = "^(INSERT|UPDATE|DELETE)", destination_hostgroup = 0, flagIN = 0 }
    )
```

#### 3. **解析配置内容**

- **`mysql_servers`**：
  - `mysql-master-service`：主库服务，配置为 `hostgroup = 0`，支持读写。
  - `mysql-slave-service`：从库服务，配置为 `hostgroup = 1`，只支持读取。
  
- **`mysql_users`**：定义了一个用户 `root`，它的默认 `hostgroup` 是 `0`，即主库。这个用户可以通过 ProxySQL 连接到数据库，读取或写入。

- **`mysql_query_rules`**：
  - `rule_id = 1` 和 `rule_id = 2`：`SELECT` 查询被路由到主库和从库。这样主库可以处理读请求，而从库也可以处理读请求。
  - `rule_id = 3`：所有的写操作（如 `INSERT`、`UPDATE`、`DELETE`）都被路由到主库（`hostgroup = 0`）。

#### 4. **更新 ProxySQL 配置**

将这个配置更新到 ProxySQL，通常有两种方式：
1. **通过 `ConfigMap` 更新**：如果使用 Kubernetes `ConfigMap` 来管理 ProxySQL 配置，你只需更新 `ConfigMap` 中的 `proxysql.cnf` 配置并重新加载 ProxySQL。

2. **手动更新配置**：
   - 使用 `mysql` 客户端连接到 ProxySQL 的 Admin 端口（默认是 `6032`）并更新配置：

   ```bash
   mysql -h proxysql-service -P 6032 -u admin -p
   ```

   然后执行以下 SQL 来更新配置：

   ```sql
   -- 更新 mysql_servers 配置
   INSERT INTO mysql_servers (hostgroup_id, hostname, port) VALUES (0, 'mysql-master-service', 3306);
   INSERT INTO mysql_servers (hostgroup_id, hostname, port) VALUES (1, 'mysql-slave-service', 3306);

   -- 更新 mysql_users 配置
   INSERT INTO mysql_users (username, password, default_hostgroup) VALUES ('root', 'root_password', 0);

   -- 更新 mysql_query_rules 配置
   INSERT INTO mysql_query_rules (active, match_pattern, destination_hostgroup) VALUES (1, '^SELECT', 0);
   INSERT INTO mysql_query_rules (active, match_pattern, destination_hostgroup) VALUES (1, '^SELECT', 1);
   INSERT INTO mysql_query_rules (active, match_pattern, destination_hostgroup) VALUES (1, '^(INSERT|UPDATE|DELETE)', 0);

   -- 让配置生效
   LOAD MYSQL SERVERS TO RUNTIME;
   LOAD MYSQL USERS TO RUNTIME;
   LOAD MYSQL QUERY RULES TO RUNTIME;
   ```

#### 5. **部署 ProxySQL**

确保 ProxySQL 部署的 YAML 文件包含正确的 **ConfigMap** 配置，并且 ProxySQL 使用此配置文件。以下是 ProxySQL 的部署示例：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: proxysql
spec:
  replicas: 1
  selector:
    matchLabels:
      app: proxysql
  template:
    metadata:
      labels:
        app: proxysql
    spec:
      containers:
      - name: proxysql
        image: proxysql/proxysql
        ports:
          - containerPort: 6033 # MySQL 端口
          - containerPort: 6032 # Admin 端口
        volumeMounts:
          - mountPath: /etc/proxysql
            name: proxysql-config
      volumes:
        - name: proxysql-config
          configMap:
            name: proxysql-config
---
apiVersion: v1
kind: Service
metadata:
  name: proxysql
spec:
  ports:
    - port: 3306
      targetPort: 6033
  selector:
    app: proxysql
```

#### 6. **验证配置**

通过以下命令检查 ProxySQL 的配置是否生效：

```bash
# 登录到 ProxySQL Admin 端口
mysql -h proxysql-service -P 6032 -u admin -p

# 查看服务器配置
SELECT * FROM mysql_servers;

# 查看用户配置
SELECT * FROM mysql_users;

# 查看查询路由规则
SELECT * FROM mysql_query_rules;

# 如果需要重新加载配置
LOAD MYSQL SERVERS TO RUNTIME;
LOAD MYSQL USERS TO RUNTIME;
LOAD MYSQL QUERY RULES TO RUNTIME;
```

#### 7. **访问 ProxySQL**

你可以通过 **ProxySQL 服务** 访问数据库：

- **写操作**（`INSERT`、`UPDATE`、`DELETE`）会路由到主库。
- **读操作**（`SELECT`）会路由到主库和从库。

```bash
# 通过 ProxySQL 访问 MySQL 服务
mysql -h proxysql-service -P 3306 -u root -p
```

### 总结

- 通过更新 ProxySQL 配置文件，你可以将 **主库配置为支持读写操作**，并将 **从库配置为只读**。
- 配置 **`mysql_query_rules`** 来控制读写请求的路由，使得 **写请求只路由到主库**，**读请求路由到主库和从库**。
- 使用 Kubernetes `ConfigMap` 来管理 ProxySQL 配置，确保配置与容器的生命周期一致。
