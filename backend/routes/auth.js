const express = require('express');
const router = express.Router();
const { login, test } = require('../controllers/authController');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: 用户认证相关接口
 */

/**
 * @swagger
 * /test:
 *   get:
 *     summary: 测试API连通性
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: API正常工作
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Auth test route is working!
 */
router.get('/test', test);

/**
 * @swagger
 * /login:
 *   post:
 *     summary: 用户登录
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: 用户名
 *                 example: admin
 *               password:
 *                 type: string
 *                 description: 密码
 *                 example: 123456
 *     responses:
 *       200:
 *         description: 登录成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 登录成功
 *                 token:
 *                   type: string
 *                   description: JWT令牌
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     role_id:
 *                       type: integer
 *                     company_id:
 *                        type: integer
 *       400:
 *         description: 用户名或密码为空
 *       401:
 *         description: 用户名或密码错误
 *       500:
 *         description: 服务器内部错误
 */
router.post('/login', login);

module.exports = router;