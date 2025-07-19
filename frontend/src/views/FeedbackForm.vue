<template>
  <div class="feedback-container">
    <div class="header">
      <div class="back-button" @click="goBack">
        <el-icon><arrow-left /></el-icon> 返回
      </div>
      <h1>问题反馈</h1>
      <div></div>
    </div>

    <div class="content">
      <el-card class="feedback-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>提交系统问题反馈</span>
          </div>
        </template>

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



          <el-form-item>
            <el-button type="primary" @click="submitForm" :loading="loading">
              提交反馈
            </el-button>
            <el-button @click="resetForm">重置</el-button>
            <el-button @click="goBack">取消</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';
import httpService from '../config/httpService';
import apiConfig from '../config/api';

export default {
  name: 'FeedbackForm',
  components: {
    ArrowLeft
  },
  setup() {
    const router = useRouter();
    const formRef = ref(null);
    const loading = ref(false);

    // 表单数据
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
          // 跳转到反馈列表页面
          router.push({ name: 'FeedbackList' });
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
      formRef.value.resetFields();
    };

    // 返回上一页
    const goBack = () => {
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
          router.back();
        });
      } else {
        router.back();
      }
    };

    return {
      formRef,
      loading,
      form,
      rules,
      submitForm,
      resetForm,
      goBack
    };
  }
};
</script>

<style scoped>
.feedback-container {
  background-color: #f5f5f5;
  min-height: 100vh;
}

.header {
  background: linear-gradient(to right, #1976d2, #42a5f5, #1976d2);
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 0 0 20px 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.back-button {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  background-color: rgba(255, 255, 255, 0.25);
  padding: 8px 14px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.back-button:hover {
  background-color: rgba(255, 255, 255, 0.35);
}

.content {
  padding: 0 20px 20px 20px;
  max-width: 800px;
  margin: 0 auto;
}

.feedback-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}



/* 移动端适配 */
@media screen and (max-width: 768px) {
  .content {
    padding: 0 10px 20px 10px;
  }
  
  .header {
    padding: 15px;
  }
  
  .header h1 {
    font-size: 20px;
  }
  
  :deep(.el-form-item__label) {
    font-size: 14px;
  }
}
</style> 