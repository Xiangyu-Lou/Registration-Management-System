const request = require('supertest');
const app = require('../../backend/app');
const { getTestData, TEST_PASSWORD } = require('../helpers/auth.helper');

let testData;

beforeAll(() => {
  testData = getTestData();
});

describe('POST /api/login', () => {
  it('正常登录应返回 200 和用户信息及 token', async () => {
    const { basicUser } = testData.users;

    const res = await request(app)
      .post('/api/login')
      .send({ phone: basicUser.phone, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('username');
    expect(res.body).toHaveProperty('phone', basicUser.phone);
    expect(res.body).toHaveProperty('role');
    expect(res.body).toHaveProperty('role_id');
    expect(res.body).toHaveProperty('unit_id');
    expect(res.body).toHaveProperty('unit_name');
    expect(res.body).toHaveProperty('company_id');
    expect(res.body).toHaveProperty('company_name');
    expect(res.body).toHaveProperty('can_view_logs');
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBeGreaterThan(0);
  });

  it('rememberMe=true 应能正常登录', async () => {
    const { basicUser } = testData.users;

    const res = await request(app)
      .post('/api/login')
      .send({ phone: basicUser.phone, password: TEST_PASSWORD, rememberMe: true });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('缺少 phone 应返回 400', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ password: TEST_PASSWORD });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('缺少 password 应返回 400', async () => {
    const { basicUser } = testData.users;

    const res = await request(app)
      .post('/api/login')
      .send({ phone: basicUser.phone });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('密码错误应返回 401', async () => {
    const { basicUser } = testData.users;

    const res = await request(app)
      .post('/api/login')
      .send({ phone: basicUser.phone, password: 'WrongPassword123' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('不存在的用户应返回 401', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ phone: '10000000000', password: TEST_PASSWORD });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
});
