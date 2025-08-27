const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// 加载环境变量 - 统一使用backend/.env
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

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 信任代理设置（用于获取真实IP）
app.set('trust proxy', 1);

// 安全中间件配置
// Helmet - 设置各种HTTP头部来保护应用
const isProduction = process.env.NODE_ENV === 'production';

// CSP配置 - 根据环境调整
const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: isProduction 
      ? ["'self'"] // 生产环境严格限制
      : ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // 开发环境兼容性
    styleSrc: isProduction
      ? ["'self'", "'unsafe-inline'"] // 样式需要inline支持Element Plus
      : ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "blob:"],
    connectSrc: ["'self'"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
  },
};

app.use(helmet({
  contentSecurityPolicy: cspConfig,
  crossOriginEmbedderPolicy: false, // 兼容性考虑
}));

// 速率限制 - 防止暴力攻击
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP最多100个请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // 跳过静态文件的限制
    return req.url.startsWith('/uploads/') || req.url.startsWith('/static/');
  }
});

// 登录接口特殊限制 - 更严格的速率限制
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 每个IP最多5次登录尝试
  message: {
    success: false,
    message: '登录尝试次数过多，请15分钟后再试',
    code: 'LOGIN_RATE_LIMIT_EXCEEDED'
  },
  skipSuccessfulRequests: true, // 成功的请求不计入限制
});

// 应用速率限制
app.use('/api', limiter);
app.use('/api/login', loginLimiter);

// CORS配置 - 简化配置，允许所有来源
app.use(cors({
  origin: true, // 允许所有来源
  credentials: false, // 不使用Cookie认证，使用Authorization头
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 请求体解析中间件
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // 验证JSON格式，防止恶意输入
    try {
      JSON.parse(buf);
    } catch (e) {
      const error = new Error('无效的JSON格式');
      error.status = 400;
      throw error;
    }
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 100 // 限制参数数量
}));

// 应用安全中间件
app.use(inputLimits); // 输入长度限制
app.use(sqlInjectionProtection); // SQL注入防护
app.use(xssProtection); // XSS防护

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  maxAge: '1d', // 缓存1天
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    // 为图片文件设置安全头
    if (path.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));

app.use(express.static(path.join(__dirname, '../frontend/dist'), {
  maxAge: '1h', // 缓存1小时
  etag: true,
  lastModified: true
}));

// API路由
app.use('/api', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/waste-types', wasteTypeRoutes);
app.use('/api/waste-records', wasteRecordRoutes);
app.use('/api/operation-logs', operationLogRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/feedback', feedbackRoutes);

// 健康检查端点 - 限制信息暴露
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '服务正常运行',
    timestamp: new Date().toISOString()
    // 移除uptime等可能泄露的信息
  });
});

// 处理所有前端路由请求，返回index.html
app.get('*', (req, res) => {
  // 排除API请求
  if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  } else {
    notFoundHandler(req, res);
  }
});

// 错误处理中间件（必须放在最后）
app.use(errorHandler);

// 启动服务器
app.listen(PORT, async () => {
  console.log(`🚀 服务器启动成功: http://localhost:${PORT}`);
  console.log(`🔒 安全中间件已启用: Helmet, Rate Limiting, XSS Protection`);
  console.log(`🌍 环境模式: ${process.env.NODE_ENV || 'development'}`);
  if (redisClient.status === 'ready') {
    console.log('💾 Redis 缓存已启用');
  }
  if (isProduction) {
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
    await new Promise(resolve => redisClient.quit(resolve));
    console.log('✅ Redis 连接已关闭');
    console.log('✅ 服务器已安全关闭');
    process.exit(0);
  } catch (error) {
    console.error('❌ 关闭服务器时出错:', error);
    process.exit(1);
  }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// 捕获未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  // 在生产环境中可能需要优雅关闭
});

// 捕获未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  process.exit(1);
});
