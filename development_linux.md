# Registration-Management-System Deployment Guide for Linux

This document provides detailed steps for deploying the Registration-Management-System on Linux.

## 1. Preparation

### 1.1 Install Node.js

```bash
# Using nvm to install Node.js (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
source ~/.bashrc
nvm install --lts
nvm use --lts

# Direct installation
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm
```

### 1.2 Install MySQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server

# Start MySQL service and enable auto-start
sudo systemctl start mysql
sudo systemctl enable mysql

# Configure MySQL security settings
sudo mysql_secure_installation
```
### 1.3 Install Nginx (optional)

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx
```

### 1.4 Get the code
```bash
# Clone the repository
git clone git@github.com:Xiangyu-Lou/Registration-Management-System.git
cd Registration-Management-System
```

### 1.5 Configure environment variables

```bash
# Create .env file in the backend directory
cd backend
vim .env

# Input the following content
# Database configuration
DB_HOST=localhost
DB_USER=  # Replace with your MySQL username
DB_PASSWORD=  # Replace with your MySQL password
DB_NAME=waste_management

# Other configurations
PORT=3000
JWT_SECRET=  # Replace with your JWT secret key
UPLOAD_DIR=uploads 
```

## 2. Deploy the Backend

### 2.1 Install Dependencies

```bash
# Install backend dependencies
npm install

# Install database initialization script dependencies
cd ../db/mysql
npm install
```

### 2.2 Initialize the Database

1. Open the `db/mysql/init_db.js` file in the project
2. Modify the database connection configuration:
```javascript
const dbConfig = {
    host: 'localhost',
    user: 'your_username',    // Replace with your MySQL username
    password: 'your_password', // Replace with your MySQL password
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};
```
3. Run the initialization script:
```bash
node init_db.js
```

### 2.3 Configure Database Connection

Edit the `backend/server.js` file, modify the database connection configuration:
```javascript
const dbConfig = {
    host: 'localhost',
    user: 'your_username',  // Change to your created username
    password: 'your_password',  // Change to your set password
    database: 'waste_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true
};
```

### 2.4 Create Upload Directory

```bash
# Modify upload directory permissions
cd ../../
chmod 755 uploads
```

### 2.5 Deploy Backend Service (Development Environment)

```bash
# Enter the backend directory
cd backend
# Start development service
npm run start
```

### 2.6 Deploy Backend Service (Production Environment)

```bash
# Install PM2
sudo npm install -g pm2

# Start backend service
cd backend
pm2 start server.js --name "waste-management-backend"

# Set up auto-start
pm2 startup
pm2 save
```
## 3. Deploy Frontend

### 3.1 Install Dependencies and Build Frontend

```bash
# Enter frontend directory
cd ../frontend

# Install dependencies
npm install
```

### 3.2 Deploy Frontend (Development Version)

```bash
# Start development server
npm run serve
```

### 3.3 Deploy Frontend (Production Version) (Requires Nginx)

```bash
# Build production version
npm run build
```

## 4. Configure Nginx

### 4.1 Development Version
Create Nginx configuration file:

```bash
sudo mv ../ngnix_config/linux/develop/waste-management /etc/nginx/sites-available/
```

Enable configuration and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/waste-management /etc/nginx/sites-enabled/
sudo nginx -t  # Check if configuration is correct
sudo systemctl restart nginx
```
### 4.2 Production Version（Using IP）

```bash
sudo mv ../ngnix_config/linux/product/waste-management-ip /etc/nginx/sites-available/
# Or use
sudo vim /etc/nginx/sites-available/waste-management-ip
```

Enable configuration and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/waste-management /etc/nginx/sites-enabled/
sudo nginx -t  # Check if configuration is correct
sudo systemctl restart nginx
```

### 4.3 Production Version（Using https）

```bash
sudo mv ../ngnix_config/linux/product/waste-management /etc/nginx/sites-available/
# Or use
sudo vim /etc/nginx/sites-available/waste-management
```

Enable configuration and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/waste-management /etc/nginx/sites-enabled/
sudo nginx -t  # Check if configuration is correct
sudo systemctl restart nginx
```

Modify permissions (may be necessary)
sudo chmod +x /home/ecs-user/

### 4.3.1 Configure SSL Certificate

Upload certificate to /etc/nginx/ssl/

Modify configuration file

```bash
sudo vim /etc/nginx/sites-available/waste-management
```

Enable configuration and restart Nginx:

```bash
sudo nginx -t  # Check if configuration is correct
sudo systemctl restart nginx
``` 
