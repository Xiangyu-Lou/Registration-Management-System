const express = require('express');
const router = express.Router();
const { login, test } = require('../controllers/authController');

// 测试路由
router.get('/test', test);

// 用户登录
router.post('/login', login);

module.exports = router; 