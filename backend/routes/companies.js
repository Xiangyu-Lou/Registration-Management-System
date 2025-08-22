const express = require('express');
const router = express.Router();
const { authenticateToken, requireSystemAdmin } = require('../middleware/auth');
const {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanyStats
} = require('../controllers/companyController');

// 所有路由都需要认证
router.use(authenticateToken);

// 获取所有公司（仅系统超级管理员）
router.get('/', requireSystemAdmin, getAllCompanies);

// 根据ID获取公司信息
router.get('/:id', getCompanyById);

// 获取公司统计信息
router.get('/:id/stats', getCompanyStats);

// 创建公司（仅系统超级管理员）
router.post('/', requireSystemAdmin, createCompany);

// 更新公司信息（仅系统超级管理员）
router.put('/:id', requireSystemAdmin, updateCompany);

// 删除公司（仅系统超级管理员）
router.delete('/:id', requireSystemAdmin, deleteCompany);

module.exports = router;
