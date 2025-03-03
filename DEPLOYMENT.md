# 危险废物管理系统部署指南

本文档提供了危险废物管理系统的部署步骤，包括开发环境和生产环境的配置。

## 目录
- [本地开发环境部署](#本地开发环境部署)
- [生产环境部署](#生产环境部署)
- [使用Nginx进行代理](#使用nginx进行代理)
- [常见问题排查](#常见问题排查)
- [系统维护](#系统维护)
- [安全建议](#安全建议)

## 本地开发环境部署

### 前提条件
- Node.js (推荐v14+) 和 npm
- MySQL 数据库
- Git (可选，用于克隆项目)

### 安装步骤

1. **克隆或下载项目**
   ```bash
   git clone https://github.com/Xiangyu-Lou/Hazardous-waste-management-system.git
   cd Hazardous-waste-management-system
   ```

2. **安装依赖**
   ```bash
   # 安装后端依赖
   cd backend
   npm install

   # 安装前端依赖
   cd ../frontend
   npm install
   ```

3. **配置MySQL数据库**
   确保MySQL服务已启动，并创建以下用户（或使用已有的具有创建数据库权限的用户）：
   - 用户名：Xiangyu
   - 密码：990924

   ```sql
   CREATE USER 'Xiangyu'@'localhost' IDENTIFIED BY '990924';
   GRANT ALL PRIVILEGES ON *.* TO 'Xiangyu'@'localhost';
   FLUSH PRIVILEGES;
   ```

4. **初始化数据库**
   ```bash
   cd db/mysql
   node init_db.js
   ```

5. **启动后端服务**
   ```bash
   cd backend
   node server.js
   ```

6. **启动前端开发服务器**
   ```bash
   cd frontend
   npm run serve
   ```

7. **访问应用**
   在浏览器中打开 [http://localhost:8080](http://localhost:8080)

## 生产环境部署

### 前提条件
- 一台运行 Linux 的服务器
- 已安装 Node.js (推荐v14+) 和 npm
- 已安装 MySQL 数据库
- 已安装 Nginx 或其他 Web 服务器

### 部署步骤

#### 1. 准备服务器环境

确保服务器已安装以下软件：

```bash
# Ubuntu系统
sudo apt update
sudo apt install -y nodejs npm mysql-server nginx

# CentOS系统
sudo yum update
sudo yum install -y nodejs npm mysql-server nginx
```

#### 2. 克隆或上传项目

将项目文件上传到服务器，例如：

```bash
# 使用git克隆
git clone <repository-url> /var/www/hazardous-waste-management-system

# 或上传本地文件到服务器
scp -r ./Hazardous-waste-management-system user@your-server-ip:/var/www/
```

#### 3. 配置MySQL数据库

```bash
# 启动MySQL服务
sudo systemctl start mysql
sudo systemctl enable mysql

# 登录MySQL并创建用户账号
sudo mysql
```

在MySQL中执行：

```sql
CREATE USER 'Xiangyu'@'localhost' IDENTIFIED BY '990924';
GRANT ALL PRIVILEGES ON *.* TO 'Xiangyu'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 4. 安装项目依赖并初始化数据库

```bash
# 安装后端依赖
cd /var/www/hazardous-waste-management-system/backend
npm install

# 安装前端依赖
cd /var/www/hazardous-waste-management-system/frontend
npm install

# 初始化数据库
cd /var/www/hazardous-waste-management-system/db/mysql
node init_db.js
```

#### 5. 构建前端项目

```bash
cd /var/www/hazardous-waste-management-system/frontend
npm run build
```

这会在 `frontend/dist` 目录下生成生产环境的前端文件。

#### 6. 配置Nginx

创建一个Nginx配置文件：

```bash
sudo vim /etc/nginx/sites-available/hazardous-waste
```

添加以下内容：

```nginx
server {
    listen 80;
    server_name your-domain.com; # 替换为你的域名或服务器IP

    # 前端资源
    location / {
        root /var/www/hazardous-waste-management-system/frontend/dist;
        try_files $uri $uri/ /index.html;
        index index.html;
    }

    # 后端API代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 上传文件目录
    location /uploads {
        alias /var/www/hazardous-waste-management-system/uploads;
    }
}
```

启用配置并重启Nginx：

```bash
sudo ln -s /etc/nginx/sites-available/hazardous-waste /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 7. 配置后端服务

为确保后端服务持续运行，可以使用PM2进程管理器：

```bash
# 安装PM2
sudo npm install -g pm2

# 启动后端服务
cd /var/www/hazardous-waste-management-system/backend
pm2 start server.js --name "hazardous-waste-api"

# 设置PM2随系统启动
pm2 startup
pm2 save
```

#### 8. 确保目录权限正确

```bash
# 创建并设置uploads目录权限
mkdir -p /var/www/hazardous-waste-management-system/uploads
sudo chown -R www-data:www-data /var/www/hazardous-waste-management-system/uploads
sudo chmod -R 755 /var/www/hazardous-waste-management-system/uploads
```

#### 9. 配置防火墙

确保服务器防火墙允许HTTP/HTTPS流量：

```bash
# Ubuntu
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# CentOS
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## 使用Nginx进行代理

### Windows环境下的Nginx配置

1. **下载并安装Nginx**
   - 从[Nginx官网](http://nginx.org/en/download.html)下载Windows版本
   - 解压到任意目录，如`C:\nginx`

2. **创建Nginx配置文件**
   在Nginx安装目录的`conf`文件夹中，创建一个名为`hazardous-waste.conf`的文件，内容如下：

   ```nginx
   server {
       listen 80;
       server_name localhost;

       # 前端资源
       location / {
           proxy_pass http://localhost:8080;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       # 后端API代理
       location /api {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       # 上传文件目录
       location /uploads {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **在主配置文件中引入自定义配置**
   编辑`C:\nginx\conf\nginx.conf`文件，在`http`块中添加：
   ```nginx
   include hazardous-waste.conf;
   ```

4. **启动Nginx**
   打开命令提示符或PowerShell，执行：
   ```
   cd C:\nginx
   start nginx
   ```

5. **重新加载配置**
   修改配置后重新加载：
   ```
   cd C:\nginx
   nginx -s reload
   ```

6. **停止Nginx**
   ```
   cd C:\nginx
   nginx -s stop
   ```

7. **访问应用**
   在浏览器中打开 [http://localhost](http://localhost)

### 生产环境的Nginx配置

对于生产环境，建议使用以下配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 将HTTP请求重定向到HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    # SSL证书配置
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;

    # 前端资源
    location / {
        root /var/www/hazardous-waste-management-system/frontend/dist;
        try_files $uri $uri/ /index.html;
        index index.html;
        
        # 缓存静态资源
        expires 1d;
        add_header Cache-Control "public";
    }

    # 后端API代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 上传文件目录
    location /uploads {
        alias /var/www/hazardous-waste-management-system/uploads;
        
        # 限制上传文件大小
        client_max_body_size 10M;
    }
}
```

## 常见问题排查

1. **前端无法连接后端**
   - 检查Nginx配置中的代理设置是否正确
   - 确认后端服务是否正在运行(`pm2 status`或`node server.js`)
   - 检查浏览器控制台是否有CORS错误

2. **图片上传失败**
   - 检查uploads目录权限
   - 确认nginx用户对uploads目录有写入权限
   - 检查服务器磁盘空间是否充足

3. **数据库连接错误**
   - 检查MySQL服务是否启动
   - 验证用户名/密码配置是否正确
   - 检查数据库连接字符串

4. **Nginx配置问题**
   - 使用`nginx -t`命令检查配置语法
   - 查看Nginx错误日志(`/var/log/nginx/error.log`或Windows下的`logs/error.log`)

## 系统维护

### 更新系统

当需要更新系统时：

```bash
# 拉取最新代码
cd /var/www/hazardous-waste-management-system
git pull

# 更新依赖
cd backend
npm install
cd ../frontend
npm install

# 重新构建前端
cd ../frontend
npm run build

# 重启后端服务
pm2 restart hazardous-waste-api
```

### 备份数据库

定期备份数据库是良好的维护习惯：

```bash
# 创建备份目录
mkdir -p /var/backups/hazardous-waste

# 备份数据库
mysqldump -u Xiangyu -p waste_management > /var/backups/hazardous-waste/backup_$(date +%Y%m%d).sql

# 设置定时备份（每天凌晨3点）
echo "0 3 * * * mysqldump -u Xiangyu -p990924 waste_management > /var/backups/hazardous-waste/backup_$(date +\\%Y\\%m\\%d).sql" | sudo tee -a /etc/crontab
```

## 安全建议

1. **使用HTTPS**
   - 获取并配置SSL证书
   - 将HTTP请求重定向到HTTPS

2. **定期更新依赖**
   ```bash
   npm audit fix
   ```

3. **限制上传文件类型和大小**
   - 在Nginx配置中设置`client_max_body_size`
   - 在后端代码中验证文件类型和大小

4. **设置强密码策略**
   - 要求密码包含大小写字母、数字和特殊字符
   - 定期更换密码

5. **配置防火墙**
   - 只开放必要的端口
   - 限制SSH访问

6. **定期备份**
   - 数据库备份
   - 代码备份
   - 上传文件备份