# 危险废物管理系统部署指南 Windows

本文档提供了在Windows系统上部署危险废物管理系统的详细步骤。

## 1. 准备工作

### 1.1 安装 Node.js

1. 访问 [Node.js 官网](https://nodejs.org/)下载Windows安装包
2. 验证安装：
```bash
node --version
npm --version
```

### 1.2 安装 MySQL

1. 访问 [MySQL官网](https://dev.mysql.com/downloads/installer/) 下载MySQL安装程序
2. 确保MySQL服务已启动：
   - 在Windows搜索栏中输入"services.msc"
   - 找到"MySQL"服务，确保其状态为"正在运行"

### 1.3 获取代码
```bash
git clone https://github.com/Xiangyu-Lou/Registration-Management-System.git
cd Registration-Management-System
```

### 1.4 配置环境变量

```bash
# 在项目backend目录下创建 .env 文件
cd backend
vim .env

# 输入以下内容
# 数据库配置
DB_HOST=localhost
DB_USER=  # 替换为您的MySQL用户名
DB_PASSWORD=  # 替换为您的MySQL密码
DB_NAME=waste_management

# 其他配置
PORT=3000
JWT_SECRET=  # 替换为您的JWT密钥
UPLOAD_DIR=uploads 
```

## 2. 部署后端

### 2.1 安装依赖

```bash
cd db/mysql
npm install
cd ../backend
npm install
```

### 2.3 初始化数据库

1. 打开项目中的 `db/mysql/init_db.js` 文件
2. 修改数据库连接配置：
```javascript
const dbConfig = {
    host: 'localhost',
    user: 'your_username',    // 替换为您的MySQL用户名
    password: 'your_password', // 替换为您的MySQL密码
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};
```
3. 运行初始化脚本：
```bash
cd db/mysql
node init_db.js
```

### 2.4 配置数据库链接

编辑 `backend/server.js` 文件，修改数据库连接配置：
```javascript
const dbConfig = {
    host: 'localhost',
    user: 'your_username',  // 修改为您创建的用户名
    password: 'your_password',  // 修改为您设置的密码
    database: 'waste_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true
};
```

### 2.5 运行后端服务
```bash
cd ../../backend
npm run start
```

## 3. 部署前端

### 3.1 安装依赖
```bash
cd ../frontend
npm install
```

### 3.2 运行前端服务(开发环境)
```bash
cd ../frontend
npm run serve
```

### 2.6 运行前端服务(生产环境)
```bash
cd ../frontend
npm run build
```
如果不是使用nginx，则需要使用http-server运行前端服务
```bash
npm install -g http-server
cd dist
http-server -p 8080
```

## 3. 配置 Nginx (可选)

1. 访问 [Nginx 官方网站](http://nginx.org/en/download.html)，下载 Windows 版本
2. 将下载的 zip 文件解压到您选择的目录，例如 `C:\Program Files (x86)\nginx-1.27.4`
3. 配置nginx.conf文件
   - 对于开发环境，使用 `\ngnix_config\windows\develop\nginx.conf` 替换 `C:\Program Files (x86)\nginx-1.27.4\conf\nginx.conf` 文件
   - 对于生产环境，使用 `\ngnix_config\windows\production\nginx.conf` 替换 `C:\Program Files (x86)\nginx-1.27.4\conf\nginx.conf` 文件

4. 启动 Nginx：
   - 导航到 Nginx 目录：`cd C:\Program Files (x86)\nginx-1.27.4`
   - 验证配置文件：`nginx -t`
   - 启动 Nginx：`start nginx`

5. 访问 http://localhost

6. 常用命令：
   - 启动 Nginx：`start nginx`
   - 停止 Nginx：`nginx -s stop`
   - 重新加载配置：`nginx -s reload`
   - 退出：`nginx -s quit`




