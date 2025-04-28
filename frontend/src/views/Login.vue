<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>固体废物管理系统</h1>
        <h2>用户登录</h2>
      </div>
      
      <el-form 
        ref="loginForm" 
        :model="form" 
        :rules="rules" 
        label-width="80px"
        class="login-form"
        @submit.prevent="submitForm"
      >
        <el-form-item label="用户" prop="phone">
          <el-input 
            v-model="form.phone" 
            placeholder="请输入用户名" 
          />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="form.password" 
            type="password" 
            placeholder="请输入密码" 
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-checkbox v-model="form.rememberMe">记住登录</el-checkbox>
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            native-type="submit"
            @click="submitForm" 
            :loading="auth.state.loading"
            style="width: 100%"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
      
      <div v-if="auth.state.error" class="login-error">
        {{ auth.state.error }}
      </div>
    </div>
  </div>
</template>

<script>
import { reactive, ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import auth from '../store/auth';

/* eslint-disable vue/multi-word-component-names */
export default {
  name: 'LoginView',
  setup() {
    const router = useRouter();
    const loginForm = ref(null);
    
    const form = reactive({
      phone: '',
      password: '',
      rememberMe: false
    });
    
    // 验证规则
    const rules = computed(() => {
      const phoneRules = [
        { required: true, message: '请输入用户名', trigger: 'submit' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的格式', trigger: 'submit' }
      ];
      
      const passwordRules = [
        { required: true, message: '请输入密码', trigger: 'submit' }
      ];
      
      return {
        phone: phoneRules,
        password: passwordRules
      };
    });
    
    // 提交表单
    const submitForm = async () => {
      console.log('提交表单被触发');
      if (!loginForm.value) {
        console.log('表单引用不存在');
        return;
      }
      
      // 防止重复提交
      if (auth.state.loading) {
        console.log('登录正在进行中，跳过');
        return;
      }
      
      loginForm.value.validate(async (valid) => {
        if (valid) {
          console.log('表单验证通过');
          await doLogin();
        } else {
          console.log('表单验证失败');
        }
      });
    };
    
    // 执行登录
    const doLogin = async () => {
      console.log('开始登录，账号:', form.phone);
      try {
        // 添加调试信息
        console.log('开始处理登录操作...');
        
        const result = await auth.login(
          form.phone,
          form.password,
          form.rememberMe
        );
        
        console.log('登录响应:', result);
        
        if (result.success) {
          const user = result.user;
          
          ElMessage.success(`欢迎，${user.username || user.phone}`);
          
          // 根据用户角色跳转到不同页面
          if (user.role_id === 3) {
            // 超级管理员
            router.push('/admin-records');
          } else if (user.role_id === 4) {
            // 监督人员直接进入新增记录页面
            router.push('/record/new');
          } else if (user.role_id === 2) {
            // 单位管理员直接进入填报页面
            router.push(`/unit/${user.unit_id}`);
          } else {
            // 普通员工进入填报页面
            router.push(`/unit/${user.unit_id}`);
          }
        } else {
          // 显示登录失败错误
          ElMessage.error(result.error || '登录失败');
        }
      } catch (error) {
        // 捕获并显示非预期错误
        ElMessage.error(error.response?.data?.error || '登录失败，请检查网络连接');
      }
    };
    
    // 如果已登录，自动跳转
    onMounted(() => {
      if (auth.state.isLoggedIn) {
        const user = auth.state.user;
        if (user.role_id === 3) {
          router.push('/admin-records');
        } else if (user.role_id === 4) {
          router.push('/record/new');
        } else if (user.role_id === 2) {
          router.push(`/unit/${user.unit_id}`);
        } else {
          router.push(`/unit/${user.unit_id}`);
        }
      }
    });
    
    return {
      form,
      rules,
      loginForm,
      submitForm,
      auth
    };
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f2f5;
  padding: 15px;
}

.login-card {
  width: 400px;
  padding: 30px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h1 {
  font-size: 24px;
  color: #409EFF;
  margin-bottom: 10px;
}

.login-header h2 {
  font-size: 18px;
  color: #555;
  font-weight: normal;
}

.login-form {
  margin-top: 20px;
}

.login-error {
  color: #f56c6c;
  text-align: center;
  margin-top: 15px;
  font-size: 14px;
}

/* 移动端适配 */
@media screen and (max-width: 480px) {
  .login-card {
    width: 100%;
    padding: 20px;
    box-shadow: none;
  }
  
  .login-header h1 {
    font-size: 20px;
  }
  
  .login-header h2 {
    font-size: 16px;
  }
  
  .el-form-item {
    margin-bottom: 15px;
  }
}
</style>
