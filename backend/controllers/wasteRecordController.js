const WasteRecord = require('../models/WasteRecord');
const User = require('../models/User');
const { verifyToken } = require('../utils/auth');
const { processUploadedFiles, deletePhotoFiles, mergePhotoFiles, removeSpecificPhotoFiles } = require('../utils/fileUtils');
const path = require('path');

// 创建废物记录
const createWasteRecord = async (req, res, next) => {
  try {
    const { unitId, wasteTypeId, location, collectionDate, collectionTime, quantity, remarks, process } = req.body;
    
    // 验证必填字段
    if (!unitId || !wasteTypeId || !location || !process) {
      return res.status(400).json({ error: '单位、废物类型、位置和产生工序是必填字段' });
    }

    // 处理quantity字段
    const quantityValue = quantity === undefined || quantity === 'undefined' || quantity === '' ? null : quantity;
    
    // 验证单位和废物类型是否存在
    const unitExists = await WasteRecord.validateUnit(unitId);
    if (!unitExists) {
      return res.status(400).json({ error: '单位不存在' });
    }
    
    const wasteTypeExists = await WasteRecord.validateWasteType(wasteTypeId);
    if (!wasteTypeExists) {
      return res.status(400).json({ error: '废物类型不存在' });
    }
    
    // 格式化收集时间
    const collectionStartTime = collectionDate && collectionTime ? `${collectionDate} ${collectionTime}` : null;
    
    // 处理上传的照片
    const photoPathBefore = processUploadedFiles(req.files.photo_before);
    const photoPathAfter = processUploadedFiles(req.files.photo_after);
    
    // 获取当前用户信息
    const userId = req.body.creator_id || (req.user ? req.user.id : null);
    
    // 检查用户是否为监督人员
    let isSupervisedValue = null;
    if (userId) {
      const user = await User.findById(userId);
      if (user && user.role_id === 4) { // 监督人员
        isSupervisedValue = 1;
      }
    }
    
    // 创建记录
    const recordId = await WasteRecord.create({
      unitId,
      wasteTypeId,
      location,
      collectionStartTime,
      photoPathBefore,
      photoPathAfter,
      quantity: quantityValue,
      creatorId: userId,
      remarks,
      process,
      isSupervised: isSupervisedValue
    });
    
    res.status(201).json({
      message: '废物记录添加成功',
      id: recordId
    });
  } catch (error) {
    next(error);
  }
};

// 获取特定单位的废物记录
const getWasteRecordsByUnit = async (req, res, next) => {
  try {
    const { unitId } = req.params;
    
    // 判断用户角色
    const token = req.headers.authorization?.split(' ')[1];
    let isAdmin = false;
    
    if (token) {
      try {
        const decoded = verifyToken(token);
        isAdmin = decoded.role_id === 3; // 只有超级管理员可以看到所有数据
      } catch (err) {
        console.error('Token验证失败:', err);
      }
    }
    
    const records = await WasteRecord.findByUnitId(unitId, isAdmin);
    res.json(records);
  } catch (error) {
    next(error);
  }
};

// 获取所有废物记录
const getAllWasteRecords = async (req, res, next) => {
  try {
    const records = await WasteRecord.findAll();
    res.json(records);
  } catch (error) {
    next(error);
  }
};

// 获取用户创建的废物记录（支持分页）
const getWasteRecordsByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const filters = req.query;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    const result = await WasteRecord.findByUser(userId, user, filters);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// 导出用户的废物记录
const exportWasteRecordsByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const filters = req.query;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    const records = await WasteRecord.exportByUser(userId, user, filters);
    res.json(records);
  } catch (error) {
    next(error);
  }
};

// 获取单个废物记录详情
const getWasteRecordDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const record = await WasteRecord.findById(id);
    
    if (!record) {
      return res.status(404).json({ error: '记录不存在' });
    }
    
    res.json(record);
  } catch (error) {
    next(error);
  }
};

// 更新废物记录
const updateWasteRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      unitId, 
      wasteTypeId, 
      location, 
      collectionDate, 
      collectionTime, 
      quantity, 
      photo_path_before, 
      photo_path_after, 
      remarks, 
      process,
      photos_to_remove_before,  // 要删除的收集前照片列表
      photos_to_remove_after    // 要删除的收集后照片列表
    } = req.body;
    
    // 验证记录是否存在
    const record = await WasteRecord.findById(id);
    if (!record) {
      return res.status(404).json({ error: '记录不存在' });
    }
    
    // 处理quantity字段
    const quantityValue = quantity === undefined || quantity === 'undefined' || quantity === '' ? null : quantity;
    
    // 处理照片更新（支持删除指定照片和添加新照片）
    let newPhotoPathBefore = record.photo_path_before;
    let newPhotoPathAfter = record.photo_path_after;
    
    // 处理收集前照片
    // 1. 先删除指定要删除的照片
    if (photos_to_remove_before) {
      let photosToRemove = [];
      try {
        photosToRemove = JSON.parse(photos_to_remove_before);
      } catch (e) {
        photosToRemove = [photos_to_remove_before];
      }
      newPhotoPathBefore = removeSpecificPhotoFiles(newPhotoPathBefore, photosToRemove, path.join(__dirname, '../..'));
    }
    
    // 2. 然后添加新上传的照片
    if (req.files.photo_before && req.files.photo_before.length > 0) {
      // 合并现有照片和新照片
      newPhotoPathBefore = mergePhotoFiles(newPhotoPathBefore, req.files.photo_before);
    } else if (photo_path_before === 'NULL') {
      // 清空所有照片
      if (newPhotoPathBefore) {
        deletePhotoFiles(newPhotoPathBefore, path.join(__dirname, '../..'));
      }
      newPhotoPathBefore = null;
    } else if (photo_path_before && photo_path_before !== 'undefined') {
      // 直接设置照片路径（兼容旧的接口）
      newPhotoPathBefore = photo_path_before;
    }
    
    // 处理收集后照片
    // 1. 先删除指定要删除的照片
    if (photos_to_remove_after) {
      let photosToRemove = [];
      try {
        photosToRemove = JSON.parse(photos_to_remove_after);
      } catch (e) {
        photosToRemove = [photos_to_remove_after];
      }
      newPhotoPathAfter = removeSpecificPhotoFiles(newPhotoPathAfter, photosToRemove, path.join(__dirname, '../..'));
    }
    
    // 2. 然后添加新上传的照片
    if (req.files.photo_after && req.files.photo_after.length > 0) {
      // 合并现有照片和新照片
      newPhotoPathAfter = mergePhotoFiles(newPhotoPathAfter, req.files.photo_after);
    } else if (photo_path_after === 'NULL') {
      // 清空所有照片
      if (newPhotoPathAfter) {
        deletePhotoFiles(newPhotoPathAfter, path.join(__dirname, '../..'));
      }
      newPhotoPathAfter = null;
    } else if (photo_path_after && photo_path_after !== 'undefined') {
      // 直接设置照片路径（兼容旧的接口）
      newPhotoPathAfter = photo_path_after;
    }
    
    // 格式化收集时间
    const collectionStartTime = collectionDate && collectionTime ? `${collectionDate} ${collectionTime}` : null;
    
    // 更新记录
    await WasteRecord.update(id, {
      unitId,
      wasteTypeId,
      location,
      collectionStartTime,
      photoPathBefore: newPhotoPathBefore,
      photoPathAfter: newPhotoPathAfter,
      quantity: quantityValue,
      remarks,
      process
    });
    
    res.json({
      message: '废物记录更新成功',
      id: parseInt(id)
    });
  } catch (error) {
    next(error);
  }
};

// 删除废物记录
const deleteWasteRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // 验证记录是否存在
    const record = await WasteRecord.findById(id);
    if (!record) {
      return res.status(404).json({ error: '记录不存在' });
    }
    
    // 删除照片文件
    if (record.photo_path_before) {
      deletePhotoFiles(record.photo_path_before, path.join(__dirname, '../..'));
    }
    
    if (record.photo_path_after) {
      deletePhotoFiles(record.photo_path_after, path.join(__dirname, '../..'));
    }
    
    // 删除记录
    await WasteRecord.delete(id);
    
    res.json({
      message: '废物记录删除成功',
      id: parseInt(id)
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createWasteRecord,
  getWasteRecordsByUnit,
  getAllWasteRecords,
  getWasteRecordsByUser,
  exportWasteRecordsByUser,
  getWasteRecordDetail,
  updateWasteRecord,
  deleteWasteRecord
}; 