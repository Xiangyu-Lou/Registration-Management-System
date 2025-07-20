const { verifyToken } = require('../utils/auth');
const User = require('../models/User');

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

// 检查系统超级管理员权限
const requireSystemAdmin = (req, res, next) => {
  if (!req.user || req.user.role_id !== 5) {
    return res.status(403).json({ error: '需要系统超级管理员权限' });
  }
  next();
};

// 检查公司级管理员权限（公司管理员或系统超级管理员）
const requireCompanyAdmin = (req, res, next) => {
  if (!req.user || (req.user.role_id !== 3 && req.user.role_id !== 5)) {
    return res.status(403).json({ error: '需要公司管理员权限' });
  }
  next();
};

// 检查超级管理员权限（兼容原有逻辑：公司管理员、监督人员或系统超级管理员）
const requireSuperAdmin = (req, res, next) => {
  if (!req.user || (req.user.role_id !== 3 && req.user.role_id !== 4 && req.user.role_id !== 5)) {
    return res.status(403).json({ error: '需要管理员权限' });
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
    // 设置用户信息到请求对象
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: '无效的令牌' });
  }
};

// 检查是否有查看日志的权限（用于修改其他人的日志权限）
const requireLogViewPermission = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: '未授权' });
  }
  
  try {
    const decoded = verifyToken(token);
    
    // 检查用户是否为监督人员
    if (decoded.role_id === 4) {
      return res.status(403).json({ error: '监督人员无权修改日志权限' });
    }
    
    // 从数据库获取用户完整信息以检查日志查看权限
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 检查用户是否有查看日志的权限
    if (!user.can_view_logs) {
      return res.status(403).json({ error: '只有有权限查看日志的用户才能修改其他人的日志权限' });
    }
    
    // 设置用户信息到请求对象
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: '无效的令牌' });
  }
};

// 验证监督人员单位访问权限
const validateSupervisorUnitAccess = async (req, res, next) => {
  try {
    // 只对监督人员进行检查
    if (req.user && req.user.role_id === 4) {
      // 从参数或请求体中获取单位ID
      const unitId = req.params.unitId || req.params.id || req.body.unitId;
      
      if (unitId) {
        const Unit = require('../models/Unit');
        const unit = await Unit.findById(unitId);
        
        if (!unit) {
          return res.status(404).json({ error: '单位不存在' });
        }
        
        // 检查单位是否属于监督人员的公司
        if (unit.company_id !== req.user.company_id) {
          return res.status(403).json({ error: '监督人员只能操作本公司单位' });
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('验证监督人员单位访问权限失败:', error);
    return res.status(500).json({ error: '权限验证失败' });
  }
};

module.exports = {
  authenticate: authenticateToken,  // 为了保持与现有代码的兼容性
  authenticateToken,
  requireSystemAdmin,
  requireCompanyAdmin,
  requireSuperAdmin,
  requireUnitAdmin,
  blockSupervisor,
  requireLogViewPermission,
  validateSupervisorUnitAccess
}; 