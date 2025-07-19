<template>
  <div class="app-header">
    <div class="logo">
      <h1>固体废物管理系统</h1>
    </div>
    <div class="user-info" v-if="auth.state.isLoggedIn">
      <span class="welcome-text">
        欢迎,
        <strong>{{ userName }}</strong>
        <span v-if="auth.state.user.company_name" class="company-tag">
          {{ auth.state.user.company_name }}
        </span>
        <span v-if="auth.state.user.unit_name" class="unit-tag">
          {{ auth.state.user.unit_name }}
        </span>
      </span>
      <el-button type="text" class="feedback-button" @click="showFeedbackDialog">
        <el-icon><chat-line-round /></el-icon> 问题反馈
      </el-button>
      <el-button type="text" class="profile-button" @click="goToProfile">
        <el-icon><user /></el-icon> 账号设置
      </el-button>
      <el-button type="text" class="logout-button" @click="handleLogout">
        退出登录
      </el-button>
    </div>

    <!-- 问题反馈弹窗 -->
    <el-dialog
      v-model="feedbackVisible"
      title="问题反馈"
      width="600px"
      :close-on-click-modal="false"
      @close="closeFeedbackDialog"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        @submit.prevent="submitForm"
      >
        <el-form-item label="问题类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择问题类型" style="width: 100%">
            <el-option label="系统Bug" value="bug" />
            <el-option label="功能建议" value="feature" />
            <el-option label="体验改进" value="improvement" />
            <el-option label="其他问题" value="other" />
          </el-select>
        </el-form-item>

        <el-form-item label="优先级" prop="priority">
          <el-select v-model="form.priority" placeholder="请选择优先级" style="width: 100%">
            <el-option label="低" value="low" />
            <el-option label="中" value="medium" />
            <el-option label="高" value="high" />
            <el-option label="紧急" value="urgent" />
          </el-select>
        </el-form-item>

        <el-form-item label="问题标题" prop="title">
          <el-input
            v-model="form.title"
            placeholder="请简要描述问题"
          />
        </el-form-item>

        <el-form-item label="问题描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="6"
            placeholder="请详细描述遇到的问题，包括出现的情况、预期的结果等"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="resetForm">重置</el-button>
          <el-button @click="closeFeedbackDialog">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="loading">
            提交反馈
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { computed, ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ChatLineRound } from '@element-plus/icons-vue';
import auth from '../store/auth';
import httpService from '../config/httpService';
import apiConfig from '../config/api';

export default {
  name: 'AppHeader',
  components: {
    ChatLineRound
  },
  setup() {
    const router = useRouter();
    const formRef = ref(null);
    const loading = ref(false);
    const feedbackVisible = ref(false);
    
    // 获取用户名，优先显示用户名，如果没有则显示手机号
    const userName = computed(() => {
      if (!auth.state.isLoggedIn) return '';
      return auth.state.user.username || auth.state.user.phone;
    });

    // 反馈表单数据
    const form = reactive({
      type: 'bug',
      priority: 'medium',
      title: '',
      description: ''
    });

    // 表单验证规则
    const rules = {
      type: [
        { required: true, message: '请选择问题类型', trigger: 'change' }
      ],
      priority: [
        { required: true, message: '请选择优先级', trigger: 'change' }
      ],
      title: [
        { required: true, message: '请输入问题标题', trigger: 'blur' }
      ],
      description: [
        { required: true, message: '请输入问题描述', trigger: 'blur' }
      ]
    };
    
    // 处理退出登录
    const handleLogout = () => {
      auth.logout();
      ElMessage.success('已退出登录');
      router.push('/login');
    };
    
    // 跳转到个人资料页面
    const goToProfile = () => {
      router.push('/profile');
    };

    // 显示反馈弹窗
    const showFeedbackDialog = () => {
      feedbackVisible.value = true;
    };

    // 关闭反馈弹窗
    const closeFeedbackDialog = () => {
      if (form.title || form.description) {
        ElMessageBox.confirm(
          '您有未保存的内容，确定要离开吗？',
          '提示',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        ).then(() => {
          feedbackVisible.value = false;
          resetForm();
        });
      } else {
        feedbackVisible.value = false;
        resetForm();
      }
    };

    // 提交表单
    const submitForm = async () => {
      try {
        // 验证表单
        const valid = await formRef.value.validate();
        if (!valid) {
          return;
        }

        loading.value = true;

        // 准备表单数据
        const formData = {
          type: form.type,
          priority: form.priority,
          title: form.title,
          description: form.description
        };

        // 提交数据
        const response = await httpService.post(apiConfig.endpoints.feedback, formData);

        if (response.data.success) {
          ElMessage.success('问题反馈提交成功！');
          feedbackVisible.value = false;
          resetForm();
        } else {
          ElMessage.error(response.data.message || '提交失败');
        }

      } catch (error) {
        console.error('提交问题反馈失败:', error);
        ElMessage.error('提交失败，请重试');
      } finally {
        loading.value = false;
      }
    };

    // 重置表单
    const resetForm = () => {
      if (formRef.value) {
        formRef.value.resetFields();
      }
      form.type = 'bug';
      form.priority = 'medium';
      form.title = '';
      form.description = '';
    };
    
    return {
      auth,
      userName,
      handleLogout,
      goToProfile,
      // 反馈表单相关
      feedbackVisible,
      formRef,
      loading,
      form,
      rules,
      showFeedbackDialog,
      closeFeedbackDialog,
      submitForm,
      resetForm
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

.logo h1 {
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

.role-tag, .unit-tag, .company-tag {
  font-size: 12px;
  margin-left: 5px;
  padding: 2px 6px;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.3);
}

.company-tag {
  background-color: rgba(255, 215, 0, 0.6); /* 金色背景表示公司 */
}

.feedback-button,
.profile-button,
.logout-button {
  color: white;
  font-weight: bold;
  margin-left: 15px;
}

.feedback-button:hover,
.profile-button:hover,
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
  
  .logo h1 {
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
  
  .role-tag, .unit-tag, .company-tag {
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
  
  .logo {
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

/* 反馈弹窗样式 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

:deep(.el-dialog) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-dialog__header) {
  background: linear-gradient(to right, #409EFF, #1976d2);
  color: white;
  padding: 20px;
  margin: 0;
}

:deep(.el-dialog__title) {
  color: white;
  font-weight: 600;
}

:deep(.el-dialog__headerbtn) {
  top: 20px;
  right: 20px;
}

:deep(.el-dialog__close) {
  color: white;
  font-size: 18px;
}

:deep(.el-dialog__close:hover) {
  color: #f0f0f0;
}

:deep(.el-dialog__body) {
  padding: 30px;
}

:deep(.el-dialog__footer) {
  border-top: 1px solid #ebeef5;
  padding: 20px 30px;
  background-color: #fafafa;
}

/* 表单样式优化 */
:deep(.el-form-item__label) {
  font-weight: 600;
  color: #333;
}

:deep(.el-select),
:deep(.el-input__wrapper) {
  border-radius: 6px;
}

:deep(.el-textarea__inner) {
  border-radius: 6px;
  resize: vertical;
}

/* 移动端弹窗适配 */
@media screen and (max-width: 768px) {
  :deep(.el-dialog) {
    width: 95% !important;
    margin: 0 auto;
  }
  
  :deep(.el-dialog__body) {
    padding: 20px;
  }
  
  :deep(.el-dialog__footer) {
    padding: 15px 20px;
  }
  
  :deep(.el-form-item__label) {
    width: 80px !important;
    font-size: 14px;
  }
}
</style>
