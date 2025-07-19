const OperationLog = require('../models/OperationLog');

// 获取客户端IP地址
const getClientIP = (req) => {
  return req.headers['x-forwarded-for'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         '127.0.0.1';
};

// 记录登录日志
const logLogin = async (req, userId, username, success = true, reason = '', userInfo = null) => {
  try {
    let description;
    let additionalData = {
      success,
      loginTime: new Date().toLocaleString('zh-CN'),
      reason
    };
    
    if (success) {
      // 登录成功
      const roleText = userInfo?.roleName || '未知角色';
      const unitText = userInfo?.unitName || '无单位';
      const companyText = userInfo?.companyName || '未知公司';
      const rememberText = userInfo?.rememberMe ? '(记住登录)' : '';
      description = `用户登录成功 - 用户名: ${username}, 手机号: ${userInfo?.phone || username}, 角色: ${roleText}, 单位: ${unitText}, 公司: ${companyText}${rememberText}`;
      
      if (userInfo) {
        additionalData = { ...additionalData, ...userInfo };
      }
    } else {
      // 登录失败
      if (userInfo) {
        // 有用户信息（用户存在但登录失败）
        const roleText = userInfo.roleName || '未知角色';
        const unitText = userInfo.unitName || '无单位';
        const companyText = userInfo.companyName || '未知公司';
        description = `用户登录失败 - 用户名: ${username}, 手机号: ${userInfo.phone || username}, 角色: ${roleText}, 单位: ${unitText}, 公司: ${companyText}, 失败原因: ${reason}`;
        additionalData = { ...additionalData, ...userInfo };
      } else {
        // 无用户信息（用户不存在）
        description = `用户登录失败 - 手机号: ${username}, 失败原因: ${reason}`;
      }
    }
    
    await OperationLog.create({
      userId: success ? userId : null,
      operationType: 'login',
      targetType: 'user',
      targetId: userId,
      description,
      ipAddress: getClientIP(req),
      userAgent: req.headers['user-agent'],
      additionalData,
      companyId: userInfo?.company_id || null
    });
  } catch (error) {
    console.error('记录登录日志失败:', error);
  }
};

// 记录废物记录操作日志
const logWasteRecordOperation = async (req, operationType, recordId, userId, description, additionalData = null) => {
  try {
    // 从请求中获取公司ID
    const companyId = req.user?.company_id || null;
    
    await OperationLog.create({
      userId,
      operationType,
      targetType: 'waste_record',
      targetId: recordId,
      description,
      ipAddress: getClientIP(req),
      userAgent: req.headers['user-agent'],
      additionalData,
      companyId
    });
  } catch (error) {
    console.error('记录废物记录操作日志失败:', error);
  }
};

// 记录用户管理操作日志
const logUserManagementOperation = async (req, operationType, targetUserId, operatorId, description, additionalData = null) => {
  try {
    // 从请求中获取公司ID
    const companyId = req.user?.company_id || null;
    
    await OperationLog.create({
      userId: operatorId,
      operationType,
      targetType: 'user',
      targetId: targetUserId,
      description,
      ipAddress: getClientIP(req),
      userAgent: req.headers['user-agent'],
      additionalData,
      companyId
    });
  } catch (error) {
    console.error('记录用户管理操作日志失败:', error);
  }
};

// 记录单位管理操作日志
const logUnitOperation = async (req, operationType, unitId, userId, description, additionalData = null) => {
  try {
    // 从请求中获取公司ID
    const companyId = req.user?.company_id || null;
    
    await OperationLog.create({
      userId,
      operationType,
      targetType: 'unit',
      targetId: unitId,
      description,
      ipAddress: getClientIP(req),
      userAgent: req.headers['user-agent'],
      additionalData,
      companyId
    });
  } catch (error) {
    console.error('记录单位操作日志失败:', error);
  }
};

// 记录废物类型管理操作日志
const logWasteTypeOperation = async (req, operationType, wasteTypeId, userId, description, additionalData = null) => {
  try {
    // 从请求中获取公司ID
    const companyId = req.user?.company_id || null;
    
    await OperationLog.create({
      userId,
      operationType,
      targetType: 'waste_type',
      targetId: wasteTypeId,
      description,
      ipAddress: getClientIP(req),
      userAgent: req.headers['user-agent'],
      additionalData,
      companyId
    });
  } catch (error) {
    console.error('记录废物类型操作日志失败:', error);
  }
};

// 通用操作日志记录
const logOperation = async (req, userId, operationType, targetType, targetId, description, additionalData = null) => {
  try {
    // 从请求中获取公司ID
    const companyId = req.user?.company_id || null;
    
    await OperationLog.create({
      userId,
      operationType,
      targetType,
      targetId,
      description,
      ipAddress: getClientIP(req),
      userAgent: req.headers['user-agent'],
      additionalData,
      companyId
    });
  } catch (error) {
    console.error('记录操作日志失败:', error);
  }
};

module.exports = {
  logLogin,
  logWasteRecordOperation,
  logUserManagementOperation,
  logUnitOperation,
  logWasteTypeOperation,
  logOperation,
  getClientIP
}; 