# 危险废物管理系统部署指南 Linux

本文档提供了在Linux系统上部署危险废物管理系统的详细步骤。

## 1. 准备工作

### 1.1 安装 Node.js

```bash
# 使用 nvm 安装 Node.js（推荐）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
source ~/.bashrc
nvm install --lts
nvm use --lts

# 直接安装
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm
```

### 1.2 安装 MySQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server

# 启动 MySQL 服务并设置开机自启
sudo systemctl start mysql
sudo systemctl enable mysql

# 配置 MySQL 安全设置
sudo mysql_secure_installation
```
### 1.3 安装Nginx(可选)

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx
```

### 1.4 获取代码
```bash
# 克隆代码仓库
git clone git@github.com:Xiangyu-Lou/Hazardous-waste-management-system.git
cd hazardous-waste-management-system
```
## 2. 部署后端

### 2.1 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装数据库初始化脚本依赖
cd ../db/mysql
npm install
```

### 2.2 初始化数据库

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
node init_db.js
```

### 2.3 配置数据库链接

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

### 2.4 创建上传目录

```bash
# 修改上传目录权限
cd ../../
chmod 755 uploads
```

### 2.5 部署后端服务（开发环境）

```bash
# 进入后端目录
cd backend
# 启动开发服务
npm run start
```

### 2.6 部署后端服务（生产环境）

```bash
# 安装 PM2
npm install -g pm2

# 启动后端服务
cd backend
pm2 start server.js --name "waste-management-backend"

# 设置开机自启
pm2 startup
pm2 save
```
## 3. 部署前端

### 3.1 安装依赖并构建前端

```bash
# 进入前端目录
cd ../frontend

# 安装依赖
npm install
```

### 3.2 部署前端（开发版本）

```bash
# 进入前端目录
cd ../frontend

# 启动开发服务
npm run serve
```

### 3.3 部署前端（生产版本）（需要ngnix）

```bash
# 进入前端目录
cd ../frontend

# 构建生产版本
npm run build
```

## 4. 配置 Nginx

### 4.1 开发版本
创建 Nginx 配置文件：

```bash
sudo mv ../ngnix_config/linux/develop/waste-management /etc/nginx/sites-available/
```

启用配置并重启 Nginx：

```bash
sudo ln -s /etc/nginx/sites-available/waste-management /etc/nginx/sites-enabled/
sudo nginx -t  # 检测配置是否正确
sudo systemctl restart nginx
```

### 4.2 生产版本

```bash
sudo mv ../ngnix_config/linux/product/waste-management /etc/nginx/sites-available/
```

启用配置并重启 Nginx：
```bash
sudo ln -s /etc/nginx/sites-available/waste-management /etc/nginx/sites-enabled/
sudo nginx -t  # 检测配置是否正确
sudo systemctl restart nginx
```
