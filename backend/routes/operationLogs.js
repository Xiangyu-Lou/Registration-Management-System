const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getOperationLogs,
  getOperationStats,
  getUserOperationStats,
  exportOperationLogs
} = require('../controllers/operationLogController');

// 所有操作日志路由都需要认证
router.use(authenticateToken);

// 获取操作日志（带分页和筛选）
router.get('/', getOperationLogs);

// 获取操作类型统计
router.get('/stats', getOperationStats);

// 获取用户操作统计
router.get('/user-stats', getUserOperationStats);

// 导出操作日志
router.get('/export', exportOperationLogs);

module.exports = router; 