# 危险废物管理系统部署指南

本文档提供了在服务器上部署危险废物管理系统的详细步骤。

## 系统要求

- Node.js 14.x 或更高版本
- MySQL 8.x 或更高版本
- Nginx (用于反向代理)

## 1. 准备工作

### 1.1 安装 Node.js

```bash
# 使用 nvm 安装 Node.js (推荐)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
source ~/.bashrc
nvm install 14
nvm use 14

# 或者直接安装
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm
```

### 1.2 安装 MySQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server

# 启动 MySQL 服务
sudo systemctl start mysql
sudo systemctl enable mysql

# 配置 MySQL 安全设置
sudo mysql_secure_installation
```

### 1.3 创建数据库和用户

```bash
# 登录 MySQL
sudo mysql -u root -p

# 在 MySQL 中执行以下命令
CREATE DATABASE waste_management;
CREATE USER 'waste_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON waste_management.* TO 'waste_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 2. 部署后端

### 2.1 获取代码

```bash
# 克隆代码仓库
git clone <repository_url>
cd hazardous-waste-management-system
```

### 2.2 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装数据库初始化脚本依赖
cd ../db/mysql
npm install
```

### 2.3 配置数据库连接

编辑 `db/mysql/init_db.js` 和 `db/mysql/init_db_simple.js` 文件，修改数据库连接配置：

```javascript
const dbConfig = {
  host: 'localhost',
  user: 'waste_user',  // 修改为您创建的用户名
  password: 'your_password',  // 修改为您设置的密码
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};
```

同样，编辑 `backend/server.js` 文件，修改数据库连接配置：

```javascript
const dbConfig = {
  host: 'localhost',
  user: 'waste_user',  // 修改为您创建的用户名
  password: 'your_password',  // 修改为您设置的密码
  database: 'waste_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true
};
```

### 2.4 初始化数据库

```bash
# 返回项目根目录
cd ../../

# 初始化数据库
cd backend
npm run init-db
```

### 2.5 创建上传目录

```bash
# 在项目根目录下创建上传目录
mkdir -p uploads
chmod 755 uploads
```

### 2.6 使用 PM2 运行后端服务

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

# 构建生产版本
npm run build
```

### 3.2 配置 Nginx

安装 Nginx：

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx
```

创建 Nginx 配置文件：

```bash
sudo nano /etc/nginx/sites-available/waste-management
```

添加以下配置：

```nginx
server {
    listen 80;
    server_name your_domain.com;  # 替换为您的域名或服务器 IP

    # 前端资源
    location / {
        root /path/to/hazardous-waste-management-system/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 10M;  # 允许上传最大 10MB 的文件
    }

    # 上传文件目录
    location /uploads {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 10M;
    }

    # 错误页面
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

启用配置并重启 Nginx：

```bash
sudo ln -s /etc/nginx/sites-available/waste-management /etc/nginx/sites-enabled/
sudo nginx -t  # 测试配置是否有效
sudo systemctl restart nginx
```

## 4. 安全配置

### 4.1 配置防火墙

```bash
# Ubuntu/Debian 使用 ufw
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

### 4.2 设置 HTTPS (推荐)

使用 Let's Encrypt 获取免费 SSL 证书：

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your_domain.com
```

## 5. 系统维护

### 5.1 日志查看

```bash
# 查看后端日志
pm2 logs waste-management-backend

# 查看 Nginx 访问日志
sudo tail -f /var/log/nginx/access.log

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log
```

### 5.2 系统更新

```bash
# 拉取最新代码
git pull

# 更新后端依赖
cd backend
npm install

# 更新前端依赖并重新构建
cd ../frontend
npm install
npm run build

# 重启后端服务
cd ../backend
pm2 restart waste-management-backend
```

### 5.3 数据库备份

```bash
# 创建备份目录
mkdir -p ~/backups

# 备份数据库
mysqldump -u waste_user -p waste_management > ~/backups/waste_management_$(date +%Y%m%d).sql
```

## 6. 故障排除

### 6.1 后端服务无法启动

- 检查数据库连接配置是否正确
- 检查 Node.js 版本是否兼容
- 检查日志文件获取详细错误信息

### 6.2 前端无法访问

- 检查 Nginx 配置是否正确
- 确保前端已正确构建
- 检查 Nginx 错误日志

### 6.3 文件上传失败

- 检查上传目录权限
- 确保 Nginx 配置中的 `client_max_body_size` 设置足够大
- 检查后端服务器的磁盘空间是否充足

### 6.4 照片显示问题

- 如果从旧版本升级，确保已运行 `merge_photo_paths.js` 迁移脚本
- 检查数据库中 `waste_records` 表是否包含 `photos` 字段
- 确保前端代码已更新为使用新的照片字段格式

## 7. 联系支持

如有任何部署问题，请联系系统管理员或开发团队获取支持。