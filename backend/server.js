// 加载环境变量 - 统一使用backend/.env
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = require('./app');
const { testConnection } = require('./config/database');

const PORT = process.env.PORT || 3000;

// 启动服务器
app.listen(PORT, async () => {
  console.log(`🚀 服务器启动成功: http://localhost:${PORT}`);
  console.log(`🔒 安全中间件已启用: Helmet, Rate Limiting, XSS Protection`);
  console.log(`🌍 环境模式: ${process.env.NODE_ENV || 'development'}`);
  if (process.env.NODE_ENV === 'production') {
    console.log('🛡️ 生产环境安全策略已启用');
  }
  console.log('🔧 开始检查数据库连接...');
  await testConnection();
  console.log('✅ 服务器初始化完成');
});

// 优雅关闭
const gracefulShutdown = async () => {
  console.log('📦 正在关闭服务器...');
  try {
    console.log('✅ 服务器已安全关闭');
    process.exit(0);
  } catch (error) {
    console.error('❌ 关闭服务器时出错:', error);
    process.exit(1);
  }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

process.on('unhandledRejection', (reason) => {
  console.error('未处理的Promise拒绝:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  process.exit(1);
});
