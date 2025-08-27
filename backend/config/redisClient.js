const Redis = require('ioredis');

const redisClient = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
});

redisClient.on('connect', () => {
  console.log('已连接到 Redis');
});

redisClient.on('error', (err) => {
  console.error('Redis 连接错误:', err);
});

module.exports = redisClient;
