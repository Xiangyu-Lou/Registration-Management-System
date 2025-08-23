const request = require('supertest');
const app = require('../../backend/app');
const {
  getTestData,
  login,
  TEST_PASSWORD,
} = require('../helpers/auth.helper');

let testData;
let logViewerToken;  // 需要 can_view_logs=1 的用户
let basicUserToken;

beforeAll(async () => {
  testData = getTestData();
  // 操作日志接口要求 can_view_logs=1，使用 logViewer 用户
  [logViewerToken, basicUserToken] = await Promise.all([
    login(testData.users.logViewer.phone),
    login(testData.users.basicUser.phone),
  ]);
});

describe('GET /api/operation-logs', () => {
  it('有 can_view_logs 权限的用户应能获取操作日志', async () => {
    const res = await request(app)
      .get('/api/operation-logs')
      .set('Authorization', `Bearer ${logViewerToken}`);

    expect(res.status).toBe(200);
    // 返回带分页的对象
    expect(typeof res.body).toBe('object');
  });

  it('没有 can_view_logs 权限的用户应返回 403', async () => {
    const res = await request(app)
      .get('/api/operation-logs')
      .set('Authorization', `Bearer ${basicUserToken}`);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error');
  });

  it('支持分页参数', async () => {
    const res = await request(app)
      .get('/api/operation-logs?page=1&pageSize=10')
      .set('Authorization', `Bearer ${logViewerToken}`);

    expect(res.status).toBe(200);
  });

  it('支持按类型筛选', async () => {
    const res = await request(app)
      .get('/api/operation-logs?operationType=login')
      .set('Authorization', `Bearer ${logViewerToken}`);

    expect(res.status).toBe(200);
  });

  it('未提供 token 应返回 401', async () => {
    const res = await request(app).get('/api/operation-logs');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/operation-logs/stats', () => {
  it('有 can_view_logs 权限的用户应能获取操作统计', async () => {
    const res = await request(app)
      .get('/api/operation-logs/stats')
      .set('Authorization', `Bearer ${logViewerToken}`);

    expect(res.status).toBe(200);
  });
});

describe('GET /api/operation-logs/user-stats', () => {
  it('有 can_view_logs 权限的用户应能获取用户操作统计', async () => {
    const res = await request(app)
      .get('/api/operation-logs/user-stats')
      .set('Authorization', `Bearer ${logViewerToken}`);

    expect(res.status).toBe(200);
  });
});

describe('GET /api/operation-logs/export', () => {
  it('有 can_view_logs 权限的用户应能导出操作日志', async () => {
    const res = await request(app)
      .get('/api/operation-logs/export')
      .set('Authorization', `Bearer ${logViewerToken}`);

    expect(res.status).toBe(200);
  });
});
