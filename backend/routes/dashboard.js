const express = require('express');
const router = express.Router();
const { getDashboardData } = require('../controllers/dashboardController');
const { isAuthenticated, isManager } = require('../middleware/auth'); // 假设您有权限中间件

// 定义仪表盘数据路由
// GET /api/dashboard
// 需要登录和管理员权限
router.get('/', isAuthenticated, isManager, getDashboardData);

module.exports = router;
