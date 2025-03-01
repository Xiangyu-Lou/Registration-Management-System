import { reactive } from 'vue';
import axios from 'axios';

// 初始化状态
const defaultState = {
  user: null,
  isLoggedIn: false,
  loading: false,
  error: null
};

// 创建响应式状态
const state = reactive({
  ...defaultState
});

// 从localStorage获取已保存的用户信息
const init = () => {
  const savedUser = localStorage.getItem('user');
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      state.user = user;
      state.isLoggedIn = true;
    } catch (e) {
      console.error('Error parsing saved user data:', e);
      localStorage.removeItem('user');
    }
  }
};

// 登录方法
const login = async (phone, password) => {
  state.loading = true;
  state.error = null;

  try {
    const response = await axios.post('http://localhost:3000/api/login', {
      phone,
      password: password || undefined // 员工登录不需要密码
    });

    const user = response.data;
    state.user = user;
    state.isLoggedIn = true;
    
    // 保存到localStorage以便刷新后保持登录状态
    localStorage.setItem('user', JSON.stringify(user));
    
    return { success: true, user };
  } catch (error) {
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
  state.isLoggedIn = false;
  localStorage.removeItem('user');
};

// 初始化
init();

export default {
  state,
  login,
  logout
};
