const WasteType = require('../models/WasteType');
const { logWasteTypeOperation } = require('../utils/logger');

// 获取所有废物类型
const getAllWasteTypes = async (req, res, next) => {
  try {
    const wasteTypes = await WasteType.findAll();
    res.json(wasteTypes);
  } catch (error) {
    next(error);
  }
};

// 根据ID获取废物类型
const getWasteTypeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const wasteType = await WasteType.findById(id);
    
    if (!wasteType) {
      return res.status(404).json({ error: '废物类型不存在' });
    }
    
    res.json(wasteType);
  } catch (error) {
    next(error);
  }
};

// 创建废物类型
const createWasteType = async (req, res, next) => {
  try {
    const { name } = req.body;
    
    // 验证必填字段
    if (!name) {
      return res.status(400).json({ error: '废物类型名称是必填字段' });
    }
    
    // 检查废物类型名称是否已存在
    const nameExists = await WasteType.nameExists(name);
    if (nameExists) {
      return res.status(400).json({ error: '废物类型名称已存在' });
    }
    
    // 创建废物类型
    const wasteTypeId = await WasteType.create({ name });
    
    // 获取操作者ID和操作者信息
    const operatorId = req.user ? req.user.id : null;
    const operatorInfo = req.user ? `${req.user.username}(${req.user.phone})` : '系统';
    
    // 记录操作日志
    await logWasteTypeOperation(
      req, 
      'create', 
      wasteTypeId, 
      operatorId, 
      `创建废物类型 - 类型ID: ${wasteTypeId}, 类型名称: "${name}", 操作者: ${operatorInfo}`,
      { 
        wasteTypeId,
        name,
        operatorInfo,
        createdAt: new Date().toLocaleString('zh-CN')
      }
    );
    
    res.status(201).json({
      message: '废物类型创建成功',
      id: wasteTypeId
    });
  } catch (error) {
    next(error);
  }
};

// 更新废物类型信息
const updateWasteType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    // 验证废物类型是否存在
    const existingWasteType = await WasteType.findById(id);
    if (!existingWasteType) {
      return res.status(404).json({ error: '废物类型不存在' });
    }
    
    // 验证必填字段
    if (!name) {
      return res.status(400).json({ error: '废物类型名称是必填字段' });
    }
    
    // 检查废物类型名称是否被其他类型使用
    const nameExists = await WasteType.nameExists(name, id);
    if (nameExists) {
        return res.status(400).json({ error: '废物类型名称已被其他类型使用' });
      }
    
    // 记录更新前的数据
    const beforeData = {
      wasteTypeId: parseInt(id),
      name: existingWasteType.name
    };
    
    // 更新废物类型
    await WasteType.update(id, { name });
    
    // 获取操作者ID和操作者信息
    const operatorId = req.user ? req.user.id : null;
    const operatorInfo = req.user ? `${req.user.username}(${req.user.phone})` : '系统';
    
    // 构建变更描述
    let changeText = '';
    if (beforeData.name !== name) {
      changeText = `, 名称变更: "${beforeData.name}" → "${name}"`;
    }
    
    // 记录操作日志
    await logWasteTypeOperation(
      req, 
      'update', 
      parseInt(id), 
      operatorId, 
      `更新废物类型信息 - 类型ID: ${id}, 当前名称: "${name}", 操作者: ${operatorInfo}${changeText}`,
      {
        wasteTypeId: parseInt(id),
        beforeData,
        afterData: { name },
        operatorInfo,
        updatedAt: new Date().toLocaleString('zh-CN')
      }
    );
    
    res.json({
      message: '废物类型信息更新成功',
      id: parseInt(id)
    });
  } catch (error) {
    next(error);
  }
};

// 删除废物类型
const deleteWasteType = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // 验证废物类型是否存在
    const wasteType = await WasteType.findById(id);
    if (!wasteType) {
      return res.status(404).json({ error: '废物类型不存在' });
    }
    
    // 检查废物类型是否有关联的废物记录
    const hasWasteRecords = await WasteType.hasWasteRecords(id);
    if (hasWasteRecords) {
      return res.status(400).json({ error: '该废物类型有关联的废物记录，无法删除' });
    }
    
    // 记录删除的废物类型数据
    const deletedData = {
      wasteTypeId: parseInt(id),
      name: wasteType.name,
      deletedAt: new Date().toLocaleString('zh-CN')
    };
    
    // 删除废物类型
    await WasteType.delete(id);
    
    // 获取操作者ID和操作者信息
    const operatorId = req.user ? req.user.id : null;
    const operatorInfo = req.user ? `${req.user.username}(${req.user.phone})` : '系统';
    
    // 记录操作日志
    await logWasteTypeOperation(
      req, 
      'delete', 
      parseInt(id), 
      operatorId, 
      `删除废物类型 - 类型ID: ${id}, 类型名称: "${wasteType.name}", 操作者: ${operatorInfo}, 删除时间: ${deletedData.deletedAt}`,
      {
        ...deletedData,
        operatorInfo
      }
    );
    
    res.json({
      message: '废物类型删除成功',
      id: parseInt(id)
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllWasteTypes,
  getWasteTypeById,
  createWasteType,
  updateWasteType,
  deleteWasteType
}; 