const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

// 密码加密
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// 密码验证
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// 生成JWT token
const generateToken = (user, rememberMe = false) => {
  const payload = {
    id: user.id,
    username: user.username,
    phone: user.phone,
    role_id: user.role_id,
    unit_id: user.unit_id,
    company_id: user.company_id,
    company_name: user.company_name
  };
  
  const expiresIn = rememberMe ? jwtConfig.expiresIn.remember : jwtConfig.expiresIn.default;
  
  return jwt.sign(payload, jwtConfig.secret, { expiresIn });
};

// 验证JWT token
const verifyToken = (token) => {
  return jwt.verify(token, jwtConfig.secret);
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken
}; 