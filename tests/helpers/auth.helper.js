/**
 * auth.helper.js
 * 提供不同角色的认证 token
 */
const request = require('supertest');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') });
process.env.NODE_ENV = 'test';

let _app = null;
const getApp = () => {
  if (!_app) {
    _app = require('../../backend/app');
  }
  return _app;
};

const TEST_PASSWORD = 'Test@12345';

// 读取全局测试数据
const getTestData = () => {
  const fs = require('fs');
  const dataPath = path.join(__dirname, '../.test-data.json');
  if (!fs.existsSync(dataPath)) {
    throw new Error('测试数据文件不存在，请先运行 globalSetup');
  }
  return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
};

const login = async (phone, password = TEST_PASSWORD) => {
  const res = await request(getApp())
    .post('/api/login')
    .send({ phone, password });

  if (res.status !== 200) {
    throw new Error(`登录失败 (${res.status}): ${JSON.stringify(res.body)}`);
  }
  return res.body.token;
};

const getSuperAdminToken = async () => {
  const data = getTestData();
  return login(data.users.superAdmin.phone);
};

const getCompanyAdminToken = async () => {
  const data = getTestData();
  return login(data.users.companyAdmin.phone);
};

const getUnitAdminToken = async () => {
  const data = getTestData();
  return login(data.users.unitAdmin.phone);
};

const getSupervisorToken = async () => {
  const data = getTestData();
  return login(data.users.supervisor.phone);
};

const getBasicUserToken = async () => {
  const data = getTestData();
  return login(data.users.basicUser.phone);
};

module.exports = {
  TEST_PASSWORD,
  getTestData,
  login,
  getSuperAdminToken,
  getCompanyAdminToken,
  getUnitAdminToken,
  getSupervisorToken,
  getBasicUserToken,
};
