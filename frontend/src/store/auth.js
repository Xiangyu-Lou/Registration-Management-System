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

// 从localStorage获取已保存的用户信息和token
const init = () => {
  const savedUser = localStorage.getItem('user');
  const savedToken = localStorage.getItem('token');
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
    } catch (e) {
      console.error('Error parsing saved user data:', e);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  }
};

// 登录方法
const login = async (phone, password, rememberMe = false, userType = 1) => {
  // 设置加载状态
  state.loading = true;
  state.error = null;
  
  console.log('auth.login 开始执行，手机号:', phone, '用户类型:', userType);

  try {
    // 构建登录请求数据
    const postData = { 
      phone, 
      rememberMe,
      userType // 添加用户类型
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

// 判断是否为超级管理员
const isAdmin = () => {
  return state.isLoggedIn && state.user && state.user.role_id === 3;
};

// 判断是否为单位管理员
const isUnitAdmin = () => {
  return state.isLoggedIn && state.user && state.user.role_id === 2;
};

// 获取当前用户ID
const getUserId = () => {
  return state.user ? state.user.id : null;
};

// 获取当前用户单位ID
const getUnitId = () => {
  return state.user ? state.user.unit_id : null;
};

// 初始化认证状态
init();

export default {
  state,
  login,
  logout,
  isAdmin,
  isUnitAdmin,
  getUserId,
  getUnitId
};
