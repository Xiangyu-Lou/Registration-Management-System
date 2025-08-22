const express = require('express');
const router = express.Router();
const {
  getAllWasteTypes,
  getWasteTypeById,
  createWasteType,
  updateWasteType,
  deleteWasteType
} = require('../controllers/wasteTypeController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// 获取所有废物类型（无需特殊权限）
router.get('/', getAllWasteTypes);

// 获取废物类型详情（无需特殊权限）
router.get('/:id', getWasteTypeById);

// 创建废物类型（需要超级管理员权限）
router.post('/', authenticateToken, requireAdmin, createWasteType);

// 更新废物类型信息（需要超级管理员权限）
router.put('/:id', authenticateToken, requireAdmin, updateWasteType);

// 删除废物类型（需要超级管理员权限）
router.delete('/:id', authenticateToken, requireAdmin, deleteWasteType);

module.exports = router;
