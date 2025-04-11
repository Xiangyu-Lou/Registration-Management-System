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
import auth from '../store/auth';
import httpService from '../config/httpService';
import api from '../config/api';

export default {
  name: 'UserProfile',
  
  setup() {
    const router = useRouter();
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
    
    // 表单验证规则
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
        setTimeout(() => {
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
  background-color: #f5f7fa;
}

.header {
  /* 修改背景渐变，实现两端深中间浅的效果 */
  background: linear-gradient(to right, #1976d2, #42a5f5, #1976d2);
  color: white;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 0 0 20px 20px;
  margin-bottom: 10px;
  position: relative;
  overflow: hidden;
}

.header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  /* 调整覆盖层渐变，增强立体感 */
  background: linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0) 100%);
  z-index: 1;
}

.header h1 {
  position: relative;
  z-index: 2;
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  letter-spacing: 1px;
}

.back-button {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  position: relative;
  z-index: 2;
  background-color: rgba(255, 255, 255, 0.25);
  padding: 8px 14px;
  border-radius: 8px;
  transition: all 0.3s ease;
  border: 1.5px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  letter-spacing: 0.3px;
}

.back-button:hover {
  background-color: rgba(255, 255, 255, 0.35);
  transform: translateY(-2px);
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.25);
  border-color: rgba(255, 255, 255, 0.8);
}

.content {
  flex: 1;
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.profile-card {
  margin-bottom: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.profile-card:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-weight: 600;
  color: #333;
}

.profile-form {
  padding: 10px 0;
}

.field-hint {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
  margin-left: 2px;
}

.el-divider {
  margin: 30px 0;
}

@media screen and (max-width: 768px) {
  .content {
    padding: 10px;
  }
  
  .profile-card {
    border-radius: 8px;
  }
}
</style> 