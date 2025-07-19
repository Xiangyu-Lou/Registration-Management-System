const { pool } = require('../config/database');

class User {
  // 根据手机号查找用户
  static async findByPhone(phone) {
    const [rows] = await pool.query('SELECT * FROM users WHERE phone = ?', [phone]);
    return rows[0] || null;
  }

  // 根据手机号查找用户（用于登录认证，包含角色、单位和公司信息）
  static async findByPhoneForAuth(phone) {
    const [rows] = await pool.query(
      `SELECT u.*, r.name as role_name, un.name as unit_name, c.name as company_name
       FROM users u 
       JOIN user_roles r ON u.role_id = r.id 
       LEFT JOIN units un ON u.unit_id = un.id 
       JOIN companies c ON u.company_id = c.id
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
      `SELECT u.id, u.username, u.phone, u.role_id, u.unit_id, u.company_id, r.name as role_name, un.name as unit_name, c.name as company_name, u.status, u.can_view_logs
       FROM users u 
       JOIN user_roles r ON u.role_id = r.id 
       LEFT JOIN units un ON u.unit_id = un.id 
       JOIN companies c ON u.company_id = c.id
       WHERE u.id = ?`, 
      [id]
    );
    return rows[0] || null;
  }

  // 获取所有用户（系统超级管理员可看全部，其他用户只看本公司）
  static async findAll(currentUser = null) {
    let query = `
      SELECT u.id, u.username, u.phone, u.role_id, r.name as role_name, u.unit_id, un.name as unit_name, u.company_id, c.name as company_name, u.status, u.can_view_logs
       FROM users u 
       JOIN user_roles r ON u.role_id = r.id 
       LEFT JOIN units un ON u.unit_id = un.id 
      JOIN companies c ON u.company_id = c.id
    `;
    
    const params = [];
    
    // 如果不是系统超级管理员，只能查看本公司用户
    if (currentUser && currentUser.role_id !== 5) {
      query += ' WHERE u.company_id = ?';
      params.push(currentUser.company_id);
    }
    
    query += ' ORDER BY c.name ASC, un.name ASC, u.role_id DESC, u.username ASC';
    
    const [rows] = await pool.query(query, params);
    return rows;
  }

  // 根据单位ID获取用户
  static async findByUnitId(unitId, currentUser = null) {
    let query = `
      SELECT u.id, u.username, u.phone, u.role_id, r.name as role_name, u.unit_id, un.name as unit_name, u.company_id, c.name as company_name, u.status 
       FROM users u 
       JOIN user_roles r ON u.role_id = r.id 
       LEFT JOIN units un ON u.unit_id = un.id 
      JOIN companies c ON u.company_id = c.id
       WHERE u.unit_id = ? 
    `;
    
    const params = [unitId];
    
    // 如果不是系统超级管理员，只能查看本公司用户
    if (currentUser && currentUser.role_id !== 5) {
      query += ' AND u.company_id = ?';
      params.push(currentUser.company_id);
    }
    
    query += ' ORDER BY u.role_id DESC, u.username ASC';
    
    const [rows] = await pool.query(query, params);
    return rows;
  }

  // 创建用户
  static async create(userData) {
    const { username, phone, password, roleId, unitId, companyId } = userData;
    const [result] = await pool.query(
      'INSERT INTO users (username, phone, password, role_id, unit_id, company_id) VALUES (?, ?, ?, ?, ?, ?)',
      [username, phone, password, roleId, unitId || null, companyId]
    );
    return result.insertId;
  }

  // 更新用户信息
  static async update(id, userData) {
    const { username, phone, password, roleId, unitId, companyId } = userData;
    
    if (password) {
      await pool.query(
        'UPDATE users SET username = ?, phone = ?, password = ?, role_id = ?, unit_id = ?, company_id = ? WHERE id = ?',
        [username, phone, password, roleId, unitId || null, companyId, id]
      );
    } else {
      await pool.query(
        'UPDATE users SET username = ?, phone = ?, role_id = ?, unit_id = ?, company_id = ? WHERE id = ?',
        [username, phone, roleId, unitId || null, companyId, id]
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

  // 根据公司ID获取用户
  static async findByCompanyId(companyId) {
    const [rows] = await pool.query(
      `SELECT u.id, u.username, u.phone, u.role_id, r.name as role_name, u.unit_id, un.name as unit_name, u.company_id, c.name as company_name, u.status, u.can_view_logs
       FROM users u 
       JOIN user_roles r ON u.role_id = r.id 
       LEFT JOIN units un ON u.unit_id = un.id 
       JOIN companies c ON u.company_id = c.id
       WHERE u.company_id = ?
       ORDER BY un.name ASC, u.role_id DESC, u.username ASC`, 
      [companyId]
    );
    return rows;
  }

  // 检查用户是否属于指定公司
  static async belongsToCompany(userId, companyId) {
    const [rows] = await pool.query('SELECT id FROM users WHERE id = ? AND company_id = ?', [userId, companyId]);
    return rows.length > 0;
  }
}

module.exports = User; 