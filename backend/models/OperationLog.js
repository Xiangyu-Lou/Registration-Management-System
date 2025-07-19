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
      additionalData,
      companyId
    } = logData;

    const [result] = await pool.query(
      `INSERT INTO operation_logs 
      (user_id, operation_type, target_type, target_id, description, ip_address, user_agent, additional_data, company_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, operationType, targetType, targetId, description, ipAddress, userAgent, additionalData ? JSON.stringify(additionalData) : null, companyId]
    );

    return result.insertId;
  }

  // 根据用户ID查找日志
  static async findByUserId(userId, currentUser = null, limit = 100, offset = 0) {
    let query = `
      SELECT ol.*, u.username, u.phone, c.name as company_name
       FROM operation_logs ol
       LEFT JOIN users u ON ol.user_id = u.id
      LEFT JOIN companies c ON ol.company_id = c.id
       WHERE ol.user_id = ?
    `;
    
    const params = [userId];
    
    // 如果不是系统超级管理员，只能查看本公司日志
    if (currentUser && currentUser.role_id !== 5) {
      query += ' AND ol.company_id = ?';
      params.push(currentUser.company_id);
    }
    
    query += ' ORDER BY ol.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const [rows] = await pool.query(query, params);
    return rows;
  }

  // 获取所有日志（支持分页和筛选）
  static async findAll(filters = {}, currentUser = null, limit = 100, offset = 0) {
    const {
      userId,
      operationType,
      targetType,
      startDate,
      endDate
    } = filters;

    let sql = `
      SELECT ol.*, u.username, u.phone, c.name as company_name
      FROM operation_logs ol
      LEFT JOIN users u ON ol.user_id = u.id
      LEFT JOIN companies c ON ol.company_id = c.id
      WHERE 1=1
    `;
    const params = [];

    // 如果不是系统超级管理员，只能查看本公司日志
    if (currentUser && currentUser.role_id !== 5) {
      sql += ' AND ol.company_id = ?';
      params.push(currentUser.company_id);
    }

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

  // 带分页和筛选的查询方法
  static async findWithFilters(filters = {}, pagination = {}, currentUser = null) {
    const {
      operationType,
      targetType,
      userId,
      userKeyword,
      startDate,
      endDate,
      description
    } = filters;

    const {
      page = 1,
      pageSize = 20
    } = pagination;

    let baseSql = `
      FROM operation_logs ol
      LEFT JOIN users u ON ol.user_id = u.id
      LEFT JOIN companies c ON ol.company_id = c.id
      WHERE 1=1
    `;
    const params = [];

    // 如果不是系统超级管理员，只能查看本公司日志
    if (currentUser && currentUser.role_id !== 5) {
      baseSql += ' AND ol.company_id = ?';
      params.push(currentUser.company_id);
    }

    if (operationType) {
      baseSql += ' AND ol.operation_type = ?';
      params.push(operationType);
    }

    if (targetType) {
      baseSql += ' AND ol.target_type = ?';
      params.push(targetType);
    }

    if (userId) {
      baseSql += ' AND ol.user_id = ?';
      params.push(userId);
    }

    if (userKeyword) {
      baseSql += ' AND (u.username LIKE ? OR u.phone LIKE ?)';
      params.push(`%${userKeyword}%`, `%${userKeyword}%`);
    }

    if (startDate) {
      baseSql += ' AND ol.created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      baseSql += ' AND ol.created_at <= ?';
      params.push(endDate);
    }

    if (description) {
      baseSql += ' AND ol.description LIKE ?';
      params.push(`%${description}%`);
    }

    // 获取总数
    const countSql = `SELECT COUNT(*) as total ${baseSql}`;
    const [countResult] = await pool.query(countSql, params);
    const total = countResult[0].total;

    // 获取分页数据
    const dataSql = `
      SELECT ol.*, u.username, u.phone, u.role_id, c.name as company_name,
      CASE u.role_id
        WHEN 1 THEN '基层员工'
        WHEN 2 THEN '单位管理员'
        WHEN 3 THEN '公司管理员'
        WHEN 4 THEN '监督人员'
        WHEN 5 THEN '系统超级管理员'
        ELSE '未知'
      END as role_name
      ${baseSql}
      ORDER BY ol.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;
    params.push(limit, offset);

    const [logs] = await pool.query(dataSql, params);

    return {
      logs,
      pagination: {
        page: parseInt(page),
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + logs.length < total
      }
    };
  }

  // 获取操作类型统计
  static async getStats(startDate, endDate, currentUser = null) {
    try {
      let sql = `
        SELECT 
          operation_type,
          COUNT(*) as count,
          DATE(created_at) as date
        FROM operation_logs
        WHERE 1=1
      `;
      const params = [];

      // 如果不是系统超级管理员，只能查看本公司统计
      if (currentUser && currentUser.role_id !== 5) {
        sql += ' AND company_id = ?';
        params.push(currentUser.company_id);
      }

      if (startDate) {
        sql += ' AND created_at >= ?';
        params.push(startDate);
      }

      if (endDate) {
        sql += ' AND created_at <= ?';
        params.push(endDate);
      }

      sql += ' GROUP BY operation_type, DATE(created_at) ORDER BY DATE(created_at) DESC';

      const [rows] = await pool.query(sql, params);

      // 还需要获取总体统计
      let totalSql = `
        SELECT 
          operation_type,
          COUNT(*) as total_count
        FROM operation_logs
        WHERE 1=1
      `;
      const totalParams = [];

      // 如果不是系统超级管理员，只能查看本公司统计
      if (currentUser && currentUser.role_id !== 5) {
        totalSql += ' AND company_id = ?';
        totalParams.push(currentUser.company_id);
      }

      if (startDate) {
        totalSql += ' AND created_at >= ?';
        totalParams.push(startDate);
      }

      if (endDate) {
        totalSql += ' AND created_at <= ?';
        totalParams.push(endDate);
      }

      totalSql += ' GROUP BY operation_type';

      const [totalRows] = await pool.query(totalSql, totalParams);

      return {
        dailyStats: rows || [],
        totalStats: totalRows || []
      };
    } catch (error) {
      console.error('OperationLog.getStats 错误:', error);
      // 即使出错也返回默认结构
      return {
        dailyStats: [],
        totalStats: []
      };
    }
  }

  // 获取用户操作统计
  static async getUserStats(startDate, endDate, currentUser = null, limit = 10) {
    try {
      let sql = `
        SELECT 
          ol.user_id,
          u.username,
          u.phone,
          c.name as company_name,
          CASE u.role_id
            WHEN 1 THEN '基层员工'
            WHEN 2 THEN '单位管理员'
            WHEN 3 THEN '公司管理员'
            WHEN 4 THEN '监督人员'
            WHEN 5 THEN '系统超级管理员'
            ELSE '未知'
          END as role_name,
          COUNT(*) as operation_count,
          COUNT(CASE WHEN ol.operation_type = 'login' THEN 1 END) as login_count,
          COUNT(CASE WHEN ol.operation_type = 'create' THEN 1 END) as create_count,
          COUNT(CASE WHEN ol.operation_type = 'update' THEN 1 END) as update_count,
          COUNT(CASE WHEN ol.operation_type = 'delete' THEN 1 END) as delete_count,
          MAX(ol.created_at) as last_operation_time
        FROM operation_logs ol
        LEFT JOIN users u ON ol.user_id = u.id
        LEFT JOIN companies c ON ol.company_id = c.id
        WHERE 1=1
      `;
      const params = [];

      // 如果不是系统超级管理员，只能查看本公司统计
      if (currentUser && currentUser.role_id !== 5) {
        sql += ' AND ol.company_id = ?';
        params.push(currentUser.company_id);
      }

      if (startDate) {
        sql += ' AND ol.created_at >= ?';
        params.push(startDate);
      }

      if (endDate) {
        sql += ' AND ol.created_at <= ?';
        params.push(endDate);
      }

      sql += ' GROUP BY ol.user_id, u.username, u.phone, u.role_id, c.name';
      sql += ' ORDER BY operation_count DESC';
      sql += ' LIMIT ?';
      params.push(limit);

      const [rows] = await pool.query(sql, params);
      return rows || [];
    } catch (error) {
      console.error('OperationLog.getUserStats 错误:', error);
      return [];
    }
  }

  // 导出所有符合条件的日志
  static async findAllWithFilters(filters = {}, currentUser = null) {
    try {
      const {
        operationType,
        targetType,
        userId,
        userKeyword,
        startDate,
        endDate,
        description
      } = filters;

      let sql = `
        SELECT ol.*, u.username, u.phone, u.role_id, c.name as company_name,
        CASE u.role_id
          WHEN 1 THEN '基层员工'
          WHEN 2 THEN '单位管理员'
          WHEN 3 THEN '公司管理员'
          WHEN 4 THEN '监督人员'
          WHEN 5 THEN '系统超级管理员'
          ELSE '未知'
        END as role_name
        FROM operation_logs ol
        LEFT JOIN users u ON ol.user_id = u.id
        LEFT JOIN companies c ON ol.company_id = c.id
        WHERE 1=1
      `;
      const params = [];

      // 如果不是系统超级管理员，只能查看本公司日志
      if (currentUser && currentUser.role_id !== 5) {
        sql += ' AND ol.company_id = ?';
        params.push(currentUser.company_id);
      }

      if (operationType) {
        sql += ' AND ol.operation_type = ?';
        params.push(operationType);
      }

      if (targetType) {
        sql += ' AND ol.target_type = ?';
        params.push(targetType);
      }

      if (userId) {
        sql += ' AND ol.user_id = ?';
        params.push(userId);
      }

      if (userKeyword) {
        sql += ' AND (u.username LIKE ? OR u.phone LIKE ?)';
        params.push(`%${userKeyword}%`, `%${userKeyword}%`);
      }

      if (startDate) {
        sql += ' AND ol.created_at >= ?';
        params.push(startDate);
      }

      if (endDate) {
        sql += ' AND ol.created_at <= ?';
        params.push(endDate);
      }

      if (description) {
        sql += ' AND ol.description LIKE ?';
        params.push(`%${description}%`);
      }

      sql += ' ORDER BY ol.created_at DESC';

      const [rows] = await pool.query(sql, params);
      return rows || [];
    } catch (error) {
      console.error('OperationLog.findAllWithFilters 错误:', error);
      return [];
    }
  }
}

module.exports = OperationLog; 