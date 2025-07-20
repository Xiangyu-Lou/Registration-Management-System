const { pool } = require('../config/database');

class Unit {
  // 获取所有单位（系统超级管理员可看全部，其他用户只看本公司）
  static async findAll(currentUser = null) {
    let query = `
      SELECT u.*, c.name as company_name 
      FROM units u 
      JOIN companies c ON u.company_id = c.id
    `;
    
    const params = [];
    
    // 如果不是系统超级管理员，只能查看本公司单位
    if (currentUser && currentUser.role_id !== 5) {
      query += ' WHERE u.company_id = ?';
      params.push(currentUser.company_id);
    }
    
    query += ' ORDER BY c.name ASC, u.name ASC';
    
    const [rows] = await pool.query(query, params);
    return rows;
  }

  // 根据ID查找单位
  static async findById(id, currentUser = null) {
    let query = `
      SELECT u.*, c.name as company_name 
      FROM units u 
      JOIN companies c ON u.company_id = c.id 
      WHERE u.id = ?
    `;
    
    const params = [id];
    
    // 如果不是系统超级管理员，只能查看本公司单位
    if (currentUser && currentUser.role_id !== 5) {
      query += ' AND u.company_id = ?';
      params.push(currentUser.company_id);
    }
    
    const [rows] = await pool.query(query, params);
    return rows[0] || null;
  }

  // 根据名称查找单位
  static async findByName(name, companyId = null) {
    let query = `
      SELECT u.*, c.name as company_name 
      FROM units u 
      JOIN companies c ON u.company_id = c.id 
      WHERE u.name = ?
    `;
    
    const params = [name];
    
    if (companyId) {
      query += ' AND u.company_id = ?';
      params.push(companyId);
    }
    
    const [rows] = await pool.query(query, params);
    return rows[0] || null;
  }

  // 检查单位名称是否已存在（在同一公司内）
  static async nameExists(name, companyId, excludeId = null) {
    let query = 'SELECT id FROM units WHERE name = ? AND company_id = ?';
    let params = [name, companyId];
    
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    
    const [rows] = await pool.query(query, params);
    return rows.length > 0;
  }

  // 创建单位
  static async create(unitData) {
    const { name, companyId } = unitData;
    const [result] = await pool.query('INSERT INTO units (name, company_id) VALUES (?, ?)', [name, companyId]);
    return result.insertId;
  }

  // 更新单位
  static async update(id, unitData) {
    const { name, companyId } = unitData;
    await pool.query('UPDATE units SET name = ?, company_id = ? WHERE id = ?', [name, companyId, id]);
    return true;
  }

  // 删除单位
  static async delete(id) {
    await pool.query('DELETE FROM units WHERE id = ?', [id]);
    return true;
  }

  // 检查单位是否存在用户
  static async hasUsers(id) {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM users WHERE unit_id = ?', [id]);
    return rows[0].count > 0;
  }

  // 检查单位是否存在废物记录
  static async hasWasteRecords(id) {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM waste_records WHERE unit_id = ?', [id]);
    return rows[0].count > 0;
  }

  // 根据公司ID获取单位
  static async findByCompanyId(companyId) {
    const [rows] = await pool.query(
      `SELECT u.*, c.name as company_name 
       FROM units u 
       JOIN companies c ON u.company_id = c.id 
       WHERE u.company_id = ? 
       ORDER BY u.name ASC`, 
      [companyId]
    );
    return rows;
  }

  // 检查单位是否属于指定公司
  static async belongsToCompany(unitId, companyId) {
    const [rows] = await pool.query('SELECT id FROM units WHERE id = ? AND company_id = ?', [unitId, companyId]);
    return rows.length > 0;
  }

  // 监督人员专用：获取本公司所有单位
  static async findAllForSupervisor(supervisorUser) {
    const query = `
      SELECT u.*, c.name as company_name 
      FROM units u 
      JOIN companies c ON u.company_id = c.id
      WHERE u.company_id = ?
      ORDER BY u.name ASC
    `;
    const [rows] = await pool.query(query, [supervisorUser.company_id]);
    return rows;
  }

  // 验证用户对单位的访问权限
  static async validateUnitAccess(unitId, userId) {
    const [unitRows] = await pool.query(
      'SELECT company_id FROM units WHERE id = ?', [unitId]
    );
    const [userRows] = await pool.query(
      'SELECT company_id, role_id FROM users WHERE id = ?', [userId]
    );
    
    if (unitRows.length === 0 || userRows.length === 0) {
      return false;
    }
    
    const unit = unitRows[0];
    const user = userRows[0];
    
    // 系统超级管理员可以访问任意单位
    if (user.role_id === 5) return true;
    
    // 其他用户只能访问本公司单位
    return unit.company_id === user.company_id;
  }
}

module.exports = Unit; 