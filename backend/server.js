const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { initWebSocket } = require('./websocket');

// 加载环境变量
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { testConnection } = require('./config/database');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { xssProtection, inputLimits, sqlInjectionProtection } = require('./middleware/security');
const redisClient = require('./config/redisClient');

// 导入路由
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const unitRoutes = require('./routes/units');
const wasteTypeRoutes = require('./routes/wasteTypes');
const wasteRecordRoutes = require('./routes/wasteRecords');
const operationLogRoutes = require('./routes/operationLogs');
const companyRoutes = require('./routes/companies');
const feedbackRoutes = require('./routes/feedback');

// 导入Swagger配置
const setupSwagger = require('./swagger');

// 创建Express应用
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// ... (中间件和安全设置保持不变) ...

// CORS配置
app.use(cors({
  origin: true,
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 请求体解析
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
app.use('/api/operation-logs', operationLogRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/feedback', feedbackRoutes);

// 设置Swagger API文档路径
setupSwagger(app);

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ success: true, message: '服务正常运行' });
});

// 前端路由回退
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/api-docs')) {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  } else {
    notFoundHandler(req, res);
  }
});

// 错误处理
app.use(errorHandler);

// 初始化WebSocket
initWebSocket(server);

// 启动服务器
server.listen(PORT, async () => {
  console.log(`🚀 服务器启动成功: http://localhost:${PORT}`);
  await testConnection();
  // 其他日志...
});
