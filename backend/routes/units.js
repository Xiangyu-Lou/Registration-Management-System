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

// 获取所有单位（无需特殊权限）
router.get('/', getAllUnits);

// 获取单位详情（无需特殊权限）
router.get('/:id', getUnitById);

// 创建单位（需要超级管理员权限）
router.post('/', authenticateToken, requireSuperAdmin, createUnit);

// 更新单位信息（需要超级管理员权限）
router.put('/:id', authenticateToken, requireSuperAdmin, updateUnit);

// 删除单位（需要超级管理员权限）
router.delete('/:id', authenticateToken, requireSuperAdmin, deleteUnit);

module.exports = router; 