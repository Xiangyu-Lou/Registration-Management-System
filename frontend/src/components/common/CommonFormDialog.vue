<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    :width="width"
    :close-on-click-modal="closeOnClickModal"
    :close-on-press-escape="closeOnPressEscape"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="internalFormData"
      :rules="formRules"
      :label-width="labelWidth"
      :style="{ maxWidth: formMaxWidth, margin: '0 auto' }"
    >
      <template v-for="field in fields" :key="field.key">
        <el-form-item 
          :label="field.label" 
          :prop="field.key"
          v-if="!field.hidden && (!field.showWhen || field.showWhen(internalFormData, isEdit))"
        >
          <!-- 输入框 -->
          <el-input
            v-if="field.type === 'input' || !field.type"
            v-model="internalFormData[field.key]"
            :placeholder="field.placeholder || `请输入${field.label}`"
            :clearable="field.clearable !== false"
            :disabled="field.disabled || (field.disabledWhen && field.disabledWhen(internalFormData, isEdit))"
            :type="field.inputType || 'text'"
            :maxlength="field.maxlength"
            :show-word-limit="field.showWordLimit"
          />

          <!-- 数字输入 -->
          <el-input-number
            v-else-if="field.type === 'number'"
            v-model="internalFormData[field.key]"
            :placeholder="field.placeholder"
            :style="{ width: '100%' }"
            :min="field.min"
            :max="field.max"
            :step="field.step"
            :precision="field.precision"
            :disabled="field.disabled || (field.disabledWhen && field.disabledWhen(internalFormData, isEdit))"
            :controls="field.controls !== false"
          />

          <!-- 下拉选择 -->
          <el-select
            v-else-if="field.type === 'select'"
            v-model="internalFormData[field.key]"
            :placeholder="field.placeholder || `请选择${field.label}`"
            :style="{ width: '100%' }"
            :clearable="field.clearable !== false"
            :disabled="field.disabled || (field.disabledWhen && field.disabledWhen(internalFormData, isEdit))"
            :multiple="field.multiple"
            :filterable="field.filterable"
            @change="handleFieldChange(field.key, $event)"
          >
            <el-option
              v-for="option in getFieldOptions(field)"
              :key="getOptionValue(option, field.optionValue)"
              :label="getOptionLabel(option, field.optionLabel)"
              :value="getOptionValue(option, field.optionValue)"
              :disabled="option.disabled"
            />
          </el-select>

          <!-- 日期选择 -->
          <el-date-picker
            v-else-if="field.type === 'date'"
            v-model="internalFormData[field.key]"
            :type="field.dateType || 'date'"
            :placeholder="field.placeholder || `请选择${field.label}`"
            :style="{ width: '100%' }"
            :clearable="field.clearable !== false"
            :disabled="field.disabled || (field.disabledWhen && field.disabledWhen(internalFormData, isEdit))"
            :format="field.format"
            :value-format="field.valueFormat"
          />

          <!-- 开关 -->
          <el-switch
            v-else-if="field.type === 'switch'"
            v-model="internalFormData[field.key]"
            :active-text="field.activeText"
            :inactive-text="field.inactiveText"
            :active-value="field.activeValue !== undefined ? field.activeValue : true"
            :inactive-value="field.inactiveValue !== undefined ? field.inactiveValue : false"
            :disabled="field.disabled || (field.disabledWhen && field.disabledWhen(internalFormData, isEdit))"
          />

          <!-- 文本域 -->
          <el-input
            v-else-if="field.type === 'textarea'"
            v-model="internalFormData[field.key]"
            type="textarea"
            :placeholder="field.placeholder || `请输入${field.label}`"
            :rows="field.rows || 3"
            :maxlength="field.maxlength"
            :show-word-limit="field.showWordLimit"
            :disabled="field.disabled || (field.disabledWhen && field.disabledWhen(internalFormData, isEdit))"
          />

          <!-- 密码框 -->
          <el-input
            v-else-if="field.type === 'password'"
            v-model="internalFormData[field.key]"
            type="password"
            :placeholder="field.placeholder || `请输入${field.label}`"
            :show-password="field.showPassword !== false"
            :disabled="field.disabled || (field.disabledWhen && field.disabledWhen(internalFormData, isEdit))"
          />

          <!-- 自定义插槽 -->
          <slot
            v-else-if="field.type === 'slot'"
            :name="field.slotName || field.key"
            :field="field"
            :value="internalFormData[field.key]"
            :formData="internalFormData"
            :isEdit="isEdit"
            :onChange="(value) => handleFieldChange(field.key, value)"
          />

          <!-- 提示文本 -->
          <div v-if="field.tip" class="field-tip">{{ field.tip }}</div>
        </el-form-item>
      </template>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          {{ isEdit ? '更新' : '确定' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
import { ref, reactive, computed, watch, nextTick } from 'vue';

export default {
  name: 'CommonFormDialog',
  props: {
    // 对话框配置
    modelValue: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: ''
    },
    width: {
      type: String,
      default: '500px'
    },
    closeOnClickModal: {
      type: Boolean,
      default: false
    },
    closeOnPressEscape: {
      type: Boolean,
      default: true
    },

    // 表单配置
    fields: {
      type: Array,
      required: true
    },
    formData: {
      type: Object,
      default: () => ({})
    },
    rules: {
      type: Object,
      default: () => ({})
    },
    labelWidth: {
      type: String,
      default: '100px'
    },
    formMaxWidth: {
      type: String,
      default: '400px'
    },

    // 状态配置
    isEdit: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },

    // 标题配置
    addTitle: {
      type: String,
      default: '添加'
    },
    editTitle: {
      type: String,
      default: '编辑'
    }
  },
  emits: ['update:modelValue', 'submit', 'cancel', 'field-change'],
  setup(props, { emit }) {
    const formRef = ref(null);
    const internalFormData = reactive({});

    // 对话框显示状态
    const dialogVisible = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    });

    // 对话框标题
    const dialogTitle = computed(() => {
      if (props.title) return props.title;
      return props.isEdit ? props.editTitle : props.addTitle;
    });

    // 表单验证规则
    const formRules = computed(() => {
      const rules = { ...props.rules };
      
      // 自动生成基础验证规则
      props.fields.forEach(field => {
        if (!rules[field.key] && field.required) {
          rules[field.key] = [
            { 
              required: true, 
              message: field.requiredMessage || `请${getRequiredMessagePrefix(field.type)}${field.label}`,
              trigger: getValidationTrigger(field.type)
            }
          ];
        }
        
        // 合并字段自定义规则
        if (field.rules) {
          rules[field.key] = rules[field.key] 
            ? [...rules[field.key], ...field.rules]
            : field.rules;
        }
      });
      
      return rules;
    });

    // 获取必填验证消息前缀
    const getRequiredMessagePrefix = (type) => {
      switch (type) {
        case 'select':
          return '选择';
        case 'date':
          return '选择';
        case 'upload':
          return '上传';
        default:
          return '输入';
      }
    };

    // 获取验证触发方式
    const getValidationTrigger = (type) => {
      switch (type) {
        case 'select':
        case 'date':
        case 'switch':
          return 'change';
        default:
          return 'blur';
      }
    };

    // 初始化表单数据
    const initFormData = () => {
      // 清空当前数据
      Object.keys(internalFormData).forEach(key => {
        delete internalFormData[key];
      });
      
      // 设置新数据
      props.fields.forEach(field => {
        const value = props.formData[field.key];
        internalFormData[field.key] = value !== undefined ? value : getDefaultValue(field);
      });
    };

    // 获取字段默认值
    const getDefaultValue = (field) => {
      if (field.defaultValue !== undefined) {
        return typeof field.defaultValue === 'function' 
          ? field.defaultValue(props.isEdit) 
          : field.defaultValue;
      }
      
      switch (field.type) {
        case 'number':
          return undefined;
        case 'switch':
          return false;
        case 'select':
          return field.multiple ? [] : null;
        default:
          return '';
      }
    };

    // 获取字段选项
    const getFieldOptions = (field) => {
      if (typeof field.options === 'function') {
        return field.options(internalFormData, props.isEdit);
      }
      return field.options || [];
    };

    // 获取选项值和标签
    const getOptionValue = (option, valueKey) => {
      if (typeof option === 'object' && option !== null) {
        return option[valueKey || 'value'];
      }
      return option;
    };

    const getOptionLabel = (option, labelKey) => {
      if (typeof option === 'object' && option !== null) {
        return option[labelKey || 'label'];
      }
      return option;
    };

    // 处理字段变化
    const handleFieldChange = (key, value) => {
      internalFormData[key] = value;
      emit('field-change', { key, value, formData: { ...internalFormData } });
    };

    // 处理提交
    const handleSubmit = async () => {
      if (!formRef.value) return;
      
      try {
        await formRef.value.validate();
        emit('submit', { ...internalFormData });
      } catch (error) {
        console.log('表单验证失败:', error);
      }
    };

    // 处理关闭
    const handleClose = () => {
      emit('cancel');
      dialogVisible.value = false;
      
      // 重置表单验证状态
      nextTick(() => {
        if (formRef.value) {
          formRef.value.resetFields();
        }
      });
    };

    // 监听对话框打开状态
    watch(() => props.modelValue, (visible) => {
      if (visible) {
        initFormData();
      }
    });

    // 监听外部formData变化
    watch(() => props.formData, () => {
      if (props.modelValue) {
        initFormData();
      }
    }, { deep: true });

    return {
      formRef,
      internalFormData,
      dialogVisible,
      dialogTitle,
      formRules,
      getFieldOptions,
      getOptionValue,
      getOptionLabel,
      handleFieldChange,
      handleSubmit,
      handleClose
    };
  }
};
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.field-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .dialog-footer {
    flex-direction: column-reverse;
  }
  
  .dialog-footer .el-button {
    width: 100%;
    margin: 0;
  }
}
</style> 