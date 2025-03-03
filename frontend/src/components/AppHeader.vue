<template>
  <div class="app-header">
    <div class="header-title">
      <h1>危险废物管理系统</h1>
    </div>
    <div class="user-info" v-if="auth.state.isLoggedIn">
      <span class="welcome-text">
        欢迎,
        <strong>{{ userName }}</strong>
        <span class="role-tag">({{ auth.state.user.role }})</span>
        <span v-if="auth.state.user.unit_name" class="unit-tag">
          {{ auth.state.user.unit_name }}
        </span>
      </span>
      <el-button type="text" class="logout-button" @click="handleLogout">
        退出登录
      </el-button>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import auth from '../store/auth';

export default {
  name: 'AppHeader',
  setup() {
    const router = useRouter();
    
    // 获取用户名，优先显示用户名，如果没有则显示手机号
    const userName = computed(() => {
      if (!auth.state.isLoggedIn) return '';
      return auth.state.user.username || auth.state.user.phone;
    });
    
    // 处理退出登录
    const handleLogout = () => {
      auth.logout();
      ElMessage.success('已退出登录');
      router.push('/login');
    };
    
    return {
      auth,
      userName,
      handleLogout
    };
  }
};
</script>

<style scoped>
.app-header {
  background-color: #409EFF;
  color: white;
  padding: 0 20px;
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title h1 {
  margin: 0;
  font-size: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.welcome-text {
  font-size: 14px;
}

.role-tag, .unit-tag {
  font-size: 12px;
  margin-left: 5px;
  padding: 2px 6px;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.3);
}

.logout-button {
  color: white;
  font-weight: bold;
  margin-left: 15px;
}

.logout-button:hover {
  color: #f0f0f0;
  background-color: rgba(255, 255, 255, 0.1);
}

.el-dropdown-link {
  cursor: pointer;
  display: flex;
  align-items: center;
  color: white;
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .app-header {
    padding: 0 10px;
    height: 50px;
    flex-wrap: wrap;
  }
  
  .header-title h1 {
    font-size: 16px;
  }
  
  .user-info {
    gap: 10px;
  }
  
  .welcome-text {
    font-size: 12px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
  }
  
  .role-tag, .unit-tag {
    font-size: 10px;
    margin-left: 3px;
    padding: 1px 4px;
  }
  
  .logout-button {
    margin-left: 5px;
    padding: 4px 8px;
  }
}

/* 小屏幕手机适配 */
@media screen and (max-width: 480px) {
  .app-header {
    flex-direction: column;
    height: auto;
    padding: 10px;
  }
  
  .header-title {
    margin-bottom: 5px;
  }
  
  .user-info {
    width: 100%;
    justify-content: space-between;
  }
  
  .unit-tag {
    display: none;
  }
}
</style>
