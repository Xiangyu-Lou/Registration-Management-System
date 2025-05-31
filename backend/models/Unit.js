const { pool } = require('../config/database');

class Unit {
  // 获取所有单位
  static async findAll() {
    const [rows] = await pool.query('SELECT * FROM units ORDER BY name');
    return rows;
  }

  // 根据ID查找单位
  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM units WHERE id = ?', [id]);
    return rows[0] || null;
  }

  // 根据名称查找单位
  static async findByName(name) {
    const [rows] = await pool.query('SELECT * FROM units WHERE name = ?', [name]);
    return rows[0] || null;
  }

  // 检查单位名称是否已存在
  static async nameExists(name, excludeId = null) {
    let query = 'SELECT id FROM units WHERE name = ?';
    let params = [name];
    
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    
    const [rows] = await pool.query(query, params);
    return rows.length > 0;
  }

  // 创建单位
  static async create(unitData) {
    const { name } = unitData;
    const [result] = await pool.query('INSERT INTO units (name) VALUES (?)', [name]);
    return result.insertId;
  }

  // 更新单位
  static async update(id, unitData) {
    const { name } = unitData;
    await pool.query('UPDATE units SET name = ? WHERE id = ?', [name, id]);
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
}

module.exports = Unit; 