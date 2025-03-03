# Nginx 安装和配置指南

本文档提供了在 Windows 环境下安装和配置 Nginx 的步骤，用于代理危险废物管理系统的前端和后端服务。

## 安装 Nginx

1. **下载 Nginx**
   - 访问 [Nginx 官方网站](http://nginx.org/en/download.html)
   - 下载最新的稳定版本的 Windows 版本（例如：`nginx-1.24.0.zip`）

2. **解压文件**
   - 将下载的 zip 文件解压到一个简单的路径，例如 `C:\nginx`
   - 确保路径中没有空格或特殊字符

## 配置 Nginx

1. **使用项目中的配置文件**
   - 将项目根目录中的 `nginx.conf` 文件复制到 Nginx 安装目录的 `conf` 文件夹中
   - 替换原有的 `nginx.conf` 文件

   ```
   copy nginx.conf C:\nginx\conf\nginx.conf
   ```

2. **配置说明**
   - 该配置文件设置了以下代理规则：
     - 将 `http://localhost/` 请求代理到前端服务 `http://localhost:8080/`
     - 将 `http://localhost/api/` 请求代理到后端服务 `http://localhost:3000/api/`
     - 将 `http://localhost/uploads/` 请求代理到后端服务 `http://localhost:3000/uploads/`

## 启动和管理 Nginx

1. **启动 Nginx**
   - 打开命令提示符或 PowerShell（以管理员身份运行）
   - 导航到 Nginx 安装目录
   - 执行以下命令启动 Nginx：

   ```
   cd C:\nginx
   start nginx
   ```

2. **验证 Nginx 是否运行**
   - 打开浏览器，访问 `http://localhost`
   - 如果 Nginx 正在运行，并且前端服务也在运行，你应该能看到危险废物管理系统的登录页面

3. **重新加载配置**
   - 如果修改了配置文件，可以使用以下命令重新加载配置，而不需要重启 Nginx：

   ```
   nginx -s reload
   ```

4. **停止 Nginx**
   - 使用以下命令停止 Nginx：

   ```
   nginx -s stop
   ```

## 常见问题排查

1. **端口冲突**
   - 如果 80 端口已被占用，可以在 `nginx.conf` 中修改监听端口，例如改为 8000：
   ```
   listen 8000;
   ```
   - 然后通过 `http://localhost:8000` 访问应用

2. **权限问题**
   - 在 Windows 上，可能需要以管理员身份运行命令提示符或 PowerShell 来启动 Nginx

3. **路径问题**
   - 确保所有路径中不包含空格或特殊字符
   - 使用反斜杠 `\` 作为 Windows 路径分隔符

4. **查看日志**
   - Nginx 日志位于 `C:\nginx\logs` 目录
   - 检查 `error.log` 文件以排查问题

## 使用 Nginx 进行测试

配置完成后，你可以通过以下步骤测试系统：

1. **启动后端服务**
   ```
   cd backend
   node server.js
   ```

2. **启动前端开发服务器**
   ```
   cd frontend
   npm run serve
   ```

3. **启动 Nginx**
   ```
   cd C:\nginx
   start nginx
   ```

4. **访问应用**
   - 打开浏览器，访问 `http://localhost`
   - 所有请求将通过 Nginx 代理到相应的服务

## 生产环境配置

对于生产环境，建议进行以下额外配置：

1. **配置 HTTPS**
   - 获取 SSL 证书
   - 在 Nginx 配置中启用 HTTPS

2. **优化性能**
   - 启用 gzip 压缩
   - 配置缓存策略
   - 调整工作进程数量

更多详细的部署信息，请参考 [部署指南](DEPLOYMENT.md)。 