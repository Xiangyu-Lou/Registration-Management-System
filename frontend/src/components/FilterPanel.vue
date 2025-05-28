<template>
  <el-card class="filter-card">
    <div class="filter-header">
      <h3>筛选条件</h3>
      <el-button type="primary" link @click="togglePanel">
        {{ showPanel ? '收起' : '展开' }} 
        <el-icon v-if="!showPanel"><arrow-down /></el-icon>
        <el-icon v-else><arrow-up /></el-icon>
      </el-button>
    </div>
    
    <div v-show="showPanel" class="filter-form-container">
      <el-form :model="form" label-width="100px" class="filter-form">
        <el-row :gutter="20">
          <!-- 动态渲染筛选字段 -->
          <el-col 
            v-for="field in filterFields" 
            :key="field.key"
            :xs="field.xs || 24" 
            :sm="field.sm || 12" 
            :md="field.md || 6" 
            :lg="field.lg || 6" 
            :xl="field.xl || 6"
          >
            <el-form-item :label="field.label">
              <!-- 下拉选择 -->
              <el-select 
                v-if="field.type === 'select'"
                v-model="form[field.key]" 
                :placeholder="field.placeholder" 
                style="width: 100%" 
                clearable
              >
                <el-option 
                  v-for="option in field.options" 
                  :key="option.value" 
                  :label="option.label" 
                  :value="option.value" 
                />
              </el-select>
              
              <!-- 文本输入 -->
              <el-input 
                v-else-if="field.type === 'input'"
                v-model="form[field.key]" 
                :placeholder="field.placeholder" 
                clearable
              />
              
              <!-- 日期范围 -->
              <el-date-picker
                v-else-if="field.type === 'daterange'"
                v-model="form[field.key]"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
              
              <!-- 数字范围 -->
              <div v-else-if="field.type === 'numberrange'" class="number-range">
                <div class="input-with-clear">
                  <el-input-number 
                    v-model="form[field.key + 'Min']" 
                    :min="0"
                    :precision="field.precision || 3"
                    :step="field.step || 0.001"
                    :placeholder="field.minPlaceholder"
                    style="width: 100%"
                  />
                  <el-icon 
                    v-if="form[field.key + 'Min'] !== null" 
                    class="clear-icon" 
                    @click="form[field.key + 'Min'] = null"
                  >
                    <CircleClose />
                  </el-icon>
                </div>
                <span class="range-separator">至</span>
                <div class="input-with-clear">
                  <el-input-number 
                    v-model="form[field.key + 'Max']" 
                    :min="form[field.key + 'Min'] || 0"
                    :precision="field.precision || 3"
                    :step="field.step || 0.001"
                    :placeholder="field.maxPlaceholder"
                    style="width: 100%"
                  />
                  <el-icon 
                    v-if="form[field.key + 'Max'] !== null" 
                    class="clear-icon" 
                    @click="form[field.key + 'Max'] = null"
                  >
                    <CircleClose />
                  </el-icon>
                </div>
              </div>
              
              <!-- 开关 -->
              <el-switch
                v-else-if="field.type === 'switch'"
                v-model="form[field.key]"
                :active-text="field.activeText"
                :inactive-text="field.inactiveText"
                active-color="#13ce66"
                inactive-color="#ff4949"
                :active-value="true"
                :inactive-value="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <!-- 操作按钮 -->
        <el-row :gutter="20">
          <el-col :xs="24" :sm="24" :md="6" :lg="6" :xl="6" class="filter-buttons-col">
            <div class="filter-actions">
              <el-button type="primary" @click="handleApply">{{ applyText }}</el-button>
              <el-button @click="handleReset">{{ resetText }}</el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </div>
  </el-card>
</template>

<script>
import { ref, watch } from 'vue';
import { ArrowDown, ArrowUp, CircleClose } from '@element-plus/icons-vue';
import { debounce } from '../utils/commonUtils';

export default {
  name: 'FilterPanel',
  components: {
    ArrowDown,
    ArrowUp,
    CircleClose
  },
  props: {
    // 筛选字段配置
    filterFields: {
      type: Array,
      required: true
    },
    // 表单数据
    modelValue: {
      type: Object,
      required: true
    },
    // 是否默认展开
    defaultExpanded: {
      type: Boolean,
      default: true
    },
    // 按钮文本
    applyText: {
      type: String,
      default: '刷新筛选'
    },
    resetText: {
      type: String,
      default: '重置'
    },
    // 是否启用自动筛选（输入时自动触发）
    autoFilter: {
      type: Boolean,
      default: true
    },
    // 防抖延迟时间
    debounceDelay: {
      type: Number,
      default: 300
    }
  },
  emits: ['update:modelValue', 'apply', 'reset'],
  setup(props, { emit }) {
    const showPanel = ref(props.defaultExpanded);
    const form = ref({ ...props.modelValue });

    // 切换面板显示/隐藏
    const togglePanel = () => {
      showPanel.value = !showPanel.value;
    };

    // 应用筛选
    const handleApply = () => {
      emit('update:modelValue', { ...form.value });
      emit('apply', { ...form.value });
    };

    // 重置筛选
    const handleReset = () => {
      // 重置所有字段
      const resetForm = {};
      props.filterFields.forEach(field => {
        if (field.type === 'numberrange') {
          resetForm[field.key + 'Min'] = null;
          resetForm[field.key + 'Max'] = null;
        } else if (field.type === 'switch') {
          resetForm[field.key] = field.defaultValue !== undefined ? field.defaultValue : false;
        } else if (field.type === 'daterange') {
          resetForm[field.key] = null;
        } else {
          resetForm[field.key] = field.defaultValue !== undefined ? field.defaultValue : '';
        }
      });
      
      form.value = resetForm;
      emit('update:modelValue', { ...form.value });
      emit('reset', { ...form.value });
    };

    // 创建防抖函数用于自动筛选
    const debouncedAutoFilter = debounce(() => {
      if (props.autoFilter) {
        handleApply();
      }
    }, props.debounceDelay);

    // 监听表单变化
    watch(
      () => props.modelValue,
      (newValue) => {
        form.value = { ...newValue };
      },
      { deep: true }
    );

    // 监听内部表单变化，触发自动筛选
    watch(
      form,
      () => {
        if (props.autoFilter) {
          debouncedAutoFilter();
        }
      },
      { deep: true }
    );

    return {
      showPanel,
      form,
      togglePanel,
      handleApply,
      handleReset
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
  margin-bottom: 10px;
}

.filter-header h3 {
  margin: 0;
  color: #333;
}

.filter-form-container {
  margin-top: 15px;
}

.number-range {
  display: flex;
  align-items: center;
  gap: 10px;
}

.input-with-clear {
  position: relative;
  flex: 1;
}

.clear-icon {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #909399;
  font-size: 14px;
  z-index: 10;
}

.clear-icon:hover {
  color: #606266;
}

.range-separator {
  white-space: nowrap;
  color: #909399;
}

.filter-buttons-col {
  display: flex;
  align-items: end;
}

.filter-actions {
  display: flex;
  gap: 10px;
  width: 100%;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .filter-actions {
    flex-direction: column;
  }
  
  .number-range {
    flex-direction: column;
    gap: 5px;
  }
  
  .range-separator {
    display: none;
  }
}
</style> 