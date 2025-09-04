module.exports = {
  // 使用 Node.js 测试环境
  testEnvironment: 'node',

  // 在每个测试文件运行后自动清除模拟、实例和存根
  clearMocks: true,

  // Jest 应该搜索测试文件的目录
  roots: [
    '<rootDir>/tests'
  ],

  // 测试文件的匹配模式
  testRegex: '(/__tests__/.*|(\.|/)(test|spec))\.js$',

  // 在运行测试之前需要执行的设置文件
  // setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // 转换器配置，告诉 Jest 如何处理 .js 文件
  transform: {
    '^.+\\.js$': 'babel-jest',
  },

  // 模块文件扩展名
  moduleFileExtensions: ['js', 'json', 'node'],
  
  // 测试超时时间 (例如, 30000ms)
  testTimeout: 30000,
};
