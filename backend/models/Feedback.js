const mysql = require('mysql2/promise');
const path = require('path');

// 加载环境变量
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

class Feedback {
  // 创建问题反馈
  static async create(feedbackData) {
    const { user_id, company_id, title, description, type, priority, images } = feedbackData;
    
    const query = `
      INSERT INTO feedback (user_id, company_id, title, description, type, priority, images)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await pool.execute(query, [
      user_id, company_id, title, description, type, priority, images
    ]);
    
    return result.insertId;
  }

  // 获取用户的问题反馈列表
  static async getByUserId(userId) {
    const query = `
      SELECT f.*, u.username, u.phone
      FROM feedback f
      LEFT JOIN users u ON f.user_id = u.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `;
    
    const [rows] = await pool.execute(query, [userId]);
    return rows;
  }

  // 获取所有问题反馈（管理员用）
  static async getAll(filters = {}) {
    let query = `
      SELECT f.*, 
             u.username, u.phone, u.company_id as user_company_id,
             c.name as company_name,
             admin.username as admin_username
      FROM feedback f
      LEFT JOIN users u ON f.user_id = u.id
      LEFT JOIN companies c ON f.company_id = c.id
      LEFT JOIN users admin ON f.admin_id = admin.id
    `;
    
    const conditions = [];
    const params = [];

    if (filters.company_id) {
      conditions.push('f.company_id = ?');
      params.push(filters.company_id);
    }

    if (filters.status) {
      conditions.push('f.status = ?');
      params.push(filters.status);
    }

    if (filters.type) {
      conditions.push('f.type = ?');
      params.push(filters.type);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY f.created_at DESC';

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  // 根据ID获取问题反馈
  static async getById(id) {
    const query = `
      SELECT f.*, 
             u.username, u.phone,
             c.name as company_name,
             admin.username as admin_username
      FROM feedback f
      LEFT JOIN users u ON f.user_id = u.id
      LEFT JOIN companies c ON f.company_id = c.id
      LEFT JOIN users admin ON f.admin_id = admin.id
      WHERE f.id = ?
    `;
    
    const [rows] = await pool.execute(query, [id]);
    return rows[0];
  }

  // 更新问题反馈状态
  static async updateStatus(id, status, adminId = null, adminReply = null) {
    const query = `
      UPDATE feedback 
      SET status = ?, admin_id = ?, admin_reply = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const [result] = await pool.execute(query, [status, adminId, adminReply, id]);
    return result.affectedRows > 0;
  }

  // 删除问题反馈
  static async delete(id) {
    const query = 'DELETE FROM feedback WHERE id = ?';
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  // 获取统计数据
  static async getStats(companyId = null) {
    let query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed,
        SUM(CASE WHEN type = 'bug' THEN 1 ELSE 0 END) as bugs,
        SUM(CASE WHEN type = 'feature' THEN 1 ELSE 0 END) as features,
        SUM(CASE WHEN type = 'improvement' THEN 1 ELSE 0 END) as improvements,
        SUM(CASE WHEN type = 'other' THEN 1 ELSE 0 END) as others
      FROM feedback
    `;
    
    const params = [];
    if (companyId) {
      query += ' WHERE company_id = ?';
      params.push(companyId);
    }
    
    const [rows] = await pool.execute(query, params);
    return rows[0];
  }
}

module.exports = Feedback; 