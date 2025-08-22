const { verifyToken } = require('../utils/auth');
const User = require('../models/User');

// 定义角色常量，提高代码可读性和可维护性
const ROLES = {
  EMPLOYEE: 1,
  UNIT_ADMIN: 2,
  COMPANY_ADMIN: 3,
  SUPERVISOR: 4,
  SYSTEM_ADMIN: 5,
};

// 验证JWT token的中间件
// 这个中间件应该在所有需要认证的路由之前被调用
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // 将解码后的用户信息附加到请求对象上
    next();
  } catch (error) {
    return res.status(401).json({ error: '无效的认证令牌' });
  }
};

// 通用的授权中间件，用于检查用户是否具有指定的角色之一
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    // 确保authenticateToken中间件已经运行
    if (!req.user) {
      return res.status(401).json({ error: '用户未认证' });
    }

    const { role_id } = req.user;
    if (!allowedRoles.includes(role_id)) {
      return res.status(403).json({ error: '没有足够的权限' });
    }
    next();
  };
};

// 检查是否为监督人员（用于特定场景的访问控制）
const blockSupervisor = (req, res, next) => {
  if (req.user && req.user.role_id === ROLES.SUPERVISOR) {
    return res.status(403).json({ error: '监督人员无权执行此操作' });
  }
  next();
};

// 检查是否有修改日志查看权限的权限
const requireLogViewPermission = async (req, res, next) => {
  try {
    // 监督人员无权修改日志权限
    if (req.user.role_id === ROLES.SUPERVISOR) {
      return res.status(403).json({ error: '监督人员无权修改日志权限' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    if (!user.can_view_logs) {
      return res.status(403).json({ error: '只有有权限查看日志的用户才能修改其他人的日志权限' });
    }
    
    next();
  } catch (error) {
    console.error('检查日志查看权限失败:', error);
    return res.status(500).json({ error: '权限验证失败' });
  }
};

// 验证监督人员对其公司下单位的访问权限
const validateSupervisorUnitAccess = async (req, res, next) => {
  // 只对监督人员进行检查
  if (!req.user || req.user.role_id !== ROLES.SUPERVISOR) {
    return next();
  }

  try {
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
    next();
  } catch (error) {
    console.error('验证监督人员单位访问权限失败:', error);
    return res.status(500).json({ error: '权限验证失败' });
  }
};

module.exports = {
  ROLES,
  authenticateToken,
  authorize,
  blockSupervisor,
  requireLogViewPermission,
  validateSupervisorUnitAccess,
  // 导出具体的角色检查中间件，方便在路由中直接使用
  requireSystemAdmin: authorize([ROLES.SYSTEM_ADMIN]),
  requireCompanyAdmin: authorize([ROLES.COMPANY_ADMIN, ROLES.SYSTEM_ADMIN]),
  // 注意：之前的superadmin包含公司管理员，监督员和系统管理员，现在重命名为requireAdmin
  requireAdmin: authorize([ROLES.COMPANY_ADMIN, ROLES.SUPERVISOR, ROLES.SYSTEM_ADMIN]),
  requireUnitAdmin: authorize([ROLES.UNIT_ADMIN, ROLES.COMPANY_ADMIN, ROLES.SYSTEM_ADMIN]),
};
