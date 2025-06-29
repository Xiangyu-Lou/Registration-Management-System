const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// 加载环境变量
require('dotenv').config({ path: path.join(__dirname, '.env') });

// JWT 密钥
const JWT_SECRET = process.env.JWT_SECRET || 'please input your secret key in .env file'; // 使用环境变量，如未设置则使用默认值作为后备

// 检查是否为监督人员
const checkForSupervisor = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: '未授权' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // 检查用户是否为监督人员
    if (decoded.role_id === 4) { // 监督人员不能访问用户管理
      return res.status(403).json({ error: '没有权限访问用户管理' });
    }
    // 不是监督人员，继续执行
    next();
  } catch (error) {
    return res.status(401).json({ error: '无效的令牌' });
  }
};

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors({
  origin: true, // 允许所有来源，或者替换为你的前端域名
  credentials: true, // 允许带凭证的请求
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 添加前端静态文件服务和路由处理
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// 创建上传目录（如果不存在）
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    
    // 根据文件的实际MIME类型确定扩展名
    let ext;
    switch (file.mimetype) {
      case 'image/jpeg':
      case 'image/jpg':
        ext = '.jpg';
        break;
      case 'image/png':
        ext = '.png';
        break;
      case 'image/gif':
        ext = '.gif';
        break;
      case 'image/bmp':
        ext = '.bmp';
        break;
      case 'image/webp':
        ext = '.webp';
        break;
      default:
        // 如果是未知类型，使用原始扩展名
        ext = path.extname(file.originalname);
    }
    
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// 文件类型过滤器
const fileFilter = function(req, file, cb) {
  // 接受的图片类型
  const acceptedMimeTypes = [
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'image/gif', 
    'image/bmp', 
    'image/webp'
  ];
  
  if (acceptedMimeTypes.includes(file.mimetype)) {
    cb(null, true); // 接受文件
  } else {
    cb(new Error('只接受JPEG、JPG、PNG、GIF、BMP和WEBP格式的图片文件'), false); // 拒绝文件
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB file size limit
  }
});

// 自定义文件处理中间件，用于检查上传的文件
const processUploadedFiles = (req, res, next) => {
  if (!req.files) {
    return next();
  }

  // 简单记录上传的文件信息
  Object.keys(req.files).forEach(fieldName => {
    req.files[fieldName].forEach(file => {
      console.log(`接收到上传的文件: ${file.originalname}, 类型: ${file.mimetype}, 大小: ${(file.size / 1024).toFixed(2)}KB`);
    });
  });
  
  next();
};

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST || 'your_database_host',
  user: process.env.DB_USER || 'your_database_username',
  password: process.env.DB_PASSWORD || 'your_database_password',
  database: process.env.DB_NAME || 'your_database_name',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true // 允许执行多条SQL语句
};

// 密码加密函数
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// 密码验证函数
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// 创建数据库连接池
const pool = mysql.createPool(dbConfig);

// 日期格式化函数 - 将ISO格式转为MySQL格式
function formatDateForMySQL(dateString) {
  if (!dateString) return null;
  // 处理ISO格式的日期时间字符串
  if (dateString.includes('T')) {
    return dateString.slice(0, 19).replace('T', ' ');
  }
  return dateString;
}

// 测试数据库连接
async function testDatabaseConnection() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('成功连接到 MySQL 数据库');
    
    // 验证数据库表和数据
    try {
      const [rows] = await connection.query("SELECT count(*) as count FROM units");
      console.log(`数据库内有 ${rows[0].count || 0} 个单位记录`);
      if (rows[0].count === 0) {
        console.log('警告: 数据库中没有单位数据, 请运行初始化脚本');
      }
    } catch (err) {
      console.error('查询单位表失败, 表可能不存在:', err.message);
      console.log('请运行数据库初始化脚本: npm run init-db');
    }
  } catch (error) {
    console.error('数据库连接失败:', error.message);
    console.log('请确保 MySQL 服务运行且配置正确');
    // 不立即退出，允许重新初始化数据库
    console.log('将继续启动服务器，请运行初始化脚本然后重试');
  } finally {
    if (connection) connection.release();
  }
}

// 启动时测试数据库连接
testDatabaseConnection();

// API路由

// 测试路由
app.get('/api/test', (req, res) => {
  res.json({ message: '服务器运行正常' });
});

// 用户登录
app.post('/api/login', async (req, res) => {
  const { phone, password, rememberMe } = req.body;
  
  try {
    // 验证用户是否存在
    const [users] = await pool.query('SELECT * FROM users WHERE phone = ?', [phone]);
    if (users.length === 0) {
      return res.status(401).json({ error: '用户不存在' });
    }
    
    const user = users[0];
    
    // 检查用户状态，如果用户已停用则拒绝登录
    if (user.status === 0) {
      return res.status(403).json({ error: '账号已停用，请联系管理员' });
    }
    
    // 验证密码 - 支持空密码用户(主要是兼容历史数据)
    if (user.password) {
      // 如果用户有密码，则必须提供密码
      if (!password) {
        return res.status(401).json({ error: '请输入密码' });
      }
      
      // 验证密码
      const passwordMatch = await comparePassword(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: '密码错误' });
      }
    }

    // 生成 token
    const token = jwt.sign(
      { 
        id: user.id,
        username: user.username,
        phone: user.phone,
        role_id: user.role_id,
        unit_id: user.unit_id
      },
      JWT_SECRET,
      { expiresIn: rememberMe ? '30d' : '24h' }
    );
    
    res.json({
      id: user.id,
      username: user.username,
      phone: user.phone,
      role: user.role_name,
      role_id: user.role_id,
      unit_id: user.unit_id,
      unit_name: user.unit_name,
      token
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 验证 token 的中间件
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: '无效的认证令牌' });
  }
};

// 获取所有用户（用于管理员）
app.get('/api/users', checkForSupervisor, async (req, res) => {
  try {
    // 获取用户的角色和单位信息
    const [rows] = await pool.query(
      `SELECT u.id, u.username, u.phone, u.role_id, r.name as role_name, u.unit_id, un.name as unit_name, u.status
       FROM users u 
       JOIN user_roles r ON u.role_id = r.id 
       LEFT JOIN units un ON u.unit_id = un.id 
       ORDER BY un.name ASC, u.role_id DESC, u.username ASC`
    );
    
    res.json(rows);
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取指定单位的用户（用于单位管理员）
app.get('/api/units/:unitId/users', checkForSupervisor, async (req, res) => {
  const { unitId } = req.params;
  
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.username, u.phone, u.role_id, r.name as role_name, u.unit_id, un.name as unit_name, u.status 
       FROM users u 
       JOIN user_roles r ON u.role_id = r.id 
       LEFT JOIN units un ON u.unit_id = un.id 
       WHERE u.unit_id = ? 
       ORDER BY u.role_id DESC, u.username ASC`, 
      [unitId]
    );
    
    res.json(rows);
  } catch (error) {
    console.error('获取单位用户列表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 添加新用户
app.post('/api/users', checkForSupervisor, async (req, res) => {
  const { username, phone, password, roleId, unitId } = req.body;
  
  // 验证必填字段
  if (!username || !phone || !roleId) {
    return res.status(400).json({ error: '用户名、手机号和角色是必填项' });
  }
  
  // 必要的参数验证 - 员工和单位管理员必须指定单位，超级管理员和监督人员不需要
  if ((roleId == 1 || roleId == 2) && !unitId) {
    return res.status(400).json({ error: '员工和单位管理员必须指定单位' });
  }
  
  // 对于所有用户类型，都需要验证密码
  if (!password) {
    return res.status(400).json({ error: '所有账号必须设置密码' });
  }
  
  try {
    // 验证手机号是否已存在
    const [existingUsers] = await pool.query('SELECT id FROM users WHERE phone = ?', [phone]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: '手机号已被注册' });
    }
    
    // 对密码进行加密（如果有密码）
    let hashedPassword = null;
    if (password) {
      hashedPassword = await hashPassword(password);
    }
    
    // 创建新用户
    const [result] = await pool.query(
      'INSERT INTO users (username, phone, password, role_id, unit_id) VALUES (?, ?, ?, ?, ?)',
      [username, phone, hashedPassword, roleId, unitId || null]
    );
    
    res.status(201).json({
      id: result.insertId,
      message: '用户创建成功'
    });
  } catch (error) {
    console.error('创建用户错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新用户信息
app.put('/api/users/:id', checkForSupervisor, async (req, res) => {
  const { id } = req.params;
  const { username, phone, password, roleId, unitId } = req.body;
  
  // 验证必填字段
  if (!username || !phone || !roleId) {
    return res.status(400).json({ error: '用户名、手机号和角色是必填项' });
  }
  
  // 必要的参数验证 - 员工和单位管理员必须指定单位，超级管理员和监督人员不需要
  if ((roleId == 1 || roleId == 2) && !unitId) {
    return res.status(400).json({ error: '员工和单位管理员必须指定单位' });
  }
  
  try {
    // 验证用户是否存在
    const [existingUsers] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (existingUsers.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    const existingUser = existingUsers[0];
    
    // 验证手机号是否被其他用户使用
    if (phone !== existingUser.phone) {
      const [phoneUsers] = await pool.query('SELECT id FROM users WHERE phone = ? AND id != ?', [phone, id]);
      if (phoneUsers.length > 0) {
        return res.status(400).json({ error: '手机号已被其他用户使用' });
      }
    }
    
    // 准备更新数据
    let sql;
    let params;
    
    // 如果提供了新密码，则更新密码
    if (password) {
      // 对新密码进行加密
      const hashedPassword = await hashPassword(password);
      sql = 'UPDATE users SET username = ?, phone = ?, password = ?, role_id = ?, unit_id = ? WHERE id = ?';
      params = [username, phone, hashedPassword, roleId, unitId || null, id];
    } else {
      sql = 'UPDATE users SET username = ?, phone = ?, role_id = ?, unit_id = ? WHERE id = ?';
      params = [username, phone, roleId, unitId || null, id];
    }
    
    // 更新用户
    await pool.query(sql, params);
    
    res.json({
      id: parseInt(id),
      message: '用户信息更新成功'
    });
  } catch (error) {
    console.error('更新用户错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除用户
app.delete('/api/users/:id', checkForSupervisor, async (req, res) => {
  const { id } = req.params;
  
  try {
    // 验证用户是否存在
    const [existingUsers] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (existingUsers.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 检查该用户是否创建了废物记录
    const [records] = await pool.query('SELECT COUNT(*) as count FROM waste_records WHERE creator_id = ?', [id]);
    if (records[0].count > 0) {
      return res.status(400).json({ error: '不能删除该用户，因为存在关联的废物记录' });
    }
    
    // 删除用户
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    
    res.json({
      message: '用户删除成功',
      id: parseInt(id)
    });
  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 修改用户状态（停用/恢复）
app.put('/api/users/:id/status', checkForSupervisor, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (status !== 0 && status !== 1) {
    return res.status(400).json({ error: '无效的状态值' });
  }
  
  try {
    // 验证用户是否存在
    const [existingUsers] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (existingUsers.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 更新用户状态
    await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
    
    res.json({
      id: parseInt(id),
      status,
      message: status === 1 ? '账号已恢复' : '账号已停用'
    });
  } catch (error) {
    console.error('修改用户状态错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取单个用户信息
app.get('/api/users/:id', checkForSupervisor, async (req, res) => {
  const { id } = req.params;
  
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.username, u.phone, u.role_id, u.unit_id, r.name as role_name, un.name as unit_name, u.status 
       FROM users u 
       JOIN user_roles r ON u.role_id = r.id 
       LEFT JOIN units un ON u.unit_id = un.id 
       WHERE u.id = ?`, 
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const user = rows[0];
    res.json({
      id: user.id,
      username: user.username,
      phone: user.phone,
      role: user.role_name,
      role_id: user.role_id,
      unit_id: user.unit_id,
      unit_name: user.unit_name,
      status: user.status
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取所有单位
app.get('/api/units', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM units ORDER BY name');
    res.json(rows);
  } catch (error) {
    console.error('获取单位列表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取所有废物类型
app.get('/api/waste-types', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM waste_types ORDER BY id');
    res.json(rows);
  } catch (error) {
    console.error('获取废物类型错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 添加废物记录
app.post('/api/waste-records', verifyToken, upload.fields([
  { name: 'photo_before', maxCount: 5 },
  { name: 'photo_after', maxCount: 5 }
]), async (req, res) => {
  try {
    const { unitId, wasteTypeId, location, collectionDate, collectionTime, quantity, remarks, process } = req.body;
    
    // 验证必填字段
    if (!unitId || !wasteTypeId || !location || !process) {
      return res.status(400).json({ error: '单位、废物类型、位置和产生工序是必填字段' });
    }

    // 处理quantity字段，如果是undefined或空字符串，则设为null
    const quantityValue = quantity === undefined || quantity === 'undefined' || quantity === '' ? null : quantity;
    
    // 处理照片路径
    let photo_path_before = null;
    let photo_path_after = null;
    
    // 验证单位是否存在
    const [unitRows] = await pool.query('SELECT * FROM units WHERE id = ?', [unitId]);
    if (unitRows.length === 0) {
      return res.status(400).json({ error: '单位不存在' });
    }
    
    // 验证废物类型是否存在
    const [wasteTypeRows] = await pool.query('SELECT * FROM waste_types WHERE id = ?', [wasteTypeId]);
    if (wasteTypeRows.length === 0) {
      return res.status(400).json({ error: '废物类型不存在' });
    }
    
    // 格式化收集时间
    const collectionStartTime = collectionDate && collectionTime ? `${collectionDate} ${collectionTime}` : null;
    
    // 处理收集前照片
    if (req.files.photo_before && req.files.photo_before.length > 0) {
      const photoPathsBefore = req.files.photo_before.map(file => `/uploads/${file.filename}`);
      photo_path_before = JSON.stringify(photoPathsBefore);
    }
    
    // 处理收集后照片
    if (req.files.photo_after && req.files.photo_after.length > 0) {
      const photoPathsAfter = req.files.photo_after.map(file => `/uploads/${file.filename}`);
      photo_path_after = JSON.stringify(photoPathsAfter);
    }
    
    // 获取当前用户信息
    const userId = req.body.creator_id || (req.user ? req.user.id : null);
    
    // 检查用户是否为监督人员
    let isSupervisedValue = null;
    if (userId) {
      const [userRows] = await pool.query('SELECT role_id FROM users WHERE id = ?', [userId]);
      if (userRows.length > 0 && userRows[0].role_id === 4) { // 监督人员
        isSupervisedValue = 1;
      }
    }
    
    console.log('处理废物记录提交:', {
      body: req.body,
      userId,
      user: req.user,
      isSupervisedValue
    });
    
    // 插入记录
    const [result] = await pool.query(
      `INSERT INTO waste_records 
      (unit_id, waste_type_id, location, collection_start_time, photo_path_before, photo_path_after, quantity, created_at, creator_id, remarks, process, is_supervised)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?)`,
      [unitId, wasteTypeId, location, collectionStartTime, photo_path_before, photo_path_after, quantityValue, userId, remarks, process, isSupervisedValue]
    );
    
    res.status(201).json({
      message: '废物记录添加成功',
      id: result.insertId
    });
  } catch (error) {
    console.error('添加废物记录错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取特定单位的废物记录
app.get('/api/waste-records/:unitId', async (req, res) => {
  const { unitId } = req.params;
  
  try {
    // 从请求头中获取token以判断用户角色
    const token = req.headers.authorization?.split(' ')[1];
    let isAdmin = false; // 是否为超级管理员
    
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        isAdmin = decoded.role_id === 3; // 只有超级管理员可以看到所有数据
      } catch (err) {
        console.error('Token验证失败:', err);
      }
    }
    
    let query = `
      SELECT wr.*, u.name as unit_name, wt.name as waste_type_name,
       IFNULL(creator.username, creator.phone) as creator_name
       FROM waste_records wr
       JOIN units u ON wr.unit_id = u.id
       JOIN waste_types wt ON wr.waste_type_id = wt.id
       LEFT JOIN users creator ON wr.creator_id = creator.id
       WHERE wr.unit_id = ?
    `;
    
    const params = [unitId];
    
    // 如果不是超级管理员，则不显示监督数据
    if (!isAdmin) {
      query += ' AND (wr.is_supervised IS NULL OR wr.is_supervised != 1)';
    }
    
    query += ' ORDER BY wr.created_at DESC';
    
    const [rows] = await pool.query(query, params);
    
    res.json(rows);
  } catch (error) {
    console.error('获取单位废物记录错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 修改废物记录
app.put('/api/waste-records/:id', verifyToken, upload.fields([
  { name: 'photo_before', maxCount: 5 },
  { name: 'photo_after', maxCount: 5 }
]), async (req, res) => {
  const { id } = req.params;
  const { unitId, wasteTypeId, location, collectionDate, collectionTime, quantity, photo_path_before, photo_path_after, remarks, process } = req.body;
  
  try {
    // 验证记录是否存在
    const [rows] = await pool.query('SELECT * FROM waste_records WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: '记录不存在' });
    }
    
    const record = rows[0];
    
    // 处理quantity字段，如果是undefined或空字符串，则设为null
    const quantityValue = quantity === undefined || quantity === 'undefined' || quantity === '' ? null : quantity;
    
    // 处理照片
    let newPhotoPathBefore = record.photo_path_before;
    let newPhotoPathAfter = record.photo_path_after;
    
    // 处理收集前照片
    if (req.files.photo_before && req.files.photo_before.length > 0) {
      console.log('收到新的收集前照片:', req.files.photo_before.length, '张');
      
      // 新上传的照片路径
      const newPhotosBefore = req.files.photo_before.map(file => `/uploads/${file.filename}`);
      
      // 如果前端提供了现有照片路径，则合并
      if (photo_path_before) {
        console.log('收到现有收集前照片路径:', photo_path_before);
        
        // 检查是否为特殊的NULL标记
        if (photo_path_before === 'NULL') {
          console.log('收到NULL标记，将收集前照片字段设为null');
          
          // 删除旧照片文件
          if (record.photo_path_before) {
            try {
              const oldPhotosBefore = JSON.parse(record.photo_path_before);
              if (Array.isArray(oldPhotosBefore)) {
                oldPhotosBefore.forEach(photoPath => {
                  const fullPath = path.join(__dirname, '..', photoPath);
                  if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                    console.log(`已删除旧照片(收集前): ${fullPath}`);
                  }
                });
              }
            } catch (error) {
              console.error('删除旧照片文件失败:', error);
            }
          }
          
          newPhotoPathBefore = null;
        } else {
          let existingPaths = [];
          try {
            existingPaths = JSON.parse(photo_path_before);
            // 检查是否为空数组
            if (Array.isArray(existingPaths) && existingPaths.length === 0) {
              console.log('收集前照片路径为空数组，将字段设为null');
              
              // 删除旧照片文件
              if (record.photo_path_before) {
                try {
                  const oldPhotosBefore = JSON.parse(record.photo_path_before);
                  if (Array.isArray(oldPhotosBefore)) {
                    oldPhotosBefore.forEach(photoPath => {
                      const fullPath = path.join(__dirname, '..', photoPath);
                      if (fs.existsSync(fullPath)) {
                        fs.unlinkSync(fullPath);
                        console.log(`已删除旧照片(收集前): ${fullPath}`);
                      }
                    });
                  }
                } catch (error) {
                  console.error('删除旧照片文件失败:', error);
                }
              }
              
              // 设置为null
              newPhotoPathBefore = null;
            } else {
              // 找出已删除的照片并删除文件
              if (record.photo_path_before) {
                try {
                  const oldPhotosBefore = JSON.parse(record.photo_path_before);
                  if (Array.isArray(oldPhotosBefore)) {
                    oldPhotosBefore.forEach(oldPath => {
                      // 如果旧照片路径不在新列表中，则删除该文件
                      if (!existingPaths.includes(oldPath)) {
                        const fullPath = path.join(__dirname, '..', oldPath);
                        if (fs.existsSync(fullPath)) {
                          fs.unlinkSync(fullPath);
                          console.log(`已删除已移除的照片(收集前): ${fullPath}`);
                        }
                      }
                    });
                  }
                } catch (error) {
                  console.error('处理已删除照片失败:', error);
                }
              }
              
              // 合并新上传的照片和现有照片，将新照片放在后面
              const allPhotosBefore = [...existingPaths, ...newPhotosBefore];
              newPhotoPathBefore = JSON.stringify(allPhotosBefore);
              console.log('合并后的收集前照片路径:', newPhotoPathBefore);
            }
          } catch (e) {
            console.error('解析现有收集前照片路径失败:', e);
            existingPaths = photo_path_before ? [photo_path_before] : [];
            
            // 找出已删除的照片并删除文件
            if (record.photo_path_before) {
              try {
                const oldPhotosBefore = Array.isArray(record.photo_path_before) 
                  ? record.photo_path_before 
                  : JSON.parse(record.photo_path_before);
                
                if (Array.isArray(oldPhotosBefore)) {
                  oldPhotosBefore.forEach(oldPath => {
                    // 如果旧照片路径不在新列表中，则删除该文件
                    if (!existingPaths.includes(oldPath)) {
                      const fullPath = path.join(__dirname, '..', oldPath);
                      if (fs.existsSync(fullPath)) {
                        fs.unlinkSync(fullPath);
                        console.log(`已删除已移除的照片(收集前): ${fullPath}`);
                      }
                    }
                  });
                }
              } catch (error) {
                console.error('处理已删除照片失败:', error);
              }
            }
            
            // 合并新上传的照片和现有照片，将新照片放在后面
            const allPhotosBefore = [...existingPaths, ...newPhotosBefore];
            newPhotoPathBefore = JSON.stringify(allPhotosBefore);
            console.log('合并后的收集前照片路径(解析失败):', newPhotoPathBefore);
          }
        }
      } else {
        // 如果没有现有照片路径，只使用新上传的照片
        newPhotoPathBefore = JSON.stringify(newPhotosBefore);
        console.log('仅使用新上传的收集前照片路径:', newPhotoPathBefore);
        
        // 删除旧照片文件
        if (record.photo_path_before) {
          try {
            const oldPhotosBefore = JSON.parse(record.photo_path_before);
            if (Array.isArray(oldPhotosBefore)) {
              oldPhotosBefore.forEach(photoPath => {
                const fullPath = path.join(__dirname, '..', photoPath);
                if (fs.existsSync(fullPath)) {
                  fs.unlinkSync(fullPath);
                  console.log(`已删除旧照片(收集前): ${fullPath}`);
                }
              });
            }
          } catch (error) {
            console.error('删除旧照片文件失败:', error);
          }
        }
      }
    } else if (photo_path_before) {
      // 如果没有新上传的照片，但有现有照片路径
      console.log('没有新的收集前照片，使用现有路径:', photo_path_before);
      
      // 检查是否为特殊的NULL标记
      if (photo_path_before === 'NULL') {
        console.log('收到NULL标记，将收集前照片字段设为null');
        
        // 删除旧照片文件
        if (record.photo_path_before) {
          try {
            const oldPhotosBefore = JSON.parse(record.photo_path_before);
            if (Array.isArray(oldPhotosBefore)) {
              oldPhotosBefore.forEach(photoPath => {
                const fullPath = path.join(__dirname, '..', photoPath);
                if (fs.existsSync(fullPath)) {
                  fs.unlinkSync(fullPath);
                  console.log(`已删除旧照片(收集前): ${fullPath}`);
                }
              });
            }
          } catch (error) {
            console.error('删除旧照片文件失败:', error);
          }
        }
        
        newPhotoPathBefore = null;
      } else {
        // 检查是否为空数组
        try {
          const existingPaths = JSON.parse(photo_path_before);
          if (Array.isArray(existingPaths) && existingPaths.length === 0) {
            console.log('收集前照片路径为空数组，将字段设为null');
            
            // 删除旧照片文件
            if (record.photo_path_before) {
              try {
                const oldPhotosBefore = JSON.parse(record.photo_path_before);
                if (Array.isArray(oldPhotosBefore)) {
                  oldPhotosBefore.forEach(photoPath => {
                    const fullPath = path.join(__dirname, '..', photoPath);
                    if (fs.existsSync(fullPath)) {
                      fs.unlinkSync(fullPath);
                      console.log(`已删除旧照片(收集前): ${fullPath}`);
                    }
                  });
                }
              } catch (error) {
                console.error('删除旧照片文件失败:', error);
              }
            }
            
            // 设置为null
            newPhotoPathBefore = null;
          } else {
            // 找出已删除的照片并删除文件
            if (record.photo_path_before) {
              try {
                const oldPhotosBefore = JSON.parse(record.photo_path_before);
                if (Array.isArray(oldPhotosBefore) && Array.isArray(existingPaths)) {
                  oldPhotosBefore.forEach(oldPath => {
                    // 如果旧照片路径不在新列表中，则删除该文件
                    if (!existingPaths.includes(oldPath)) {
                      const fullPath = path.join(__dirname, '..', oldPath);
                      if (fs.existsSync(fullPath)) {
                        fs.unlinkSync(fullPath);
                        console.log(`已删除已移除的照片(收集前): ${fullPath}`);
                      }
                    }
                  });
                }
              } catch (error) {
                console.error('处理已删除照片失败:', error);
              }
            }
            
            newPhotoPathBefore = photo_path_before;
          }
        } catch (e) {
          // 如果不是有效的JSON，直接使用
          newPhotoPathBefore = photo_path_before;
        }
      }
    }
    
    // 处理收集后照片
    if (req.files.photo_after && req.files.photo_after.length > 0) {
      console.log('收到新的收集后照片:', req.files.photo_after.length, '张');
      
      // 新上传的照片路径
      const newPhotosAfter = req.files.photo_after.map(file => `/uploads/${file.filename}`);
      
      // 如果前端提供了现有照片路径，则合并
      if (photo_path_after) {
        console.log('收到现有收集后照片路径:', photo_path_after);
        
        // 检查是否为特殊的NULL标记
        if (photo_path_after === 'NULL') {
          console.log('收到NULL标记，将收集后照片字段设为null');
          
          // 删除旧照片文件
          if (record.photo_path_after) {
            try {
              const oldPhotosAfter = JSON.parse(record.photo_path_after);
              if (Array.isArray(oldPhotosAfter)) {
                oldPhotosAfter.forEach(photoPath => {
                  const fullPath = path.join(__dirname, '..', photoPath);
                  if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                    console.log(`已删除旧照片(收集后): ${fullPath}`);
                  }
                });
              }
            } catch (error) {
              console.error('删除旧照片文件失败:', error);
            }
          }
          
          newPhotoPathAfter = null;
        } else {
          let existingPaths = [];
          try {
            existingPaths = JSON.parse(photo_path_after);
            // 检查是否为空数组
            if (Array.isArray(existingPaths) && existingPaths.length === 0) {
              console.log('收集后照片路径为空数组，将字段设为null');
              
              // 删除旧照片文件
              if (record.photo_path_after) {
                try {
                  const oldPhotosAfter = JSON.parse(record.photo_path_after);
                  if (Array.isArray(oldPhotosAfter)) {
                    oldPhotosAfter.forEach(photoPath => {
                      const fullPath = path.join(__dirname, '..', photoPath);
                      if (fs.existsSync(fullPath)) {
                        fs.unlinkSync(fullPath);
                        console.log(`已删除旧照片(收集后): ${fullPath}`);
                      }
                    });
                  }
                } catch (error) {
                  console.error('删除旧照片文件失败:', error);
                }
              }
              
              // 设置为null
              newPhotoPathAfter = null;
            } else {
              // 找出已删除的照片并删除文件
              if (record.photo_path_after) {
                try {
                  const oldPhotosAfter = JSON.parse(record.photo_path_after);
                  if (Array.isArray(oldPhotosAfter)) {
                    oldPhotosAfter.forEach(oldPath => {
                      // 如果旧照片路径不在新列表中，则删除该文件
                      if (!existingPaths.includes(oldPath)) {
                        const fullPath = path.join(__dirname, '..', oldPath);
                        if (fs.existsSync(fullPath)) {
                          fs.unlinkSync(fullPath);
                          console.log(`已删除已移除的照片(收集后): ${fullPath}`);
                        }
                      }
                    });
                  }
                } catch (error) {
                  console.error('处理已删除照片失败:', error);
                }
              }
              
              // 合并新上传的照片和现有照片，将新照片放在后面
              const allPhotosAfter = [...existingPaths, ...newPhotosAfter];
              newPhotoPathAfter = JSON.stringify(allPhotosAfter);
              console.log('合并后的收集后照片路径:', newPhotoPathAfter);
            }
          } catch (e) {
            console.error('解析现有收集后照片路径失败:', e);
            existingPaths = photo_path_after ? [photo_path_after] : [];
            
            // 找出已删除的照片并删除文件
            if (record.photo_path_after) {
              try {
                const oldPhotosAfter = Array.isArray(record.photo_path_after) 
                  ? record.photo_path_after 
                  : JSON.parse(record.photo_path_after);
                
                if (Array.isArray(oldPhotosAfter)) {
                  oldPhotosAfter.forEach(oldPath => {
                    // 如果旧照片路径不在新列表中，则删除该文件
                    if (!existingPaths.includes(oldPath)) {
                      const fullPath = path.join(__dirname, '..', oldPath);
                      if (fs.existsSync(fullPath)) {
                        fs.unlinkSync(fullPath);
                        console.log(`已删除已移除的照片(收集后): ${fullPath}`);
                      }
                    }
                  });
                }
              } catch (error) {
                console.error('处理已删除照片失败:', error);
              }
            }
            
            // 合并新上传的照片和现有照片，将新照片放在后面
            const allPhotosAfter = [...existingPaths, ...newPhotosAfter];
            newPhotoPathAfter = JSON.stringify(allPhotosAfter);
            console.log('合并后的收集后照片路径(解析失败):', newPhotoPathAfter);
          }
        }
      } else {
        // 如果没有现有照片路径，只使用新上传的照片
        newPhotoPathAfter = JSON.stringify(newPhotosAfter);
        console.log('仅使用新上传的收集后照片路径:', newPhotoPathAfter);
        
        // 删除旧照片文件
        if (record.photo_path_after) {
          try {
            const oldPhotosAfter = JSON.parse(record.photo_path_after);
            if (Array.isArray(oldPhotosAfter)) {
              oldPhotosAfter.forEach(photoPath => {
                const fullPath = path.join(__dirname, '..', photoPath);
                if (fs.existsSync(fullPath)) {
                  fs.unlinkSync(fullPath);
                  console.log(`已删除旧照片(收集后): ${fullPath}`);
                }
              });
            }
          } catch (error) {
            console.error('删除旧照片文件失败:', error);
          }
        }
      }
    } else if (photo_path_after) {
      // 如果没有新上传的照片，但有现有照片路径
      console.log('没有新的收集后照片，使用现有路径:', photo_path_after);
      
      // 检查是否为特殊的NULL标记
      if (photo_path_after === 'NULL') {
        console.log('收到NULL标记，将收集后照片字段设为null');
        
        // 删除旧照片文件
        if (record.photo_path_after) {
          try {
            const oldPhotosAfter = JSON.parse(record.photo_path_after);
            if (Array.isArray(oldPhotosAfter)) {
              oldPhotosAfter.forEach(photoPath => {
                const fullPath = path.join(__dirname, '..', photoPath);
                if (fs.existsSync(fullPath)) {
                  fs.unlinkSync(fullPath);
                  console.log(`已删除旧照片(收集后): ${fullPath}`);
                }
              });
            }
          } catch (error) {
            console.error('删除旧照片文件失败:', error);
          }
        }
        
        newPhotoPathAfter = null;
      } else {
        // 检查是否为空数组
        try {
          const existingPaths = JSON.parse(photo_path_after);
          if (Array.isArray(existingPaths) && existingPaths.length === 0) {
            console.log('收集后照片路径为空数组，将字段设为null');
            
            // 删除旧照片文件
            if (record.photo_path_after) {
              try {
                const oldPhotosAfter = JSON.parse(record.photo_path_after);
                if (Array.isArray(oldPhotosAfter)) {
                  oldPhotosAfter.forEach(photoPath => {
                    const fullPath = path.join(__dirname, '..', photoPath);
                    if (fs.existsSync(fullPath)) {
                      fs.unlinkSync(fullPath);
                      console.log(`已删除旧照片(收集后): ${fullPath}`);
                    }
                  });
                }
              } catch (error) {
                console.error('删除旧照片文件失败:', error);
              }
            }
            
            // 设置为null
            newPhotoPathAfter = null;
          } else {
            // 找出已删除的照片并删除文件
            if (record.photo_path_after) {
              try {
                const oldPhotosAfter = JSON.parse(record.photo_path_after);
                if (Array.isArray(oldPhotosAfter) && Array.isArray(existingPaths)) {
                  oldPhotosAfter.forEach(oldPath => {
                    // 如果旧照片路径不在新列表中，则删除该文件
                    if (!existingPaths.includes(oldPath)) {
                      const fullPath = path.join(__dirname, '..', oldPath);
                      if (fs.existsSync(fullPath)) {
                        fs.unlinkSync(fullPath);
                        console.log(`已删除已移除的照片(收集后): ${fullPath}`);
                      }
                    }
                  });
                }
              } catch (error) {
                console.error('处理已删除照片失败:', error);
              }
            }
            
            newPhotoPathAfter = photo_path_after;
          }
        } catch (e) {
          // 如果不是有效的JSON，直接使用
          newPhotoPathAfter = photo_path_after;
        }
      }
    }
    
    // 格式化收集时间
    const collectionStartTime = `${collectionDate} ${collectionTime}`;
    
    // 获取当前用户ID
    const userId = req.user ? req.user.id : null;

    // 检查用户是否为监督人员，如果是且当前记录不是监督数据，则将其标记为监督数据
    let isSupervisedValue = record.is_supervised;
    if (userId && isSupervisedValue !== 1) {
      const [userRows] = await pool.query('SELECT role_id FROM users WHERE id = ?', [userId]);
      if (userRows.length > 0 && userRows[0].role_id === 4) { // 监督人员
        isSupervisedValue = 1;
      }
    }
    
    // 更新记录
    await pool.query(
      `UPDATE waste_records 
       SET unit_id = ?, waste_type_id = ?, location = ?, collection_start_time = ?, 
       photo_path_before = ?, photo_path_after = ?, quantity = ?, remarks = ?, process = ?, is_supervised = ?
       WHERE id = ?`,
      [unitId, wasteTypeId, location, collectionStartTime, newPhotoPathBefore, newPhotoPathAfter, quantityValue, remarks, process, isSupervisedValue, id]
    );
    
    res.json({
      message: '废物记录更新成功',
      id: parseInt(id)
    });
  } catch (error) {
    console.error('更新废物记录错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取特定废物记录详情
app.get('/api/waste-records/detail/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const [rows] = await pool.query(
      `SELECT wr.*, u.name as unit_name, wt.name as waste_type_name,
       IFNULL(creator.username, creator.phone) as creator_name
       FROM waste_records wr
       JOIN units u ON wr.unit_id = u.id
       JOIN waste_types wt ON wr.waste_type_id = wt.id
       LEFT JOIN users creator ON wr.creator_id = creator.id
       WHERE wr.id = ?`,
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: '记录不存在' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('获取废物记录详情错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取用户创建的废物记录（支持分页）
app.get('/api/waste-records/user/:userId', async (req, res) => {
  const { userId } = req.params;
  const { page = 1, pageSize = 20, wasteTypeId, minQuantity, maxQuantity, location, dateRange, process, showSupervised, unitId } = req.query;
  
  try {
    // 获取用户信息以确定其权限
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    
    if (users.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    const user = users[0];
    let baseSql = `
      FROM waste_records wr
      JOIN units u ON wr.unit_id = u.id
      JOIN waste_types wt ON wr.waste_type_id = wt.id
      LEFT JOIN users creator ON wr.creator_id = creator.id
      WHERE 1=1
    `;
    
    const params = [];
    
    // 根据用户角色添加权限过滤
    if (user.role_id !== 3 && user.role_id !== 4) { // 不是超级管理员或监督人员
      baseSql += ' AND wr.unit_id = ?';
      params.push(user.unit_id);
      
      // 单位管理员不能查看监督数据
      if (user.role_id === 2) {
        baseSql += ' AND (wr.is_supervised IS NULL OR wr.is_supervised != 1)';
      }
    } else if (user.role_id === 3 && showSupervised === 'false') {
      // 超级管理员特殊处理：如果showSupervised为false，则不显示监督人员录入的数据
      baseSql += ' AND (wr.is_supervised IS NULL OR wr.is_supervised != 1)';
    }
    
    // 监督人员只能查看自己提交的记录
    if (user.role_id === 4) {
      baseSql += ' AND wr.creator_id = ?';
      params.push(user.id);
    }
    
    // 为普通员工（role_id=1）添加48小时时间限制并限制只能查看自己提交的记录
    if (user.role_id === 1) {
      const hours48Ago = new Date();
      hours48Ago.setHours(hours48Ago.getHours() - 48);
      const formattedDate = hours48Ago.toISOString().slice(0, 19).replace('T', ' '); // 格式如 YYYY-MM-DD HH:MM:SS
      
      baseSql += ' AND wr.created_at >= ?';
      params.push(formattedDate);
      
      // 只能查看自己提交的记录
      baseSql += ' AND wr.creator_id = ?';
      params.push(user.id);
    }
    
    // 添加筛选条件
    // 添加单位筛选条件 - 对超级管理员和监督人员有效
    if (unitId && (user.role_id === 3 || user.role_id === 4)) {
      baseSql += ' AND wr.unit_id = ?';
      params.push(unitId);
    }
    
    if (wasteTypeId) {
      baseSql += ' AND wr.waste_type_id = ?';
      params.push(wasteTypeId);
    }
    
    if (minQuantity !== undefined && minQuantity !== '') {
      baseSql += ' AND wr.quantity >= ?';
      params.push(parseFloat(minQuantity));
    }
    
    if (maxQuantity !== undefined && maxQuantity !== '') {
      baseSql += ' AND wr.quantity <= ?';
      params.push(parseFloat(maxQuantity));
    }
    
    if (location) {
      baseSql += ' AND wr.location LIKE ?';
      params.push(`%${location}%`);
    }
    
    if (dateRange) {
      try {
        const [startDate, endDate] = JSON.parse(dateRange);
        if (startDate && endDate) {
          baseSql += ' AND DATE(wr.collection_start_time) BETWEEN ? AND ?';
          params.push(startDate, endDate);
        }
      } catch (error) {
        console.error('解析日期范围失败:', error);
      }
    }
    
    if (process) {
      baseSql += ' AND wr.process LIKE ?';
      params.push(`%${process}%`);
    }
    
    // 添加排序
    baseSql += ' ORDER BY wr.created_at DESC';
    
    // 获取总记录数
    const countSql = `SELECT COUNT(*) as total ${baseSql}`;
    const [countResult] = await pool.query(countSql, params);
    const total = countResult[0].total;
    
    // 添加分页
    const dataSql = `
      SELECT wr.*, u.name as unit_name, wt.name as waste_type_name,
      IFNULL(creator.username, creator.phone) as creator_name
      ${baseSql} LIMIT ? OFFSET ?
    `;
    
    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;
    params.push(limit, offset);
    
    // 获取分页数据
    const [records] = await pool.query(dataSql, params);
    
    // 计算是否还有更多数据
    const hasMore = offset + records.length < total;
    
    res.json({
      records,
      hasMore,
      total
    });
  } catch (error) {
    console.error('获取用户废物记录错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 导出用户的废物记录（获取所有符合条件的记录）
app.get('/api/waste-records/export/user/:userId', async (req, res) => {
  const { userId } = req.params;
  const { wasteTypeId, minQuantity, maxQuantity, location, dateRange, unitId, process, showSupervised } = req.query;
  
  try {
    console.log('导出记录API被调用，参数:', req.query);
    
    // 获取用户信息以确定其权限
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    
    if (users.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    const user = users[0];
    let sql = `
      SELECT wr.*, u.name as unit_name, wt.name as waste_type_name,
      IFNULL(creator.username, creator.phone) as creator_name
      FROM waste_records wr
      JOIN units u ON wr.unit_id = u.id
      JOIN waste_types wt ON wr.waste_type_id = wt.id
      LEFT JOIN users creator ON wr.creator_id = creator.id
      WHERE 1=1
    `;
    
    const params = [];
    
    // 根据用户角色添加权限过滤
    if (user.role_id !== 3 && user.role_id !== 4) { // 不是超级管理员或监督人员
      sql += ' AND wr.unit_id = ?';
      params.push(user.unit_id);
      
      // 单位管理员不能查看监督数据
      if (user.role_id === 2) {
        sql += ' AND (wr.is_supervised IS NULL OR wr.is_supervised != 1)';
      }
    } else if (user.role_id === 3 && showSupervised === 'false') {
      // 超级管理员特殊处理：如果showSupervised为false，则不显示监督人员录入的数据
      sql += ' AND (wr.is_supervised IS NULL OR wr.is_supervised != 1)';
    }
    
    // 监督人员只能查看自己提交的记录
    if (user.role_id === 4) {
      sql += ' AND wr.creator_id = ?';
      params.push(user.id);
    }
    
    // 为普通员工（role_id=1）添加48小时时间限制并限制只能查看自己提交的记录
    if (user.role_id === 1) {
      const hours48Ago = new Date();
      hours48Ago.setHours(hours48Ago.getHours() - 48);
      const formattedDate = hours48Ago.toISOString().slice(0, 19).replace('T', ' '); // 格式如 YYYY-MM-DD HH:MM:SS
      
      sql += ' AND wr.created_at >= ?';
      params.push(formattedDate);
      
      // 只能查看自己提交的记录
      sql += ' AND wr.creator_id = ?';
      params.push(user.id);
    }
    
    // 添加筛选条件
    if (unitId && (user.role_id === 3 || user.role_id === 4)) { // 只有超级管理员或监督人员可以按单位筛选
      sql += ' AND wr.unit_id = ?';
      params.push(unitId);
    }
    
    if (wasteTypeId) {
      sql += ' AND wr.waste_type_id = ?';
      params.push(wasteTypeId);
    }
    
    if (minQuantity !== undefined && minQuantity !== '') {
      sql += ' AND wr.quantity >= ?';
      params.push(minQuantity);
    }
    
    if (maxQuantity !== undefined && maxQuantity !== '') {
      sql += ' AND wr.quantity <= ?';
      params.push(maxQuantity);
    }
    
    if (location) {
      sql += ' AND wr.location LIKE ?';
      params.push(`%${location}%`);
    }
    
    if (dateRange) {
      try {
        const [startDate, endDate] = JSON.parse(dateRange);
        if (startDate && endDate) {
          sql += ' AND DATE(wr.collection_start_time) BETWEEN ? AND ?';
          params.push(startDate, endDate);
        }
      } catch (error) {
        console.error('解析日期范围失败:', error);
      }
    }
    
    if (process) {
      sql += ' AND wr.process LIKE ?';
      params.push(`%${process}%`);
    }
    
    // 添加排序
    sql += ' ORDER BY wr.created_at DESC';
    
    console.log('执行SQL:', sql);
    console.log('SQL参数:', params);
    
    const [records] = await pool.query(sql, params);
    console.log(`查询到 ${records.length} 条记录用于导出`);
    
    res.json(records);
  } catch (error) {
    console.error('导出废物记录错误:', error);
    res.status(500).json({ error: '服务器错误', details: error.message });
  }
});

// 获取所有废物记录（用于管理员查看）
app.get('/api/waste-records', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT wr.*, u.name as unit_name, wt.name as waste_type_name,
       IFNULL(creator.username, creator.phone) as creator_name
       FROM waste_records wr
       JOIN units u ON wr.unit_id = u.id
       JOIN waste_types wt ON wr.waste_type_id = wt.id
       LEFT JOIN users creator ON wr.creator_id = creator.id
       ORDER BY wr.created_at DESC`
    );
    
    res.json(rows);
  } catch (error) {
    console.error('获取所有废物记录错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除废物记录
app.delete('/api/waste-records/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    // 验证记录是否存在
    const [rows] = await pool.query('SELECT * FROM waste_records WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: '记录不存在' });
    }
    
    const record = rows[0];
    
    // 删除照片文件
    // 删除收集前照片
    if (record.photo_path_before) {
      try {
        let photoPathsBefore = [];
        // 尝试解析JSON格式的路径
        try {
          photoPathsBefore = JSON.parse(record.photo_path_before);
        } catch (e) {
          // 如果不是JSON格式，则视为单个路径
          photoPathsBefore = [record.photo_path_before];
        }
        
        // 删除每张照片
        photoPathsBefore.forEach(photoPath => {
          const fullPath = path.join(__dirname, '..', photoPath);
          if (fs.existsSync(fullPath)) {
            try {
              fs.unlinkSync(fullPath);
              console.log(`已删除收集前照片: ${fullPath}`);
            } catch (error) {
              console.error(`删除照片失败: ${fullPath}`, error);
            }
          } else {
            console.log(`照片不存在: ${fullPath}`);
          }
        });
      } catch (error) {
        console.error('处理照片删除时出错:', error);
      }
    }
    
    // 删除收集后照片
    if (record.photo_path_after) {
      try {
        let photoPathsAfter = [];
        // 尝试解析JSON格式的路径
        try {
          photoPathsAfter = JSON.parse(record.photo_path_after);
        } catch (e) {
          // 如果不是JSON格式，则视为单个路径
          photoPathsAfter = [record.photo_path_after];
        }
        
        // 删除每张照片
        photoPathsAfter.forEach(photoPath => {
          const fullPath = path.join(__dirname, '..', photoPath);
          if (fs.existsSync(fullPath)) {
            try {
              fs.unlinkSync(fullPath);
              console.log(`已删除收集后照片: ${fullPath}`);
            } catch (error) {
              console.error(`删除照片失败: ${fullPath}`, error);
            }
          } else {
            console.log(`照片不存在: ${fullPath}`);
          }
        });
      } catch (error) {
        console.error('处理照片删除时出错:', error);
      }
    }
    
    // 删除记录
    await pool.query('DELETE FROM waste_records WHERE id = ?', [id]);
    
    res.json({
      message: '废物记录删除成功',
      id: parseInt(id)
    });
  } catch (error) {
    console.error('删除废物记录错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新用户个人资料（用户名和密码）
app.put('/api/users/:id/profile', verifyToken, async (req, res) => {
  const userId = req.params.id;
  const { username, oldPassword, newPassword } = req.body;
  
  try {
    // 验证当前用户只能修改自己的资料
    if (req.user.id != userId) {
      return res.status(403).json({ error: '您只能修改自己的个人资料' });
    }
    
    // 验证用户名
    if (!username || username.trim().length < 2) {
      return res.status(400).json({ error: '用户名不能为空且长度必须大于等于2个字符' });
    }
    
    // 获取用户当前信息
    const [userRows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 如果要修改密码
    if (newPassword) {
      // 验证旧密码
      if (!oldPassword) {
        return res.status(400).json({ error: '修改密码时必须提供原密码' });
      }
      
      // 验证旧密码是否正确
      const isPasswordValid = await comparePassword(oldPassword, userRows[0].password);
      if (!isPasswordValid) {
        return res.status(400).json({ error: '原密码不正确' });
      }
      
      // 加密新密码
      const hashedPassword = await hashPassword(newPassword);
      
      // 更新用户名和密码
      await pool.query(
        'UPDATE users SET username = ?, password = ? WHERE id = ?',
        [username, hashedPassword, userId]
      );
    } else {
      // 仅更新用户名
      await pool.query(
        'UPDATE users SET username = ? WHERE id = ?',
        [username, userId]
      );
    }
    
    res.json({ message: '个人资料已更新' });
    
  } catch (error) {
    console.error('更新用户个人资料错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更改用户状态（启用/禁用）
app.patch('/api/users/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (status !== 0 && status !== 1) {
    return res.status(400).json({ error: '无效的状态值' });
  }
  
  try {
    // 验证用户是否存在
    const [existingUsers] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (existingUsers.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 更新用户状态
    await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
    
    res.json({
      id: parseInt(id),
      status,
      message: status === 1 ? '账号已恢复' : '账号已停用'
    });
  } catch (error) {
    console.error('修改用户状态错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 处理所有前端路由请求，返回index.html
app.get('*', (req, res) => {
  // 排除API请求
  if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  } else {
    res.status(404).send('Not found');
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// 处理应用关闭
process.on('SIGINT', async () => {
  try {
    await pool.end();
    console.log('数据库连接池已关闭');
  } catch (error) {
    console.error('关闭数据库连接池错误:', error);
  }
  process.exit(0);
});

// 处理multer错误
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer错误
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: '文件大小超过限制，最大允许10MB' });
    }
    return res.status(400).json({ error: `文件上传错误: ${err.message}` });
  } else if (err) {
    // 其他错误
    return res.status(500).json({ error: err.message });
  }
  next();
});

