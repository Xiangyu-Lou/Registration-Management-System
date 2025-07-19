const { pool } = require('../config/database');
const { get48HoursAgo } = require('../utils/dateUtils');

class WasteRecord {
  // 创建废物记录
  static async create(recordData) {
    const {
      unitId,
      wasteTypeId,
      location,
      collectionStartTime,
      photoPathBefore,
      photoPathAfter,
      quantity,
      creatorId,
      remarks,
      process,
      isSupervised,
      companyId
    } = recordData;

    const [result] = await pool.query(
      `INSERT INTO waste_records 
      (unit_id, waste_type_id, location, collection_start_time, photo_path_before, photo_path_after, quantity, created_at, creator_id, remarks, process, is_supervised, company_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?)`,
      [unitId, wasteTypeId, location, collectionStartTime, photoPathBefore, photoPathAfter, quantity, creatorId, remarks, process, isSupervised, companyId]
    );

    return result.insertId;
  }

  // 根据ID查找记录
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT wr.*, u.name as unit_name, wt.name as waste_type_name, c.name as company_name,
       IFNULL(creator.username, creator.phone) as creator_name
       FROM waste_records wr
       JOIN units u ON wr.unit_id = u.id
       JOIN waste_types wt ON wr.waste_type_id = wt.id
       JOIN companies c ON wr.company_id = c.id
       LEFT JOIN users creator ON wr.creator_id = creator.id
       WHERE wr.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  // 获取所有记录（系统超级管理员可看全部，其他用户只看本公司）
  static async findAll(currentUser = null) {
    let query = `
      SELECT wr.*, u.name as unit_name, wt.name as waste_type_name, c.name as company_name,
       IFNULL(creator.username, creator.phone) as creator_name
       FROM waste_records wr
       JOIN units u ON wr.unit_id = u.id
       JOIN waste_types wt ON wr.waste_type_id = wt.id
       JOIN companies c ON wr.company_id = c.id
       LEFT JOIN users creator ON wr.creator_id = creator.id
    `;
    
    const params = [];
    
    // 如果不是系统超级管理员，只能查看本公司记录
    if (currentUser && currentUser.role_id !== 5) {
      query += ' WHERE wr.company_id = ?';
      params.push(currentUser.company_id);
    }
    
    query += ' ORDER BY wr.created_at DESC';
    
    const [rows] = await pool.query(query, params);
    return rows;
  }

  // 根据单位ID获取记录
  static async findByUnitId(unitId, currentUser = null) {
    let query = `
      SELECT wr.*, u.name as unit_name, wt.name as waste_type_name, c.name as company_name,
       IFNULL(creator.username, creator.phone) as creator_name
       FROM waste_records wr
       JOIN units u ON wr.unit_id = u.id
       JOIN waste_types wt ON wr.waste_type_id = wt.id
       JOIN companies c ON wr.company_id = c.id
       LEFT JOIN users creator ON wr.creator_id = creator.id
       WHERE wr.unit_id = ?
    `;

    const params = [unitId];

    // 如果不是系统超级管理员，只能查看本公司记录
    if (currentUser && currentUser.role_id !== 5) {
      query += ' AND wr.company_id = ?';
      params.push(currentUser.company_id);
    }

    // 如果不是超级管理员或系统管理员，则不显示监督数据
    if (currentUser && currentUser.role_id !== 3 && currentUser.role_id !== 5) {
      query += ' AND (wr.is_supervised IS NULL OR wr.is_supervised != 1)';
    }

    query += ' ORDER BY wr.created_at DESC';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  // 根据用户获取记录（支持分页和筛选）
  static async findByUser(userId, user, filters = {}, pagination = {}) {
    const {
      page = 1,
      pageSize = 20,
      wasteTypeId,
      minQuantity,
      maxQuantity,
      location,
      dateRange,
      process,
      showSupervised,
      unitId
    } = { ...filters, ...pagination };

    let baseSql = `
      FROM waste_records wr
      JOIN units u ON wr.unit_id = u.id
      JOIN waste_types wt ON wr.waste_type_id = wt.id
      JOIN companies c ON wr.company_id = c.id
      LEFT JOIN users creator ON wr.creator_id = creator.id
      WHERE 1=1
    `;

    const params = [];

    // 根据用户角色添加权限过滤
    if (user.role_id !== 3 && user.role_id !== 4 && user.role_id !== 5) { // 不是公司管理员、监督人员或系统超级管理员
      baseSql += ' AND wr.unit_id = ?';
      params.push(user.unit_id);

      // 单位管理员不能查看监督数据
      if (user.role_id === 2) {
        baseSql += ' AND (wr.is_supervised IS NULL OR wr.is_supervised != 1)';
      }
    } else if (user.role_id === 3 && showSupervised === 'false') {
      // 公司管理员特殊处理：如果showSupervised为false，则不显示监督人员录入的数据
      baseSql += ' AND (wr.is_supervised IS NULL OR wr.is_supervised != 1)';
    }

    // 如果不是系统超级管理员，只能查看本公司记录
    if (user.role_id !== 5) {
      baseSql += ' AND wr.company_id = ?';
      params.push(user.company_id);
    }

    // 监督人员只能查看自己提交的记录
    if (user.role_id === 4) {
      baseSql += ' AND wr.creator_id = ?';
      params.push(user.id);
    }

    // 为普通员工（role_id=1）添加48小时时间限制并限制只能查看自己提交的记录
    if (user.role_id === 1) {
      const formattedDate = get48HoursAgo();
      baseSql += ' AND wr.created_at >= ?';
      params.push(formattedDate);

      // 只能查看自己提交的记录
      baseSql += ' AND wr.creator_id = ?';
      params.push(user.id);
    }

    // 添加筛选条件
    if (unitId && (user.role_id === 3 || user.role_id === 4)) {
      baseSql += ' AND wr.unit_id = ?';
      params.push(unitId);
    }

    if (wasteTypeId) {
      baseSql += ' AND wr.waste_type_id = ?';
      params.push(wasteTypeId);
    }

    if (minQuantity !== undefined && minQuantity !== '') {
      baseSql += ' AND wr.quantity >= ?';
      params.push(parseFloat(minQuantity));
    }

    if (maxQuantity !== undefined && maxQuantity !== '') {
      baseSql += ' AND wr.quantity <= ?';
      params.push(parseFloat(maxQuantity));
    }

    if (location) {
      baseSql += ' AND wr.location LIKE ?';
      params.push(`%${location}%`);
    }

    if (dateRange) {
      try {
        const [startDate, endDate] = JSON.parse(dateRange);
        if (startDate && endDate) {
          baseSql += ' AND DATE(wr.collection_start_time) BETWEEN ? AND ?';
          params.push(startDate, endDate);
        }
      } catch (error) {
        console.error('解析日期范围失败:', error);
      }
    }

    if (process) {
      baseSql += ' AND wr.process LIKE ?';
      params.push(`%${process}%`);
    }

    // 获取总记录数
    const countSql = `SELECT COUNT(*) as total ${baseSql}`;
    const [countResult] = await pool.query(countSql, params);
    const total = countResult[0].total;

    // 添加排序和分页
    const dataSql = `
      SELECT wr.*, u.name as unit_name, wt.name as waste_type_name, c.name as company_name,
      IFNULL(creator.username, creator.phone) as creator_name
      ${baseSql} ORDER BY wr.created_at DESC LIMIT ? OFFSET ?
    `;

    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;
    params.push(limit, offset);

    const [records] = await pool.query(dataSql, params);

    return {
      records,
      total,
      hasMore: offset + records.length < total
    };
  }

  // 导出用户记录（获取所有符合条件的记录）
  static async exportByUser(userId, user, filters = {}) {
    const {
      wasteTypeId,
      minQuantity,
      maxQuantity,
      location,
      dateRange,
      unitId,
      process,
      showSupervised
    } = filters;

    let sql = `
      SELECT wr.*, u.name as unit_name, wt.name as waste_type_name, c.name as company_name,
      IFNULL(creator.username, creator.phone) as creator_name
      FROM waste_records wr
      JOIN units u ON wr.unit_id = u.id
      JOIN waste_types wt ON wr.waste_type_id = wt.id
      JOIN companies c ON wr.company_id = c.id
      LEFT JOIN users creator ON wr.creator_id = creator.id
      WHERE 1=1
    `;

    const params = [];

    // 根据用户角色添加权限过滤
    if (user.role_id !== 3 && user.role_id !== 4 && user.role_id !== 5) { // 不是公司管理员、监督人员或系统超级管理员
      sql += ' AND wr.unit_id = ?';
      params.push(user.unit_id);

      // 单位管理员不能查看监督数据
      if (user.role_id === 2) {
        sql += ' AND (wr.is_supervised IS NULL OR wr.is_supervised != 1)';
      }
    } else if (user.role_id === 3 && showSupervised === 'false') {
      // 公司管理员特殊处理：如果showSupervised为false，则不显示监督人员录入的数据
      sql += ' AND (wr.is_supervised IS NULL OR wr.is_supervised != 1)';
    }

    // 如果不是系统超级管理员，只能查看本公司记录
    if (user.role_id !== 5) {
      sql += ' AND wr.company_id = ?';
      params.push(user.company_id);
    }

    // 监督人员只能查看自己提交的记录
    if (user.role_id === 4) {
      sql += ' AND wr.creator_id = ?';
      params.push(user.id);
    }

    // 为普通员工（role_id=1）添加48小时时间限制并限制只能查看自己提交的记录
    if (user.role_id === 1) {
      const formattedDate = get48HoursAgo();
      sql += ' AND wr.created_at >= ?';
      params.push(formattedDate);

      // 只能查看自己提交的记录
      sql += ' AND wr.creator_id = ?';
      params.push(user.id);
    }

    // 添加筛选条件
    if (unitId && (user.role_id === 3 || user.role_id === 4)) {
      sql += ' AND wr.unit_id = ?';
      params.push(unitId);
    }

    if (wasteTypeId) {
      sql += ' AND wr.waste_type_id = ?';
      params.push(wasteTypeId);
    }

    if (minQuantity !== undefined && minQuantity !== '') {
      sql += ' AND wr.quantity >= ?';
      params.push(minQuantity);
    }

    if (maxQuantity !== undefined && maxQuantity !== '') {
      sql += ' AND wr.quantity <= ?';
      params.push(maxQuantity);
    }

    if (location) {
      sql += ' AND wr.location LIKE ?';
      params.push(`%${location}%`);
    }

    if (dateRange) {
      try {
        const [startDate, endDate] = JSON.parse(dateRange);
        if (startDate && endDate) {
          sql += ' AND DATE(wr.collection_start_time) BETWEEN ? AND ?';
          params.push(startDate, endDate);
        }
      } catch (error) {
        console.error('解析日期范围失败:', error);
      }
    }

    if (process) {
      sql += ' AND wr.process LIKE ?';
      params.push(`%${process}%`);
    }

    // 添加排序
    sql += ' ORDER BY wr.created_at DESC';

    const [records] = await pool.query(sql, params);
    return records;
  }

  // 更新记录
  static async update(id, recordData) {
    const {
      unitId,
      wasteTypeId,
      location,
      collectionStartTime,
      photoPathBefore,
      photoPathAfter,
      quantity,
      remarks,
      process,
      companyId
    } = recordData;

    let query = `UPDATE waste_records SET 
       unit_id = ?, waste_type_id = ?, location = ?, collection_start_time = ?, 
       photo_path_before = ?, photo_path_after = ?, quantity = ?, remarks = ?, process = ?`;
    
    let params = [unitId, wasteTypeId, location, collectionStartTime, photoPathBefore, photoPathAfter, quantity, remarks, process];
    
    // 如果传入了companyId，则更新公司字段（主要用于系统超级管理员转移记录）
    if (companyId !== undefined) {
      query += `, company_id = ?`;
      params.push(companyId);
    }
    
    query += ` WHERE id = ?`;
    params.push(id);

    await pool.query(query, params);

    return true;
  }

  // 删除记录
  static async delete(id) {
    await pool.query('DELETE FROM waste_records WHERE id = ?', [id]);
    return true;
  }

  // 验证单位是否存在
  static async validateUnit(unitId) {
    const [rows] = await pool.query('SELECT * FROM units WHERE id = ?', [unitId]);
    return rows.length > 0;
  }

  // 验证废物类型是否存在
  static async validateWasteType(wasteTypeId) {
    const [rows] = await pool.query('SELECT * FROM waste_types WHERE id = ?', [wasteTypeId]);
    return rows.length > 0;
  }
}

module.exports = WasteRecord; 