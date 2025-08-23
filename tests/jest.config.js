const path = require('path');

module.exports = {
  testEnvironment: 'node',
  globalSetup: './global.setup.js',
  globalTeardown: './global.teardown.js',
  setupFiles: ['./setup.env.js'],
  testMatch: ['**/api/**/*.test.js'],
  testTimeout: 30000,
  verbose: true,
  // 允许 Jest 找到 backend/node_modules 中的依赖
  modulePaths: [path.join(__dirname, '../backend/node_modules')],
};
