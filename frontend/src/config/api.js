// API 配置文件

// 判断当前环境
const isProduction = process.env.NODE_ENV === 'production';

// 设置 API 基础 URL
// 开发环境使用 localhost
// 生产环境使用相对路径，这样会请求当前域名下的 API
const API_BASE_URL = isProduction ? '' : 'http://localhost:3000';

export default {
  baseURL: API_BASE_URL,
  
  // API 路径
  endpoints: {
    login: '/api/login',
    users: '/api/users',
    units: '/api/units',
    wasteTypes: '/api/waste-types',
    wasteRecords: '/api/waste-records',
  },
  
  // 获取完整 API URL
  getUrl(endpoint) {
    return `${this.baseURL}${endpoint}`;
  }
};
