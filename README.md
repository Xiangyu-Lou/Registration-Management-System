# 危险废物管理系统

这是一个基于 Vue 和 MySQL 的危险废物管理系统，用于基层单位填报危险废物的产生情况。

## 项目功能

- 10个基层单位选择
- 废物分类：油泥沙、含油包装物、其他
- 废物产生信息填报
  - 产生地点
  - 收集开始时间
  - 现场照片
  - 收集数量
  - 自动记录填报时间
- 废物记录查看

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

### 3. 初始化数据库

有两种方式可以初始化数据库：

#### 方式一：使用完整初始化脚本（推荐）

如果您的MySQL用户有创建数据库的权限：

```bash
cd backend
npm run init-db
```

此脚本会：
- 创建`waste_management`数据库
- 创建所有必要的表
- 插入基础数据和测试账号

#### 方式二：手动创建数据库后初始化

如果您的用户没有创建数据库权限，可以先手动创建数据库：

```sql
CREATE DATABASE waste_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON waste_management.* TO 'Xiangyu'@'localhost';
FLUSH PRIVILEGES;
```

然后运行简化版初始化脚本：

```bash
cd backend
npm run init-db-simple
```

### 4. 启动后端服务

```bash
cd backend
npm run start
```

### 5. 启动前端开发服务器

```bash
cd frontend
npm run serve
```

### 6. 访问应用

在浏览器中打开 [http://localhost:8080](http://localhost:8080)

## 部署说明

### 前端构建

```bash
cd frontend
npm run build
```

构建完成后，将 `frontend/dist` 目录下的文件部署到 Web 服务器。

### 后端部署

确保 Node.js 环境已安装，然后启动后端服务：

```bash
cd backend
npm start
```

可以使用 PM2 等工具将服务作为后台进程运行。
