const request = require('supertest');
const app = require('../../backend/app');

describe('GET /health', () => {
  it('应返回 200 和服务状态', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('message', '服务正常运行');
    expect(res.body).toHaveProperty('timestamp');
    expect(typeof res.body.timestamp).toBe('string');
  });
});

describe('GET /api/test', () => {
  it('应返回 200 和运行状态消息', async () => {
    const res = await request(app).get('/api/test');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', '服务器运行正常');
  });
});
