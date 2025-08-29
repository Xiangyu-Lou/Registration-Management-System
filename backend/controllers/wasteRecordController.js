const WasteRecord = require('../models/WasteRecord');
const User = require('../models/User');
const { verifyToken } = require('../utils/auth');
const { processUploadedFiles, deletePhotoFiles, mergePhotoFiles, removeSpecificPhotoFiles } = require('../utils/fileUtils');
const { logWasteRecordOperation } = require('../utils/logger');
const { parseCollectionTime } = require('../utils/dateUtils');
const path = require('path');
const { broadcast } = require('../websocket');

// 创建废物记录
const createWasteRecord = async (req, res, next) => {
  try {
    const { 
      unitId, 
      wasteTypeId, 
      location, 
      collectionDate, 
      collectionTime, 
      quantity, 
      remarks, 
      process,
      longitude,
      latitude,
      address,
      district,
      city,
      province
    } = req.body;
    
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
    
    // 监督人员单位访问权限验证
    if (req.user && req.user.role_id === 4) {
      const Unit = require('../models/Unit');
      const unit = await Unit.findById(unitId);
      if (!unit || unit.company_id !== req.user.company_id) {
        return res.status(403).json({ error: '监督人员只能在本公司单位创建记录' });
      }
    }
    
    // 使用工具函数格式化收集时间，确保时区一致性
    const collectionStartTime = parseCollectionTime(collectionDate, collectionTime);
    
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
    
    // 获取公司ID（从当前用户）
    const companyId = req.user ? req.user.company_id : null;
    
    // 处理位置信息 - 确保数值类型正确
    const locationData = {
      longitude: longitude ? parseFloat(longitude) : null,
      latitude: latitude ? parseFloat(latitude) : null,
      address: address || null,
      district: district || null,
      city: city || null,
      province: province || null
    };
    
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
      isSupervised: isSupervisedValue,
      companyId,
      ...locationData
    });
    
    // 获取创建后的完整记录信息用于日志和通知
    const createdRecord = await WasteRecord.findById(recordId);

    // 发送 WebSocket 通知
    broadcast({
      type: 'NEW_WASTE_RECORD',
      payload: createdRecord
    });
    
    // 记录操作日志
    const quantityText = quantityValue !== null ? `${quantityValue}吨` : '未填写';
    const collectionTimeText = collectionStartTime || '未填写';
    const remarksText = remarks || '无';
    const photoBeforeCount = req.files.photo_before ? req.files.photo_before.length : 0;
    const photoAfterCount = req.files.photo_after ? req.files.photo_after.length : 0;
    const supervisionText = isSupervisedValue ? ' [监督数据]' : '';
    
    await logWasteRecordOperation(
      req, 
      'create', 
      recordId, 
      userId, 
      `创建废物记录${supervisionText} - 单位: ${createdRecord.unit_name}, 废物类型: ${createdRecord.waste_type_name}, 位置: ${location}, 工序: ${process}, 数量: ${quantityText}, 收集时间: ${collectionTimeText}, 收集前照片: ${photoBeforeCount}张, 收集后照片: ${photoAfterCount}张, 备注: ${remarksText}`,
      {
        unitId,
        unitName: createdRecord.unit_name,
        wasteTypeId,
        wasteTypeName: createdRecord.waste_type_name,
        location,
        quantity: quantityValue,
        process,
        collectionTime: collectionStartTime,
        remarks,
        photoBeforeCount,
        photoAfterCount,
        isSupervised: isSupervisedValue
      }
    );
    
    res.status(201).json({
      message: '废物记录添加成功',
      id: recordId
    });
  } catch (error) {
    next(error);
  }
};

// ... (其他GET方法保持不变) ...

// 更新废物记录
const updateWasteRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    // ... (更新逻辑) ...

    // 获取更新后的完整记录信息
    const updatedRecord = await WasteRecord.findById(id);

    // 发送 WebSocket 通知
    broadcast({
      type: 'UPDATE_WASTE_RECORD',
      payload: updatedRecord
    });
    
    // ... (日志记录逻辑) ...
    
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
    const record = await WasteRecord.findById(id);
    // ... (删除逻辑) ...

    // 发送 WebSocket 通知
    broadcast({
      type: 'DELETE_WASTE_RECORD',
      payload: { id: parseInt(id), unitName: record.unit_name, wasteTypeName: record.waste_type_name }
    });

    // ... (日志记录逻辑) ...
    
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