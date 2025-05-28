const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/database');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// 导入路由
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const unitRoutes = require('./routes/units');
const wasteTypeRoutes = require('./routes/wasteTypes');
const wasteRecordRoutes = require('./routes/wasteRecords');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// API路由
app.use('/api', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/waste-types', wasteTypeRoutes);
app.use('/api/waste-records', wasteRecordRoutes);

// 处理所有前端路由请求，返回index.html
app.get('*', (req, res) => {
  // 排除API请求
  if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  } else {
    notFoundHandler(req, res);
  }
});

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
app.listen(PORT, async () => {
  console.log(`🚀 服务器启动成功: http://localhost:${PORT}`);
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