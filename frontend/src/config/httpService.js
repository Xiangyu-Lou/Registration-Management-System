import axios from 'axios';
import { ElMessage } from 'element-plus';
import auth from '../store/auth';
import apiConfig from './api';

// 创建 axios 实例
const axiosInstance = axios.create({
  baseURL: apiConfig.baseURL,
  timeout: 10000, // 10秒超时
  headers: {
    'Content-Type': 'application/json'
  },
  maxContentLength: 10 * 1024 * 1024, // 10MB
  maxBodyLength: 10 * 1024 * 1024 // 10MB
});

// 请求拦截器
axiosInstance.interceptors.request.use(
  config => {
    // 从 localStorage 或 sessionStorage 获取 token
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
axiosInstance.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // token 过期或无效，清除登录状态并跳转到登录页
          auth.logout();
          ElMessage.error('登录已过期，请重新登录');
          window.location.href = '/login';
          break;
        case 403:
          ElMessage.error('没有权限访问该资源');
          break;
        case 404:
          ElMessage.error('请求的资源不存在');
          break;
        case 500:
          ElMessage.error('服务器错误，请稍后重试');
          break;
        default:
          ElMessage.error(error.response.data?.error || '请求失败');
      }
    } else if (error.request) {
      ElMessage.error('网络错误，请检查网络连接');
    } else {
      ElMessage.error('请求配置错误');
    }
    return Promise.reject(error);
  }
);

// HTTP服务
const httpService = {
  // GET请求
  get(endpoint, params = {}) {
    return axiosInstance.get(endpoint, { params });
  },
  
  // POST请求
  post(endpoint, data = {}) {
    return axiosInstance.post(endpoint, data);
  },
  
  // 带文件上传的POST请求
  postForm(endpoint, formData) {
    return axiosInstance.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      maxContentLength: 10 * 1024 * 1024, // 10MB
      maxBodyLength: 10 * 1024 * 1024 // 10MB
    });
  },
  
  // PUT请求
  put(endpoint, data = {}) {
    return axiosInstance.put(endpoint, data);
  },
  
  // 带文件上传的PUT请求
  putForm(endpoint, formData) {
    return axiosInstance.put(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      maxContentLength: 10 * 1024 * 1024, // 10MB
      maxBodyLength: 10 * 1024 * 1024 // 10MB
    });
  },
  
  // DELETE请求
  delete(endpoint) {
    return axiosInstance.delete(endpoint);
  },

  // 导出 axios 实例的 defaults
  defaults: axiosInstance.defaults
};

export default httpService;
