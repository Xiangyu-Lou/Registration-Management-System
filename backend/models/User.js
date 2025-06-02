const { pool } = require('../config/database');

class User {
  // 根据手机号查找用户
  static async findByPhone(phone) {
    const [rows] = await pool.query('SELECT * FROM users WHERE phone = ?', [phone]);
    return rows[0] || null;
  }

  // 根据手机号查找用户（用于登录认证，包含角色和单位信息）
  static async findByPhoneForAuth(phone) {
    const [rows] = await pool.query(
      `SELECT u.*, r.name as role_name, un.name as unit_name
       FROM users u 
       JOIN user_roles r ON u.role_id = r.id 
       LEFT JOIN units un ON u.unit_id = un.id 
       WHERE u.phone = ?`, 
      [phone]
    );
    return rows[0] || null;
  }

  // 根据ID查找用户（包含密码，用于认证）
  static async findByIdWithPassword(id) {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  }

  // 根据ID查找用户
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT u.id, u.username, u.phone, u.role_id, u.unit_id, r.name as role_name, un.name as unit_name, u.status, u.can_view_logs
       FROM users u 
       JOIN user_roles r ON u.role_id = r.id 
       LEFT JOIN units un ON u.unit_id = un.id 
       WHERE u.id = ?`, 
      [id]
    );
    return rows[0] || null;
  }

  // 获取所有用户
  static async findAll() {
    const [rows] = await pool.query(
      `SELECT u.id, u.username, u.phone, u.role_id, r.name as role_name, u.unit_id, un.name as unit_name, u.status, u.can_view_logs
       FROM users u 
       JOIN user_roles r ON u.role_id = r.id 
       LEFT JOIN units un ON u.unit_id = un.id 
       ORDER BY un.name ASC, u.role_id DESC, u.username ASC`
    );
    return rows;
  }

  // 根据单位ID获取用户
  static async findByUnitId(unitId) {
    const [rows] = await pool.query(
      `SELECT u.id, u.username, u.phone, u.role_id, r.name as role_name, u.unit_id, un.name as unit_name, u.status 
       FROM users u 
       JOIN user_roles r ON u.role_id = r.id 
       LEFT JOIN units un ON u.unit_id = un.id 
       WHERE u.unit_id = ? 
       ORDER BY u.role_id DESC, u.username ASC`, 
      [unitId]
    );
    return rows;
  }

  // 创建用户
  static async create(userData) {
    const { username, phone, password, roleId, unitId } = userData;
    const [result] = await pool.query(
      'INSERT INTO users (username, phone, password, role_id, unit_id) VALUES (?, ?, ?, ?, ?)',
      [username, phone, password, roleId, unitId || null]
    );
    return result.insertId;
  }

  // 更新用户信息
  static async update(id, userData) {
    const { username, phone, password, roleId, unitId } = userData;
    
    if (password) {
      await pool.query(
        'UPDATE users SET username = ?, phone = ?, password = ?, role_id = ?, unit_id = ? WHERE id = ?',
        [username, phone, password, roleId, unitId || null, id]
      );
    } else {
      await pool.query(
        'UPDATE users SET username = ?, phone = ?, role_id = ?, unit_id = ? WHERE id = ?',
        [username, phone, roleId, unitId || null, id]
      );
    }
    return true;
  }

  // 更新用户状态
  static async updateStatus(id, status) {
    await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
    return true;
  }

  // 更新用户个人资料
  static async updateProfile(id, userData) {
    const { username, password } = userData;
    
    if (password) {
      await pool.query(
        'UPDATE users SET username = ?, password = ? WHERE id = ?',
        [username, password, id]
      );
    } else {
      await pool.query(
        'UPDATE users SET username = ? WHERE id = ?',
        [username, id]
      );
    }
    return true;
  }

  // 更新用户日志查看权限
  static async updateLogPermission(id, canViewLogs) {
    await pool.query('UPDATE users SET can_view_logs = ? WHERE id = ?', [canViewLogs, id]);
    return true;
  }

  // 删除用户
  static async delete(id) {
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    return true;
  }

  // 检查用户是否存在手机号
  static async phoneExists(phone, excludeId = null) {
    let query = 'SELECT id FROM users WHERE phone = ?';
    let params = [phone];
    
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    
    const [rows] = await pool.query(query, params);
    return rows.length > 0;
  }

  // 检查用户是否有废物记录
  static async hasWasteRecords(id) {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM waste_records WHERE creator_id = ?', [id]);
    return rows[0].count > 0;
  }
}

module.exports = User; 