const request = require('supertest');
const { app } = require('../server'); // 确保 server.js 导出了 app
const { db } = require('../config/database');
const bcrypt = require('bcrypt');

beforeAll(async () => {
  // Knex 会使用 knexfile.js 中的 test 配置，连接到 test.db
  // 运行迁移来创建表
  await db.migrate.latest();

  // 插入测试数据
  // 插入一个角色
  await db('roles').insert({ id: 1, name: 'admin' });
  // 插入一个公司
  await db('companies').insert({ id: 1, name: 'Test Company' });
  // 哈希密码并插入一个用户
  const hashedPassword = await bcrypt.hash('password123', 10);
  await db('users').insert({
    username: 'testuser',
    password: hashedPassword,
    role_id: 1,
    company_id: 1
  });
});

afterAll(async () => {
  // 销毁数据库连接
  await db.destroy();
});

describe('Auth API', () => {
  it('should log in a user with correct credentials', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        username: 'testuser',
        password: 'password123',
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });

  it('should not log in with incorrect password', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        username: 'testuser',
        password: 'wrongpassword',
      });
    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('message', '无效的用户名或密码');
  });

  it('should not log in a non-existent user', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        username: 'nonexistent',
        password: 'password123',
      });
    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('message', '无效的用户名或密码');
  });
});
