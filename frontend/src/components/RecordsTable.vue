<template>
  <div class="records-table-container">
    <!-- 筛选条件面板 -->
    <el-card class="filter-card">
      <div class="filter-header">
        <h3>筛选条件</h3>
        <el-button type="primary" link @click="showFilterPanel = !showFilterPanel">
          {{ showFilterPanel ? '收起' : '展开' }} 
          <el-icon v-if="!showFilterPanel"><arrow-down /></el-icon>
          <el-icon v-else><arrow-up /></el-icon>
        </el-button>
      </div>
      
      <div v-show="showFilterPanel" class="filter-form-container">
        <el-form :model="filterForm" label-width="100px" class="filter-form">
          <el-row :gutter="20">
            <!-- 单位筛选（仅管理员模式） -->
            <el-col :xs="24" :sm="12" :md="5" :lg="5" :xl="5" v-if="enableUnitFilter">
              <el-form-item label="所属单位">
                <el-select v-model="filterForm.unitId" placeholder="选择单位" style="width: 100%" clearable>
                  <el-option 
                    v-for="unit in units" 
                    :key="unit.id" 
                    :label="unit.name" 
                    :value="unit.id" 
                  />
                </el-select>
              </el-form-item>
            </el-col>
            
            <!-- 废物类型 -->
            <el-col :xs="24" :sm="12" :md="5" :lg="5" :xl="5">
              <el-form-item label="废物类型">
                <el-select v-model="filterForm.wasteTypeId" placeholder="选择废物类型" style="width: 100%" clearable>
                  <el-option 
                    v-for="type in wasteTypes" 
                    :key="type.id" 
                    :label="type.name" 
                    :value="type.id" 
                  />
                </el-select>
              </el-form-item>
            </el-col>
            
            <!-- 产生地点 -->
            <el-col :xs="24" :sm="12" :md="5" :lg="5" :xl="5">
              <el-form-item label="产生地点">
                <el-input 
                  v-model="filterForm.location" 
                  placeholder="输入地点关键词搜索" 
                  clearable
                />
              </el-form-item>
            </el-col>
            
            <!-- 产生工序 -->
            <el-col :xs="24" :sm="12" :md="5" :lg="5" :xl="5">
              <el-form-item label="产生工序">
                <el-input 
                  v-model="filterForm.process" 
                  placeholder="输入工序关键词搜索" 
                  clearable
                />
              </el-form-item>
            </el-col>
            
            <!-- 监督数据筛选（仅超级管理员） -->
            <el-col :xs="24" :sm="12" :md="4" :lg="4" :xl="4" v-if="enableSupervisionFilter">
              <el-form-item label="监督数据">
                <el-switch
                  v-model="filterForm.showSupervised"
                  active-text="显示"
                  inactive-text="隐藏"
                  active-color="#13ce66"
                  inactive-color="#ff4949"
                  :active-value="true"
                  :inactive-value="false"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <!-- 收集时间范围 -->
            <el-col :xs="24" :sm="24" :md="10" :lg="10" :xl="10">
              <el-form-item label="收集时间">
                <el-date-picker
                  v-model="filterForm.dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            
            <!-- 数量范围 -->
            <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
              <el-form-item label="数量范围(吨)">
                <div class="quantity-range">
                  <div class="input-with-clear">
                    <el-input-number 
                      v-model="filterForm.minQuantity" 
                      :min="0"
                      :precision="3"
                      :step="0.001"
                      placeholder="最小值"
                      style="width: 100%"
                    />
                    <el-icon v-if="filterForm.minQuantity !== null" class="clear-icon" @click="filterForm.minQuantity = null">
                      <CircleClose />
                    </el-icon>
                  </div>
                  <span class="range-separator">至</span>
                  <div class="input-with-clear">
                    <el-input-number 
                      v-model="filterForm.maxQuantity" 
                      :min="filterForm.minQuantity || 0"
                      :precision="3"
                      :step="0.001"
                      placeholder="最大值"
                      style="width: 100%"
                    />
                    <el-icon v-if="filterForm.maxQuantity !== null" class="clear-icon" @click="filterForm.maxQuantity = null">
                      <CircleClose />
                    </el-icon>
                  </div>
                </div>
              </el-form-item>
            </el-col>
            
            <!-- 筛选按钮 -->
            <el-col :xs="24" :sm="24" :md="6" :lg="6" :xl="6" class="filter-buttons-col">
              <div class="filter-actions">
                <el-button type="primary" @click="applyFilter">刷新筛选</el-button>
                <el-button @click="resetFilter">重置</el-button>
              </div>
            </el-col>
          </el-row>
        </el-form>
      </div>
    </el-card>
    
    <!-- 表格卡片 -->
    <el-card class="records-card">
      <div class="card-header">
        <h3 class="table-title">{{ tableTitle }}</h3>
        <div class="card-actions">
          <el-button type="warning" @click="exportWithoutImages" :loading="loading">
            <el-icon><download /></el-icon> 无照片
          </el-button>
          <el-button type="warning" @click="exportWithImages" :loading="loading">
            <el-icon><download /></el-icon> 包含首张照片
          </el-button>
          <el-button type="warning" @click="exportWithAllImages" :loading="loading">
            <el-icon><download /></el-icon> 包含全部照片
          </el-button>
        </div>
      </div>
      
      <!-- 表格 -->
      <div class="table-wrapper" ref="tableContainer">
        <el-table 
          ref="tableRef"
          :data="displayRecords" 
          style="width: 100%" 
          border 
          v-loading="loading"
          stripe
          class="responsive-table"
          :height="tableHeight"
        >
          <el-table-column 
            type="index" 
            label="序号" 
            width="70" 
            align="center"
            :index="indexMethod"
          />
          
          <!-- 单位列（仅管理员模式显示） -->
          <el-table-column 
            v-if="showUnitColumn" 
            prop="unit_name" 
            label="单位" 
            min-width="100" 
          />
          
          <el-table-column prop="waste_type_name" label="废物类型" min-width="100" />
          <el-table-column prop="location" label="产生地点" min-width="100" />
          <el-table-column prop="process" label="产生工序" min-width="100">
            <template #default="scope">
              {{ scope.row.process || '无' }}
            </template>
          </el-table-column>
          <el-table-column prop="remarks" label="备注" min-width="120">
            <template #default="scope">
              {{ scope.row.remarks || '无' }}
            </template>
          </el-table-column>
          
          <!-- 收集时间 -->
          <el-table-column label="收集开始时间" min-width="160">
            <template #default="scope">
              {{ formatDateTime(scope.row.collection_start_time) }}
            </template>
          </el-table-column>
          
          <!-- 数量 -->
          <el-table-column label="数量(吨)" min-width="100">
            <template #default="scope">
              {{ formatQuantity(scope.row.quantity) }}
            </template>
          </el-table-column>
          
          <!-- 填报人（可选） -->
          <el-table-column 
            v-if="showCreatorColumn" 
            prop="creator_name" 
            label="填报人" 
            min-width="100" 
          />
          
          <!-- 记录时间（可选） -->
          <el-table-column 
            v-if="showRecordTimeColumn" 
            label="记录时间" 
            min-width="160" 
            class="mobile-hidden"
          >
            <template #default="scope">
              {{ formatDateTime(scope.row.created_at) }}
            </template>
          </el-table-column>
          
          <!-- 清理前照片 -->
          <el-table-column
            label="清理前照片"
            min-width="140"
            align="center"
          >
            <template #default="scope">
              <div v-if="scope.row.photo_path_before" class="photo-preview">
                <div 
                  v-for="(path, index) in parsePhotoPath(scope.row.photo_path_before)" 
                  :key="index"
                  class="photo-thumbnail-container"
                  @click="previewPhoto(parsePhotoPath(scope.row.photo_path_before), index)"
                >
                  <el-image
                    style="width: 50px; height: 50px; margin: 0 auto;"
                    :src="buildImageUrl(path)"
                    fit="cover"
                  ></el-image>
                </div>
                <div v-if="parsePhotoPath(scope.row.photo_path_before).length > 1" class="photo-count">
                  {{ parsePhotoPath(scope.row.photo_path_before).length }}张
                </div>
              </div>
              <span v-else>无</span>
            </template>
          </el-table-column>
          
          <!-- 清理后照片 -->
          <el-table-column
            label="清理后照片"
            min-width="140"
            align="center"
          >
            <template #default="scope">
              <div v-if="scope.row.photo_path_after" class="photo-preview">
                <div 
                  v-for="(path, index) in parsePhotoPath(scope.row.photo_path_after)" 
                  :key="index"
                  class="photo-thumbnail-container"
                  @click="previewPhoto(parsePhotoPath(scope.row.photo_path_after), index)"
                >
                  <el-image
                    style="width: 50px; height: 50px; margin: 0 auto;"
                    :src="buildImageUrl(path)"
                    fit="cover"
                  ></el-image>
                </div>
                <div v-if="parsePhotoPath(scope.row.photo_path_after).length > 1" class="photo-count">
                  {{ parsePhotoPath(scope.row.photo_path_after).length }}张
                </div>
              </div>
              <span v-else>无</span>
            </template>
          </el-table-column>
          
          <!-- 操作列 -->
          <el-table-column label="操作" min-width="130">
            <template #default="scope">
              <div class="operation-buttons">
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="$emit('edit-record', scope.row.id)"
                  text
                  v-if="canEdit(scope.row)"
                >
                  编辑
                </el-button>
                <el-button 
                  type="danger" 
                  size="small" 
                  @click="confirmDelete(scope.row)"
                  text
                  v-if="canDelete(scope.row)"
                >
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
          
          <!-- 加载更多按钮 -->
          <template #append>
            <div v-if="loadingMore" class="loading-row">
              <el-icon class="loading"><loading /></el-icon>
              正在加载...
            </div>
            
            <div v-else-if="hasMore && records.length > 0" class="load-more-row">
              <el-button type="primary" @click="loadMore" :disabled="loadingMore" size="small">
                点击加载更多 <el-icon><arrow-down /></el-icon>
              </el-button>
            </div>
            
            <div v-else-if="records.length > 0" class="no-more-row">
              已全部加载
            </div>
          </template>
        </el-table>
      </div>
      
      <!-- 空状态 -->
      <div class="empty-block" v-if="records.length === 0 && !loading">
        <el-empty description="暂无废物记录" />
      </div>
    </el-card>

    <!-- 图片预览组件 -->
    <el-image-viewer
      v-if="showViewer"
      :url-list="previewImages"
      :initial-index="previewIndex"
      @close="closeViewer"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ElImageViewer } from 'element-plus';
import { ArrowDown, ArrowUp, Download, Loading, CircleClose } from '@element-plus/icons-vue';
import { useRecordsTable } from '../composables/useRecordsTable';
import { parsePhotoPath, formatDateTime, formatQuantity, buildImageUrl } from '../utils/commonUtils';
import apiConfig from '../config/api';

export default {
  name: 'RecordsTable',
  components: {
    ArrowDown,
    ArrowUp,
    Download,
    Loading,
    CircleClose,
    ElImageViewer
  },
  props: {
    unitId: {
      type: [String, Number],
      default: null
    },
    tableTitle: {
      type: String,
      default: '废物记录列表'
    },
    enableUnitFilter: {
      type: Boolean,
      default: false
    },
    enableSupervisionFilter: {
      type: Boolean,
      default: false
    },
    showUnitColumn: {
      type: Boolean,
      default: false
    },
    showCreatorColumn: {
      type: Boolean,
      default: true
    },
    showRecordTimeColumn: {
      type: Boolean,
      default: true
    },
    canEdit: {
      type: Function,
      default: () => true
    },
    canDelete: {
      type: Function,
      default: () => true
    }
  },
  emits: ['edit-record'],
  setup(props) {
    // 使用可复用的表格逻辑
    const {
      records,
      loading,
      loadingMore,
      units,
      wasteTypes,
      showFilterPanel,
      hasMore,
      tableHeight,
      tableContainer,
      filterForm,
      filteredRecords,
      applyFilter,
      resetFilter,
      refreshRecords,
      confirmDelete,
      exportWithoutImages,
      exportWithImages,
      exportWithAllImages,
      indexMethod,
      loadMore,
      init,
      cleanup
    } = useRecordsTable({
      unitId: props.unitId,
      enableUnitFilter: props.enableUnitFilter,
      enableSupervisionFilter: props.enableSupervisionFilter
    });

    // 图片预览相关
    const showViewer = ref(false);
    const previewImages = ref([]);
    const previewIndex = ref(0);

    // 显示的记录（如果启用客户端筛选则使用filteredRecords，否则使用records）
    const displayRecords = computed(() => {
      return props.enableUnitFilter ? filteredRecords.value : records.value;
    });

    /**
     * 预览照片
     */
    const previewPhoto = (photoPaths, index) => {
      previewImages.value = photoPaths.map(path => buildImageUrl(path, apiConfig.baseURL));
      previewIndex.value = index;
      showViewer.value = true;
    };

    /**
     * 关闭图片预览
     */
    const closeViewer = () => {
      showViewer.value = false;
    };

    // 生命周期
    onMounted(() => {
      init();
    });

    onUnmounted(() => {
      cleanup();
    });

    return {
      // 状态
      records,
      loading,
      loadingMore,
      units,
      wasteTypes,
      showFilterPanel,
      hasMore,
      tableHeight,
      tableContainer,
      filterForm,
      displayRecords,
      showViewer,
      previewImages,
      previewIndex,
      
      // 方法
      parsePhotoPath,
      formatDateTime,
      formatQuantity,
      buildImageUrl,
      applyFilter,
      resetFilter,
      refreshRecords,
      confirmDelete,
      exportWithoutImages,
      exportWithImages,
      exportWithAllImages,
      indexMethod,
      loadMore,
      previewPhoto,
      closeViewer
    };
  }
};
</script>

<style scoped>
.records-table-container {
  padding: 20px;
}

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

.quantity-range {
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

.records-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.table-title {
  margin: 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.card-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.table-wrapper {
  width: 100%;
  overflow: auto;
}

.photo-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.photo-thumbnail-container {
  cursor: pointer;
  transition: transform 0.2s;
}

.photo-thumbnail-container:hover {
  transform: scale(1.05);
}

.photo-count {
  font-size: 12px;
  color: #666;
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
}

.operation-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.loading-row, .load-more-row, .no-more-row {
  text-align: center;
  padding: 20px;
  color: #666;
}

.loading-row .loading {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.empty-block {
  padding: 50px 0;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .records-table-container {
    padding: 10px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .card-actions {
    width: 100%;
    justify-content: center;
  }
  
  .mobile-hidden {
    display: none;
  }
}
</style> 