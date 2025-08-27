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
const { cache, clearCache } = require('../middleware/cache');

const CACHE_PREFIX_WASTE_TYPES = '/api/waste-types';

// 获取所有废物类型（缓存1小时）
router.get('/', cache(3600), getAllWasteTypes);

// 获取废物类型详情（缓存1小时）
router.get('/:id', cache(3600), getWasteTypeById);

// 创建废物类型（清除缓存）
router.post('/', authenticateToken, requireAdmin, clearCache(CACHE_PREFIX_WASTE_TYPES), createWasteType);

// 更新废物类型信息（清除缓存）
router.put('/:id', authenticateToken, requireAdmin, clearCache(CACHE_PREFIX_WASTE_TYPES), updateWasteType);

// 删除废物类型（清除缓存）
router.delete('/:id', authenticateToken, requireAdmin, clearCache(CACHE_PREFIX_WASTE_TYPES), deleteWasteType);

module.exports = router;
