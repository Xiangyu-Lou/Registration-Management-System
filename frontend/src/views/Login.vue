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
        @submit.prevent="submitForm"
      >
        <el-form-item label="手机号" prop="phone">
          <el-input 
            v-model="form.phone" 
            placeholder="请输入手机号" 
          />
        </el-form-item>
        
        <el-form-item v-if="showPassword" label="密码" prop="password">
          <el-input 
            v-model="form.password" 
            type="password" 
            placeholder="请输入密码" 
            show-password
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
      userType: 1, // 默认为员工
      rememberMe: false // 添加记住登录选项
    });
    
    // 员工登录不需要密码，管理员需要
    const showPassword = computed(() => form.userType !== 1);
    
    // 根据用户类型动态设置验证规则
    const rules = computed(() => {
      const phoneRules = [
        { required: true, message: '请输入手机号', trigger: 'submit' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'submit' }
      ];
      
      const passwordRules = showPassword.value ? [
        { required: true, message: '请输入密码', trigger: 'submit' }
      ] : [];
      
      return {
        phone: phoneRules,
        password: passwordRules
      };
    });
    
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
      
      // 员工登录不需要密码
      if (form.userType === 1) {
        console.log('员工登录模式');
        // 手机号简单验证 - 使用表单验证而不是手动验证
        loginForm.value.validate(async (valid) => {
          if (valid) {
            console.log('员工登录表单验证通过');
            await doLogin();
          } else {
            console.log('员工表单验证失败');
            // 不再显示额外的消息，表单验证会自动显示
          }
        });
      } else {
        console.log('管理员登录模式');
        // 管理员需要验证整个表单
        loginForm.value.validate(async (valid) => {
          if (valid) {
            console.log('管理员表单验证通过');
            await doLogin();
          } else {
            console.log('表单验证失败');
            // 移除这行，让表单验证自动显示错误信息，避免重复
            // ElMessage.warning('请填写必要的登录信息');
          }
        });
      }
    };
    
    // 执行登录
    const doLogin = async () => {
      console.log('开始登录，账号:', form.phone, '用户类型:', form.userType);
      try {
        // 添加调试信息
        console.log('开始处理登录操作...');
        
        // 根据用户类型和密码进行登录
        const result = await auth.login(
          form.phone,
          form.userType === 1 ? null : form.password,
          form.rememberMe,
          form.userType
        );
        
        console.log('登录响应:', result);
        
        if (result.success) {
          const user = result.user;
          
          ElMessage.success(`欢迎，${user.username || user.phone}`);
          
          // 根据用户角色跳转到不同页面
          if (user.role_id === 3) {
            // 超级管理员
            router.push('/admin-records');
          } else if (user.role_id === 2) {
            // 单位管理员直接进入记录页面
            router.push(`/records/${user.unit_id}`);
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
        } else if (user.role_id === 2) {
          router.push(`/records/${user.unit_id}`);
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
