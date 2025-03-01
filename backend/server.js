const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

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

// 数据库连接
const dbPath = path.join(__dirname, '../db/waste_management.db');
let db = null;

// 验证数据库文件是否存在
if (!fs.existsSync(dbPath)) {
  console.error(`错误: 数据库文件不存在: ${dbPath}`);
  console.log('请先运行 npm run init-db 完成数据库初始化');
  process.exit(1);
}

// 使用原生模块打开数据库文件
const sqlite3 = require('sqlite3').verbose();
db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
    process.exit(1);
  }
  console.log('成功连接到 SQLite 数据库');
  
  // 验证数据库表和数据
  db.get("SELECT count(*) as count FROM units", (err, row) => {
    if (err) {
      console.error('验证数据库失败:', err.message);
    } else {
      console.log(`数据库内有 ${row?.count || 0} 个单位记录`);
      if ((row?.count || 0) === 0) {
        console.log('警告: 数据库中没有单位数据, 请重新运行初始化');
      }
    }
  });
});

// API路由

// 测试路由
app.get('/api/test', (req, res) => {
  res.json({ message: '服务器运行正常' });
});

// 用户登录
app.post('/api/login', (req, res) => {
  const { phone, password } = req.body;
  
  if (!phone) {
    return res.status(400).json({ error: '手机号是必填项' });
  }

  // 查询用户
  db.get(`SELECT u.*, r.name as role_name, un.name as unit_name 
          FROM users u 
          JOIN user_roles r ON u.role_id = r.id 
          LEFT JOIN units un ON u.unit_id = un.id 
          WHERE u.phone = ?`, 
          [phone], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // 用户不存在
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }

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
  });
});

// 根据用户ID获取用户信息
app.get('/api/users/:id', (req, res) => {
  const { id } = req.params;
  
  db.get(`SELECT u.id, u.username, u.phone, u.role_id, u.unit_id, r.name as role_name, un.name as unit_name 
          FROM users u 
          JOIN user_roles r ON u.role_id = r.id 
          LEFT JOIN units un ON u.unit_id = un.id 
          WHERE u.id = ?`, 
          [id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
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
  });
});

// 获取所有单位
app.get('/api/units', (req, res) => {
  db.all('SELECT * FROM units ORDER BY name', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// 获取所有废物类型
app.get('/api/waste-types', (req, res) => {
  db.all('SELECT * FROM waste_types ORDER BY name', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// 添加废物记录
app.post('/api/waste-records', upload.single('photo'), (req, res) => {
  const { unitId, wasteTypeId, location, collectionStartTime, quantity, creatorId } = req.body;
  
  if (!unitId || !wasteTypeId || !location || !collectionStartTime || !quantity) {
    return res.status(400).json({ error: '所有字段都是必填的' });
  }
  
  const photoPath = req.file ? `/uploads/${req.file.filename}` : null;
  const createdAt = new Date().toISOString();
  
  const sql = `INSERT INTO waste_records 
              (unit_id, waste_type_id, location, collection_start_time, photo_path, quantity, created_at, creator_id) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(sql, [unitId, wasteTypeId, location, collectionStartTime, photoPath, quantity, createdAt, creatorId || null], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.status(201).json({
      id: this.lastID,
      message: '废物记录添加成功'
    });
  });
});

// 获取特定单位的废物记录
app.get('/api/waste-records/:unitId', (req, res) => {
  const { unitId } = req.params;
  
  const sql = `SELECT wr.*, u.name as unit_name, wt.name as waste_type_name 
               FROM waste_records wr
               JOIN units u ON wr.unit_id = u.id
               JOIN waste_types wt ON wr.waste_type_id = wt.id
               WHERE wr.unit_id = ?
               ORDER BY wr.created_at DESC`;
  
  db.all(sql, [unitId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// 修改废物记录
app.put('/api/waste-records/:id', upload.single('photo'), (req, res) => {
  const { id } = req.params;
  const { unitId, wasteTypeId, location, collectionStartTime, quantity, userId } = req.body;
  
  if (!unitId || !wasteTypeId || !location || !collectionStartTime || !quantity) {
    return res.status(400).json({ error: '所有字段都是必填的' });
  }
  
  // 验证记录存在性
  db.get('SELECT * FROM waste_records WHERE id = ?', [id], (err, record) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!record) {
      return res.status(404).json({ error: '记录不存在' });
    }
    
    // 准备更新数据
    let photoPath = record.photo_path;
    if (req.file) {
      photoPath = `/uploads/${req.file.filename}`;
    }
    
    const sql = `UPDATE waste_records SET 
                unit_id = ?, 
                waste_type_id = ?, 
                location = ?, 
                collection_start_time = ?, 
                photo_path = ?, 
                quantity = ? 
                WHERE id = ?`;
    
    db.run(sql, 
      [unitId, wasteTypeId, location, collectionStartTime, photoPath, quantity, id], 
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        res.json({
          id: parseInt(id),
          message: '废物记录更新成功'
        });
      }
    );
  });
});

// 获取特定废物记录详情
app.get('/api/waste-records/detail/:id', (req, res) => {
  const { id } = req.params;
  
  const sql = `SELECT wr.*, u.name as unit_name, wt.name as waste_type_name 
               FROM waste_records wr
               JOIN units u ON wr.unit_id = u.id
               JOIN waste_types wt ON wr.waste_type_id = wt.id
               WHERE wr.id = ?`;
  
  db.get(sql, [id], (err, record) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!record) {
      return res.status(404).json({ error: '记录不存在' });
    }
    
    res.json(record);
  });
});

// 获取用户创建的废物记录
app.get('/api/waste-records/user/:userId', (req, res) => {
  const { userId } = req.params;
  
  // 获取用户信息以确定其权限
  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
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
    
    db.all(sql, params, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    });
  });
});

// 获取所有废物记录（用于管理员查看）
app.get('/api/waste-records', (req, res) => {
  const sql = `SELECT wr.*, u.name as unit_name, wt.name as waste_type_name 
               FROM waste_records wr
               JOIN units u ON wr.unit_id = u.id
               JOIN waste_types wt ON wr.waste_type_id = wt.id
               ORDER BY wr.created_at DESC`;
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// 处理应用关闭时关闭数据库连接
process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});
