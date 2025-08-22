const express = require('express');
const router = express.Router();
const { upload } = require('../config/upload');
const {
  createWasteRecord,
  getWasteRecordsByUnit,
  getAllWasteRecords,
  getWasteRecordsByUser,
  exportWasteRecordsByUser,
  getWasteRecordDetail,
  updateWasteRecord,
  deleteWasteRecord
} = require('../controllers/wasteRecordController');
const { authenticateToken, validateSupervisorUnitAccess, requireAdmin } = require('../middleware/auth');

// 对所有废物记录路由应用认证中间件
router.use(authenticateToken);

// 创建废物记录（支持文件上传，并验证监督人员的单位权限）
router.post('/', 
  validateSupervisorUnitAccess,
  upload.fields([
    { name: 'photo_before', maxCount: 5 },
    { name: 'photo_after', maxCount: 5 }
  ]), 
  createWasteRecord
);

// 导出用户的废物记录
router.get('/export/user/:userId', exportWasteRecordsByUser);

// 获取废物记录详情
router.get('/detail/:id', getWasteRecordDetail);

// 获取指定用户创建的废物记录
router.get('/user/:userId', getWasteRecordsByUser);

// 获取特定单位的废物记录（验证监督人员的单位权限）
router.get('/unit/:unitId', validateSupervisorUnitAccess, getWasteRecordsByUnit);

// 获取所有废物记录（仅限管理员）
router.get('/', requireAdmin, getAllWasteRecords);

// 更新废物记录（支持文件上传）
router.put('/:id', 
  upload.fields([
    { name: 'photo_before', maxCount: 5 },
    { name: 'photo_after', maxCount: 5 }
  ]), 
  updateWasteRecord
);

// 删除废物记录
router.delete('/:id', deleteWasteRecord);

module.exports = router;
