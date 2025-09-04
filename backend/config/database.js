const knex = require('knex');
const knexfile = require('../knexfile');

const environment = process.env.NODE_ENV || 'development';
const config = knexfile[environment];

const db = knex(config);

const testConnection = async () => {
  try {
    await db.raw('SELECT 1');
    console.log(`✓ 数据库连接成功 (环境: ${environment})`);
  } catch (error) {
    console.error(`✗ 数据库连接失败 (环境: ${environment}):`, error.message);
    process.exit(1);
  }
};

module.exports = { db, testConnection };
