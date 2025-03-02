# 危险废物管理系统部署指南

本文档提供了在云服务器上部署危险废物管理系统的详细步骤。

## 前提条件

- 一台运行 Linux 服务器
- 已安装 Node.js (推荐v14+) 和 npm
- 已安装 MySQL 数据库
- 已安装 Nginx 或其他 Web 服务器

## 部署步骤

### 1. 准备服务器环境

确保服务器已安装以下软件：

```bash
# Ubuntu系统
sudo apt update
sudo apt install -y nodejs npm mysql-server nginx

# CentOS系统
sudo yum update
sudo yum install -y nodejs npm mysql-server nginx
```

### 2. 克隆或上传项目

将项目文件上传到服务器，例如：

```bash
# 使用git克隆（如适用）
git clone <repository-url> /var/www/hazardous-waste-management-system

# 或上传本地文件到服务器
scp -r ./Hazardous-waste-management-system user@your-server-ip:/var/www/
```

### 3. 配置MySQL数据库

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

### 4. 安装项目依赖并初始化数据库

```bash
# 安装后端依赖
cd /var/www/hazardous-waste-management-system/backend
npm install

# 安装前端依赖
cd /var/www/hazardous-waste-management-system/frontend
npm install

# 初始化数据库
cd /var/www/Hazardous-waste-management-system/backend
npm run init-db
```

### 5. 构建前端项目

```bash
cd /var/www/hazardous-waste-management-system/frontend
npm run build
```

这会在 `frontend/dist` 目录下生成生产环境的前端文件。

### 6. 配置Nginx

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

### 7. 配置后端服务

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

### 8. 确保目录权限正确

```bash
# 创建并设置uploads目录权限
mkdir -p /var/www/hazardous-waste-management-system/uploads
sudo chown -R www-data:www-data /var/www/hazardous-waste-management-system/uploads
sudo chmod -R 755 /var/www/hazardous-waste-management-system/uploads
```

### 9. 配置防火墙

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

## 访问系统

完成以上步骤后，可通过以下地址访问系统：

- 前端: http://your-domain.com 或 http://your-server-ip
- 后端API: http://your-domain.com/api

## 测试账号

默认的测试账号：

1. 超级管理员
   - 手机号: 13800000001
   - 密码: 1

2. 牛庄管理员
   - 手机号: 13800000002
   - 密码: 2

3. 牛庄员工
   - 手机号: 13800000003
   - 密码: (无需密码)

## 常见问题排查

1. **前端无法连接后端**
   - 检查Nginx配置中的代理设置是否正确
   - 确认后端服务是否正在运行(`pm2 status`)

2. **图片上传失败**
   - 检查uploads目录权限
   - 确认nginx用户对uploads目录有写入权限

3. **数据库连接错误**
   - 检查MySQL服务是否启动
   - 验证用户名/密码配置是否正确

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

1. **设置SSL证书**
   - 使用Let's Encrypt设置HTTPS加密
   - 修改Nginx配置，强制使用HTTPS

2. **数据库安全**
   - 修改默认测试账号的密码
   - 限制数据库只接受本地连接
   - 定期更新数据库密码

3. **系统更新**
   - 定期更新服务器操作系统
   - 保持Node.js和其他依赖的最新安全版本

## 云服务器特别说明

在云服务器环境中，可能需要注意以下几点：

1. **域名解析**：如果您使用域名，请确保已正确设置DNS解析指向您的云服务器IP

2. **CDN配置**：如需使用CDN加速前端资源，请确保正确配置缓存规则，API请求不要缓存

3. **云服务器安全组**：确保在云服务器控制台开放了必要的端口（80/443）

4. **数据备份**：利用云服务提供的快照或备份功能，定期备份整个系统

## 故障恢复

如果系统出现故障，可以按照以下步骤进行恢复：

1. **检查日志**
   ```bash
   # 检查Nginx错误日志
   sudo tail -f /var/log/nginx/error.log
   
   # 检查PM2日志
   pm2 logs hazardous-waste-api
   ```

2. **重启服务**
   ```bash
   # 重启Nginx
   sudo systemctl restart nginx
   
   # 重启后端服务
   pm2 restart hazardous-waste-api
   
   # 重启MySQL
   sudo systemctl restart mysql
   ```

3. **数据库恢复**（如需）
   ```bash
   mysql -u Xiangyu -p waste_management < /var/backups/hazardous-waste/backup_YYYYMMDD.sql
   ```

## 联系支持

如有任何部署或使用问题，请联系系统管理员或开发人员。