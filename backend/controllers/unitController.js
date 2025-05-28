const Unit = require('../models/Unit');

// 获取所有单位
const getAllUnits = async (req, res, next) => {
  try {
    const units = await Unit.findAll();
    res.json(units);
  } catch (error) {
    next(error);
  }
};

// 根据ID获取单位
const getUnitById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const unit = await Unit.findById(id);
    
    if (!unit) {
      return res.status(404).json({ error: '单位不存在' });
    }
    
    res.json(unit);
  } catch (error) {
    next(error);
  }
};

// 创建单位
const createUnit = async (req, res, next) => {
  try {
    const { name } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: '单位名称不能为空' });
    }
    
    // 检查单位名称是否已存在
    const existingUnit = await Unit.findByName(name.trim());
    if (existingUnit) {
      return res.status(400).json({ error: '单位名称已存在' });
    }
    
    const unitId = await Unit.create(name.trim());
    
    res.status(201).json({
      id: unitId,
      message: '单位创建成功'
    });
  } catch (error) {
    next(error);
  }
};

// 更新单位
const updateUnit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: '单位名称不能为空' });
    }
    
    // 验证单位是否存在
    const existingUnit = await Unit.findById(id);
    if (!existingUnit) {
      return res.status(404).json({ error: '单位不存在' });
    }
    
    // 检查单位名称是否已被其他单位使用
    if (name.trim() !== existingUnit.name) {
      const duplicateUnit = await Unit.findByName(name.trim());
      if (duplicateUnit && duplicateUnit.id !== parseInt(id)) {
        return res.status(400).json({ error: '单位名称已被其他单位使用' });
      }
    }
    
    await Unit.update(id, name.trim());
    
    res.json({
      id: parseInt(id),
      message: '单位信息更新成功'
    });
  } catch (error) {
    next(error);
  }
};

// 删除单位
const deleteUnit = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // 验证单位是否存在
    const existingUnit = await Unit.findById(id);
    if (!existingUnit) {
      return res.status(404).json({ error: '单位不存在' });
    }
    
    // 检查是否有用户关联
    const hasUsers = await Unit.hasUsers(id);
    if (hasUsers) {
      return res.status(400).json({ error: '不能删除该单位，因为存在关联的用户' });
    }
    
    // 检查是否有废物记录关联
    const hasRecords = await Unit.hasWasteRecords(id);
    if (hasRecords) {
      return res.status(400).json({ error: '不能删除该单位，因为存在关联的废物记录' });
    }
    
    await Unit.delete(id);
    
    res.json({
      message: '单位删除成功',
      id: parseInt(id)
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUnits,
  getUnitById,
  createUnit,
  updateUnit,
  deleteUnit
}; 