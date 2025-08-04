<template>
  <div class="common-data-table">
    <el-card class="table-card" shadow="hover">
      <!-- 表格头部 -->
      <template #header v-if="showHeader">
        <div class="table-header">
          <div class="table-title">
            <slot name="title">
              <h3>{{ title }}</h3>
              <span v-if="showCount" class="count-badge">
                (共{{ totalCount }}条{{ countSuffix }})
              </span>
            </slot>
          </div>
          <div class="table-actions">
            <slot name="actions">
              <el-button v-if="showRefresh" @click="$emit('refresh')">
                <el-icon><refresh /></el-icon> 刷新
              </el-button>
            </slot>
          </div>
        </div>
      </template>

      <!-- 表格内容 -->
      <div class="table-wrapper">
        <el-table
          ref="tableRef"
          :data="data"
          :loading="loading"
          :border="border"
          :stripe="stripe"
          :height="height"
          :style="{ width: '100%' }"
          v-bind="$attrs"
          @row-click="handleRowClick"
        >
          <!-- 序号列 -->
          <el-table-column
            v-if="showIndex"
            type="index"
            label="序号"
            width="70"
            align="center"
            :index="indexMethod"
          />

          <!-- 动态列 -->
          <template v-for="column in columns" :key="column.prop || column.label">
            <el-table-column
              :prop="column.prop"
              :label="column.label"
              :width="column.width"
              :min-width="column.minWidth"
              :align="column.align || 'left'"
              :show-overflow-tooltip="column.showTooltip !== false"
              :sortable="column.sortable"
              :fixed="column.fixed"
            >
              <template #default="scope" v-if="column.render || column.formatter || $slots[column.slot]">
                <!-- 自定义渲染插槽 -->
                <slot 
                  v-if="column.slot" 
                  :name="column.slot" 
                  :row="scope.row" 
                  :column="column" 
                  :index="scope.$index"
                />
                <!-- 自定义渲染函数 -->
                <component 
                  v-else-if="column.render" 
                  :is="column.render" 
                  :row="scope.row" 
                  :column="column" 
                  :index="scope.$index"
                />
                <!-- 格式化函数 -->
                <span v-else-if="column.formatter">
                  {{ column.formatter(scope.row, column, scope.row[column.prop], scope.$index) }}
                </span>
                <!-- 默认显示 -->
                <span v-else>
                  {{ getColumnValue(scope.row, column) }}
                </span>
              </template>
            </el-table-column>
          </template>

          <!-- 操作列 -->
          <el-table-column
            v-if="showActions && (actionButtons.length > 0 || $slots.actions)"
            label="操作"
            :width="actionWidth"
            :min-width="actionMinWidth"
            align="center"
            fixed="right"
          >
            <template #default="scope">
              <slot name="actions" :row="scope.row" :index="scope.$index">
                <div class="action-buttons">
                  <template v-for="button in actionButtons" :key="button.key">
                    <el-button
                      v-if="!button.show || button.show(scope.row)"
                      :type="button.type || 'primary'"
                      :size="button.size || 'small'"
                      :disabled="button.disabled && button.disabled(scope.row)"
                      :loading="button.loading && button.loading(scope.row)"
                      link
                      @click="handleActionClick(button.action, scope.row, scope.$index)"
                    >
                      <el-icon v-if="button.icon"><component :is="button.icon" /></el-icon>
                      {{ button.label }}
                    </el-button>
                  </template>
                </div>
              </slot>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页 -->
      <div v-if="showPagination" class="pagination-wrapper">
        <el-pagination
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="pageSizes"
          :total="totalCount"
          :layout="paginationLayout"
          :small="smallPagination"
          background
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { Refresh } from '@element-plus/icons-vue';

export default {
  name: 'CommonDataTable',
  components: {
    Refresh
  },
  props: {
    // 基本数据
    data: {
      type: Array,
      default: () => []
    },
    columns: {
      type: Array,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    },

    // 表格配置
    title: {
      type: String,
      default: ''
    },
    showHeader: {
      type: Boolean,
      default: true
    },
    showCount: {
      type: Boolean,
      default: true
    },
    countSuffix: {
      type: String,
      default: '记录'
    },
    showIndex: {
      type: Boolean,
      default: true
    },
    border: {
      type: Boolean,
      default: true
    },
    stripe: {
      type: Boolean,
      default: true
    },
    height: {
      type: [String, Number],
      default: undefined
    },
    showRefresh: {
      type: Boolean,
      default: true
    },

    // 操作相关
    showActions: {
      type: Boolean,
      default: false
    },
    actionButtons: {
      type: Array,
      default: () => []
    },
    actionWidth: {
      type: [String, Number],
      default: undefined
    },
    actionMinWidth: {
      type: [String, Number],
      default: 120
    },

    // 分页相关
    showPagination: {
      type: Boolean,
      default: false
    },
    totalCount: {
      type: Number,
      default: 0
    },
    currentPage: {
      type: Number,
      default: 1
    },
    pageSize: {
      type: Number,
      default: 20
    },
    pageSizes: {
      type: Array,
      default: () => [10, 20, 50, 100]
    },
    paginationLayout: {
      type: String,
      default: 'total, sizes, prev, pager, next, jumper'
    },
    smallPagination: {
      type: Boolean,
      default: false
    },

    // 序号相关
    indexOffset: {
      type: Number,
      default: 0
    }
  },
  emits: [
    'refresh',
    'row-click',
    'action-click',
    'page-change',
    'size-change',
    'update:currentPage',
    'update:pageSize'
  ],
  setup(props, { emit }) {
    const tableRef = ref(null);

    // 序号计算方法
    const indexMethod = computed(() => {
      return (index) => {
        return index + 1 + (props.currentPage - 1) * props.pageSize + props.indexOffset;
      };
    });

    // 处理行点击
    const handleRowClick = (row, column, event) => {
      emit('row-click', row, column, event);
    };

    // 处理操作按钮点击
    const handleActionClick = (action, row, index) => {
      emit('action-click', { action, row, index });
    };

    // 处理分页变化
    const handleCurrentChange = (page) => {
      emit('update:currentPage', page);
      emit('page-change', { page, pageSize: props.pageSize });
    };

    const handleSizeChange = (size) => {
      emit('update:pageSize', size);
      emit('size-change', { page: props.currentPage, pageSize: size });
    };

    // 获取列值
    const getColumnValue = (row, column) => {
      if (!column.prop) return '';
      
      // 支持嵌套属性
      const value = column.prop.split('.').reduce((obj, key) => obj?.[key], row);
      
      // 处理特殊值
      if (value === null || value === undefined) {
        return column.emptyText || '';
      }
      
      return value;
    };

    return {
      tableRef,
      indexMethod,
      handleRowClick,
      handleActionClick,
      handleCurrentChange,
      handleSizeChange,
      getColumnValue
    };
  }
};
</script>

<style scoped>
.common-data-table {
  width: 100%;
}

.table-card {
  margin-bottom: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.table-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.table-title h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.count-badge {
  color: #909399;
  font-size: 14px;
}

.table-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.table-wrapper {
  width: 100%;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .table-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .table-actions {
    justify-content: center;
  }
  
  .pagination-wrapper {
    overflow-x: auto;
  }
}
</style> 