<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>危险废物管理系统</h1>
        <h2>用户登录</h2>
      </div>
      
      <el-form 
        ref="loginForm" 
        :model="form" 
        :rules="rules" 
        label-width="80px"
        class="login-form"
      >
        <el-form-item label="手机号" prop="phone">
          <el-input 
            v-model="form.phone" 
            placeholder="请输入手机号" 
            @keyup.enter="submitForm"
          />
        </el-form-item>
        
        <el-form-item v-if="showPassword" label="密码" prop="password">
          <el-input 
            v-model="form.password" 
            type="password" 
            placeholder="请输入密码" 
            show-password
            @keyup.enter="submitForm"
          />
        </el-form-item>
        
        <el-form-item>
          <el-radio-group v-model="form.userType" @change="handleUserTypeChange">
            <el-radio :label="1">员工</el-radio>
            <el-radio :label="2">单位管理员</el-radio>
            <el-radio :label="3">超级管理员</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
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
      userType: 1 // 默认为员工
    });
    
    const rules = {
      phone: [
        { required: true, message: '请输入手机号', trigger: 'blur' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' }
      ]
    };
    
    // 员工登录不需要密码，管理员需要
    const showPassword = computed(() => form.userType !== 1);
    
    // 切换用户类型时重置表单
    const handleUserTypeChange = () => {
      if (form.userType === 1) {
        form.password = '';
      }
      if (loginForm.value) {
        loginForm.value.clearValidate();
      }
    };
    
    // 提交表单
    const submitForm = () => {
      if (!showPassword.value) {
        // 员工登录不需要验证密码
        loginForm.value.validateField('phone', async (error) => {
          if (!error) {
            await doLogin();
          }
        });
      } else {
        // 管理员需要验证所有字段
        loginForm.value.validate(async (valid) => {
          if (valid) {
            await doLogin();
          }
        });
      }
    };
    
    // 执行登录
    const doLogin = async () => {
      try {
        const result = await auth.login(form.phone, form.password);
        
        if (result.success) {
          const user = result.user;
          
          ElMessage.success(`欢迎，${user.username || user.phone}`);
          
          // 根据用户角色跳转到不同页面
          if (user.role_id === 3) {
            // 超级管理员
            router.push('/');
          } else {
            // 其他用户直接进入对应单位的填报页面
            router.push(`/unit/${user.unit_id}`);
          }
        }
      } catch (error) {
        console.error('Login error:', error);
      }
    };
    
    // 如果已登录，自动跳转
    onMounted(() => {
      if (auth.state.isLoggedIn) {
        const user = auth.state.user;
        if (user.role_id === 3) {
          router.push('/');
        } else {
          router.push(`/unit/${user.unit_id}`);
        }
      }
    });
    
    return {
      form,
      rules,
      loginForm,
      showPassword,
      handleUserTypeChange,
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
</style>
