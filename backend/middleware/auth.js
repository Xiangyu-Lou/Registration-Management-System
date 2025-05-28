const { verifyToken } = require('../utils/auth');

// 验证JWT token的中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: '无效的认证令牌' });
  }
};

// 检查超级管理员权限
const requireSuperAdmin = (req, res, next) => {
  if (!req.user || (req.user.role_id !== 3 && req.user.role_id !== 4)) {
    return res.status(403).json({ error: '需要超级管理员权限' });
  }
  next();
};

// 检查单位管理员权限
const requireUnitAdmin = (req, res, next) => {
  if (!req.user || req.user.role_id < 2) {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
};

// 检查是否为监督人员（阻止监督人员访问用户管理）
const blockSupervisor = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: '未授权' });
  }
  
  try {
    const decoded = verifyToken(token);
    // 检查用户是否为监督人员
    if (decoded.role_id === 4) {
      return res.status(403).json({ error: '没有权限访问用户管理' });
    }
    // 不是监督人员，继续执行
    next();
  } catch (error) {
    return res.status(401).json({ error: '无效的令牌' });
  }
};

module.exports = {
  authenticateToken,
  requireSuperAdmin,
  requireUnitAdmin,
  blockSupervisor
}; 