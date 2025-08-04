<template>
  <el-card class="filter-card" shadow="hover">
    <div class="filter-header">
      <h3>{{ title }}</h3>
      <div class="filter-header-actions">
        <el-button type="primary" link @click="togglePanel">
          {{ showPanel ? '收起' : '展开' }} 
          <el-icon v-if="!showPanel"><arrow-down /></el-icon>
          <el-icon v-else><arrow-up /></el-icon>
        </el-button>
      </div>
    </div>
    
    <div v-show="showPanel" class="filter-form-container">
      <el-form :model="formData" :label-width="labelWidth" class="filter-form">
        <el-row :gutter="20">
          <template v-for="field in fields" :key="field.key">
            <el-col 
              :xs="field.responsive?.xs || 24" 
              :sm="field.responsive?.sm || 12" 
              :md="field.responsive?.md || 8" 
              :lg="field.responsive?.lg || 6" 
              :xl="field.responsive?.xl || 6"
            >
              <el-form-item :label="field.label" :prop="field.key">
                <!-- 下拉选择 -->
                <el-select
                  v-if="field.type === 'select'"
                  v-model="formData[field.key]"
                  :placeholder="field.placeholder || `选择${field.label}`"
                  :style="{ width: '100%' }"
                  :clearable="field.clearable !== false"
                  :multiple="field.multiple"
                  :filterable="field.filterable"
                  @change="handleFieldChange(field.key, $event)"
                >
                  <el-option
                    v-for="option in field.options"
                    :key="getOptionValue(option, field.optionValue)"
                    :label="getOptionLabel(option, field.optionLabel)"
                    :value="getOptionValue(option, field.optionValue)"
                  />
                </el-select>

                <!-- 输入框 -->
                <el-input
                  v-else-if="field.type === 'input' || !field.type"
                  v-model="formData[field.key]"
                  :placeholder="field.placeholder || `输入${field.label}`"
                  :clearable="field.clearable !== false"
                  :type="field.inputType || 'text'"
                  @input="handleFieldChange(field.key, $event)"
                />

                <!-- 数字输入 -->
                <el-input-number
                  v-else-if="field.type === 'number'"
                  v-model="formData[field.key]"
                  :placeholder="field.placeholder"
                  :style="{ width: '100%' }"
                  :min="field.min"
                  :max="field.max"
                  :step="field.step"
                  :precision="field.precision"
                  :controls="field.controls !== false"
                  @change="handleFieldChange(field.key, $event)"
                />

                <!-- 日期选择 -->
                <el-date-picker
                  v-else-if="field.type === 'date'"
                  v-model="formData[field.key]"
                  :type="field.dateType || 'date'"
                  :placeholder="field.placeholder || `选择${field.label}`"
                  :style="{ width: '100%' }"
                  :clearable="field.clearable !== false"
                  :format="field.format"
                  :value-format="field.valueFormat"
                  @change="handleFieldChange(field.key, $event)"
                />

                <!-- 日期范围选择 -->
                <el-date-picker
                  v-else-if="field.type === 'daterange'"
                  v-model="formData[field.key]"
                  type="daterange"
                  :range-separator="field.rangeSeparator || '至'"
                  :start-placeholder="field.startPlaceholder || '开始日期'"
                  :end-placeholder="field.endPlaceholder || '结束日期'"
                  :style="{ width: '100%' }"
                  :clearable="field.clearable !== false"
                  :format="field.format"
                  :value-format="field.valueFormat"
                  @change="handleFieldChange(field.key, $event)"
                />

                <!-- 开关 -->
                <el-switch
                  v-else-if="field.type === 'switch'"
                  v-model="formData[field.key]"
                  :active-text="field.activeText"
                  :inactive-text="field.inactiveText"
                  :active-value="field.activeValue !== undefined ? field.activeValue : true"
                  :inactive-value="field.inactiveValue !== undefined ? field.inactiveValue : false"
                  @change="handleFieldChange(field.key, $event)"
                />

                <!-- 自定义插槽 -->
                <slot
                  v-else-if="field.type === 'slot'"
                  :name="field.slotName || field.key"
                  :field="field"
                  :value="formData[field.key]"
                  :onChange="(value) => handleFieldChange(field.key, value)"
                />
              </el-form-item>
            </el-col>
          </template>
        </el-row>

        <!-- 操作按钮 -->
        <el-row v-if="showActions">
          <el-col :span="24">
            <div class="filter-actions">
              <el-button type="primary" :loading="loading" @click="handleSearch">
                <el-icon><search /></el-icon> 搜索
              </el-button>
              <el-button @click="handleReset">
                <el-icon><refresh /></el-icon> 重置
              </el-button>
              <slot name="extra-actions" :formData="formData" />
            </div>
          </el-col>
        </el-row>
      </el-form>
    </div>
  </el-card>
</template>

<script>
import { ref, reactive, watch } from 'vue';
import { ArrowDown, ArrowUp, Search, Refresh } from '@element-plus/icons-vue';

export default {
  name: 'CommonFilter',
  components: {
    ArrowDown,
    ArrowUp,
    Search,
    Refresh
  },
  props: {
    // 基本配置
    title: {
      type: String,
      default: '筛选条件'
    },
    fields: {
      type: Array,
      required: true
    },
    modelValue: {
      type: Object,
      default: () => ({})
    },
    
    // 布局配置
    labelWidth: {
      type: String,
      default: '100px'
    },
    showActions: {
      type: Boolean,
      default: true
    },
    defaultExpanded: {
      type: Boolean,
      default: true
    },
    
    // 行为配置
    loading: {
      type: Boolean,
      default: false
    },
    autoSearch: {
      type: Boolean,
      default: false
    },
    debounceTime: {
      type: Number,
      default: 300
    }
  },
  emits: ['update:modelValue', 'search', 'reset', 'field-change'],
  setup(props, { emit }) {
    const showPanel = ref(props.defaultExpanded);
    const debounceTimer = ref(null);

    // 初始化表单数据
    const initFormData = () => {
      const data = { ...props.modelValue };
      
      // 确保所有字段都有初始值
      props.fields.forEach(field => {
        if (data[field.key] === undefined) {
          data[field.key] = field.defaultValue !== undefined ? field.defaultValue : getDefaultValue(field.type);
        }
      });
      
      return data;
    };

    const formData = reactive(initFormData());

    // 获取默认值
    const getDefaultValue = (type) => {
      switch (type) {
        case 'select':
        case 'input':
        case 'date':
          return null;
        case 'daterange':
          return [];
        case 'number':
          return undefined;
        case 'switch':
          return false;
        default:
          return null;
      }
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

    // 切换面板展开/收起
    const togglePanel = () => {
      showPanel.value = !showPanel.value;
    };

    // 处理字段变化
    const handleFieldChange = (key, value) => {
      formData[key] = value;
      emit('field-change', { key, value, formData: { ...formData } });
      
      if (props.autoSearch) {
        if (debounceTimer.value) clearTimeout(debounceTimer.value);
        debounceTimer.value = setTimeout(() => {
          handleSearch();
        }, props.debounceTime);
      }
    };

    // 处理搜索
    const handleSearch = () => {
      emit('update:modelValue', { ...formData });
      emit('search', { ...formData });
    };

    // 处理重置
    const handleReset = () => {
      props.fields.forEach(field => {
        formData[field.key] = field.defaultValue !== undefined ? field.defaultValue : getDefaultValue(field.type);
      });
      
      emit('update:modelValue', { ...formData });
      emit('reset', { ...formData });
    };

    // 监听外部值变化
    watch(() => props.modelValue, (newValue) => {
      Object.keys(newValue).forEach(key => {
        if (formData[key] !== newValue[key]) {
          formData[key] = newValue[key];
        }
      });
    }, { deep: true });

    return {
      showPanel,
      formData,
      togglePanel,
      handleFieldChange,
      handleSearch,
      handleReset,
      getOptionValue,
      getOptionLabel
    };
  }
};
</script>

<style scoped>
.filter-card {
  margin-bottom: 20px;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.filter-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.filter-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-form-container {
  width: 100%;
}

.filter-form {
  width: 100%;
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .filter-header {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  
  .filter-actions {
    justify-content: center;
    flex-wrap: wrap;
  }
}
</style> 