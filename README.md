# 危险废物管理系统

这是一个基于 Vue 和 MySQL 的危险废物管理系统，用于基层单位填报危险废物的产生情况。

## 项目功能

- 10个基层单位选择
- 废物分类：油泥沙、含油包装物、其他
- 废物产生信息填报
  - 产生地点
  - 收集开始时间
  - 现场照片（收集前）- 最多10张
  - 现场照片（收集后）- 最多10张
  - 收集数量
  - 自动记录填报时间
- 废物记录查看和管理
- 多级用户权限管理
  - 超级管理员：可查看和管理所有单位的记录
  - 单位管理员：可查看和管理本单位的记录
  - 基层员工：可填报本单位的废物记录

## 项目结构

```
hazardous-waste-management-system/
│
├── backend/          # Node.js 后端服务
│   ├── package.json  # 后端依赖配置
│   └── server.js     # 后端服务主文件
│
├── frontend/         # Vue 前端应用
│   ├── public/       # 静态资源
│   ├── src/          # 源代码
│   │   ├── views/    # 页面组件
│   │   ├── router/   # 路由配置
│   │   ├── store/    # 状态管理
│   │   ├── config/   # 配置文件
│   │   ├── App.vue   # 主应用组件
│   │   └── main.js   # 应用入口文件
│   ├── package.json  # 前端依赖配置
│   └── vue.config.js # Vue配置文件
│
├── db/               # 数据库文件
│   └── mysql/        # MySQL数据库脚本
│       ├── init_db.js        # 完整版MySQL初始化脚本
│       ├── init_db_simple.js # 简化版MySQL初始化脚本
│       └── README.md         # MySQL配置说明
│
└── uploads/          # 上传的照片存储目录(运行后生成)
```

## 测试账号

初始化数据库后，系统包含以下测试账号：

1. 超级管理员
   - 手机号: 13800000001
   - 密码: 1

2. 牛庄管理员
   - 手机号: 13800000002
   - 密码: 2

3. 牛庄员工
   - 手机号: 13800000003
   - 密码: (无需密码)

## 安装和运行步骤

### 1. 克隆项目并安装依赖

```bash
# 克隆项目
git clone https://github.com/Xiangyu-Lou/Hazardous-waste-management-system.git

# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 2. 配置MySQL数据库

确保MySQL服务已启动，并创建以下用户（或使用已有的具有创建数据库权限的用户）：
- 用户名：Xiangyu
- 密码：990924

```sql
CREATE USER 'Xiangyu'@'localhost' IDENTIFIED BY '990924';
GRANT ALL PRIVILEGES ON *.* TO 'Xiangyu'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. 初始化数据库

```bash
cd db/mysql
node init_db.js
```

此脚本会：
- 创建`waste_management`数据库
- 创建所有必要的表
- 插入基础数据和测试账号

如果您已经手动创建了数据库，或者没有创建数据库的权限，可以使用简化版初始化脚本：

```bash
cd db/mysql
node init_db_simple.js
```

### 4. 启动后端服务

```bash
cd backend
node server.js
```

### 5. 启动前端开发服务器

```bash
cd frontend
npm run serve
```

### 6. 访问应用

在浏览器中打开 [http://localhost:8080](http://localhost:8080)

## 数据库结构

系统使用MySQL数据库，主要表结构包括：

1. `user_roles` - 用户角色表
2. `units` - 单位信息表
3. `users` - 用户信息表
4. `waste_types` - 废物类型表
5. `waste_records` - 废物记录表，包含以下主要字段：
   - 单位ID
   - 废物类型ID
   - 产生地点
   - 收集时间
   - 收集前照片路径
   - 收集后照片路径
   - 收集数量
   - 创建时间
   - 创建者ID

更多详细信息请参考 `db/mysql/README.md`