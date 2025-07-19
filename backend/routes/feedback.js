const express = require('express');
const router = express.Router();
const {
  createFeedback,
  getUserFeedbacks,
  getAllFeedbacks,
  getFeedbackById,
  updateFeedbackStatus,
  deleteFeedback,
  getFeedbackStats
} = require('../controllers/feedbackController');
const { authenticateToken } = require('../middleware/auth');

// 创建问题反馈
router.post('/', authenticateToken, createFeedback);

// 获取用户的问题反馈列表
router.get('/user', authenticateToken, getUserFeedbacks);

// 获取所有问题反馈（管理员专用）
router.get('/admin', authenticateToken, getAllFeedbacks);

// 获取问题反馈统计（管理员专用）
router.get('/stats', authenticateToken, getFeedbackStats);

// 获取问题反馈详情
router.get('/:id', authenticateToken, getFeedbackById);

// 更新问题反馈状态（管理员专用）
router.put('/:id/status', authenticateToken, updateFeedbackStatus);

// 删除问题反馈
router.delete('/:id', authenticateToken, deleteFeedback);

module.exports = router; 