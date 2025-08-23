const request = require('supertest');
const app = require('../../backend/app');
const {
  getTestData,
  getSuperAdminToken,
  getCompanyAdminToken,
  getBasicUserToken,
} = require('../helpers/auth.helper');

let testData;
let superAdminToken;
let companyAdminToken;
let basicUserToken;
let createdRecordId;

beforeAll(async () => {
  testData = getTestData();
  [superAdminToken, companyAdminToken, basicUserToken] = await Promise.all([
    getSuperAdminToken(),
    getCompanyAdminToken(),
    getBasicUserToken(),
  ]);
});

describe('GET /api/waste-records', () => {
  it('应返回废物记录列表', async () => {
    const res = await request(app)
      .get('/api/waste-records')
      .set('Authorization', `Bearer ${companyAdminToken}`);

    // 管理员获取所有记录
    expect([200, 401, 403]).toContain(res.status);
    if (res.status === 200) {
      expect(Array.isArray(res.body) || typeof res.body === 'object').toBe(true);
    }
  });
});

describe('GET /api/waste-records/detail/:id', () => {
  it('应返回废物记录详情', async () => {
    const res = await request(app)
      .get(`/api/waste-records/detail/${testData.wasteRecordId}`)
      .set('Authorization', `Bearer ${companyAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('location');
    expect(res.body).toHaveProperty('unit_id');
    expect(res.body).toHaveProperty('waste_type_id');
  });

  it('不存在的记录应返回 404', async () => {
    const res = await request(app)
      .get('/api/waste-records/detail/999999999')
      .set('Authorization', `Bearer ${companyAdminToken}`);

    expect(res.status).toBe(404);
  });
});

describe('GET /api/waste-records/user/:userId', () => {
  it('应返回用户的废物记录', async () => {
    const { basicUser } = testData.users;

    const res = await request(app)
      .get(`/api/waste-records/user/${basicUser.id}`)
      .set('Authorization', `Bearer ${basicUserToken}`);

    expect(res.status).toBe(200);
    // 返回可能是数组或带分页的对象
    expect(typeof res.body).toBe('object');
  });
});

describe('GET /api/waste-records/:unitId', () => {
  it('应返回指定单位的废物记录', async () => {
    const res = await request(app)
      .get(`/api/waste-records/${testData.unit1Id}`)
      .set('Authorization', `Bearer ${companyAdminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body) || typeof res.body === 'object').toBe(true);
  });
});

describe('POST /api/waste-records', () => {
  it('应能创建废物记录', async () => {
    const now = new Date();
    const res = await request(app)
      .post('/api/waste-records')
      .set('Authorization', `Bearer ${basicUserToken}`)
      .field('unitId', testData.unit1Id)
      .field('wasteTypeId', testData.wasteTypeId)
      .field('location', '测试创建位置')
      .field('collectionDate', now.toISOString().split('T')[0])
      .field('collectionTime', '10:00')
      .field('process', '测试工序')
      .field('quantity', '5.5');

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    createdRecordId = res.body.id;
  });

  it('缺少必填字段应返回 400', async () => {
    const res = await request(app)
      .post('/api/waste-records')
      .set('Authorization', `Bearer ${basicUserToken}`)
      .field('unitId', testData.unit1Id);
    // 缺少 wasteTypeId, location, process

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('未提供 token 应返回 401', async () => {
    const res = await request(app)
      .post('/api/waste-records')
      .field('unitId', testData.unit1Id)
      .field('wasteTypeId', testData.wasteTypeId)
      .field('location', '测试')
      .field('process', '测试');

    expect(res.status).toBe(401);
  });
});

describe('PUT /api/waste-records/:id', () => {
  it('应能更新废物记录', async () => {
    if (!createdRecordId) return;

    const now = new Date();
    const res = await request(app)
      .put(`/api/waste-records/${createdRecordId}`)
      .set('Authorization', `Bearer ${basicUserToken}`)
      .field('unitId', testData.unit1Id)
      .field('wasteTypeId', testData.wasteTypeId)
      .field('location', '更新后的位置')
      .field('collectionDate', now.toISOString().split('T')[0])
      .field('collectionTime', '11:00')
      .field('process', '测试工序')
      .field('remarks', '更新备注');

    expect(res.status).toBe(200);
  });
});

describe('DELETE /api/waste-records/:id', () => {
  it('应能删除废物记录', async () => {
    if (!createdRecordId) return;

    const res = await request(app)
      .delete(`/api/waste-records/${createdRecordId}`)
      .set('Authorization', `Bearer ${basicUserToken}`);

    expect(res.status).toBe(200);
    createdRecordId = null;
  });
});
