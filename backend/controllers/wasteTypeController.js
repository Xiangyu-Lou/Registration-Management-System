const WasteType = require('../models/WasteType');

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
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: '废物类型名称不能为空' });
    }
    
    // 检查废物类型名称是否已存在
    const existingType = await WasteType.findByName(name.trim());
    if (existingType) {
      return res.status(400).json({ error: '废物类型名称已存在' });
    }
    
    const typeId = await WasteType.create(name.trim());
    
    res.status(201).json({
      id: typeId,
      message: '废物类型创建成功'
    });
  } catch (error) {
    next(error);
  }
};

// 更新废物类型
const updateWasteType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: '废物类型名称不能为空' });
    }
    
    // 验证废物类型是否存在
    const existingType = await WasteType.findById(id);
    if (!existingType) {
      return res.status(404).json({ error: '废物类型不存在' });
    }
    
    // 检查废物类型名称是否已被其他类型使用
    if (name.trim() !== existingType.name) {
      const duplicateType = await WasteType.findByName(name.trim());
      if (duplicateType && duplicateType.id !== parseInt(id)) {
        return res.status(400).json({ error: '废物类型名称已被其他类型使用' });
      }
    }
    
    await WasteType.update(id, name.trim());
    
    res.json({
      id: parseInt(id),
      message: '废物类型更新成功'
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
    const existingType = await WasteType.findById(id);
    if (!existingType) {
      return res.status(404).json({ error: '废物类型不存在' });
    }
    
    // 检查是否有废物记录使用此类型
    const isUsed = await WasteType.isUsed(id);
    if (isUsed) {
      return res.status(400).json({ error: '不能删除该废物类型，因为存在关联的废物记录' });
    }
    
    await WasteType.delete(id);
    
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