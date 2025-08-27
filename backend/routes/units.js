const express = require('express');
const router = express.Router();
const {
  getAllUnits,
  getUnitById,
  createUnit,
  updateUnit,
  deleteUnit
} = require('../controllers/unitController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { cache, clearCache } = require('../middleware/cache');

const CACHE_PREFIX_UNITS = '/api/units';

// 获取所有单位（缓存1小时）
router.get('/', authenticateToken, cache(3600), getAllUnits);

// 获取单位详情（缓存1小时）
router.get('/:id', authenticateToken, cache(3600), getUnitById);

// 创建单位（清除缓存）
router.post('/', authenticateToken, requireAdmin, clearCache(CACHE_PREFIX_UNITS), createUnit);

// 更新单位信息（清除缓存）
router.put('/:id', authenticateToken, requireAdmin, clearCache(CACHE_PREFIX_UNITS), updateUnit);

// 删除单位（清除缓存）
router.delete('/:id', authenticateToken, requireAdmin, clearCache(CACHE_PREFIX_UNITS), deleteUnit);

module.exports = router; 