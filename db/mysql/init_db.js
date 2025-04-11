const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

// 密码加密函数
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// MySQL连接配置
const dbConfig = {
  host: 'localhost',
  user: 'your_username', // 你的用户名
  password: 'your_password', // 你的密码
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
    
    // 创建地点表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS locations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        unit_id INT NOT NULL,
        FOREIGN KEY (unit_id) REFERENCES units(id),
        UNIQUE KEY unique_location_per_unit (name, unit_id)
      )
    `);
    console.log('locations表已创建');
    
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
    
    // 创建废物记录表 - 修改location为location_id外键
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS waste_records (
        id INT PRIMARY KEY AUTO_INCREMENT,
        unit_id INT NOT NULL,
        waste_type_id INT NOT NULL,
        location_id INT NOT NULL,
        collection_start_time DATETIME NOT NULL,
        photo_path_before VARCHAR(500),
        photo_path_after VARCHAR(500),
        quantity DECIMAL(10, 3) NOT NULL,
        created_at DATETIME NOT NULL,
        creator_id INT,
        process_type VARCHAR(50),
        remarks TEXT,
        FOREIGN KEY (unit_id) REFERENCES units(id),
        FOREIGN KEY (waste_type_id) REFERENCES waste_types(id),
        FOREIGN KEY (location_id) REFERENCES locations(id),
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
    
    // 插入地点数据前，先获取各单位ID
    const [unitsData] = await connection.execute(`SELECT id, name FROM units`);
    
    // 创建单位名称到ID的映射
    const unitMap = {};
    unitsData.forEach(unit => {
      unitMap[unit.name] = unit.id;
    });
    
    // 插入地点数据（检查是否已存在）
    const [locationRows] = await connection.execute('SELECT COUNT(*) as count FROM locations');
    if (locationRows[0].count === 0) {
      const locationInserts = [];
      
      // 桓台地点
      if (unitMap['桓台']) {
        locationInserts.push(
          `(?, ${unitMap['桓台']})`,
          `(?, ${unitMap['桓台']})`,
          `(?, ${unitMap['桓台']})`,
          `(?, ${unitMap['桓台']})`,
          `(?, ${unitMap['桓台']})`
        );
      }
      
      // 潍北地点
      if (unitMap['潍北']) {
        locationInserts.push(
          `(?, ${unitMap['潍北']})`,
          `(?, ${unitMap['潍北']})`,
          `(?, ${unitMap['潍北']})`,
          `(?, ${unitMap['潍北']})`,
          `(?, ${unitMap['潍北']})`
        );
      }
      
      // 高青地点
      if (unitMap['高青']) {
        locationInserts.push(
          `(?, ${unitMap['高青']})`,
          `(?, ${unitMap['高青']})`,
          `(?, ${unitMap['高青']})`,
          `(?, ${unitMap['高青']})`,
          `(?, ${unitMap['高青']})`
        );
      }
      
      // 牛庄地点
      if (unitMap['牛庄']) {
        locationInserts.push(
          `(?, ${unitMap['牛庄']})`,
          `(?, ${unitMap['牛庄']})`,
          `(?, ${unitMap['牛庄']})`,
          `(?, ${unitMap['牛庄']})`
        );
      }
      
      // 金角地点
      if (unitMap['金角']) {
        locationInserts.push(
          `(?, ${unitMap['金角']})`,
          `(?, ${unitMap['金角']})`
        );
      }
      
      // 信远地点
      if (unitMap['信远']) {
        locationInserts.push(
          `(?, ${unitMap['信远']})`,
          `(?, ${unitMap['信远']})`,
          `(?, ${unitMap['信远']})`
        );
      }
      
      // 滨博地点
      if (unitMap['滨博']) {
        locationInserts.push(
          `(?, ${unitMap['滨博']})`,
          `(?, ${unitMap['滨博']})`,
          `(?, ${unitMap['滨博']})`,
          `(?, ${unitMap['滨博']})`,
          `(?, ${unitMap['滨博']})`
        );
      }
      
      // 无棣地点
      if (unitMap['无棣']) {
        locationInserts.push(
          `(?, ${unitMap['无棣']})`,
          `(?, ${unitMap['无棣']})`,
          `(?, ${unitMap['无棣']})`,
          `(?, ${unitMap['无棣']})`,
          `(?, ${unitMap['无棣']})`,
          `(?, ${unitMap['无棣']})`,
          `(?, ${unitMap['无棣']})`
        );
      }
      
      // 河口地点
      if (unitMap['河口']) {
        locationInserts.push(
          `(?, ${unitMap['河口']})`,
          `(?, ${unitMap['河口']})`,
          `(?, ${unitMap['河口']})`,
          `(?, ${unitMap['河口']})`,
          `(?, ${unitMap['河口']})`,
          `(?, ${unitMap['河口']})`,
          `(?, ${unitMap['河口']})`
        );
      }
      
      // 胜兴地点
      if (unitMap['胜兴']) {
        locationInserts.push(
          `(?, ${unitMap['胜兴']})`
        );
      }
      
      if (locationInserts.length > 0) {
        const sql = `
          INSERT INTO locations (name, unit_id) VALUES 
          ${locationInserts.join(', ')}
        `;
        
        const params = [
          // 桓台地点
          '金家接转站', '金17-1注采站', '金17-2注采站', '金6金9项目组', '金8注采站',
          
          // 潍北地点
          '潍北联合站', '昌79注采站', '昌3注采站', '疃3注采站', '昌15注采站',
          
          // 高青地点
          '高青联合站', '樊107注采站', '樊14注采站', '高21注采站', '高54注采站',
          
          // 牛庄地点
          '牛25集输站', '牛25注采站', '营13注采站', '史112注采站',
          
          // 金角地点
          '长堤注采站', '桩23注采站',
          
          // 信远地点
          '河125注采站', '河122注采站', '永551注采站',
          
          // 滨博地点
          '樊142注采站', '樊142-2-12注采站', '樊162注采站', '樊页1井组', '滨博接转站',
          
          // 无棣地点
          '车41注采站', '车142注采站', '车40注采站', '车408注采站', '车274注采站', '车1接转站', '东风港联合站',
          
          // 河口地点
          '沾14东注采站', '沾14西注采站', '渤南注采站', '大北注采站', '沾5注采站', '太平接转站', '沾5接转站',
          
          // 胜兴地点
          '博兴注采站'
        ];
        
        await connection.execute(sql, params);
        console.log('已插入地点数据');
      }
    } else {
      console.log('地点数据已存在，跳过插入');
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
      
      // 加密密码
      const password = await hashPassword('1');
      
      // 插入测试用户
      await connection.execute(`
        INSERT INTO users (username, phone, password, role_id, unit_id, status) VALUES 
        ('牛庄员工', '13800000001', ?, 1, ?, 1),
        ('牛庄管理员', '13800000002', ?, 2, ?, 1),
        ('超级管理员', '13800000003', ?, 3, NULL, 1)
      `, [password, niuzhuangId, password, niuzhuangId, password]);
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
