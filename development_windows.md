# Registration-Management-System Deployment Guide for Windows

This document provides detailed steps for deploying the Registration-Management-System on Windows.

## 1. Preparation

### 1.1 Install Node.js

1. Visit the [Node.js official website](https://nodejs.org/) to download the Windows installer
2. Verify installation:
```bash
node --version
npm --version
```

### 1.2 Install MySQL

1. Visit the [MySQL official website](https://dev.mysql.com/downloads/installer/) to download the MySQL installer
2. Ensure MySQL service is running:
   - Type "services.msc" in the Windows search bar
   - Find the "MySQL" service and make sure its status is "Running"

### 1.3 Get the code
```bash
git clone https://github.com/Xiangyu-Lou/Registration-Management-System.git
cd Registration-Management-System
```
## 2. Deploy the Backend

### 2.1 Install Dependencies

```bash
cd ../db/mysql
npm install
cd ../../backend
npm install
```

### 2.3 Initialize the Database

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
cd db/mysql
node init_db.js
```

### 2.4 Configure Database Connection

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

### 2.5 Run Backend Service
```bash
cd ../../backend
npm run start
```

## 3. Deploy Frontend

### 3.1 Install Dependencies
```bash
cd ../frontend
npm install
```

### 3.2 Run Frontend Service (Development Environment)
```bash
cd ../frontend
npm run serve
```

### 3.3 Run Frontend Service (Production Environment)
```bash
cd ../frontend
npm run build
```
If not using Nginx, you'll need to use http-server to run the frontend service
```bash
npm install -g http-server
cd dist
http-server -p 8080
```

## 4. Configure Nginx (Optional)

1. Visit the [Nginx official website](http://nginx.org/en/download.html) to download the Windows version
2. Extract the downloaded zip file to a directory of your choice, for example `C:\Program Files (x86)\nginx-1.27.4`
3. Configure the nginx.conf file
   - For development environment, replace `C:\Program Files (x86)\nginx-1.27.4\conf\nginx.conf` with `\ngnix_config\windows\develop\nginx.conf`
   - For production environment, replace `C:\Program Files (x86)\nginx-1.27.4\conf\nginx.conf` with `\ngnix_config\windows\production\nginx.conf`

4. Start Nginx:
   - Navigate to the Nginx directory: `cd C:\Program Files (x86)\nginx-1.27.4`
   - Verify the configuration file: `nginx -t`
   - Start Nginx: `start nginx`

5. Visit http://localhost

6. Common commands:
   - Start Nginx: `start nginx`
   - Stop Nginx: `nginx -s stop`
   - Reload configuration: `nginx -s reload`
   - Quit: `nginx -s quit`




