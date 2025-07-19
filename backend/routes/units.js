const express = require('express');
const router = express.Router();
const {
  getAllUnits,
  getUnitById,
  createUnit,
  updateUnit,
  deleteUnit
} = require('../controllers/unitController');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');

// 获取所有单位（需要登录认证，会根据用户权限过滤）
router.get('/', authenticateToken, getAllUnits);

// 获取单位详情（需要登录认证，会根据用户权限过滤）
router.get('/:id', authenticateToken, getUnitById);

// 创建单位（需要超级管理员权限）
router.post('/', authenticateToken, requireSuperAdmin, createUnit);

// 更新单位信息（需要超级管理员权限）
router.put('/:id', authenticateToken, requireSuperAdmin, updateUnit);

// 删除单位（需要超级管理员权限）
router.delete('/:id', authenticateToken, requireSuperAdmin, deleteUnit);

module.exports = router; 