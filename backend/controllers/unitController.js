const Unit = require('../models/Unit');
const { logUnitOperation } = require('../utils/logger');

// 获取所有单位（根据用户权限过滤）
const getAllUnits = async (req, res, next) => {
  try {
    const units = await Unit.findAll(req.user);
    res.json(units);
  } catch (error) {
    next(error);
  }
};

// 根据ID获取单位（根据用户权限过滤）
const getUnitById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const unit = await Unit.findById(id, req.user);
    
    if (!unit) {
      return res.status(404).json({ error: '单位不存在或无权限访问' });
    }
    
    res.json(unit);
  } catch (error) {
    next(error);
  }
};

// 创建单位
const createUnit = async (req, res, next) => {
  try {
    const { name, companyId } = req.body;
    
    // 验证必填字段
    if (!name) {
      return res.status(400).json({ error: '单位名称是必填字段' });
    }
    
    // 确定单位所属公司
    let unitCompanyId = companyId;
    if (!unitCompanyId) {
      // 如果没有指定公司ID，使用当前用户的公司ID（除非是系统超级管理员）
      if (req.user.role_id === 5) {
        return res.status(400).json({ error: '系统超级管理员必须指定单位所属公司' });
      }
      unitCompanyId = req.user.company_id;
    } else {
      // 如果指定了公司ID，检查权限
      if (req.user.role_id !== 5 && req.user.company_id !== unitCompanyId) {
        return res.status(403).json({ error: '只能在本公司内创建单位' });
      }
    }
    
    // 检查单位名称是否在同一公司内已存在
    const nameExists = await Unit.nameExists(name, unitCompanyId);
    if (nameExists) {
      return res.status(400).json({ error: '单位名称在该公司内已存在' });
    }
    
    // 创建单位
    const unitId = await Unit.create({ name, companyId: unitCompanyId });
    
    // 获取操作者ID和操作者信息
    const operatorId = req.user ? req.user.id : null;
    const operatorInfo = req.user ? `${req.user.username}(${req.user.phone})` : '系统';
    
    // 记录操作日志
    await logUnitOperation(
      req, 
      'create', 
      unitId, 
      operatorId, 
      `创建单位 - 单位ID: ${unitId}, 单位名称: "${name}", 操作者: ${operatorInfo}`,
      { 
        unitId,
        name,
        operatorInfo,
        createdAt: new Date().toLocaleString('zh-CN')
      }
    );
    
    res.status(201).json({
      message: '单位创建成功',
      id: unitId
    });
  } catch (error) {
    next(error);
  }
};

// 更新单位信息
const updateUnit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, companyId } = req.body;
    
    // 验证单位是否存在
    const existingUnit = await Unit.findById(id, req.user);
    if (!existingUnit) {
      return res.status(404).json({ error: '单位不存在或无权限访问' });
    }
    
    // 权限检查：非系统超级管理员只能管理本公司单位
    if (req.user.role_id !== 5 && req.user.company_id !== existingUnit.company_id) {
      return res.status(403).json({ error: '只能管理本公司单位' });
    }
    
    // 验证必填字段
    if (!name) {
      return res.status(400).json({ error: '单位名称是必填字段' });
    }
    
    // 确定单位所属公司
    let unitCompanyId = companyId !== undefined ? companyId : existingUnit.company_id;
    if (companyId !== undefined && req.user.role_id !== 5) {
      // 非系统超级管理员不能转移单位到其他公司
      if (companyId !== req.user.company_id) {
        return res.status(403).json({ error: '无权将单位转移到其他公司' });
      }
    }
    
    // 检查单位名称是否在同一公司内被其他单位使用
    const nameExists = await Unit.nameExists(name, unitCompanyId, id);
    if (nameExists) {
        return res.status(400).json({ error: '单位名称在该公司内已被其他单位使用' });
      }
    
    // 记录更新前的数据
    const beforeData = {
      unitId: parseInt(id),
      name: existingUnit.name
    };
    
    // 更新单位
    await Unit.update(id, { name, companyId: unitCompanyId });
    
    // 获取操作者ID和操作者信息
    const operatorId = req.user ? req.user.id : null;
    const operatorInfo = req.user ? `${req.user.username}(${req.user.phone})` : '系统';
    
    // 构建变更描述
    let changeText = '';
    if (beforeData.name !== name) {
      changeText = `, 名称变更: "${beforeData.name}" → "${name}"`;
    }
    
    // 记录操作日志
    await logUnitOperation(
      req, 
      'update', 
      parseInt(id), 
      operatorId, 
      `更新单位信息 - 单位ID: ${id}, 当前名称: "${name}", 操作者: ${operatorInfo}${changeText}`,
      {
        unitId: parseInt(id),
        beforeData,
        afterData: { name },
        operatorInfo,
        updatedAt: new Date().toLocaleString('zh-CN')
      }
    );
    
    res.json({
      message: '单位信息更新成功',
      id: parseInt(id)
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
    const unit = await Unit.findById(id);
    if (!unit) {
      return res.status(404).json({ error: '单位不存在' });
    }
    
    // 检查单位是否有关联的用户
    const hasUsers = await Unit.hasUsers(id);
    if (hasUsers) {
      return res.status(400).json({ error: '该单位有关联的用户，无法删除' });
    }
    
    // 检查单位是否有关联的废物记录
    const hasWasteRecords = await Unit.hasWasteRecords(id);
    if (hasWasteRecords) {
      return res.status(400).json({ error: '该单位有关联的废物记录，无法删除' });
    }
    
    // 记录删除的单位数据
    const deletedData = {
      unitId: parseInt(id),
      name: unit.name,
      deletedAt: new Date().toLocaleString('zh-CN')
    };
    
    // 删除单位
    await Unit.delete(id);
    
    // 获取操作者ID和操作者信息
    const operatorId = req.user ? req.user.id : null;
    const operatorInfo = req.user ? `${req.user.username}(${req.user.phone})` : '系统';
    
    // 记录操作日志
    await logUnitOperation(
      req, 
      'delete', 
      parseInt(id), 
      operatorId, 
      `删除单位 - 单位ID: ${id}, 单位名称: "${unit.name}", 操作者: ${operatorInfo}, 删除时间: ${deletedData.deletedAt}`,
      {
        ...deletedData,
        operatorInfo
      }
    );
    
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