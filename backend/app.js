const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { xssProtection, inputLimits, sqlInjectionProtection } = require('./middleware/security');

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

// 信任代理设置（用于获取真实IP）
app.set('trust proxy', 1);

// 安全中间件配置
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

// CSP配置 - 根据环境调整
const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: isProduction
      ? ["'self'"]
      : ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
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
  crossOriginEmbedderPolicy: false,
}));

// 速率限制 - 测试环境跳过
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return isTest || req.url.startsWith('/uploads/') || req.url.startsWith('/static/');
  }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: '登录尝试次数过多，请15分钟后再试',
    code: 'LOGIN_RATE_LIMIT_EXCEEDED'
  },
  skipSuccessfulRequests: true,
  skip: () => isTest,
});

// 应用速率限制
app.use('/api', limiter);
app.use('/api/login', loginLimiter);

// CORS配置
app.use(cors({
  origin: true,
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 请求体解析中间件
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
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
  parameterLimit: 100
}));

// 应用安全中间件
app.use(inputLimits);
app.use(sqlInjectionProtection);
app.use(xssProtection);

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  maxAge: '1d',
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    if (filePath.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));

app.use(express.static(path.join(__dirname, '../frontend/dist'), {
  maxAge: '1h',
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

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '服务正常运行',
    timestamp: new Date().toISOString()
  });
});

// 处理所有前端路由请求，返回index.html
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  } else {
    notFoundHandler(req, res);
  }
});

// 错误处理中间件（必须放在最后）
app.use(errorHandler);

module.exports = app;
