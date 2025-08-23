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
let createdFeedbackId;

beforeAll(async () => {
  testData = getTestData();
  [superAdminToken, basicUserToken] = await Promise.all([
    getSuperAdminToken(),
    getBasicUserToken(),
  ]);
});

describe('POST /api/feedback', () => {
  it('已登录用户应能提交反馈', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${basicUserToken}`)
      .send({
        title: `__TEST__反馈标题_${Date.now()}`,
        description: '这是一条测试反馈内容',
        type: 'bug',
        priority: 'medium',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('id');
    createdFeedbackId = res.body.data.id;
  });

  it('缺少标题应返回 400', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${basicUserToken}`)
      .send({ description: '没有标题的反馈' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('message');
  });

  it('缺少描述应返回 400', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${basicUserToken}`)
      .send({ title: '没有描述的反馈' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
  });

  it('未提供 token 应返回 401', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .send({ title: '测试', description: '测试内容' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/feedback/user', () => {
  it('用户应能获取自己的反馈列表', async () => {
    const res = await request(app)
      .get('/api/feedback/user')
      .set('Authorization', `Bearer ${basicUserToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('GET /api/feedback/admin', () => {
  it('管理员应能获取所有反馈', async () => {
    const res = await request(app)
      .get('/api/feedback/admin')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
  });
});

describe('GET /api/feedback/stats', () => {
  it('应能获取反馈统计', async () => {
    const res = await request(app)
      .get('/api/feedback/stats')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });
});

describe('GET /api/feedback/:id', () => {
  it('应能获取指定反馈详情', async () => {
    const res = await request(app)
      .get(`/api/feedback/${testData.feedbackId}`)
      .set('Authorization', `Bearer ${basicUserToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    const feedback = res.body.data;
    expect(feedback).toHaveProperty('id', testData.feedbackId);
    expect(feedback).toHaveProperty('title');
    expect(feedback).toHaveProperty('description');
    expect(feedback).toHaveProperty('type');
    expect(feedback).toHaveProperty('priority');
    expect(feedback).toHaveProperty('status');
  });

  it('不存在的反馈应返回 404', async () => {
    const res = await request(app)
      .get('/api/feedback/999999999')
      .set('Authorization', `Bearer ${basicUserToken}`);

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/feedback/:id/status', () => {
  it('管理员应能更新反馈状态', async () => {
    const targetId = createdFeedbackId || testData.feedbackId;

    const res = await request(app)
      .put(`/api/feedback/${targetId}/status`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ status: 'processing', admin_reply: '已收到，处理中' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });
});

describe('DELETE /api/feedback/:id', () => {
  it('用户应能删除自己的反馈', async () => {
    if (!createdFeedbackId) return;

    const res = await request(app)
      .delete(`/api/feedback/${createdFeedbackId}`)
      .set('Authorization', `Bearer ${basicUserToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    createdFeedbackId = null;
  });
});
