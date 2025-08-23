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
let createdCompanyId;

beforeAll(async () => {
  testData = getTestData();
  [superAdminToken, basicUserToken] = await Promise.all([
    getSuperAdminToken(),
    getBasicUserToken(),
  ]);
});

describe('GET /api/companies', () => {
  it('系统超级管理员应能获取所有公司', async () => {
    const res = await request(app)
      .get('/api/companies')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      const company = res.body[0];
      expect(company).toHaveProperty('id');
      expect(company).toHaveProperty('name');
    }
  });

  it('非超级管理员应返回 403', async () => {
    const res = await request(app)
      .get('/api/companies')
      .set('Authorization', `Bearer ${basicUserToken}`);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error');
  });

  it('未提供 token 应返回 401', async () => {
    const res = await request(app).get('/api/companies');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/companies/:id', () => {
  it('超级管理员应能获取指定公司', async () => {
    const res = await request(app)
      .get(`/api/companies/${testData.companyId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', testData.companyId);
    expect(res.body).toHaveProperty('name');
  });

  it('用户只能查看本公司，访问他人公司应返回 403', async () => {
    // basicUser 属于 testData.companyId
    // 尝试访问不同公司（ID=1，若存在）
    const otherId = testData.companyId === 1 ? 2 : 1;
    const res = await request(app)
      .get(`/api/companies/${otherId}`)
      .set('Authorization', `Bearer ${basicUserToken}`);

    // 若公司不存在返回 404，若权限不足返回 403
    expect([403, 404]).toContain(res.status);
  });

  it('不存在的公司应返回 404', async () => {
    const res = await request(app)
      .get('/api/companies/999999999')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(404);
  });
});

describe('GET /api/companies/:id/stats', () => {
  it('超级管理员应能获取公司统计数据', async () => {
    const res = await request(app)
      .get(`/api/companies/${testData.companyId}/stats`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
  });
});

describe('POST /api/companies', () => {
  it('超级管理员应能创建公司', async () => {
    const ts = Date.now();
    const res = await request(app)
      .post('/api/companies')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: `__TEST__公司B_${ts}`,
        code: `TCB${ts}`,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('name');
    createdCompanyId = res.body.id;
  });

  it('非超级管理员应返回 403', async () => {
    const res = await request(app)
      .post('/api/companies')
      .set('Authorization', `Bearer ${basicUserToken}`)
      .send({ name: '非法公司' });

    expect(res.status).toBe(403);
  });

  it('缺少名称应返回 400', async () => {
    const res = await request(app)
      .post('/api/companies')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({});

    expect(res.status).toBe(400);
  });
});

describe('PUT /api/companies/:id', () => {
  it('超级管理员应能更新公司', async () => {
    if (!createdCompanyId) return;

    const res = await request(app)
      .put(`/api/companies/${createdCompanyId}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ name: `__TEST__公司B_更新_${Date.now()}` });

    expect(res.status).toBe(200);
  });
});

describe('DELETE /api/companies/:id', () => {
  it('超级管理员应能删除公司', async () => {
    if (!createdCompanyId) return;

    const res = await request(app)
      .delete(`/api/companies/${createdCompanyId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    createdCompanyId = null;
  });
});
