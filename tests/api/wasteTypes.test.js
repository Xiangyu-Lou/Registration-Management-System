const request = require('supertest');
const app = require('../../backend/app');
const {
  getTestData,
  getSuperAdminToken,
  getBasicUserToken,
} = require('../helpers/auth.helper');

let testData;
let superAdminToken;
let basicUserToken;
let createdTypeId;

beforeAll(async () => {
  testData = getTestData();
  [superAdminToken, basicUserToken] = await Promise.all([
    getSuperAdminToken(),
    getBasicUserToken(),
  ]);
});

describe('GET /api/waste-types', () => {
  it('无需认证即可获取废物类型列表', async () => {
    const res = await request(app).get('/api/waste-types');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      const wt = res.body[0];
      expect(wt).toHaveProperty('id');
      expect(wt).toHaveProperty('name');
    }
  });
});

describe('GET /api/waste-types/:id', () => {
  it('应返回指定废物类型', async () => {
    const res = await request(app).get(`/api/waste-types/${testData.wasteTypeId}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', testData.wasteTypeId);
    expect(res.body).toHaveProperty('name');
  });

  it('不存在的废物类型应返回 404', async () => {
    const res = await request(app).get('/api/waste-types/999999999');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/waste-types', () => {
  it('超级管理员应能创建废物类型', async () => {
    const ts = Date.now();
    const res = await request(app)
      .post('/api/waste-types')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ name: `__TEST__废物类型B_${ts}` });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('message');
    createdTypeId = res.body.id;
  });

  it('缺少名称应返回 400', async () => {
    const res = await request(app)
      .post('/api/waste-types')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('基层员工应返回 403', async () => {
    const res = await request(app)
      .post('/api/waste-types')
      .set('Authorization', `Bearer ${basicUserToken}`)
      .send({ name: '非法类型' });

    expect(res.status).toBe(403);
  });

  it('未提供 token 应返回 401', async () => {
    const res = await request(app)
      .post('/api/waste-types')
      .send({ name: '测试' });

    expect(res.status).toBe(401);
  });
});

describe('PUT /api/waste-types/:id', () => {
  it('超级管理员应能更新废物类型', async () => {
    if (!createdTypeId) return;

    const res = await request(app)
      .put(`/api/waste-types/${createdTypeId}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ name: `__TEST__废物类型B_更新_${Date.now()}` });

    expect(res.status).toBe(200);
  });
});

describe('DELETE /api/waste-types/:id', () => {
  it('超级管理员应能删除废物类型', async () => {
    if (!createdTypeId) return;

    const res = await request(app)
      .delete(`/api/waste-types/${createdTypeId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    createdTypeId = null;
  });
});
