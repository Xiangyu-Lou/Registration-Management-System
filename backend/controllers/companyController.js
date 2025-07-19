const Company = require('../models/Company');
const { logOperation } = require('../utils/logger');

// 获取所有公司（仅系统超级管理员）
const getAllCompanies = async (req, res, next) => {
  try {
    // 只有系统超级管理员才能查看所有公司
    if (req.user.role_id !== 5) {
      return res.status(403).json({ error: '权限不足，只有系统超级管理员可以查看所有公司' });
    }

    const companies = await Company.findAll();
    res.json(companies);
  } catch (error) {
    next(error);
  }
};

// 根据ID获取公司信息
const getCompanyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // 系统超级管理员可以查看任意公司，其他用户只能查看自己的公司
    if (req.user.role_id !== 5 && req.user.company_id !== parseInt(id)) {
      return res.status(403).json({ error: '权限不足，只能查看本公司信息' });
    }

    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({ error: '公司不存在' });
    }

    res.json(company);
  } catch (error) {
    next(error);
  }
};

// 创建公司（仅系统超级管理员）
const createCompany = async (req, res, next) => {
  try {
    // 只有系统超级管理员才能创建公司
    if (req.user.role_id !== 5) {
      return res.status(403).json({ error: '权限不足，只有系统超级管理员可以创建公司' });
    }

    const { name, code } = req.body;

    // 验证必填字段
    if (!name) {
      return res.status(400).json({ error: '公司名称不能为空' });
    }

    // 检查公司名称是否已存在
    if (await Company.nameExists(name)) {
      return res.status(400).json({ error: '公司名称已存在' });
    }

    // 检查公司代码是否已存在
    if (code && await Company.codeExists(code)) {
      return res.status(400).json({ error: '公司代码已存在' });
    }

    const companyId = await Company.create({ name, code });
    const newCompany = await Company.findById(companyId);

    // 记录操作日志
    await logOperation(req, req.user.id, 'create', 'company', companyId, 
      `创建公司: ${name}${code ? ` (代码: ${code})` : ''}`, {
        companyName: name,
        companyCode: code,
        companyId: companyId
      });

    res.status(201).json(newCompany);
  } catch (error) {
    next(error);
  }
};

// 更新公司信息
const updateCompany = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, status } = req.body;

    // 只有系统超级管理员才能更新公司信息
    if (req.user.role_id !== 5) {
      return res.status(403).json({ error: '权限不足，只有系统超级管理员可以修改公司信息' });
    }

    // 检查公司是否存在
    const existingCompany = await Company.findById(id);
    if (!existingCompany) {
      return res.status(404).json({ error: '公司不存在' });
    }

    // 验证必填字段
    if (!name) {
      return res.status(400).json({ error: '公司名称不能为空' });
    }

    // 检查公司名称是否已存在（排除当前公司）
    if (await Company.nameExists(name, id)) {
      return res.status(400).json({ error: '公司名称已存在' });
    }

    // 检查公司代码是否已存在（排除当前公司）
    if (code && await Company.codeExists(code, id)) {
      return res.status(400).json({ error: '公司代码已存在' });
    }

    await Company.update(id, { name, code, status });
    const updatedCompany = await Company.findById(id);

    // 记录操作日志
    await logOperation(req, req.user.id, 'update', 'company', id, 
      `更新公司信息: ${existingCompany.name} -> ${name}`, {
        oldCompanyName: existingCompany.name,
        newCompanyName: name,
        oldCompanyCode: existingCompany.code,
        newCompanyCode: code,
        companyId: id
      });

    res.json(updatedCompany);
  } catch (error) {
    next(error);
  }
};

// 删除公司（软删除，仅系统超级管理员）
const deleteCompany = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 只有系统超级管理员才能删除公司
    if (req.user.role_id !== 5) {
      return res.status(403).json({ error: '权限不足，只有系统超级管理员可以删除公司' });
    }

    // 检查公司是否存在
    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({ error: '公司不存在' });
    }

    // 检查公司是否有关联数据
    if (await Company.hasRelatedData(id)) {
      return res.status(400).json({ error: '该公司下还有用户、单位或记录，无法删除' });
    }

    await Company.delete(id);

    // 记录操作日志
    await logOperation(req, req.user.id, 'delete', 'company', id, 
      `删除公司: ${company.name}`, {
        companyName: company.name,
        companyCode: company.code,
        companyId: id
      });

    res.json({ message: '公司删除成功' });
  } catch (error) {
    next(error);
  }
};

// 获取公司统计信息
const getCompanyStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // 系统超级管理员可以查看任意公司统计，其他用户只能查看自己公司的统计
    if (req.user.role_id !== 5 && req.user.company_id !== parseInt(id)) {
      return res.status(403).json({ error: '权限不足，只能查看本公司统计信息' });
    }

    // 检查公司是否存在
    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({ error: '公司不存在' });
    }

    const stats = await Company.getStats(id);
    res.json({
      company: company,
      stats: stats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanyStats
}; 