// API 配置文件

// 设置 API 基础 URL
// 使用相对路径，这样会请求当前域名下的 API
// 当通过Nginx代理访问时，这样可以确保请求正确路由
const API_BASE_URL = '';

export default {
  baseURL: API_BASE_URL,
  
  // API 路径
  endpoints: {
    login: '/api/login',
    users: '/api/users',
    usersByUnit: '/api/users/unit', // 获取指定单位的用户
    userStatus: '/api/users/:id/status',  // 用户状态变更API
    userProfile: '/api/users/:id/profile', // 用户个人资料更新API
    units: '/api/units',
    wasteTypes: '/api/waste-types',
    wasteRecords: '/api/waste-records',
    wasteRecordsByUnit: '/api/waste-records',
    wasteRecordDetail: '/api/waste-records/detail',
    wasteRecordsByUser: '/api/waste-records/user',
    exportWasteRecords: '/api/waste-records/export/user',
    operationLogs: '/api/operation-logs',
    operationLogStats: '/api/operation-logs/stats',
    operationLogUserStats: '/api/operation-logs/user-stats',
    exportOperationLogs: '/api/operation-logs/export',
    userLogPermission: '/api/users/:id/log-permission',
    // 公司管理相关API
    companies: '/api/companies',
    companyById: '/api/companies/:id',
    companyStats: '/api/companies/:id/stats',
    // 问题反馈相关API
    feedback: '/api/feedback',
    userFeedbacks: '/api/feedback/user',
    adminFeedbacks: '/api/feedback/admin',
    feedbackStats: '/api/feedback/stats',
    feedbackById: '/api/feedback/:id',
    feedbackStatus: '/api/feedback/:id/status',
  },
  
  // 获取完整 API URL
  getUrl(endpoint) {
    return `${this.baseURL}${endpoint}`;
  }
};
