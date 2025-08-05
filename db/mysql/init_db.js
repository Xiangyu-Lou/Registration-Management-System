const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
// 加载环境变量 - 统一使用backend/.env
require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') });

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
    
    // 创建公司表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS companies (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(200) NOT NULL UNIQUE,
        code VARCHAR(50) UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TINYINT DEFAULT 1 COMMENT '公司状态：0-停用，1-正常'
      )
    `);
    console.log('companies表已创建');
    
    // 创建user_roles表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_roles (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(50) NOT NULL UNIQUE
      )
    `);
    console.log('user_roles表已创建');
    
    // 创建单位表（包含company_id）
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS units (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        company_id INT NOT NULL,
        INDEX idx_company_id (company_id),
        FOREIGN KEY (company_id) REFERENCES companies(id),
        UNIQUE KEY unique_unit_per_company (name, company_id)
      )
    `);
    console.log('units表已创建');
    
    // 创建用户表（包含company_id）
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL UNIQUE,
        password VARCHAR(100),
        role_id INT NOT NULL,
        unit_id INT,
        company_id INT NOT NULL,
        status TINYINT DEFAULT 1 COMMENT '账号状态：0-停用，1-正常',
        can_view_logs TINYINT(1) DEFAULT NULL COMMENT '是否允许查看操作日志 (1=允许, NULL=不允许)',
        INDEX idx_company_id (company_id),
        FOREIGN KEY (role_id) REFERENCES user_roles(id),
        FOREIGN KEY (unit_id) REFERENCES units(id),
        FOREIGN KEY (company_id) REFERENCES companies(id)
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
    
    // 创建废物记录表（包含company_id）
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
        company_id INT NOT NULL,
        INDEX idx_company_id (company_id),
        FOREIGN KEY (unit_id) REFERENCES units(id),
        FOREIGN KEY (waste_type_id) REFERENCES waste_types(id),
        FOREIGN KEY (creator_id) REFERENCES users(id),
        FOREIGN KEY (company_id) REFERENCES companies(id)
      )
    `);
    console.log('waste_records表已创建');
    
    // 创建操作日志表（包含company_id）
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
        company_id INT,
        INDEX idx_user_id (user_id),
        INDEX idx_operation_type (operation_type),
        INDEX idx_created_at (created_at),
        INDEX idx_company_id (company_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (company_id) REFERENCES companies(id)
      )
    `);
    console.log('operation_logs表已创建');
    
    // 创建问题反馈表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS feedback (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        company_id INT NOT NULL,
        title VARCHAR(255) NOT NULL COMMENT '问题标题',
        description TEXT NOT NULL COMMENT '问题描述',
        type ENUM('bug', 'feature', 'improvement', 'other') NOT NULL DEFAULT 'bug' COMMENT '问题类型',
        priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium' COMMENT '优先级',
        status ENUM('pending', 'processing', 'resolved', 'closed') NOT NULL DEFAULT 'pending' COMMENT '处理状态',
        images VARCHAR(1000) COMMENT '附件图片路径，多个用逗号分隔',
        admin_reply TEXT COMMENT '管理员回复',
        admin_id INT COMMENT '处理管理员ID',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_company_id (company_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (company_id) REFERENCES companies(id),
        FOREIGN KEY (admin_id) REFERENCES users(id)
      )
    `);
    console.log('feedback表已创建');
    
    // 插入公司数据（检查是否已存在）
    const [companyRows] = await connection.execute('SELECT COUNT(*) as count FROM companies');
    if (companyRows[0].count === 0) {
      await connection.execute(`
        INSERT INTO companies (name, code) VALUES 
        ('东胜', 'DONGSHENG'),
        ('石油开发', 'PETROLEUM_DEV')
      `);
      console.log('已插入公司数据');
    } else {
      console.log('公司数据已存在，跳过插入');
    }
    
    // 获取东胜公司的ID
    const [companies] = await connection.execute(`SELECT id FROM companies WHERE name = '东胜'`);
    if (companies.length === 0) {
      throw new Error('无法找到东胜公司的ID');
    }
    const dongshengCompanyId = companies[0].id;
    
    // 插入用户角色（检查是否已存在）
    const [roleRows] = await connection.execute('SELECT COUNT(*) as count FROM user_roles');
    if (roleRows[0].count === 0) {
      await connection.execute(`
        INSERT INTO user_roles (id, name) VALUES 
        (1, '基层员工'),
        (2, '单位管理员'),
        (3, '公司管理员'),
        (4, '监督人员'),
        (5, '系统超级管理员')
      `);
      console.log('已插入用户角色数据');
    } else {
      // 确保有系统超级管理员角色
      await connection.execute(`
        INSERT IGNORE INTO user_roles (id, name) VALUES (5, '系统超级管理员')
      `);
      // 更新原来的超级管理员为公司管理员
      await connection.execute(`
        UPDATE user_roles SET name = '公司管理员' WHERE id = 3
      `);
      console.log('用户角色数据已存在，已更新角色名称');
    }
    
    // 插入单位数据（检查是否已存在）
    const [unitRows] = await connection.execute('SELECT COUNT(*) as count FROM units');
    if (unitRows[0].count === 0) {
      await connection.execute(`
        INSERT INTO units (name, company_id) VALUES 
        ('牛庄', ?),
        ('信远', ?),
        ('潍北', ?),
        ('金角', ?),
        ('河口', ?),
        ('无棣', ?),
        ('高青', ?),
        ('滨博', ?),
        ('桓台', ?),
        ('胜兴', ?),
        ('其他', ?)
      `, Array(11).fill(dongshengCompanyId));
      console.log('已插入单位数据');
    } else {
      console.log('单位数据已存在，跳过插入');
    }
    
    // 获取牛庄单位的ID
    const [units] = await connection.execute(`SELECT id FROM units WHERE name = '牛庄' AND company_id = ?`, [dongshengCompanyId]);
    if (units.length === 0) {
      throw new Error('无法找到牛庄单位的ID');
    }
    const niuzhuangId = units[0].id;
    
    // 插入用户测试数据（检查是否已存在）
    const [userRows] = await connection.execute('SELECT COUNT(*) as count FROM users WHERE phone IN (?, ?, ?, ?, ?)', 
      ['13800000001', '13800000002', '13800000003', '13800000004', '13900000000']);
    
    if (userRows[0].count < 5) {
      // 先清空现有测试用户
      await connection.execute(`DELETE FROM users WHERE phone IN (?, ?, ?, ?, ?)`, 
        ['13800000001', '13800000002', '13800000003', '13800000004', '13900000000']);
      
      // 加密密码
      const password = await hashPassword('1');
      
      // 插入测试用户
      await connection.execute(`
        INSERT INTO users (username, phone, password, role_id, unit_id, company_id, status, can_view_logs) VALUES 
        ('牛庄员工', '13800000001', ?, 1, ?, ?, 1, NULL),
        ('牛庄管理员', '13800000002', ?, 2, ?, ?, 1, NULL),
        ('东胜公司管理员', '13800000003', ?, 3, NULL, ?, 1, 1),
        ('监督人员', '13800000004', ?, 4, NULL, ?, 1, NULL),
        ('系统超级管理员', '13900000000', ?, 5, NULL, ?, 1, 1)
      `, [
        password, niuzhuangId, dongshengCompanyId,
        password, niuzhuangId, dongshengCompanyId,
        password, dongshengCompanyId,
        password, dongshengCompanyId,
        password, dongshengCompanyId
      ]);
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
    console.log('');
    console.log('=== 测试账户信息 ===');
    console.log('基层员工: 13800000001 / 密码: 1 (东胜公司)');
    console.log('单位管理员: 13800000002 / 密码: 1 (东胜公司)');
    console.log('公司管理员: 13800000003 / 密码: 1 (东胜公司)');
    console.log('监督人员: 13800000004 / 密码: 1 (东胜公司)');
    console.log('系统超级管理员: 13900000000 / 密码: 1 (可管理所有公司)');
    console.log('==================');
    
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
