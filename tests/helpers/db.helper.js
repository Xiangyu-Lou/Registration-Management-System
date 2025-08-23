/**
 * db.helper.js
 * 测试用数据库直连工具
 * 直接操作 DB 创建/清理测试数据（绕过业务逻辑）
 */
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') });

const parseHost = (dbHost) => {
  const parts = (dbHost || 'localhost').split(':');
  return {
    host: parts[0],
    port: parts[1] ? parseInt(parts[1]) : 3306,
  };
};

const createPool = () => {
  const { host, port } = parseHost(process.env.DB_HOST);
  return mysql.createPool({
    host,
    port,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'waste_management',
    waitForConnections: true,
    connectionLimit: 5,
    timezone: '+08:00',
    dateStrings: true,
  });
};

let _pool = null;

const getPool = () => {
  if (!_pool) {
    _pool = createPool();
  }
  return _pool;
};

const closePool = async () => {
  if (_pool) {
    await _pool.end();
    _pool = null;
  }
};

const query = async (sql, params = []) => {
  const pool = getPool();
  const [rows] = await pool.execute(sql, params);
  return rows;
};

module.exports = { getPool, closePool, query };
