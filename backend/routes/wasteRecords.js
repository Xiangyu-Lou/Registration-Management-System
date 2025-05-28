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
const { authenticateToken } = require('../middleware/auth');

// 创建废物记录（需要认证，支持文件上传）
router.post('/', 
  authenticateToken, 
  upload.fields([
    { name: 'photo_before', maxCount: 5 },
    { name: 'photo_after', maxCount: 5 }
  ]), 
  createWasteRecord
);

// 导出用户的废物记录（必须在 /user/:userId 之前）
router.get('/export/user/:userId', exportWasteRecordsByUser);

// 获取单个废物记录详情（必须在 /:id 之前）
router.get('/detail/:id', getWasteRecordDetail);

// 获取用户创建的废物记录（支持分页）
router.get('/user/:userId', getWasteRecordsByUser);

// 获取特定单位的废物记录
router.get('/:unitId', getWasteRecordsByUnit);

// 获取所有废物记录（用于管理员查看）
router.get('/', getAllWasteRecords);

// 更新废物记录（需要认证，支持文件上传）
router.put('/:id', 
  authenticateToken, 
  upload.fields([
    { name: 'photo_before', maxCount: 5 },
    { name: 'photo_after', maxCount: 5 }
  ]), 
  updateWasteRecord
);

// 删除废物记录（需要认证）
router.delete('/:id', authenticateToken, deleteWasteRecord);

module.exports = router; 