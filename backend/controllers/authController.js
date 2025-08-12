const User = require('../models/User');
const { hashPassword, comparePassword, generateToken } = require('../utils/auth');
const { logLogin } = require('../utils/logger');

// 用户登录
const login = async (req, res, next) => {
  try {
    const { phone, password, rememberMe } = req.body;
    
    // 验证必填字段
    if (!phone || !password) {
      return res.status(400).json({ error: '手机号和密码都是必填字段' });
    }
    
    // 验证用户是否存在
    const user = await User.findByPhoneForAuth(phone);
    if (!user) {
      // 记录登录失败日志
      await logLogin(req, null, phone, false, '用户不存在');
      return res.status(401).json({ error: '用户名或密码错误' }); // 统一错误信息，避免用户枚举
    }
    
    // 检查用户状态
    if (user.status === 0) {
      // 记录登录失败日志
      await logLogin(req, user.id, user.username || user.phone, false, '账号已停用', {
        userId: user.id,
        username: user.username,
        phone: user.phone,
        roleName: user.role_name,
        unitName: user.unit_name
      });
      return res.status(403).json({ error: '账号已停用，请联系管理员' });
    }
    
    // 检查用户是否设置了密码
    if (!user.password) {
      // 记录登录失败日志
      await logLogin(req, user.id, user.username || user.phone, false, '账号未设置密码', {
        userId: user.id,
        username: user.username,
        phone: user.phone,
        roleName: user.role_name,
        unitName: user.unit_name
      });
      return res.status(401).json({ error: '账号未设置密码，请联系管理员重置密码' });
    }
    
    // 验证密码
    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      // 记录登录失败日志
      await logLogin(req, user.id, user.username || user.phone, false, '密码错误', {
        userId: user.id,
        username: user.username,
        phone: user.phone,
        roleName: user.role_name,
        unitName: user.unit_name
      });
      return res.status(401).json({ error: '用户名或密码错误' }); // 统一错误信息
    }

    // 生成 token
    const token = generateToken(user, rememberMe);
    
    // 记录登录成功日志
    await logLogin(req, user.id, user.username || user.phone, true, '登录成功', {
      userId: user.id,
      username: user.username,
      phone: user.phone,
      roleName: user.role_name,
      unitName: user.unit_name,
      rememberMe: !!rememberMe
    });
    
    // 返回用户信息
    res.json({
      id: user.id,
      username: user.username,
      phone: user.phone,
      role: user.role_name,
      role_id: user.role_id,
      unit_id: user.unit_id,
      unit_name: user.unit_name,
      company_id: user.company_id,
      company_name: user.company_name,
      can_view_logs: user.can_view_logs,
      token
    });
  } catch (error) {
    next(error);
  }
};

// 测试接口
const test = (req, res) => {
  res.json({ message: '服务器运行正常' });
};

module.exports = {
  login,
  test
}; 