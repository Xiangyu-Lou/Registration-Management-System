const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const mysql = require('mysql2/promise');

// 创建Express应用
const app = express();
const PORT = 3000;

// 中间件配置
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });

// 数据库连接配置
const dbConfig = {
  host: 'localhost',
  user: 'Xiangyu',
  password: '990924',
  database: 'waste_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true // 允许执行多条SQL语句
};

// 创建数据库连接池
const pool = mysql.createPool(dbConfig);

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
  const { phone, password } = req.body;
  
  if (!phone) {
    return res.status(400).json({ error: '手机号是必填项' });
  }

  try {
    // 查询用户
    const [rows] = await pool.query(
      `SELECT u.*, r.name as role_name, un.name as unit_name 
       FROM users u 
       JOIN user_roles r ON u.role_id = r.id 
       LEFT JOIN units un ON u.unit_id = un.id 
       WHERE u.phone = ?`, 
      [phone]
    );

    // 用户不存在
    if (rows.length === 0) {
      return res.status(401).json({ error: '用户不存在' });
    }

    const user = rows[0];

    // 员工登录（仅需手机号）
    if (user.role_id === 1) {
      return res.json({
        id: user.id,
        username: user.username,
        phone: user.phone,
        role: user.role_name,
        role_id: user.role_id,
        unit_id: user.unit_id,
        unit_name: user.unit_name
      });
    }

    // 管理员登录（需要密码）
    if (!password) {
      return res.status(400).json({ error: '密码是必填项' });
    }

    if (user.password !== password) {
      return res.status(401).json({ error: '密码错误' });
    }

    res.json({
      id: user.id,
      username: user.username,
      phone: user.phone,
      role: user.role_name,
      role_id: user.role_id,
      unit_id: user.unit_id,
      unit_name: user.unit_name
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 根据用户ID获取用户信息
app.get('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.username, u.phone, u.role_id, u.unit_id, r.name as role_name, un.name as unit_name 
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
      unit_name: user.unit_name
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
    const [rows] = await pool.query('SELECT * FROM waste_types ORDER BY name');
    res.json(rows);
  } catch (error) {
    console.error('获取废物类型错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 添加废物记录
app.post('/api/waste-records', upload.single('photo'), async (req, res) => {
  const { unitId, wasteTypeId, location, collectionStartTime, quantity, creatorId } = req.body;
  
  if (!unitId || !wasteTypeId || !location || !collectionStartTime || !quantity) {
    return res.status(400).json({ error: '所有字段都是必填的' });
  }
  
  try {
    const photoPath = req.file ? `/uploads/${req.file.filename}` : null;
    // 格式化日期为MySQL兼容的格式
    const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    const [result] = await pool.query(
      `INSERT INTO waste_records 
       (unit_id, waste_type_id, location, collection_start_time, photo_path, quantity, created_at, creator_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [unitId, wasteTypeId, location, collectionStartTime, photoPath, quantity, createdAt, creatorId || null]
    );
    
    res.status(201).json({
      id: result.insertId,
      message: '废物记录添加成功'
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
    const [rows] = await pool.query(
      `SELECT wr.*, u.name as unit_name, wt.name as waste_type_name 
       FROM waste_records wr
       JOIN units u ON wr.unit_id = u.id
       JOIN waste_types wt ON wr.waste_type_id = wt.id
       WHERE wr.unit_id = ?
       ORDER BY wr.created_at DESC`,
      [unitId]
    );
    
    res.json(rows);
  } catch (error) {
    console.error('获取单位废物记录错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 修改废物记录
app.put('/api/waste-records/:id', upload.single('photo'), async (req, res) => {
  const { id } = req.params;
  const { unitId, wasteTypeId, location, collectionStartTime, quantity } = req.body;
  
  if (!unitId || !wasteTypeId || !location || !collectionStartTime || !quantity) {
    return res.status(400).json({ error: '所有字段都是必填的' });
  }
  
  try {
    // 验证记录存在性
    const [rows] = await pool.query('SELECT * FROM waste_records WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: '记录不存在' });
    }
    
    const record = rows[0];
    
    // 准备更新数据
    let photoPath = record.photo_path;
    if (req.file) {
      photoPath = `/uploads/${req.file.filename}`;
    }
    
    await pool.query(
      `UPDATE waste_records SET 
       unit_id = ?, 
       waste_type_id = ?, 
       location = ?, 
       collection_start_time = ?, 
       photo_path = ?, 
       quantity = ? 
       WHERE id = ?`,
      [unitId, wasteTypeId, location, collectionStartTime, photoPath, quantity, id]
    );
    
    res.json({
      id: parseInt(id),
      message: '废物记录更新成功'
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
      `SELECT wr.*, u.name as unit_name, wt.name as waste_type_name 
       FROM waste_records wr
       JOIN units u ON wr.unit_id = u.id
       JOIN waste_types wt ON wr.waste_type_id = wt.id
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

// 获取用户创建的废物记录
app.get('/api/waste-records/user/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    // 获取用户信息以确定其权限
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    
    if (users.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    const user = users[0];
    let sql;
    let params;
    
    // 根据用户角色查询不同范围的记录
    if (user.role_id === 3) {
      // 超级管理员查看全部记录
      sql = `SELECT wr.*, u.name as unit_name, wt.name as waste_type_name 
             FROM waste_records wr
             JOIN units u ON wr.unit_id = u.id
             JOIN waste_types wt ON wr.waste_type_id = wt.id
             ORDER BY wr.created_at DESC`;
      params = [];
    } else if (user.role_id === 2) {
      // 单位管理员查看本单位所有记录
      sql = `SELECT wr.*, u.name as unit_name, wt.name as waste_type_name 
             FROM waste_records wr
             JOIN units u ON wr.unit_id = u.id
             JOIN waste_types wt ON wr.waste_type_id = wt.id
             WHERE wr.unit_id = ?
             ORDER BY wr.created_at DESC`;
      params = [user.unit_id];
    } else {
      // 普通员工只能查看自己创建的记录
      sql = `SELECT wr.*, u.name as unit_name, wt.name as waste_type_name 
             FROM waste_records wr
             JOIN units u ON wr.unit_id = u.id
             JOIN waste_types wt ON wr.waste_type_id = wt.id
             WHERE wr.unit_id = ? AND (wr.creator_id = ? OR wr.creator_id IS NULL)
             ORDER BY wr.created_at DESC`;
      params = [user.unit_id, userId];
    }
    
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error('获取用户废物记录错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取所有废物记录（用于管理员查看）
app.get('/api/waste-records', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT wr.*, u.name as unit_name, wt.name as waste_type_name 
       FROM waste_records wr
       JOIN units u ON wr.unit_id = u.id
       JOIN waste_types wt ON wr.waste_type_id = wt.id
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
    
    // 如果记录有照片，先删除照片文件
    if (record.photo_path) {
      const photoPath = path.join(__dirname, '..', record.photo_path);
      if (fs.existsSync(photoPath)) {
        try {
          fs.unlinkSync(photoPath);
          console.log(`已删除照片: ${photoPath}`);
        } catch (error) {
          console.error(`删除照片失败: ${photoPath}`, error);
          // 继续删除记录，即使照片删除失败
        }
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
