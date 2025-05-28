const User = require('../models/User');
const { hashPassword, comparePassword, generateToken } = require('../utils/auth');

// 用户登录
const login = async (req, res, next) => {
  try {
    const { phone, password, rememberMe } = req.body;
    
    // 验证用户是否存在
    const user = await User.findByPhoneForAuth(phone);
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }
    
    // 检查用户状态
    if (user.status === 0) {
      return res.status(403).json({ error: '账号已停用，请联系管理员' });
    }
    
    // 验证密码 - 支持空密码用户(主要是兼容历史数据)
    if (user.password) {
      if (!password) {
        return res.status(401).json({ error: '请输入密码' });
      }
      
      const passwordMatch = await comparePassword(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: '密码错误' });
      }
    }

    // 生成 token
    const token = generateToken(user, rememberMe);
    
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