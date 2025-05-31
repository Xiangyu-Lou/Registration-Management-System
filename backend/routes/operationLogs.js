const express = require('express');
const router = express.Router();
const {
  getOperationLogs,
  getUserOperationLogs,
  cleanOldLogs,
  getOperationStatistics
} = require('../controllers/operationLogController');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');

// 获取操作日志列表（需要超级管理员权限）
router.get('/', authenticateToken, requireSuperAdmin, getOperationLogs);

// 获取操作统计信息（需要超级管理员权限）
router.get('/statistics', authenticateToken, requireSuperAdmin, getOperationStatistics);

// 获取指定用户的操作日志（需要超级管理员权限）
router.get('/user/:userId', authenticateToken, requireSuperAdmin, getUserOperationLogs);

// 清理旧日志（需要超级管理员权限）
router.post('/clean', authenticateToken, requireSuperAdmin, cleanOldLogs);

module.exports = router; 