# 危险废物管理系统

这是一个基于 Vue 和 SQLite 的危险废物管理系统，用于基层单位填报危险废物的产生情况。

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
hazardous-waste-management/
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
│   │   ├── App.vue   # 主应用组件
│   │   └── main.js   # 应用入口文件
│   ├── package.json  # 前端依赖配置
│   └── vue.config.js # Vue配置文件
│
├── db/               # 数据库文件
│   ├── init_db.js    # 数据库初始化脚本
│   └── waste_management.db  # SQLite数据库文件(运行后生成)
│
└── uploads/          # 上传的照片存储目录(运行后生成)
```

## 安装和运行

### 1. 安装后端依赖

```bash
cd backend
npm install
```

### 2. 安装前端依赖

```bash
cd frontend
npm install
```

### 3. 初始化数据库

```bash
cd backend
npm run init-db
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
