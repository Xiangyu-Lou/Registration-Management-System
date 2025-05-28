<template>
  <div class="form-container">
    <!-- 单位信息标题（可选） -->
    <div v-if="showUnitInfo && unitName" class="unit-info">
      <h2>{{ unitName }}</h2>
    </div>

    <!-- 表单卡片 -->
    <el-card class="form-card" :shadow="cardShadow">
      <template #header v-if="showHeader">
        <div class="form-header">
          <span class="form-title">{{ formTitle }}</span>
          <div class="form-header-actions">
            <slot name="header-actions"></slot>
          </div>
        </div>
      </template>

      <!-- 表单内容 -->
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        :label-width="labelWidth"
        :label-position="labelPosition"
        :size="formSize"
        class="form-content"
        @submit.prevent="handleSubmit"
      >
        <slot></slot>

        <!-- 表单操作按钮 -->
        <div v-if="showActions" class="form-actions">
          <el-button
            v-if="showSubmitButton"
            type="primary"
            :loading="submitLoading"
            :disabled="submitDisabled"
            class="submit-btn"
            @click="handleSubmit"
          >
            {{ submitText }}
          </el-button>
          
          <el-button
            v-if="showResetButton"
            :disabled="submitLoading"
            class="reset-btn"
            @click="handleReset"
          >
            {{ resetText }}
          </el-button>
          
          <el-button
            v-if="showCancelButton"
            :disabled="submitLoading"
            class="cancel-btn"
            @click="handleCancel"
          >
            {{ cancelText }}
          </el-button>

          <!-- 自定义操作按钮 -->
          <slot name="custom-actions"></slot>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { ref } from 'vue';

export default {
  name: 'FormContainer',
  props: {
    // 表单数据
    formData: {
      type: Object,
      required: true
    },
    // 表单验证规则
    formRules: {
      type: Object,
      default: () => ({})
    },
    // 表单标题
    formTitle: {
      type: String,
      default: ''
    },
    // 单位名称
    unitName: {
      type: String,
      default: ''
    },
    // 是否显示单位信息
    showUnitInfo: {
      type: Boolean,
      default: false
    },
    // 是否显示表单头部
    showHeader: {
      type: Boolean,
      default: false
    },
    // 是否显示操作按钮区域
    showActions: {
      type: Boolean,
      default: true
    },
    // 是否显示提交按钮
    showSubmitButton: {
      type: Boolean,
      default: true
    },
    // 是否显示重置按钮
    showResetButton: {
      type: Boolean,
      default: true
    },
    // 是否显示取消按钮
    showCancelButton: {
      type: Boolean,
      default: false
    },
    // 按钮文本
    submitText: {
      type: String,
      default: '提交'
    },
    resetText: {
      type: String,
      default: '重置'
    },
    cancelText: {
      type: String,
      default: '取消'
    },
    // 提交状态
    submitLoading: {
      type: Boolean,
      default: false
    },
    submitDisabled: {
      type: Boolean,
      default: false
    },
    // 表单样式配置
    labelWidth: {
      type: String,
      default: '120px'
    },
    labelPosition: {
      type: String,
      default: 'right',
      validator: (value) => ['left', 'right', 'top'].includes(value)
    },
    formSize: {
      type: String,
      default: 'default',
      validator: (value) => ['large', 'default', 'small'].includes(value)
    },
    cardShadow: {
      type: String,
      default: 'always',
      validator: (value) => ['always', 'hover', 'never'].includes(value)
    },
    // 响应式配置
    responsive: {
      type: Boolean,
      default: true
    }
  },
  emits: ['submit', 'reset', 'cancel', 'validate'],
  setup(props, { emit }) {
    const formRef = ref();

    /**
     * 处理表单提交
     */
    const handleSubmit = async () => {
      if (!formRef.value) return;
      
      try {
        const valid = await formRef.value.validate();
        if (valid) {
          emit('submit', props.formData);
        }
      } catch (error) {
        console.error('表单验证失败:', error);
        emit('validate', false, error);
      }
    };

    /**
     * 处理表单重置
     */
    const handleReset = () => {
      if (formRef.value) {
        formRef.value.resetFields();
      }
      emit('reset');
    };

    /**
     * 处理取消操作
     */
    const handleCancel = () => {
      emit('cancel');
    };

    /**
     * 验证表单
     */
    const validateForm = () => {
      if (!formRef.value) return Promise.reject('表单引用不存在');
      return formRef.value.validate();
    };

    /**
     * 清除验证
     */
    const clearValidate = (props) => {
      if (formRef.value) {
        formRef.value.clearValidate(props);
      }
    };

    /**
     * 验证特定字段
     */
    const validateField = (props) => {
      if (!formRef.value) return;
      formRef.value.validateField(props);
    };

    return {
      formRef,
      handleSubmit,
      handleReset,
      handleCancel,
      validateForm,
      clearValidate,
      validateField
    };
  }
};
</script>

<style scoped>
.form-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  box-sizing: border-box;
}

.unit-info {
  text-align: center;
  margin-bottom: 20px;
}

.unit-info h2 {
  color: #333;
  border-bottom: 2px solid #409EFF;
  display: inline-block;
  padding-bottom: 5px;
  font-size: 20px;
  margin: 0;
}

.form-card {
  background-color: #ffffff;
  border-radius: 8px;
  overflow: hidden;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.form-header-actions {
  display: flex;
  gap: 10px;
}

.form-content {
  padding: 20px 0;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.submit-btn, .reset-btn, .cancel-btn {
  min-width: 100px;
  height: 44px;
  font-size: 16px;
  border-radius: 8px;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .form-container {
    padding: 15px;
  }
  
  .unit-info h2 {
    font-size: 18px;
  }
  
  .form-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .submit-btn, .reset-btn, .cancel-btn {
    width: 100%;
    max-width: 280px;
  }
  
  .form-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .form-header-actions {
    width: 100%;
    justify-content: flex-end;
  }
}

@media (max-width: 480px) {
  .form-container {
    padding: 10px;
  }
  
  .form-content {
    padding: 15px 0;
  }
  
  .form-actions {
    gap: 10px;
    margin-top: 20px;
  }
}

/* 表单项样式调整 */
.form-content :deep(.el-form-item) {
  margin-bottom: 24px;
}

.form-content :deep(.el-form-item__label) {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  padding-bottom: 4px;
}

.form-content :deep(.el-input__wrapper), 
.form-content :deep(.el-select__wrapper),
.form-content :deep(.el-textarea__inner) {
  font-size: 15px;
}

.form-content :deep(.el-input__wrapper) {
  height: 44px;
}

.form-content :deep(.el-date-editor) {
  width: 100%;
}

/* 暗色模式支持 */
@media (prefers-color-scheme: dark) {
  .form-card {
    background-color: #1e1e1e;
    border-color: #333;
  }
  
  .form-title {
    color: #fff;
  }
  
  .unit-info h2 {
    color: #fff;
  }
}
</style> 