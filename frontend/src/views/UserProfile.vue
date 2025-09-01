<template>
  <div class="user-profile-container">
    <div class="header">
      <div class="back-button" @click="goBack">
        <el-icon><arrow-left /></el-icon> 返回
      </div>
      <h1>个人账户设置</h1>
      <div></div>
    </div>

    <div class="content">
      <el-card class="profile-card">
        <template #header>
          <div class="card-header">
            <h3>账户信息</h3>
          </div>
        </template>
        
        <el-form 
          ref="profileForm" 
          :model="form" 
          :rules="rules" 
          label-position="top"
          class="profile-form"
        >
          <el-form-item label="手机号码">
            <el-input v-model="form.phone" disabled placeholder="手机号码" />
            <div class="field-hint">手机号码不可修改</div>
          </el-form-item>
          
          <el-form-item label="用户名" prop="username">
            <el-input v-model="form.username" placeholder="请输入您的名字" />
          </el-form-item>
          
          <el-divider>修改密码（可选）</el-divider>
          
          <el-form-item label="原密码" prop="oldPassword">
            <el-input 
              v-model="form.oldPassword" 
              placeholder="请输入原密码" 
              type="password" 
              show-password
            />
          </el-form-item>
          
          <el-form-item label="新密码" prop="newPassword">
            <el-input 
              v-model="form.newPassword" 
              placeholder="请输入新密码" 
              type="password" 
              show-password
            />
            <div class="field-hint">如不修改密码，请留空</div>
          </el-form-item>
          
          <el-form-item label="确认新密码" prop="confirmPassword">
            <el-input 
              v-model="form.confirmPassword" 
              placeholder="请再次输入新密码" 
              type="password" 
              show-password
            />
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="saveProfile" :loading="loading">
              保存修改
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';
import auth from '../store/auth';
import httpService from '../config/httpService';
import api from '../config/api';
import { useTimerCleanup } from '../composables/useTimerCleanup';

export default {
  name: 'UserProfile',
  components: {
    ArrowLeft
  },
  
  setup() {
    const router = useRouter();
    const { safeTimeout } = useTimerCleanup();
    const profileForm = ref(null);
    const loading = ref(false);
    
    // 表单数据
    const form = reactive({
      username: '',
      phone: '',
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    
    // 表单验证
    const rules = reactive({
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 2, max: 20, message: '用户名长度应为2-20个字符', trigger: 'blur' }
      ],
      oldPassword: [
        {
          validator: (rule, value, callback) => {
            // 仅当新密码有值时，原密码才必填
            if (form.newPassword && !value) {
              callback(new Error('修改密码时需要输入原密码'));
            } else {
              callback();
            }
          },
          trigger: 'blur'
        }
      ],
      newPassword: [
        { min: 1, max: 20, message: '密码长度应为1-20个字符', trigger: 'blur' }
      ],
      confirmPassword: [
        {
          validator: (rule, value, callback) => {
            // 仅当新密码有值时，确认密码才必填且需要验证一致性
            if (form.newPassword) {
              if (!value) {
                callback(new Error('请再次输入新密码'));
              } else if (value !== form.newPassword) {
                callback(new Error('两次输入的密码不一致'));
              } else {
                callback();
              }
            } else {
              // 如果新密码为空，则确认密码也不需要验证
              callback();
            }
          },
          trigger: 'blur'
        }
      ]
    });
    
    // 初始化数据
    onMounted(() => {
      if (!auth.state.isLoggedIn) {
        ElMessage.error('请先登录');
        router.push('/login');
        return;
      }
      
      // 加载用户数据
      form.username = auth.state.user.username || '';
      form.phone = auth.state.user.phone || '';
    });
    
    // 返回上一页
    const goBack = () => {
      router.go(-1);
    };
    
    // 保存个人资料
    const saveProfile = async () => {
      if (!auth.state.isLoggedIn) {
        ElMessage.error('请先登录');
        return;
      }
      
      try {
        await profileForm.value.validate();
        
        // 确认修改
        await ElMessageBox.confirm(
          '确定要保存这些修改吗？',
          '确认',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );
        
        loading.value = true;
        
        // 准备提交的数据
        const updateData = {
          username: form.username
        };
        
        // 如果修改了密码，添加密码相关字段
        if (form.newPassword) {
          updateData.oldPassword = form.oldPassword;
          updateData.newPassword = form.newPassword;
        }
        
        // 发送更新请求
        await httpService.put(
          api.getUrl(`/api/users/${auth.state.user.id}/profile`), 
          updateData
        );
        
        // 更新本地存储的用户信息
        auth.updateUserInfo({
          ...auth.state.user,
          username: form.username
        });
        
        ElMessage.success('个人资料已更新');
        
        // 清空密码字段
        form.oldPassword = '';
        form.newPassword = '';
        form.confirmPassword = '';
        
        // 添加延迟跳转
        safeTimeout(() => {
          goBack(); // 调用已有的返回函数
        }, 1500); // 延迟1.5秒
        
      } catch (error) {
        if (error === 'cancel') return;
        
        if (error.response && error.response.data && error.response.data.error) {
          ElMessage.error(error.response.data.error);
        } else if (error.message) {
          ElMessage.error(error.message);
        } else {
          ElMessage.error('保存失败，请重试');
        }
      } finally {
        loading.value = false;
      }
    };
    
    return {
      profileForm,
      form,
      rules,
      loading,
      goBack,
      saveProfile
    };
  }
};
</script>

<style scoped>
.user-profile-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--color-bg-secondary);
}

.header {
  background-color: var(--color-bg-primary);
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-primary);
  padding: 16px var(--space-5);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.back-button {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  color: var(--color-text-secondary);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  border: 1px solid var(--color-border);
  background-color: var(--color-bg-primary);
  font-weight: 500;
}

.back-button:hover {
  color: var(--color-accent);
  border-color: var(--color-accent);
  background-color: var(--color-accent-light);
}

.content {
  flex: 1;
  padding: var(--space-5);
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.profile-card {
  margin-bottom: var(--space-5);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
}

.profile-card:hover {
  box-shadow: var(--shadow-sm);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-weight: 600;
  color: var(--color-text-primary);
}

.profile-form {
  padding: var(--space-3) 0;
}

.field-hint {
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin-top: 4px;
  margin-left: 2px;
}

.el-divider {
  margin: var(--space-8) 0;
}

@media screen and (max-width: 768px) {
  .content {
    padding: var(--space-3);
  }

  .profile-card {
    border-radius: var(--radius-lg);
  }
}
</style> 