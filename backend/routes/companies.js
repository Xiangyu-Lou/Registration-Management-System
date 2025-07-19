const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanyStats
} = require('../controllers/companyController');

// 所有路由都需要认证
router.use(authenticate);

// 获取所有公司（仅系统超级管理员）
router.get('/', getAllCompanies);

// 根据ID获取公司信息
router.get('/:id', getCompanyById);

// 获取公司统计信息
router.get('/:id/stats', getCompanyStats);

// 创建公司（仅系统超级管理员）
router.post('/', createCompany);

// 更新公司信息（仅系统超级管理员）
router.put('/:id', updateCompany);

// 删除公司（仅系统超级管理员）
router.delete('/:id', deleteCompany);

module.exports = router; 