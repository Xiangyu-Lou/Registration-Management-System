const request = require('supertest');
const app = require('../../backend/app');
const {
  getTestData,
  getSuperAdminToken,
  getBasicUserToken,
  getSupervisorToken,
} = require('../helpers/auth.helper');

let testData;
let superAdminToken;
let basicUserToken;
let supervisorToken;
let createdUnitId;

beforeAll(async () => {
  testData = getTestData();
  [superAdminToken, basicUserToken, supervisorToken] = await Promise.all([
    getSuperAdminToken(),
    getBasicUserToken(),
    getSupervisorToken(),
  ]);
});

describe('GET /api/units', () => {
  it('已登录用户应能获取单位列表', async () => {
    const res = await request(app)
      .get('/api/units')
      .set('Authorization', `Bearer ${basicUserToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      const unit = res.body[0];
      expect(unit).toHaveProperty('id');
      expect(unit).toHaveProperty('name');
    }
  });

  it('未提供 token 应返回 401', async () => {
    const res = await request(app).get('/api/units');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/units/:id', () => {
  it('应返回指定单位信息', async () => {
    const res = await request(app)
      .get(`/api/units/${testData.unit1Id}`)
      .set('Authorization', `Bearer ${basicUserToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', testData.unit1Id);
    expect(res.body).toHaveProperty('name');
  });

  it('不存在的单位应返回 404', async () => {
    const res = await request(app)
      .get('/api/units/999999999')
      .set('Authorization', `Bearer ${basicUserToken}`);

    expect(res.status).toBe(404);
  });
});

describe('POST /api/units', () => {
  it('超级管理员应能创建单位', async () => {
    const ts = Date.now();
    const res = await request(app)
      .post('/api/units')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: `__TEST__新单位_${ts}`,
        companyId: testData.companyId,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('message');
    createdUnitId = res.body.id;
  });

  it('缺少单位名称应返回 400', async () => {
    const res = await request(app)
      .post('/api/units')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ companyId: testData.companyId });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('基层员工应返回 403', async () => {
    const res = await request(app)
      .post('/api/units')
      .set('Authorization', `Bearer ${basicUserToken}`)
      .send({ name: '非法单位', companyId: testData.companyId });

    expect(res.status).toBe(403);
  });
});

describe('PUT /api/units/:id', () => {
  it('超级管理员应能更新单位', async () => {
    if (!createdUnitId) return;

    const res = await request(app)
      .put(`/api/units/${createdUnitId}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ name: `__TEST__更新单位_${Date.now()}` });

    expect(res.status).toBe(200);
  });
});

describe('DELETE /api/units/:id', () => {
  it('超级管理员应能删除单位', async () => {
    if (!createdUnitId) return;

    const res = await request(app)
      .delete(`/api/units/${createdUnitId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    createdUnitId = null;
  });
});
