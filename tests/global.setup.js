/**
 * global.setup.js
 * 测试前创建测试数据
 * 使用 __TEST__ 前缀标识所有测试数据，避免影响生产数据
 */
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const TEST_PREFIX = '__TEST__';
const TEST_PASSWORD = 'Test@12345';

const parseHost = (dbHost) => {
  const parts = (dbHost || 'localhost').split(':');
  return { host: parts[0], port: parts[1] ? parseInt(parts[1]) : 3306 };
};

module.exports = async () => {
  const { host, port } = parseHost(process.env.DB_HOST);

  const pool = mysql.createPool({
    host,
    port,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'waste_management',
    connectionLimit: 5,
    timezone: '+08:00',
    dateStrings: true,
  });

  const q = async (sql, params = []) => {
    const [rows] = await pool.execute(sql, params);
    return rows;
  };

  const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);
  const ts = Date.now();

  // 1. 创建测试公司
  const companyName = `${TEST_PREFIX}Company_${ts}`;
  const companyCode = `TC${ts}`;
  await q('INSERT INTO companies (name, code, status) VALUES (?, ?, 1)', [companyName, companyCode]);
  const [companyRow] = await q('SELECT id FROM companies WHERE name = ?', [companyName]);
  const companyId = companyRow.id;

  // 2. 创建测试单位（2个）
  const unit1Name = `${TEST_PREFIX}Unit1_${ts}`;
  const unit2Name = `${TEST_PREFIX}Unit2_${ts}`;
  await q('INSERT INTO units (name, company_id) VALUES (?, ?)', [unit1Name, companyId]);
  await q('INSERT INTO units (name, company_id) VALUES (?, ?)', [unit2Name, companyId]);
  const [unit1Row] = await q('SELECT id FROM units WHERE name = ?', [unit1Name]);
  const [unit2Row] = await q('SELECT id FROM units WHERE name = ?', [unit2Name]);
  const unit1Id = unit1Row.id;
  const unit2Id = unit2Row.id;

  // 3. 创建各角色测试用户
  const users = {
    superAdmin: { phone: `1890000${ts.toString().slice(-4)}`, role_id: 5, username: `${TEST_PREFIX}超管` },
    companyAdmin: { phone: `1890001${ts.toString().slice(-4)}`, role_id: 3, username: `${TEST_PREFIX}公司管理员` },
    unitAdmin: { phone: `1890002${ts.toString().slice(-4)}`, role_id: 2, username: `${TEST_PREFIX}单位管理员` },
    supervisor: { phone: `1890003${ts.toString().slice(-4)}`, role_id: 4, username: `${TEST_PREFIX}监督员` },
    basicUser: { phone: `1890004${ts.toString().slice(-4)}`, role_id: 1, username: `${TEST_PREFIX}基层员工` },
    logViewer: { phone: `1890005${ts.toString().slice(-4)}`, role_id: 3, username: `${TEST_PREFIX}日志查看员` },
  };

  const userIds = {};
  for (const [key, u] of Object.entries(users)) {
    await q(
      'INSERT INTO users (username, phone, password, role_id, unit_id, company_id, status, can_view_logs) VALUES (?, ?, ?, ?, ?, ?, 1, ?)',
      [u.username, u.phone, hashedPassword, u.role_id, u.role_id === 1 || u.role_id === 2 ? unit1Id : null, companyId, key === 'logViewer' ? 1 : null]
    );
    const [userRow] = await q('SELECT id FROM users WHERE phone = ?', [u.phone]);
    userIds[key] = userRow.id;
    users[key].id = userRow.id;
  }

  // 4. 创建废物类型（若不存在则创建，或使用已有的）
  const wasteTypeName = `${TEST_PREFIX}废物类型_${ts}`;
  await q('INSERT INTO waste_types (name) VALUES (?)', [wasteTypeName]);
  const [wtRow] = await q('SELECT id FROM waste_types WHERE name = ?', [wasteTypeName]);
  const wasteTypeId = wtRow.id;

  // 5. 创建测试废物记录
  await q(
    `INSERT INTO waste_records (unit_id, waste_type_id, location, collection_start_time, quantity, created_at, creator_id, remarks, process, company_id)
     VALUES (?, ?, ?, NOW(), 10.5, NOW(), ?, '测试备注', '测试工序', ?)`,
    [unit1Id, wasteTypeId, '测试位置', userIds.basicUser, companyId]
  );
  const [recordRow] = await q(
    'SELECT id FROM waste_records WHERE creator_id = ? AND remarks = ? ORDER BY id DESC LIMIT 1',
    [userIds.basicUser, '测试备注']
  );
  const wasteRecordId = recordRow.id;

  // 6. 创建测试反馈
  await q(
    `INSERT INTO feedback (user_id, company_id, title, description, type, priority, status)
     VALUES (?, ?, ?, ?, 'bug', 'medium', 'pending')`,
    [userIds.basicUser, companyId, `${TEST_PREFIX}测试反馈标题`, '测试反馈内容']
  );
  const [feedbackRow] = await q(
    'SELECT id FROM feedback WHERE user_id = ? AND title = ? ORDER BY id DESC LIMIT 1',
    [userIds.basicUser, `${TEST_PREFIX}测试反馈标题`]
  );
  const feedbackId = feedbackRow.id;

  await pool.end();

  // 将测试数据写入文件供测试使用
  const testData = {
    companyId,
    companyName,
    companyCode,
    unit1Id,
    unit2Id,
    unit1Name,
    unit2Name,
    wasteTypeId,
    wasteTypeName,
    wasteRecordId,
    feedbackId,
    users,
  };

  fs.writeFileSync(
    path.join(__dirname, '.test-data.json'),
    JSON.stringify(testData, null, 2)
  );

  console.log(`\n[Setup] 测试数据已创建: 公司ID=${companyId}, 单位=${unit1Id}/${unit2Id}, 记录=${wasteRecordId}`);
};
