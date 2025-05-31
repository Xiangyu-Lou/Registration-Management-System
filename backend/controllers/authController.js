const User = require('../models/User');
const { hashPassword, comparePassword, generateToken } = require('../utils/auth');
const { logLogin } = require('../utils/logger');

// 用户登录
const login = async (req, res, next) => {
  try {
    const { phone, password, rememberMe } = req.body;
    
    // 验证用户是否存在
    const user = await User.findByPhoneForAuth(phone);
    if (!user) {
      // 记录登录失败日志
      await logLogin(req, null, phone, false, '用户不存在');
      return res.status(401).json({ error: '用户不存在' });
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
    
    // 验证密码 - 支持空密码用户(主要是兼容历史数据)
    if (user.password) {
      if (!password) {
        // 记录登录失败日志
        await logLogin(req, user.id, user.username || user.phone, false, '未输入密码', {
          userId: user.id,
          username: user.username,
          phone: user.phone,
          roleName: user.role_name,
          unitName: user.unit_name
        });
        return res.status(401).json({ error: '请输入密码' });
      }
      
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
        return res.status(401).json({ error: '密码错误' });
      }
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