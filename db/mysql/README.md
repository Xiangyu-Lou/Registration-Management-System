# MySQL数据库配置说明

本项目使用MySQL数据库来存储危险废物管理信息。

## 数据库连接信息

- 主机: localhost
- 用户名: Xiangyu
- 密码: 990924
- 数据库名: waste_management

## 数据表结构

系统中包含以下表结构:

1. `user_roles` - 用户角色表
   - id (INT, 主键)
   - name (VARCHAR(50), 唯一)

2. `units` - 单位信息表
   - id (INT, 主键)
   - name (VARCHAR(100), 唯一)

3. `users` - 用户信息表
   - id (INT, 主键)
   - username (VARCHAR(100))
   - phone (VARCHAR(20), 唯一)
   - password (VARCHAR(100), 可为NULL)
   - role_id (INT, 外键关联user_roles)
   - unit_id (INT, 外键关联units, 可为NULL)

4. `waste_types` - 废物类型表
   - id (INT, 主键)
   - name (VARCHAR(100), 唯一)

5. `waste_records` - 废物记录表
   - id (INT, 主键)
   - unit_id (INT, 外键关联units)
   - waste_type_id (INT, 外键关联waste_types)
   - location (VARCHAR(200))
   - collection_start_time (DATETIME)
   - photo_path (VARCHAR(500), 可为NULL)
   - quantity (DECIMAL(10,2))
   - created_at (DATETIME)
   - creator_id (INT, 外键关联users, 可为NULL)

## 数据库初始化

### 方式一：完整初始化（推荐）

如果您的MySQL用户具有创建数据库的权限，可以直接运行：

```bash
cd backend
npm run init-db
```

此命令将：
1. 自动安装所需依赖
2. 创建`waste_management`数据库
3. 创建所有必要的表结构
4. 插入基础数据和测试账号

### 方式二：简化初始化

如果您已经手动创建了数据库，或者没有创建数据库的权限，请使用：

```bash
cd backend
npm run init-db-simple
```

此命令假设`waste_management`数据库已存在，它只会：
1. 创建所有表结构
2. 插入基础数据和测试账号

### 手动创建数据库（如需要）

如果您需要手动创建数据库，请使用以下SQL命令：

```sql
CREATE DATABASE waste_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON waste_management.* TO 'Xiangyu'@'localhost';
FLUSH PRIVILEGES;
```

## 测试账号

成功初始化后，系统将包含以下测试账号：

1. 超级管理员
   - 手机号: 13800000001
   - 密码: 1

2. 牛庄管理员
   - 手机号: 13800000002
   - 密码: 2

3. 牛庄员工
   - 手机号: 13800000003
   - 密码: (无需密码)
