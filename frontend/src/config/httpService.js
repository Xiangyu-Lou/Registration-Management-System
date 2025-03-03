import axios from 'axios';
import apiConfig from './api';

// 创建 axios 实例
const httpClient = axios.create({
  baseURL: apiConfig.baseURL,
  timeout: 10000, // 10秒超时
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
httpClient.interceptors.request.use(
  config => {
    // 这里可以添加认证 token 等逻辑
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
httpClient.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    // 统一错误处理
    console.error('API请求错误:', error);
    return Promise.reject(error);
  }
);

// HTTP服务
const httpService = {
  // GET请求
  get(endpoint, params = {}) {
    return httpClient.get(endpoint, { params });
  },
  
  // POST请求
  post(endpoint, data = {}) {
    return httpClient.post(endpoint, data);
  },
  
  // 带文件上传的POST请求
  postForm(endpoint, formData) {
    return httpClient.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  // PUT请求
  put(endpoint, data = {}) {
    return httpClient.put(endpoint, data);
  },
  
  // 带文件上传的PUT请求
  putForm(endpoint, formData) {
    return httpClient.put(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  // DELETE请求
  delete(endpoint) {
    return httpClient.delete(endpoint);
  }
};

export default httpService;
