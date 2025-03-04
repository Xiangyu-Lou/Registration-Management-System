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
    units: '/api/units',
    wasteTypes: '/api/waste-types',
    wasteRecords: '/api/waste-records',
    wasteRecordsByUnit: '/api/waste-records',
    wasteRecordDetail: '/api/waste-records/detail',
    wasteRecordsByUser: '/api/waste-records/user',
    exportWasteRecords: '/api/waste-records/export/user',
  },
  
  // 获取完整 API URL
  getUrl(endpoint) {
    return `${this.baseURL}${endpoint}`;
  }
};
