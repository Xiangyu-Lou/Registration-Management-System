const mysql = require('mysql2/promise');
require('dotenv').config();

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'waste_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true,
  timezone: '+08:00', // 设置为中国时区，避免时区转换问题
  dateStrings: true  // 将日期作为字符串返回，避免自动时区转换
};

// 创建数据库连接池
const pool = mysql.createPool(dbConfig);

// 测试数据库连接
const testConnection = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('✓ 数据库连接成功');
    
    // 验证数据库表和数据
    try {
      const [rows] = await connection.query("SELECT count(*) as count FROM units");
      console.log(`数据库内有 ${rows[0].count || 0} 个单位记录`);
      if (rows[0].count === 0) {
        console.log('⚠ 警告: 数据库中没有单位数据, 请运行初始化脚本');
      }
    } catch (err) {
      console.error('查询单位表失败, 表可能不存在:', err.message);
      console.log('请运行数据库初始化脚本: npm run init-db');
    }
  } catch (error) {
    console.error('✗ 数据库连接失败:', error.message);
    console.log('请确保 MySQL 服务运行且配置正确');
  } finally {
    if (connection) connection.release();
  }
};

module.exports = { pool, testConnection }; 