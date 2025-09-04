const { db } = require('../config/database');

class User {
  // 根据手机号查找用户
  static async findByPhone(phone) {
    return db('users').where({ phone }).first();
  }

  // 根据手机号查找用户（用于登录认证，包含角色、单位和公司信息）
  static async findByPhoneForAuth(phone) {
    return db('users as u')
      .select('u.*', 'r.name as role_name', 'un.name as unit_name', 'c.name as company_name')
      .join('roles as r', 'u.role_id', 'r.id')
      .leftJoin('units as un', 'u.unit_id', 'un.id')
      .join('companies as c', 'u.company_id', 'c.id')
      .where('u.phone', phone)
      .first();
  }

  // 根据ID查找用户（包含密码，用于认证）
  static async findByIdWithPassword(id) {
    return db('users').where({ id }).first();
  }

  // 根据ID查找用户
  static async findById(id) {
    return db('users as u')
      .select('u.id', 'u.username', 'u.phone', 'u.role_id', 'u.unit_id', 'u.company_id', 'r.name as role_name', 'un.name as unit_name', 'c.name as company_name', 'u.status', 'u.can_view_logs')
      .join('roles as r', 'u.role_id', 'r.id')
      .leftJoin('units as un', 'u.unit_id', 'un.id')
      .join('companies as c', 'u.company_id', 'c.id')
      .where('u.id', id)
      .first();
  }

  // 获取所有用户
  static async findAll(currentUser = null) {
    const query = db('users as u')
      .select('u.id', 'u.username', 'u.phone', 'u.role_id', 'r.name as role_name', 'u.unit_id', 'un.name as unit_name', 'u.company_id', 'c.name as company_name', 'u.status', 'u.can_view_logs')
      .join('roles as r', 'u.role_id', 'r.id')
      .leftJoin('units as un', 'u.unit_id', 'un.id')
      .join('companies as c', 'u.company_id', 'c.id');

    if (currentUser && currentUser.role_id !== 5) {
      query.where('u.company_id', currentUser.company_id);
    }

    return query.orderBy([
      { column: 'c.name', order: 'asc' },
      { column: 'un.name', order: 'asc' },
      { column: 'u.role_id', order: 'desc' },
      { column: 'u.username', order: 'asc' },
    ]);
  }

  // 创建用户
  static async create(userData) {
    const { username, phone, password, role_id, unit_id, company_id } = userData;
    const [insertId] = await db('users').insert({
      username,
      phone,
      password,
      role_id,
      unit_id: unit_id || null,
      company_id
    }).returning('id');
    return insertId;
  }

  // 更新用户信息
  static async update(id, userData) {
    return db('users').where({ id }).update(userData);
  }
  
  // 删除用户
  static async delete(id) {
    return db('users').where({ id }).del();
  }

  // ... (其他方法保持类似风格) ...
}

module.exports = User;
