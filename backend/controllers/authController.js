const User = require('../models/User');
const { comparePassword, generateToken } = require('../utils/auth');
const { logLogin } = require('../utils/logger');

// 用户登录
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: '用户名和密码不能为空' });
    }

    const user = await User.findByPhoneForAuth(username);

    if (!user) {
      return res.status(401).json({ message: '无效的用户名或密码' });
    }

    const passwordMatch = await comparePassword(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: '无效的用户名或密码' });
    }

    const token = generateToken(user);

    res.json({ token });

  } catch (error) {
    next(error);
  }
};

module.exports = { login };