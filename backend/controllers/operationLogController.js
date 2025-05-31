const OperationLog = require('../models/OperationLog');

// 获取操作日志列表（支持分页和筛选）
const getOperationLogs = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 50,
      userId,
      operationType,
      targetType,
      startDate,
      endDate
    } = req.query;

    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;

    const filters = {
      userId,
      operationType,
      targetType,
      startDate,
      endDate
    };

    // 获取日志数据和总数
    const [logs, total] = await Promise.all([
      OperationLog.findAll(filters, limit, offset),
      OperationLog.countAll(filters)
    ]);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + logs.length < total
      }
    });
  } catch (error) {
    next(error);
  }
};

// 获取用户的操作日志
const getUserOperationLogs = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const {
      page = 1,
      pageSize = 50
    } = req.query;

    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;

    const logs = await OperationLog.findByUserId(userId, limit, offset);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        pageSize: limit
      }
    });
  } catch (error) {
    next(error);
  }
};

// 清理旧日志
const cleanOldLogs = async (req, res, next) => {
  try {
    const { daysToKeep = 90 } = req.body;
    
    const deletedCount = await OperationLog.cleanOldLogs(daysToKeep);
    
    res.json({
      message: `成功清理 ${deletedCount} 条超过 ${daysToKeep} 天的日志记录`,
      deletedCount
    });
  } catch (error) {
    next(error);
  }
};

// 获取操作统计信息
const getOperationStatistics = async (req, res, next) => {
  try {
    const {
      startDate,
      endDate
    } = req.query;

    const filters = { startDate, endDate };

    // 获取总数
    const total = await OperationLog.countAll(filters);
    
    // 获取各类型操作统计
    const [loginCount, createCount, updateCount, deleteCount] = await Promise.all([
      OperationLog.countAll({ ...filters, operationType: 'login' }),
      OperationLog.countAll({ ...filters, operationType: 'create' }),
      OperationLog.countAll({ ...filters, operationType: 'update' }),
      OperationLog.countAll({ ...filters, operationType: 'delete' })
    ]);

    res.json({
      total,
      statistics: {
        login: loginCount,
        create: createCount,
        update: updateCount,
        delete: deleteCount
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOperationLogs,
  getUserOperationLogs,
  cleanOldLogs,
  getOperationStatistics
}; 