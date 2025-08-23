const request = require('supertest');
const app = require('../../backend/app');
const {
  getTestData,
  getSuperAdminToken,
  getCompanyAdminToken,
  getSupervisorToken,
  getBasicUserToken,
  TEST_PASSWORD,
} = require('../helpers/auth.helper');

let testData;
let superAdminToken;
let companyAdminToken;
let supervisorToken;
let basicUserToken;
let createdUserId;

beforeAll(async () => {
  testData = getTestData();
  [superAdminToken, companyAdminToken, supervisorToken, basicUserToken] = await Promise.all([
    getSuperAdminToken(),
    getCompanyAdminToken(),
    getSupervisorToken(),
    getBasicUserToken(),
  ]);
});

describe('GET /api/users', () => {
  it('公司管理员应能获取用户列表', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${companyAdminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      const user = res.body[0];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('username');
      expect(user).toHaveProperty('phone');
    }
  });

  it('未提供 token 应返回 401', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('监督人员应返回 403', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${supervisorToken}`);
    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error');
  });
});

describe('GET /api/users/unit/:unitId', () => {
  it('应返回指定单位的用户列表', async () => {
    const res = await request(app)
      .get(`/api/users/unit/${testData.unit1Id}`)
      .set('Authorization', `Bearer ${companyAdminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('GET /api/users/:id', () => {
  it('应返回指定用户信息', async () => {
    const { basicUser } = testData.users;
    const res = await request(app)
      .get(`/api/users/${basicUser.id}`)
      .set('Authorization', `Bearer ${companyAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', basicUser.id);
    expect(res.body).toHaveProperty('username');
    expect(res.body).toHaveProperty('phone');
    expect(res.body).toHaveProperty('role');
    expect(res.body).toHaveProperty('role_id');
    expect(res.body).toHaveProperty('unit_id');
    expect(res.body).toHaveProperty('unit_name');
    expect(res.body).toHaveProperty('company_id');
    expect(res.body).toHaveProperty('company_name');
    expect(res.body).toHaveProperty('status');
  });

  it('不存在的用户应返回 404', async () => {
    const res = await request(app)
      .get('/api/users/999999999')
      .set('Authorization', `Bearer ${companyAdminToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

describe('POST /api/users', () => {
  it('公司管理员应能创建用户', async () => {
    const ts = Date.now();
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${companyAdminToken}`)
      .send({
        username: `__TEST__新用户_${ts}`,
        phone: `1899${ts.toString().slice(-7)}`,
        password: TEST_PASSWORD,
        roleId: 1,
        unitId: testData.unit1Id,
        companyId: testData.companyId,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    createdUserId = res.body.id;
  });

  it('缺少必填字段应返回 400', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${companyAdminToken}`)
      .send({ username: '测试用户' }); // 缺少 phone, password, roleId

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('未授权应返回 401', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ username: '测试', phone: '10000000001', password: 'Test@12345', roleId: 1 });

    expect(res.status).toBe(401);
  });
});

describe('PUT /api/users/:id/status', () => {
  it('公司管理员应能更新用户状态', async () => {
    if (!createdUserId) return;

    const res = await request(app)
      .put(`/api/users/${createdUserId}/status`)
      .set('Authorization', `Bearer ${companyAdminToken}`)
      .send({ status: 0 });

    expect(res.status).toBe(200);
  });
});

describe('DELETE /api/users/:id', () => {
  it('公司管理员应能删除用户', async () => {
    if (!createdUserId) return;

    const res = await request(app)
      .delete(`/api/users/${createdUserId}`)
      .set('Authorization', `Bearer ${companyAdminToken}`);

    expect(res.status).toBe(200);
    createdUserId = null;
  });
});
