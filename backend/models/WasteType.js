const { pool } = require('../config/database');

class WasteType {
  // 获取所有废物类型
  static async findAll() {
    const [rows] = await pool.query('SELECT * FROM waste_types ORDER BY id');
    return rows;
  }

  // 根据ID查找废物类型
  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM waste_types WHERE id = ?', [id]);
    return rows[0] || null;
  }

  // 根据名称查找废物类型
  static async findByName(name) {
    const [rows] = await pool.query('SELECT * FROM waste_types WHERE name = ?', [name]);
    return rows[0] || null;
  }

  // 检查废物类型名称是否已存在
  static async nameExists(name, excludeId = null) {
    let query = 'SELECT id FROM waste_types WHERE name = ?';
    let params = [name];
    
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    
    const [rows] = await pool.query(query, params);
    return rows.length > 0;
  }

  // 创建废物类型
  static async create(wasteTypeData) {
    const { name } = wasteTypeData;
    const [result] = await pool.query('INSERT INTO waste_types (name) VALUES (?)', [name]);
    return result.insertId;
  }

  // 更新废物类型
  static async update(id, wasteTypeData) {
    const { name } = wasteTypeData;
    await pool.query('UPDATE waste_types SET name = ? WHERE id = ?', [name, id]);
    return true;
  }

  // 删除废物类型
  static async delete(id) {
    await pool.query('DELETE FROM waste_types WHERE id = ?', [id]);
    return true;
  }

  // 检查废物类型是否有关联的废物记录
  static async hasWasteRecords(id) {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM waste_records WHERE waste_type_id = ?', [id]);
    return rows[0].count > 0;
  }

  // 检查废物类型是否被使用（向后兼容）
  static async isUsed(id) {
    return this.hasWasteRecords(id);
  }
}

module.exports = WasteType; 