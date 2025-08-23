/**
 * global.teardown.js
 * 测试后清理所有测试数据
 */
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const parseHost = (dbHost) => {
  const parts = (dbHost || 'localhost').split(':');
  return { host: parts[0], port: parts[1] ? parseInt(parts[1]) : 3306 };
};

module.exports = async () => {
  const dataPath = path.join(__dirname, '.test-data.json');
  if (!fs.existsSync(dataPath)) {
    console.log('[Teardown] 测试数据文件不存在，跳过清理');
    return;
  }

  const testData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const { companyId, users } = testData;

  const { host, port } = parseHost(process.env.DB_HOST);
  const pool = mysql.createPool({
    host,
    port,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'waste_management',
    connectionLimit: 5,
    timezone: '+08:00',
  });

  const q = async (sql, params = []) => {
    const [rows] = await pool.execute(sql, params);
    return rows;
  };

  try {
    // 删除顺序：先删子表，再删父表（外键约束）
    // 删除废物记录
    await q('DELETE FROM waste_records WHERE company_id = ?', [companyId]);

    // 删除操作日志（该公司的）
    await q('DELETE FROM operation_logs WHERE company_id = ?', [companyId]);

    // 删除反馈
    await q('DELETE FROM feedback WHERE company_id = ?', [companyId]);

    // 删除用户
    const userIds = Object.values(users).map(u => u.id).filter(Boolean);
    if (userIds.length > 0) {
      await q(`DELETE FROM users WHERE id IN (${userIds.map(() => '?').join(',')})`, userIds);
    }

    // 删除单位
    await q('DELETE FROM units WHERE company_id = ?', [companyId]);

    // 删除废物类型（只删 __TEST__ 前缀的）
    await q("DELETE FROM waste_types WHERE name LIKE '__TEST__%'");

    // 删除公司
    await q('DELETE FROM companies WHERE id = ?', [companyId]);

    console.log(`[Teardown] 测试数据已清理: 公司ID=${companyId}`);
  } finally {
    await pool.end();
    // 删除测试数据文件
    fs.unlinkSync(dataPath);
  }
};
