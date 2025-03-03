const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// MySQL连接配置
const dbConfig = {
  host: 'localhost',
  user: 'Xiangyu',
  password: '990924',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

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
    
    // 创建数据库
    await createDbConnection.execute(`CREATE DATABASE IF NOT EXISTS waste_management`);
    console.log(`数据库 waste_management 已创建或已存在`);
    
    // 关闭创建数据库的连接
    await createDbConnection.end();
    
    // 连接到新创建的数据库
    connection = await mysql.createConnection({
      ...dbConfig,
      database: 'waste_management'
    });
    console.log(`成功连接到数据库 waste_management`);
    
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
        quantity DECIMAL(10, 2) NOT NULL,
        created_at DATETIME NOT NULL,
        creator_id INT,
        FOREIGN KEY (unit_id) REFERENCES units(id),
        FOREIGN KEY (waste_type_id) REFERENCES waste_types(id),
        FOREIGN KEY (creator_id) REFERENCES users(id)
      )
    `);
    console.log('waste_records表已创建');
    
    // 插入用户角色（检查是否已存在）
    const [roleRows] = await connection.execute('SELECT COUNT(*) as count FROM user_roles');
    if (roleRows[0].count === 0) {
      await connection.execute(`
        INSERT INTO user_roles (id, name) VALUES 
        (1, '基层员工'),
        (2, '单位管理员'),
        (3, '超级管理员')
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
        ('胜兴')
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
    const [userRows] = await connection.execute('SELECT COUNT(*) as count FROM users WHERE phone IN (?, ?, ?)', 
      ['13800000001', '13800000002', '13800000003']);
    
    if (userRows[0].count < 3) {
      // 先清空现有测试用户
      await connection.execute(`DELETE FROM users WHERE phone IN (?, ?, ?)`, 
        ['13800000001', '13800000002', '13800000003']);
      
      // 插入测试用户
      await connection.execute(`
        INSERT INTO users (username, phone, password, role_id, unit_id) VALUES 
        ('超级管理员', '13800000001', '1', 3, NULL),
        ('牛庄管理员', '13800000002', '2', 2, ?),
        ('牛庄员工', '13800000003', NULL, 1, ?)
      `, [niuzhuangId, niuzhuangId]);
      console.log('已插入用户测试数据');
    } else {
      console.log('用户测试数据已存在，跳过插入');
    }
    
    // 插入废物类型（检查是否已存在）
    const [wasteTypeRows] = await connection.execute('SELECT COUNT(*) as count FROM waste_types');
    if (wasteTypeRows[0].count === 0) {
      await connection.execute(`
        INSERT INTO waste_types (name) VALUES 
        ('油泥沙'),
        ('含油包装物'),
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
