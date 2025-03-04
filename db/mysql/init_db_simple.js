/**
 * 简化版MySQL数据库初始化脚本
 * 适用于已经手动创建好waste_management数据库的情况
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

// 密码加密函数
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// MySQL连接配置
const dbConfig = {
  host: 'localhost',
  user: 'Xiangyu',
  password: '990924',
  database: 'waste_management',
  waitForConnections: true,
  multipleStatements: true
};

async function initializeDatabase() {
  let connection;
  
  try {
    console.log('尝试连接到MySQL数据库...');
    connection = await mysql.createConnection(dbConfig);
    console.log('成功连接到MySQL数据库');
    
    // 执行基础表结构和角色、单位、废物类型初始化SQL
    console.log('开始创建表结构和基础数据...');
    const baseSQL = `
    -- 创建用户角色表
    CREATE TABLE IF NOT EXISTS user_roles (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(50) NOT NULL UNIQUE
    );
    
    -- 创建单位表
    CREATE TABLE IF NOT EXISTS units (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL UNIQUE
    );
    
    -- 创建用户表
    CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(100) NOT NULL,
      phone VARCHAR(20) NOT NULL UNIQUE,
      password VARCHAR(100),
      role_id INT NOT NULL,
      unit_id INT,
      FOREIGN KEY (role_id) REFERENCES user_roles(id),
      FOREIGN KEY (unit_id) REFERENCES units(id)
    );
    
    -- 创建危险废物类型表
    CREATE TABLE IF NOT EXISTS waste_types (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL UNIQUE
    );
    
    -- 创建废物记录表
    CREATE TABLE IF NOT EXISTS waste_records (
      id INT PRIMARY KEY AUTO_INCREMENT,
      unit_id INT NOT NULL,
      waste_type_id INT NOT NULL,
      location VARCHAR(200) NOT NULL,
      collection_start_time DATETIME NOT NULL,
      photo_path_before VARCHAR(500),
      photo_path_after VARCHAR(500),
      quantity DECIMAL(10, 3) NOT NULL,
      created_at DATETIME NOT NULL,
      creator_id INT,
      creator_name VARCHAR(100),
      FOREIGN KEY (unit_id) REFERENCES units(id),
      FOREIGN KEY (waste_type_id) REFERENCES waste_types(id),
      FOREIGN KEY (creator_id) REFERENCES users(id)
    );
    
    -- 插入基础数据
    INSERT IGNORE INTO user_roles (id, name) VALUES 
    (1, '基层员工'),
    (2, '单位管理员'),
    (3, '超级管理员');
    
    INSERT IGNORE INTO units (name) VALUES 
    ('牛庄'),
    ('信远'),
    ('潍北'),
    ('金角'),
    ('河口'),
    ('无棣'),
    ('高青'),
    ('滨博'),
    ('桓台'),
    ('胜兴');
    
    INSERT IGNORE INTO waste_types (name) VALUES 
    ('油泥沙'),
    ('含油包装物'),
    ('其他');
    `;
    
    await connection.query(baseSQL);
    console.log('表结构和基础数据创建完成');
    
    // 检查测试用户是否已存在
    const [userRows] = await connection.query('SELECT COUNT(*) as count FROM users WHERE phone IN (?, ?, ?)', 
      ['13800000001', '13800000002', '13800000003']);
    
    if (userRows[0].count < 3) {
      // 获取牛庄单位ID
      const [units] = await connection.query(`SELECT id FROM units WHERE name = '牛庄'`);
      if (units.length === 0) {
        throw new Error('无法找到牛庄单位的ID');
      }
      const niuzhuangId = units[0].id;
      
      // 加密密码
      const adminPassword = await hashPassword('1');
      const managerPassword = await hashPassword('2');
      
      // 插入测试用户
      await connection.query(`
        INSERT INTO users (username, phone, password, role_id, unit_id) VALUES 
        ('超级管理员', '13800000001', ?, 3, NULL),
        ('牛庄管理员', '13800000002', ?, 2, ?),
        ('牛庄员工', '13800000003', NULL, 1, ?)
      `, [adminPassword, managerPassword, niuzhuangId, niuzhuangId]);
      console.log('已插入用户测试数据');
    } else {
      console.log('用户测试数据已存在，跳过插入');
    }
    
    console.log('数据库初始化成功');
    
  } catch (error) {
    console.error('数据库初始化失败:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

// 执行初始化
initializeDatabase().catch(err => {
  console.error('初始化过程中出现未捕获的错误:', err);
  process.exit(1);
});
