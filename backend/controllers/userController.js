const User = require('../models/User');
const { hashPassword, comparePassword } = require('../utils/auth');

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
      return res.status(400).json({ error: '用户名、手机号和角色是必填项' });
    }
    
    // 必要的参数验证 - 员工和单位管理员必须指定单位
    if ((roleId == 1 || roleId == 2) && !unitId) {
      return res.status(400).json({ error: '员工和单位管理员必须指定单位' });
    }
    
    // 验证密码
    if (!password) {
      return res.status(400).json({ error: '所有账号必须设置密码' });
    }
    
    // 验证手机号是否已存在
    const phoneExists = await User.phoneExists(phone);
    if (phoneExists) {
      return res.status(400).json({ error: '手机号已被注册' });
    }
    
    // 加密密码
    const hashedPassword = await hashPassword(password);
    
    // 创建用户
    const userId = await User.create({
      username,
      phone,
      password: hashedPassword,
      roleId,
      unitId
    });
    
    res.status(201).json({
      id: userId,
      message: '用户创建成功'
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
    
    // 验证必填字段
    if (!username || !phone || !roleId) {
      return res.status(400).json({ error: '用户名、手机号和角色是必填项' });
    }
    
    // 必要的参数验证 - 员工和单位管理员必须指定单位
    if ((roleId == 1 || roleId == 2) && !unitId) {
      return res.status(400).json({ error: '员工和单位管理员必须指定单位' });
    }
    
    // 验证用户是否存在
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 验证手机号是否被其他用户使用
    if (phone !== existingUser.phone) {
      const phoneExists = await User.phoneExists(phone, id);
      if (phoneExists) {
        return res.status(400).json({ error: '手机号已被其他用户使用' });
      }
    }
    
    // 准备更新数据
    const updateData = { username, phone, roleId, unitId };
    
    // 如果提供了新密码，则更新密码
    if (password) {
      updateData.password = await hashPassword(password);
    }
    
    // 更新用户
    await User.update(id, updateData);
    
    res.json({
      id: parseInt(id),
      message: '用户信息更新成功'
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
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 检查该用户是否创建了废物记录
    const hasRecords = await User.hasWasteRecords(id);
    if (hasRecords) {
      return res.status(400).json({ error: '不能删除该用户，因为存在关联的废物记录' });
    }
    
    // 删除用户
    await User.delete(id);
    
    res.json({
      message: '用户删除成功',
      id: parseInt(id)
    });
  } catch (error) {
    next(error);
  }
};

// 修改用户状态
const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (status !== 0 && status !== 1) {
      return res.status(400).json({ error: '无效的状态值' });
    }
    
    // 验证用户是否存在
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 更新用户状态
    await User.updateStatus(id, status);
    
    res.json({
      id: parseInt(id),
      status,
      message: status === 1 ? '账号已恢复' : '账号已停用'
    });
  } catch (error) {
    next(error);
  }
};

// 更新用户个人资料
const updateUserProfile = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { username, oldPassword, newPassword } = req.body;
    
    // 验证当前用户只能修改自己的资料
    if (req.user.id != userId) {
      return res.status(403).json({ error: '您只能修改自己的个人资料' });
    }
    
    // 验证用户名
    if (!username || username.trim().length < 2) {
      return res.status(400).json({ error: '用户名不能为空且长度必须大于等于2个字符' });
    }
    
    // 获取用户当前信息（包含密码）
    const user = await User.findByIdWithPassword(userId);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    const updateData = { username };
    
    // 如果要修改密码
    if (newPassword) {
      // 验证旧密码
      if (!oldPassword) {
        return res.status(400).json({ error: '修改密码时必须提供原密码' });
      }
      
      // 检查用户是否有设置密码
      if (!user.password) {
        return res.status(400).json({ error: '该账户未设置密码，请联系管理员' });
      }
      
      // 验证旧密码是否正确
      const isPasswordValid = await comparePassword(oldPassword, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ error: '原密码不正确' });
      }
      
      // 加密新密码
      updateData.password = await hashPassword(newPassword);
    }
    
    // 更新用户资料
    await User.updateProfile(userId, updateData);
    
    res.json({ message: '个人资料已更新' });
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