const User = require('../models/User');
const { hashPassword, comparePassword } = require('../utils/auth');
const { logUserManagementOperation } = require('../utils/logger');

// 获取所有用户
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// 获取指定单位的用户
const getUsersByUnit = async (req, res, next) => {
  try {
    const { unitId } = req.params;
    const users = await User.findByUnitId(unitId);
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// 获取单个用户信息
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({
      id: user.id,
      username: user.username,
      phone: user.phone,
      role: user.role_name,
      role_id: user.role_id,
      unit_id: user.unit_id,
      unit_name: user.unit_name,
      status: user.status
    });
  } catch (error) {
    next(error);
  }
};

// 创建用户
const createUser = async (req, res, next) => {
  try {
    const { username, phone, password, roleId, unitId } = req.body;
    
    // 验证必填字段
    if (!username || !phone || !roleId) {
      return res.status(400).json({ error: '用户名、手机号和角色是必填字段' });
    }
    
    // 检查手机号是否已存在
    const phoneExists = await User.phoneExists(phone);
    if (phoneExists) {
      return res.status(400).json({ error: '手机号已存在' });
    }
    
    // 加密密码（如果提供）
    let hashedPassword = null;
    if (password) {
      hashedPassword = await hashPassword(password);
    }
    
    // 创建用户
    const userId = await User.create({
      username,
      phone,
      password: hashedPassword,
      roleId,
      unitId
    });
    
    // 获取创建后的完整用户信息用于日志
    const createdUser = await User.findById(userId);
    
    // 获取操作者ID
    const operatorId = req.user ? req.user.id : null;
    
    // 构建详细描述
    const roleText = createdUser.role_name || '未知角色';
    const unitText = createdUser.unit_name || '无单位';
    const passwordText = password ? '已设置密码' : '未设置密码';
    
    // 记录操作日志
    await logUserManagementOperation(
      req, 
      'create', 
      userId, 
      operatorId, 
      `创建用户 - 用户名: ${username}, 手机号: ${phone}, 角色: ${roleText}, 单位: ${unitText}, 密码状态: ${passwordText}`,
      {
        username,
        phone,
        roleId,
        roleName: createdUser.role_name,
        unitId,
        unitName: createdUser.unit_name,
        hasPassword: !!password,
        status: '正常'
      }
    );
    
    res.status(201).json({
      message: '用户创建成功',
      id: userId
    });
  } catch (error) {
    next(error);
  }
};

// 更新用户信息
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { username, phone, password, roleId, unitId } = req.body;
    
    // 验证用户是否存在
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 验证必填字段
    if (!username || !phone || !roleId) {
      return res.status(400).json({ error: '用户名、手机号和角色是必填字段' });
    }
    
    // 检查手机号是否被其他用户使用
    const phoneExists = await User.phoneExists(phone, id);
    if (phoneExists) {
      return res.status(400).json({ error: '手机号已被其他用户使用' });
    }
    
    // 记录更新前的数据
    const beforeData = {
      username: existingUser.username,
      phone: existingUser.phone,
      roleId: existingUser.role_id,
      roleName: existingUser.role_name,
      unitId: existingUser.unit_id,
      unitName: existingUser.unit_name
    };
    
    // 加密密码（如果提供）
    let hashedPassword = null;
    if (password) {
      hashedPassword = await hashPassword(password);
    }
    
    // 更新用户
    await User.update(id, {
      username,
      phone,
      password: hashedPassword,
      roleId,
      unitId
    });
    
    // 获取更新后的完整用户信息
    const updatedUser = await User.findById(id);
    
    // 获取操作者ID
    const operatorId = req.user ? req.user.id : null;
    
    // 构建变更详情
    let changeDetails = [];
    if (beforeData.username !== username) {
      changeDetails.push(`用户名: ${beforeData.username} → ${username}`);
    }
    if (beforeData.phone !== phone) {
      changeDetails.push(`手机号: ${beforeData.phone} → ${phone}`);
    }
    if (beforeData.roleName !== updatedUser.role_name) {
      changeDetails.push(`角色: ${beforeData.roleName} → ${updatedUser.role_name}`);
    }
    if ((beforeData.unitName || '无单位') !== (updatedUser.unit_name || '无单位')) {
      const beforeUnit = beforeData.unitName || '无单位';
      const afterUnit = updatedUser.unit_name || '无单位';
      changeDetails.push(`单位: ${beforeUnit} → ${afterUnit}`);
    }
    if (password) {
      changeDetails.push('密码已更新');
    }
    
    const changeText = changeDetails.length > 0 ? `, 变更内容: ${changeDetails.join('; ')}` : '';
    const currentRoleText = updatedUser.role_name || '未知角色';
    const currentUnitText = updatedUser.unit_name || '无单位';
    
    // 记录操作日志
    await logUserManagementOperation(
      req, 
      'update', 
      parseInt(id), 
      operatorId, 
      `更新用户信息 - 用户ID: ${id}, 当前用户名: ${username}, 手机号: ${phone}, 角色: ${currentRoleText}, 单位: ${currentUnitText}${changeText}`,
      {
        userId: parseInt(id),
        beforeData,
        afterData: {
          username,
          phone,
          roleId,
          roleName: updatedUser.role_name,
          unitId,
          unitName: updatedUser.unit_name
        },
        changes: changeDetails,
        passwordChanged: !!password
      }
    );
    
    res.json({
      message: '用户信息更新成功',
      id: parseInt(id)
    });
  } catch (error) {
    next(error);
  }
};

// 删除用户
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // 验证用户是否存在
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 检查用户是否有废物记录
    const hasRecords = await User.hasWasteRecords(id);
    if (hasRecords) {
      return res.status(400).json({ error: '该用户有关联的废物记录，无法删除' });
    }
    
    // 记录删除的用户数据
    const deletedData = {
      userId: parseInt(id),
      username: user.username,
      phone: user.phone,
      roleId: user.role_id,
      roleName: user.role_name,
      unitId: user.unit_id,
      unitName: user.unit_name,
      status: user.status === 1 ? '正常' : '停用'
    };
    
    // 删除用户
    await User.delete(id);
    
    // 获取操作者ID
    const operatorId = req.user ? req.user.id : null;
    
    // 构建详细描述
    const roleText = deletedData.roleName || '未知角色';
    const unitText = deletedData.unitName || '无单位';
    const statusText = deletedData.status;
    
    // 记录操作日志
    await logUserManagementOperation(
      req, 
      'delete', 
      parseInt(id), 
      operatorId, 
      `删除用户 - 用户ID: ${id}, 用户名: ${deletedData.username}, 手机号: ${deletedData.phone}, 角色: ${roleText}, 单位: ${unitText}, 账号状态: ${statusText}`,
      deletedData
    );
    
    res.json({
      message: '用户删除成功',
      id: parseInt(id)
    });
  } catch (error) {
    next(error);
  }
};

// 更新用户状态
const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // 验证用户是否存在
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 验证状态值
    if (status !== 0 && status !== 1) {
      return res.status(400).json({ error: '状态值无效，必须是0或1' });
    }
    
    const oldStatus = user.status;
    
    // 更新用户状态
    await User.updateStatus(id, status);
    
    // 获取操作者ID
    const operatorId = req.user ? req.user.id : null;
    
    const statusText = status === 1 ? '启用' : '停用';
    const oldStatusText = oldStatus === 1 ? '启用' : '停用';
    const roleText = user.role_name || '未知角色';
    const unitText = user.unit_name || '无单位';
    
    // 记录操作日志
    await logUserManagementOperation(
      req, 
      'update', 
      parseInt(id), 
      operatorId, 
      `${statusText}用户 - 用户ID: ${id}, 用户名: ${user.username}, 手机号: ${user.phone}, 角色: ${roleText}, 单位: ${unitText}, 状态变更: ${oldStatusText} → ${statusText}`,
      {
        userId: parseInt(id),
        username: user.username,
        phone: user.phone,
        roleName: user.role_name,
        unitName: user.unit_name,
        operationType: 'status_change',
        oldStatus: oldStatusText,
        newStatus: statusText
      }
    );
    
    res.json({
      message: `用户${statusText}成功`,
      id: parseInt(id)
    });
  } catch (error) {
    next(error);
  }
};

// 更新用户个人资料
const updateUserProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { username, password } = req.body;
    
    // 验证用户是否存在
    const user = await User.findByIdWithPassword(id);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 验证权限：只能修改自己的信息
    if (req.user && req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: '只能修改自己的个人信息' });
    }
    
    // 验证必填字段
    if (!username) {
      return res.status(400).json({ error: '用户名是必填字段' });
    }
    
    // 获取完整用户信息
    const fullUser = await User.findById(id);
    
    // 记录更新前的数据
    const beforeData = {
      username: user.username
    };
    
    // 加密密码（如果提供）
    let hashedPassword = null;
    if (password) {
      hashedPassword = await hashPassword(password);
    }
    
    // 更新用户个人资料
    await User.updateProfile(id, {
      username,
      password: hashedPassword
    });
    
    // 构建变更详情
    let changeDetails = [];
    if (beforeData.username !== username) {
      changeDetails.push(`用户名: ${beforeData.username} → ${username}`);
    }
    if (password) {
      changeDetails.push('密码已更新');
    }
    
    const changeText = changeDetails.length > 0 ? `, 变更内容: ${changeDetails.join('; ')}` : '';
    const roleText = fullUser.role_name || '未知角色';
    const unitText = fullUser.unit_name || '无单位';
    
    // 记录操作日志
    await logUserManagementOperation(
      req, 
      'update', 
      parseInt(id), 
      parseInt(id), // 操作者是自己
      `更新个人资料 - 用户ID: ${id}, 当前用户名: ${username}, 手机号: ${fullUser.phone}, 角色: ${roleText}, 单位: ${unitText}${changeText}`,
      {
        userId: parseInt(id),
        operationType: 'profile_update',
        beforeData,
        afterData: { username },
        changes: changeDetails,
        passwordChanged: !!password,
        userInfo: {
          phone: fullUser.phone,
          roleName: fullUser.role_name,
          unitName: fullUser.unit_name
        }
      }
    );
    
    res.json({
      message: '个人资料更新成功',
      id: parseInt(id)
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUsersByUnit,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  updateUserProfile
}; 