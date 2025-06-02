const OperationLog = require('../models/OperationLog');
const User = require('../models/User');

// 获取操作日志（带分页和筛选）
const getOperationLogs = async (req, res, next) => {
  try {
    // 检查用户是否有查看日志的权限
    const user = await User.findById(req.user.id);
    if (!user || !user.can_view_logs) {
      return res.status(403).json({ error: '您没有权限查看操作日志' });
    }

    const {
      page = 1,
      pageSize = 20,
      operationType,
      targetType,
      userId,
      userKeyword,
      startDate,
      endDate,
      description
    } = req.query;

    // 处理空字符串参数
    const filters = {
      operationType: operationType && operationType.trim() !== '' ? operationType : null,
      targetType: targetType && targetType.trim() !== '' ? targetType : null,
      userId: userId && userId.trim() !== '' ? userId : null,
      userKeyword: userKeyword && userKeyword.trim() !== '' ? userKeyword : null,
      startDate: startDate && startDate.trim() !== '' ? startDate : null,
      endDate: endDate && endDate.trim() !== '' ? endDate : null,
      description: description && description.trim() !== '' ? description : null
    };

    const result = await OperationLog.findWithFilters(filters, {
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });

    res.json(result);
  } catch (error) {
    console.error('获取操作日志失败:', error);
    res.status(500).json({ 
      error: '获取操作日志失败', 
      details: error.message,
      logs: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0, hasMore: false }
    });
  }
};

// 获取操作类型统计
const getOperationStats = async (req, res, next) => {
  try {
    // 检查用户是否有查看日志的权限
    const user = await User.findById(req.user.id);
    if (!user || !user.can_view_logs) {
      return res.status(403).json({ error: '您没有权限查看操作日志统计' });
    }

    const { startDate, endDate } = req.query;
    
    // 处理空字符串参数
    const cleanStartDate = startDate && startDate.trim() !== '' ? startDate : null;
    const cleanEndDate = endDate && endDate.trim() !== '' ? endDate : null;

    const stats = await OperationLog.getStats(cleanStartDate, cleanEndDate);
    res.json(stats);
  } catch (error) {
    console.error('获取操作类型统计失败:', error);
    res.status(500).json({ 
      error: '获取操作统计失败', 
      details: error.message,
      totalStats: [],
      dailyStats: []
    });
  }
};

// 获取用户操作统计
const getUserOperationStats = async (req, res, next) => {
  try {
    // 检查用户是否有查看日志的权限
    const user = await User.findById(req.user.id);
    if (!user || !user.can_view_logs) {
      return res.status(403).json({ error: '您没有权限查看用户操作统计' });
    }

    const { startDate, endDate, limit = 10 } = req.query;
    
    // 处理空字符串参数
    const cleanStartDate = startDate && startDate.trim() !== '' ? startDate : null;
    const cleanEndDate = endDate && endDate.trim() !== '' ? endDate : null;

    const stats = await OperationLog.getUserStats(cleanStartDate, cleanEndDate, parseInt(limit));
    res.json(stats || []);
  } catch (error) {
    console.error('获取用户操作统计失败:', error);
    res.status(500).json({ 
      error: '获取用户操作统计失败', 
      details: error.message,
      data: []
    });
  }
};

// 导出操作日志
const exportOperationLogs = async (req, res, next) => {
  try {
    // 检查用户是否有查看日志的权限
    const user = await User.findById(req.user.id);
    if (!user || !user.can_view_logs) {
      return res.status(403).json({ error: '您没有权限导出操作日志' });
    }

    const {
      operationType,
      targetType,
      userId,
      userKeyword,
      startDate,
      endDate,
      description
    } = req.query;

    // 处理空字符串参数
    const filters = {
      operationType: operationType && operationType.trim() !== '' ? operationType : null,
      targetType: targetType && targetType.trim() !== '' ? targetType : null,
      userId: userId && userId.trim() !== '' ? userId : null,
      userKeyword: userKeyword && userKeyword.trim() !== '' ? userKeyword : null,
      startDate: startDate && startDate.trim() !== '' ? startDate : null,
      endDate: endDate && endDate.trim() !== '' ? endDate : null,
      description: description && description.trim() !== '' ? description : null
    };

    const logs = await OperationLog.findAllWithFilters(filters);
    res.json(logs || []);
  } catch (error) {
    console.error('导出操作日志失败:', error);
    res.status(500).json({ 
      error: '导出操作日志失败', 
      details: error.message,
      data: []
    });
  }
};

module.exports = {
  getOperationLogs,
  getOperationStats,
  getUserOperationStats,
  exportOperationLogs
}; 