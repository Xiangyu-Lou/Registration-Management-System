const WasteRecord = require('../models/WasteRecord');
const User = require('../models/User');
const { verifyToken } = require('../utils/auth');
const { processUploadedFiles, deletePhotoFiles, mergePhotoFiles, removeSpecificPhotoFiles } = require('../utils/fileUtils');
const { logWasteRecordOperation } = require('../utils/logger');
const { parseCollectionTime } = require('../utils/dateUtils');
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
      companyId
    });
    
    // 获取创建后的完整记录信息用于日志
    const createdRecord = await WasteRecord.findById(recordId);
    
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

// 获取特定单位的废物记录
const getWasteRecordsByUnit = async (req, res, next) => {
  try {
    const { unitId } = req.params;
    
    const records = await WasteRecord.findByUnitId(unitId, req.user);
    res.json(records);
  } catch (error) {
    next(error);
  }
};

// 获取所有废物记录（根据用户权限过滤）
const getAllWasteRecords = async (req, res, next) => {
  try {
    const records = await WasteRecord.findAll(req.user);
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
    
    // 获取导出类型参数
    const exportType = req.query.exportType || 'unknown';
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    const records = await WasteRecord.exportByUser(userId, user, filters);
    
    // 记录导出操作日志
    const currentUserId = req.user ? req.user.id : userId;
    
    // 获取导出类型的中文描述
    const exportTypeNames = {
      'no_images': '无照片导出',
      'first_image': '包含首张照片导出', 
      'all_images': '包含全部照片导出'
    };
    const exportTypeName = exportTypeNames[exportType] || '未知导出方式';
    
    // 构建筛选条件描述
    let filterDesc = [];
    if (filters.unitId) {
      // 如果有单位筛选，获取单位名称
      try {
        const Unit = require('../models/Unit');
        const unit = await Unit.findById(filters.unitId);
        if (unit) {
          filterDesc.push(`单位: ${unit.name}`);
        }
      } catch (e) {
        filterDesc.push(`单位ID: ${filters.unitId}`);
      }
    }
    if (filters.wasteTypeId) {
      filterDesc.push(`废物类型ID: ${filters.wasteTypeId}`);
    }
    if (filters.location) {
      filterDesc.push(`地点: ${filters.location}`);
    }
    if (filters.process) {
      filterDesc.push(`工序: ${filters.process}`);
    }
    if (filters.dateRange) {
      filterDesc.push(`日期范围: ${filters.dateRange}`);
    }
    if (filters.minQuantity || filters.maxQuantity) {
      const minQty = filters.minQuantity || '不限';
      const maxQty = filters.maxQuantity || '不限';
      filterDesc.push(`数量范围: ${minQty} - ${maxQty}吨`);
    }
    
    const filterText = filterDesc.length > 0 ? `, 筛选条件: ${filterDesc.join(', ')}` : ', 无筛选条件';
    const userRoleDesc = user.role_id === 3 ? '超级管理员' : (user.role_id === 2 ? '单位管理员' : (user.role_id === 4 ? '监督人员' : '基层员工'));
    
    await logWasteRecordOperation(
      req, 
      'create', // 导出操作使用create类型，表示创建了导出文件
      null, // 没有特定的记录ID
      currentUserId, 
      `导出废物记录 - 方式: ${exportTypeName}, 数据条数: ${records.length}条, 操作角色: ${userRoleDesc}${filterText}`,
      {
        exportType,
        exportTypeName,
        recordCount: records.length,
        userRole: user.role_id,
        userRoleName: userRoleDesc,
        filters: filters,
        targetUserId: parseInt(userId)
      }
    );
    
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
      photos_to_remove_after,   // 要删除的收集后照片列表
      companyId                 // 公司ID（仅系统超级管理员可修改）
    } = req.body;
    
    // 验证记录是否存在
    const record = await WasteRecord.findById(id);
    if (!record) {
      return res.status(404).json({ error: '记录不存在' });
    }
    
    // 获取当前用户ID
    const userId = req.user ? req.user.id : null;
    
    // 记录更新前的数据用于日志
    const beforeData = {
      location: record.location,
      quantity: record.quantity,
      process: record.process,
      unitId: record.unit_id,
      unitName: record.unit_name,
      wasteTypeId: record.waste_type_id,
      wasteTypeName: record.waste_type_name,
      remarks: record.remarks,
      collectionTime: record.collection_start_time
    };
    
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
    
    // 使用工具函数格式化收集时间，确保时区一致性
    const collectionStartTime = parseCollectionTime(collectionDate, collectionTime);
    
    // 确定公司ID（仅系统超级管理员可修改）
    let updateCompanyId = undefined;
    if (companyId !== undefined && req.user?.role_id === 5) {
      updateCompanyId = companyId;
    }
    
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
      process,
      companyId: updateCompanyId
    });
    
    // 获取更新后的完整记录信息
    const updatedRecord = await WasteRecord.findById(id);
    
    // 记录更新后的数据用于日志
    const afterData = {
      location,
      quantity: quantityValue,
      process,
      unitId,
      unitName: updatedRecord.unit_name,
      wasteTypeId,
      wasteTypeName: updatedRecord.waste_type_name,
      remarks,
      collectionTime: collectionStartTime
    };
    
    // 构建详细的变更描述
    let changeDetails = [];
    if (beforeData.unitName !== afterData.unitName) {
      changeDetails.push(`单位: ${beforeData.unitName} → ${afterData.unitName}`);
    }
    if (beforeData.wasteTypeName !== afterData.wasteTypeName) {
      changeDetails.push(`废物类型: ${beforeData.wasteTypeName} → ${afterData.wasteTypeName}`);
    }
    if (beforeData.location !== afterData.location) {
      changeDetails.push(`位置: ${beforeData.location} → ${afterData.location}`);
    }
    if (beforeData.process !== afterData.process) {
      changeDetails.push(`工序: ${beforeData.process} → ${afterData.process}`);
    }
    if (beforeData.quantity !== afterData.quantity) {
      const beforeQty = beforeData.quantity !== null ? `${beforeData.quantity}吨` : '未填写';
      const afterQty = afterData.quantity !== null ? `${afterData.quantity}吨` : '未填写';
      changeDetails.push(`数量: ${beforeQty} → ${afterQty}`);
    }
    if (beforeData.collectionTime !== afterData.collectionTime) {
      const beforeTime = beforeData.collectionTime || '未填写';
      const afterTime = afterData.collectionTime || '未填写';
      changeDetails.push(`收集时间: ${beforeTime} → ${afterTime}`);
    }
    if ((beforeData.remarks || '') !== (afterData.remarks || '')) {
      const beforeRemarks = beforeData.remarks || '无';
      const afterRemarks = afterData.remarks || '无';
      changeDetails.push(`备注: ${beforeRemarks} → ${afterRemarks}`);
    }
    
    const hasPhotoChanges = (photos_to_remove_before || photos_to_remove_after || 
                            (req.files.photo_before && req.files.photo_before.length > 0) ||
                            (req.files.photo_after && req.files.photo_after.length > 0));
    
    if (hasPhotoChanges) {
      changeDetails.push('照片发生变更');
    }
    
    const changeText = changeDetails.length > 0 ? `, 变更内容: ${changeDetails.join('; ')}` : '';
    
    // 记录操作日志
    await logWasteRecordOperation(
      req, 
      'update', 
      parseInt(id), 
      userId, 
      `更新废物记录 - 记录ID: ${id}, 当前单位: ${afterData.unitName}, 废物类型: ${afterData.wasteTypeName}, 位置: ${afterData.location}, 工序: ${afterData.process}${changeText}`,
      {
        recordId: parseInt(id),
        beforeData,
        afterData,
        changes: changeDetails,
        hasPhotoChanges
      }
    );
    
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
    
    // 获取当前用户ID
    const userId = req.user ? req.user.id : null;
    
    // 记录删除的数据用于日志
    const deletedData = {
      location: record.location,
      quantity: record.quantity,
      process: record.process,
      unitName: record.unit_name,
      wasteTypeName: record.waste_type_name,
      createdAt: record.created_at,
      remarks: record.remarks,
      collectionTime: record.collection_start_time,
      creatorName: record.creator_name
    };
    
    // 删除照片文件
    if (record.photo_path_before) {
      deletePhotoFiles(record.photo_path_before, path.join(__dirname, '../..'));
    }
    
    if (record.photo_path_after) {
      deletePhotoFiles(record.photo_path_after, path.join(__dirname, '../..'));
    }
    
    // 删除记录
    await WasteRecord.delete(id);
    
    // 构建详细的删除描述
    const quantityText = deletedData.quantity !== null ? `${deletedData.quantity}吨` : '未填写';
    const collectionTimeText = deletedData.collectionTime || '未填写';
    const remarksText = deletedData.remarks || '无';
    const creatorText = deletedData.creatorName || '未知';
    const createdAtText = new Date(deletedData.createdAt).toLocaleString('zh-CN');
    const supervisionText = record.is_supervised ? ' [监督数据]' : '';
    
    // 记录操作日志
    await logWasteRecordOperation(
      req, 
      'delete', 
      parseInt(id), 
      userId, 
      `删除废物记录${supervisionText} - 记录ID: ${id}, 单位: ${deletedData.unitName}, 废物类型: ${deletedData.wasteTypeName}, 位置: ${deletedData.location}, 工序: ${deletedData.process}, 数量: ${quantityText}, 收集时间: ${collectionTimeText}, 备注: ${remarksText}, 创建时间: ${createdAtText}, 创建者: ${creatorText}`,
      deletedData
    );
    
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