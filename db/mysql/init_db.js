const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
// 加载环境变量，指定绝对路径
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// 输出环境变量进行调试
console.log('环境变量加载状态:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '已设置' : '未设置');
console.log('DB_NAME:', process.env.DB_NAME);

// 密码加密函数
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// MySQL连接配置 - 从环境变量中读取
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// 输出数据库连接配置进行调试
console.log('数据库连接配置:');
console.log('host:', dbConfig.host);
console.log('user:', dbConfig.user);

async function initializeDatabase() {
  let connection;
  let createDbConnection;
  
  try {
    console.log('尝试连接到MySQL服务器...');
    // 先创建连接而不指定数据库，用于创建数据库
    createDbConnection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });
    
    console.log('成功连接到MySQL服务器');
    
    // 从环境变量获取数据库名称
    const dbName = process.env.DB_NAME || 'waste_management';
    
    // 创建数据库
    await createDbConnection.execute(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    console.log(`数据库 ${dbName} 已创建或已存在`);
    
    // 关闭创建数据库的连接
    await createDbConnection.end();
    
    // 连接到新创建的数据库
    connection = await mysql.createConnection({
      ...dbConfig,
      database: dbName
    });
    console.log(`成功连接到数据库 ${dbName}`);
    
    // 创建user_roles表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_roles (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(50) NOT NULL UNIQUE
      )
    `);
    console.log('user_roles表已创建');
    
    // 创建单位表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS units (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL UNIQUE
      )
    `);
    console.log('units表已创建');
    
    // 创建用户表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL UNIQUE,
        password VARCHAR(100),
        role_id INT NOT NULL,
        unit_id INT,
        status TINYINT DEFAULT 1 COMMENT '账号状态：0-停用，1-正常',
        can_view_logs TINYINT(1) DEFAULT NULL COMMENT '是否允许查看操作日志 (1=允许, NULL=不允许)',
        FOREIGN KEY (role_id) REFERENCES user_roles(id),
        FOREIGN KEY (unit_id) REFERENCES units(id)
      )
    `);
    console.log('users表已创建');
    
    // 创建危险废物类型表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS waste_types (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL UNIQUE
      )
    `);
    console.log('waste_types表已创建');
    
    // 创建废物记录表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS waste_records (
        id INT PRIMARY KEY AUTO_INCREMENT,
        unit_id INT NOT NULL,
        waste_type_id INT NOT NULL,
        location VARCHAR(200) NOT NULL,
        collection_start_time DATETIME NOT NULL,
        photo_path_before VARCHAR(500),
        photo_path_after VARCHAR(500),
        quantity DECIMAL(10, 3),
        created_at DATETIME NOT NULL,
        creator_id INT,
        remarks TEXT,
        process VARCHAR(100),
        is_supervised TINYINT(1) DEFAULT NULL COMMENT '是否为监督数据: 1-是',
        FOREIGN KEY (unit_id) REFERENCES units(id),
        FOREIGN KEY (waste_type_id) REFERENCES waste_types(id),
        FOREIGN KEY (creator_id) REFERENCES users(id)
      )
    `);
    console.log('waste_records表已创建');
    
    // 创建操作日志表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS operation_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT,
        operation_type ENUM('login', 'create', 'update', 'delete') NOT NULL,
        target_type VARCHAR(50),
        target_id INT,
        description TEXT NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        additional_data JSON,
        INDEX idx_user_id (user_id),
        INDEX idx_operation_type (operation_type),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('operation_logs表已创建');
    
    // 插入用户角色（检查是否已存在）
    const [roleRows] = await connection.execute('SELECT COUNT(*) as count FROM user_roles');
    if (roleRows[0].count === 0) {
      await connection.execute(`
        INSERT INTO user_roles (id, name) VALUES 
        (1, '基层员工'),
        (2, '单位管理员'),
        (3, '超级管理员'),
        (4, '监督人员')
      `);
      console.log('已插入用户角色数据');
    } else {
      console.log('用户角色数据已存在，跳过插入');
    }
    
    // 插入单位数据（检查是否已存在）
    const [unitRows] = await connection.execute('SELECT COUNT(*) as count FROM units');
    if (unitRows[0].count === 0) {
      await connection.execute(`
        INSERT INTO units (name) VALUES 
        ('牛庄'),
        ('信远'),
        ('潍北'),
        ('金角'),
        ('河口'),
        ('无棣'),
        ('高青'),
        ('滨博'),
        ('桓台'),
        ('胜兴'),
        ('其他')
      `);
      console.log('已插入单位数据');
    } else {
      console.log('单位数据已存在，跳过插入');
    }
    
    // 获取牛庄单位的ID
    const [units] = await connection.execute(`SELECT id FROM units WHERE name = '牛庄'`);
    if (units.length === 0) {
      throw new Error('无法找到牛庄单位的ID');
    }
    const niuzhuangId = units[0].id;
    
    // 插入用户测试数据（检查是否已存在）
    const [userRows] = await connection.execute('SELECT COUNT(*) as count FROM users WHERE phone IN (?, ?, ?, ?)', 
      ['13800000001', '13800000002', '13800000003', '13800000004']);
    
    if (userRows[0].count < 4) {
      // 先清空现有测试用户
      await connection.execute(`DELETE FROM users WHERE phone IN (?, ?, ?, ?)`, 
        ['13800000001', '13800000002', '13800000003', '13800000004']);
      
      // 加密密码
      const password = await hashPassword('1');
      
      // 插入测试用户
      await connection.execute(`
        INSERT INTO users (username, phone, password, role_id, unit_id, status, can_view_logs) VALUES 
        ('牛庄员工', '13800000001', ?, 1, ?, 1, NULL),
        ('牛庄管理员', '13800000002', ?, 2, ?, 1, NULL),
        ('超级管理员', '13800000003', ?, 3, NULL, 1, 1),
        ('监督人员', '13800000004', ?, 4, NULL, 1, NULL)
      `, [password, niuzhuangId, password, niuzhuangId, password, password]);
      console.log('已插入用户测试数据');
    } else {
      console.log('用户测试数据已存在，跳过插入');
    }
    
    // 插入废物类型（检查是否已存在）
    const [wasteTypeRows] = await connection.execute('SELECT COUNT(*) as count FROM waste_types');
    if (wasteTypeRows[0].count === 0) {
      await connection.execute(`
        INSERT INTO waste_types (name) VALUES 
        ('油泥砂'),
        ('含油包装物'),
        ('一般固废'),
        ('其他')
      `);
      console.log('已插入废物类型数据');
    } else {
      console.log('废物类型数据已存在，跳过插入');
    }
    
    console.log('数据库初始化成功完成');
    
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (err) {
        console.error('关闭数据库连接出错:', err);
      }
    }
    if (createDbConnection && createDbConnection.end) {
      try {
        await createDbConnection.end();
      } catch (err) {
        console.error('关闭数据库创建连接出错:', err);
      }
    }
  }
}

// 执行初始化
initializeDatabase().catch(err => {
  console.error('初始化过程中出现未捕获的错误:', err);
  process.exit(1);
});
