const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUsersByUnit,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  updateUserProfile,
  updateUserLogPermission
} = require('../controllers/userController');
const {
  authenticateToken,
  blockSupervisor,
  requireLogViewPermission,
  requireAdmin
} = require('../middleware/auth');

// 所有用户路由都需要认证
router.use(authenticateToken);

// 获取所有用户（管理员和单位管理员，但阻止监督人员）
router.get('/', requireAdmin, blockSupervisor, getAllUsers);

// 获取指定单位的用户（管理员和单位管理员，但阻止监督人员）
router.get('/unit/:unitId', requireAdmin, blockSupervisor, getUsersByUnit);

// 更新用户个人资料（任何认证用户都可以更新自己的个人资料）
router.put('/:id/profile', updateUserProfile);

// 修改用户状态（管理员，但阻止监督人员）
router.put('/:id/status', requireAdmin, blockSupervisor, updateUserStatus);

// 修改用户日志查看权限（需要特定权限）
router.put('/:id/log-permission', requireLogViewPermission, updateUserLogPermission);

// 获取单个用户信息（管理员，但阻止监督人员）
router.get('/:id', requireAdmin, blockSupervisor, getUserById);

// 创建用户（管理员，但阻止监督人员）
router.post('/', requireAdmin, blockSupervisor, createUser);

// 更新用户信息（管理员，但阻止监督人员）
router.put('/:id', requireAdmin, blockSupervisor, updateUser);

// 删除用户（管理员，但阻止监督人员）
router.delete('/:id', requireAdmin, blockSupervisor, deleteUser);

module.exports = router;
