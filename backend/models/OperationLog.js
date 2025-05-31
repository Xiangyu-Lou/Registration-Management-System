const { pool } = require('../config/database');

class OperationLog {
  // 创建操作日志
  static async create(logData) {
    const {
      userId,
      operationType,
      targetType,
      targetId,
      description,
      ipAddress,
      userAgent,
      additionalData
    } = logData;

    const [result] = await pool.query(
      `INSERT INTO operation_logs 
      (user_id, operation_type, target_type, target_id, description, ip_address, user_agent, additional_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, operationType, targetType, targetId, description, ipAddress, userAgent, additionalData ? JSON.stringify(additionalData) : null]
    );

    return result.insertId;
  }

  // 根据用户ID查找日志
  static async findByUserId(userId, limit = 100, offset = 0) {
    const [rows] = await pool.query(
      `SELECT ol.*, u.username, u.phone 
       FROM operation_logs ol
       LEFT JOIN users u ON ol.user_id = u.id
       WHERE ol.user_id = ?
       ORDER BY ol.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );
    return rows;
  }

  // 获取所有日志（支持分页和筛选）
  static async findAll(filters = {}, limit = 100, offset = 0) {
    const {
      userId,
      operationType,
      targetType,
      startDate,
      endDate
    } = filters;

    let sql = `
      SELECT ol.*, u.username, u.phone 
      FROM operation_logs ol
      LEFT JOIN users u ON ol.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (userId) {
      sql += ' AND ol.user_id = ?';
      params.push(userId);
    }

    if (operationType) {
      sql += ' AND ol.operation_type = ?';
      params.push(operationType);
    }

    if (targetType) {
      sql += ' AND ol.target_type = ?';
      params.push(targetType);
    }

    if (startDate) {
      sql += ' AND ol.created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      sql += ' AND ol.created_at <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY ol.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(sql, params);
    return rows;
  }

  // 获取日志总数
  static async countAll(filters = {}) {
    const {
      userId,
      operationType,
      targetType,
      startDate,
      endDate
    } = filters;

    let sql = `
      SELECT COUNT(*) as total
      FROM operation_logs ol
      WHERE 1=1
    `;
    const params = [];

    if (userId) {
      sql += ' AND ol.user_id = ?';
      params.push(userId);
    }

    if (operationType) {
      sql += ' AND ol.operation_type = ?';
      params.push(operationType);
    }

    if (targetType) {
      sql += ' AND ol.target_type = ?';
      params.push(targetType);
    }

    if (startDate) {
      sql += ' AND ol.created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      sql += ' AND ol.created_at <= ?';
      params.push(endDate);
    }

    const [rows] = await pool.query(sql, params);
    return rows[0].total;
  }

  // 清理旧日志（保留指定天数）
  static async cleanOldLogs(daysToKeep = 90) {
    const [result] = await pool.query(
      'DELETE FROM operation_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
      [daysToKeep]
    );
    return result.affectedRows;
  }
}

module.exports = OperationLog; 