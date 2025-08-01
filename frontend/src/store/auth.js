import { reactive } from 'vue';
import httpService from '../config/httpService';
import apiConfig from '../config/api';

// 初始化状态
const defaultState = {
  user: null,
  token: null,
  isLoggedIn: false,
  loading: false,
  error: null
};

// 创建响应式状态
const state = reactive({
  ...defaultState
});

// 从localStorage和sessionStorage获取已保存的用户信息和token
const init = () => {
  // 优先检查localStorage（记住登录）
  let savedUser = localStorage.getItem('user');
  let savedToken = localStorage.getItem('token');
  
  // 如果localStorage中没有，检查sessionStorage（临时登录）
  if (!savedUser || !savedToken) {
    savedUser = sessionStorage.getItem('user');
    savedToken = sessionStorage.getItem('token');
  }
  
  if (savedUser && savedToken) {
    try {
      const user = JSON.parse(savedUser);
      state.user = user;
      state.token = savedToken;
      state.isLoggedIn = true;
      // 设置 token 到 httpService
      if (httpService.defaults && httpService.defaults.headers) {
        httpService.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      }
      console.log('成功恢复用户状态:', user.username || user.phone, '角色ID:', user.role_id);
    } catch (e) {
      console.error('Error parsing saved user data:', e);
      // 清除损坏的数据
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('token');
    }
  } else {
    console.log('未找到保存的用户状态');
  }
};

// 登录方法
const login = async (phone, password, rememberMe = false) => {
  // 设置加载状态
  state.loading = true;
  state.error = null;
  
  console.log('auth.login 开始执行，手机号:', phone);

  try {
    // 构建登录请求数据
    const postData = { 
      phone, 
      rememberMe
    };
    
    // 只有在密码存在且非空时才添加到请求中
    if (password !== null && password !== undefined && password !== '') {
      postData.password = password;
      console.log('auth.login 发送密码参数');
    } else {
      console.log('auth.login 不发送密码参数');
    }
    
    console.log('发送登录请求，数据:', postData);
    const response = await httpService.post(apiConfig.endpoints.login, postData);
    console.log('登录请求成功响应:', response.data);

    const { token, ...user } = response.data;
    state.user = user;
    state.token = token;
    state.isLoggedIn = true;
    
    // 设置 token 到 httpService
    if (httpService.defaults && httpService.defaults.headers) {
      httpService.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    // 如果选择记住登录，保存到localStorage
    if (rememberMe) {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
    } else {
      // 否则只保存在 sessionStorage 中
      sessionStorage.setItem('user', JSON.stringify(user));
      sessionStorage.setItem('token', token);
      
      // 确保清除localStorage中可能存在的数据
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    
    // 添加清除缓存逻辑，确保加载最新资源
    try {
      if ('caches' in window) {
        // 清除缓存的资源
        caches.keys().then(cacheNames => {
          cacheNames.forEach(cacheName => {
            caches.delete(cacheName);
          });
        });
      }
    } catch (e) {
      console.warn('清除缓存失败:', e);
    }
    
    return { success: true, user };
  } catch (error) {
    // 只设置错误状态，不显示错误消息
    state.error = error.response?.data?.error || '登录失败，请检查网络连接';
    console.error('Login error:', error);
    return { success: false, error: state.error };
  } finally {
    state.loading = false;
  }
};

// 注销方法
const logout = () => {
  state.user = null;
  state.token = null;
  state.isLoggedIn = false;
  if (httpService.defaults && httpService.defaults.headers) {
    delete httpService.defaults.headers.common['Authorization'];
  }
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('token');
};

// 判断是否为系统超级管理员
const isSystemAdmin = () => {
  return state.isLoggedIn && state.user && state.user.role_id === 5;
};

// 判断是否为公司管理员
const isCompanyAdmin = () => {
  return state.isLoggedIn && state.user && state.user.role_id === 3;
};

// 判断是否为管理员（公司管理员、监督人员或系统超级管理员）
const isAdmin = () => {
  return state.isLoggedIn && state.user && (state.user.role_id === 3 || state.user.role_id === 4 || state.user.role_id === 5);
};

// 判断是否为单位管理员
const isUnitAdmin = () => {
  return state.isLoggedIn && state.user && state.user.role_id === 2;
};

// 判断是否为监督人员
const isSupervisor = () => {
  return state.isLoggedIn && state.user && state.user.role_id === 4;
};

// 获取当前用户ID
const getUserId = () => {
  return state.user ? state.user.id : null;
};

// 获取当前用户单位ID
const getUnitId = () => {
  return state.user ? state.user.unit_id : null;
};

// 获取当前用户公司ID
const getCompanyId = () => {
  return state.user ? state.user.company_id : null;
};

// 获取当前用户公司名称
const getCompanyName = () => {
  return state.user ? state.user.company_name : null;
};

// 更新用户信息
const updateUserInfo = (updatedUser) => {
  if (!state.isLoggedIn || !state.user) return;
  
  // 更新状态中的用户信息
  state.user = { ...state.user, ...updatedUser };
  
  // 更新存储中的用户信息
  if (localStorage.getItem('user')) {
    localStorage.setItem('user', JSON.stringify(state.user));
  }
  
  if (sessionStorage.getItem('user')) {
    sessionStorage.setItem('user', JSON.stringify(state.user));
  }
};

// 初始化认证状态
init();

export default {
  state,
  login,
  logout,
  isSystemAdmin,
  isCompanyAdmin,
  isAdmin,
  isUnitAdmin,
  isSupervisor,
  getUserId,
  getUnitId,
  getCompanyId,
  getCompanyName,
  updateUserInfo
};
