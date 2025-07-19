const { pool } = require('../config/database');

class Company {
  // 获取所有公司
  static async findAll() {
    const [rows] = await pool.query(
      'SELECT * FROM companies WHERE status = 1 ORDER BY name ASC'
    );
    return rows;
  }

  // 根据ID查找公司
  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM companies WHERE id = ?', [id]);
    return rows[0] || null;
  }

  // 根据代码查找公司
  static async findByCode(code) {
    const [rows] = await pool.query('SELECT * FROM companies WHERE code = ?', [code]);
    return rows[0] || null;
  }

  // 创建公司
  static async create(companyData) {
    const { name, code } = companyData;
    const [result] = await pool.query(
      'INSERT INTO companies (name, code) VALUES (?, ?)',
      [name, code || null]
    );
    return result.insertId;
  }

  // 更新公司信息
  static async update(id, companyData) {
    const { name, code, status } = companyData;
    await pool.query(
      'UPDATE companies SET name = ?, code = ?, status = ? WHERE id = ?',
      [name, code || null, status !== undefined ? status : 1, id]
    );
    return true;
  }

  // 删除公司（软删除）
  static async delete(id) {
    await pool.query('UPDATE companies SET status = 0 WHERE id = ?', [id]);
    return true;
  }

  // 检查公司名称是否存在
  static async nameExists(name, excludeId = null) {
    let query = 'SELECT id FROM companies WHERE name = ? AND status = 1';
    let params = [name];
    
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    
    const [rows] = await pool.query(query, params);
    return rows.length > 0;
  }

  // 检查公司代码是否存在
  static async codeExists(code, excludeId = null) {
    if (!code) return false;
    
    let query = 'SELECT id FROM companies WHERE code = ? AND status = 1';
    let params = [code];
    
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    
    const [rows] = await pool.query(query, params);
    return rows.length > 0;
  }

  // 获取公司统计信息
  static async getStats(companyId) {
    const [unitCount] = await pool.query(
      'SELECT COUNT(*) as count FROM units WHERE company_id = ?', 
      [companyId]
    );
    
    const [userCount] = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE company_id = ?', 
      [companyId]
    );
    
    const [recordCount] = await pool.query(
      'SELECT COUNT(*) as count FROM waste_records WHERE company_id = ?', 
      [companyId]
    );

    return {
      units: unitCount[0].count,
      users: userCount[0].count,
      records: recordCount[0].count
    };
  }

  // 检查公司是否有关联数据
  static async hasRelatedData(id) {
    const [unitRows] = await pool.query('SELECT COUNT(*) as count FROM units WHERE company_id = ?', [id]);
    const [userRows] = await pool.query('SELECT COUNT(*) as count FROM users WHERE company_id = ?', [id]);
    const [recordRows] = await pool.query('SELECT COUNT(*) as count FROM waste_records WHERE company_id = ?', [id]);
    
    return unitRows[0].count > 0 || userRows[0].count > 0 || recordRows[0].count > 0;
  }
}

module.exports = Company; 