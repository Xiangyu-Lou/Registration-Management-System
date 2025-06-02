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
const { authenticateToken, blockSupervisor } = require('../middleware/auth');

// 获取所有用户（阻止监督人员访问）
router.get('/', blockSupervisor, getAllUsers);

// 获取指定单位的用户（阻止监督人员访问）
router.get('/unit/:unitId', blockSupervisor, getUsersByUnit);

// 更新用户个人资料（需要认证）
router.put('/:id/profile', authenticateToken, updateUserProfile);

// 修改用户状态（阻止监督人员访问）
router.put('/:id/status', blockSupervisor, updateUserStatus);

// 修改用户日志查看权限（阻止监督人员访问）
router.put('/:id/log-permission', blockSupervisor, updateUserLogPermission);

// 获取单个用户信息（阻止监督人员访问）
router.get('/:id', blockSupervisor, getUserById);

// 创建用户（阻止监督人员访问）
router.post('/', blockSupervisor, createUser);

// 更新用户信息（阻止监督人员访问）
router.put('/:id', blockSupervisor, updateUser);

// 删除用户（阻止监督人员访问）
router.delete('/:id', blockSupervisor, deleteUser);

module.exports = router; 