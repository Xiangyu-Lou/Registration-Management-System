<template>
  <div class="admin-records-container">
    <div class="header">
      <h1>危险废物管理系统 - 全部记录</h1>
    </div>

    <div class="content">
      <div class="actions">
        <el-button type="primary" @click="addNewRecord">
          <el-icon><plus /></el-icon> 新增填报
        </el-button>
        <el-button type="success" @click="goToUserManagement">
          <el-icon><user /></el-icon> 人员管理
        </el-button>
        <el-button @click="refreshRecords">
          <el-icon><refresh /></el-icon> 刷新
        </el-button>
      </div>
      
      <!-- 筛选面板 -->
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
              <!-- 所属单位（超级管理员特有） -->
              <el-col :span="12">
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
              
              <!-- 收集时间范围 -->
              <el-col :span="12">
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
            </el-row>
            
            <el-row :gutter="20">
              <!-- 废物类型 -->
              <el-col :span="8">
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
              
              <!-- 数量范围 -->
              <el-col :span="8">
                <el-form-item label="数量范围(吨)">
                  <div class="quantity-range">
                    <el-input-number 
                      v-model="filterForm.minQuantity" 
                      :min="0"
                      :precision="3"
                      :step="0.001"
                      placeholder="最小值"
                      style="width: 47%"
                    />
                    <span class="range-separator">至</span>
                    <el-input-number 
                      v-model="filterForm.maxQuantity" 
                      :min="filterForm.minQuantity || 0"
                      :precision="3"
                      :step="0.001"
                      placeholder="最大值"
                      style="width: 47%"
                    />
                  </div>
                </el-form-item>
              </el-col>
              
              <!-- 产生地点 -->
              <el-col :span="8">
                <el-form-item label="产生地点">
                  <el-input 
                    v-model="filterForm.location" 
                    placeholder="输入地点关键词搜索" 
                    clearable
                  />
                </el-form-item>
              </el-col>
            </el-row>
            
            <div class="filter-actions">
              <el-button type="primary" @click="applyFilter">筛选</el-button>
              <el-button @click="resetFilter">重置</el-button>
            </div>
          </el-form>
        </div>
      </el-card>
      
      <div class="records-wrapper">
        <el-card class="records-card">
          <div class="card-header">
            <h3>所有废物记录</h3>
            <div class="card-actions">
              <el-button type="warning" @click="exportRecords">
                <el-icon><download /></el-icon> 导出记录
              </el-button>
            </div>
          </div>
          
          <el-table 
            :data="filteredRecords" 
            style="width: 100%" 
            border 
            v-loading="loading"
            stripe
            class="responsive-table"
            height="500"
            @scroll="handleScroll"
          >
            <el-table-column prop="unit_name" label="单位" width="100" />
            <el-table-column prop="waste_type_name" label="废物类型" width="100" />
            <el-table-column prop="location" label="产生地点" />
            <el-table-column prop="collection_start_time" label="收集开始时间" width="160" />
            <el-table-column label="数量(吨)" width="80">
              <template #default="scope">
                {{ parseFloat(scope.row.quantity).toFixed(3) }}
              </template>
            </el-table-column>
            <el-table-column prop="creator_name" label="汇报人" width="100" />
            <el-table-column prop="created_at" label="记录时间" width="160" />
            <el-table-column
              label="现场照片（清理前）"
              width="120"
              align="center"
            >
              <template #default="scope">
                <div v-if="scope.row.photo_path_before" class="photo-preview">
                  <!-- 多张照片显示 -->
                  <div 
                    v-for="(path, index) in parsePhotoPath(scope.row.photo_path_before)" 
                    :key="index"
                    class="photo-thumbnail-container"
                    @click="previewPhoto(parsePhotoPath(scope.row.photo_path_before), index)"
                  >
                    <el-image
                      style="width: 50px; height: 50px"
                      :src="`${baseUrl}${path}`"
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
            <el-table-column
              label="现场照片（清理后）"
              width="120"
              align="center"
            >
              <template #default="scope">
                <div v-if="scope.row.photo_path_after" class="photo-preview">
                  <!-- 多张照片显示 -->
                  <div 
                    v-for="(path, index) in parsePhotoPath(scope.row.photo_path_after)" 
                    :key="index"
                    class="photo-thumbnail-container"
                    @click="previewPhoto(parsePhotoPath(scope.row.photo_path_after), index)"
                  >
                    <el-image
                      style="width: 50px; height: 50px"
                      :src="`${baseUrl}${path}`"
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
            <el-table-column label="操作" width="70" fixed="right">
              <template #default="scope">
                <div class="operation-buttons">
                  <el-button 
                    type="primary" 
                    size="small" 
                    @click="editRecord(scope.row.id)"
                    text
                  >
                    编辑
                  </el-button>
                  <el-button 
                    type="danger" 
                    size="small" 
                    @click="confirmDelete(scope.row)"
                    text
                  >
                    删除
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
          
          <div v-if="loadingMore" class="loading-more">
            <el-icon class="loading"><loading /></el-icon>
            加载更多...
          </div>
          
          <div class="empty-block" v-if="records.length === 0 && !loading">
            <el-empty description="暂无废物记录" />
          </div>
        </el-card>
      </div>
    </div>

    <div class="footer">
      <p>&copy; 2025 危险废物管理系统</p>
    </div>

    <!-- 添加独立的图片预览组件 -->
    <el-image-viewer
      v-if="showViewer"
      :url-list="previewImages"
      :initial-index="previewIndex"
      @close="closeViewer"
    />
  </div>
</template>

<script>
import { ref, onMounted, computed, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox, ElImageViewer } from 'element-plus';
import axios from 'axios';
import { Plus, Refresh, User, ArrowDown, ArrowUp, Download, Loading } from '@element-plus/icons-vue';
import auth from '../store/auth';
import { exportToExcel } from '../utils/exportUtils';
import apiConfig from '../config/api';

// API基础URL
// const apiBaseURL = apiConfig.baseURL;

// 解析照片路径
const parsePhotoPath = (path) => {
  if (!path) return [];
  
  try {
    // 尝试解析为JSON
    if (path.startsWith('[') && path.endsWith(']')) {
      return JSON.parse(path);
    }
    // 如果不是JSON格式，则将其作为单个路径返回
    return [path];
  } catch (error) {
    console.error('解析照片路径失败:', error);
    // 如果解析失败，将其作为单个路径返回
    return [path];
  }
};

// 获取指定类型的照片
const getPhotosByType = (record, type) => {
  if (!record.photos) return [];
  
  try {
    const photos = JSON.parse(record.photos);
    if (Array.isArray(photos)) {
      return photos.filter(photo => photo.type === type);
    }
    return [];
  } catch (error) {
    console.error('解析照片JSON失败:', error);
    return [];
  }
};

export default {
  name: 'AdminRecordsView',
  components: {
    Plus,
    Refresh,
    User,
    ArrowDown,
    ArrowUp,
    Download,
    ElImageViewer,
    Loading
  },
  setup() {
    const router = useRouter();
    const records = ref([]);
    const loading = ref(false);
    const units = ref([]);
    const wasteTypes = ref([]);
    const showFilterPanel = ref(true);
    
    // 添加baseUrl定义
    const baseUrl = apiConfig.baseURL;
    
    // 图片预览相关
    const showViewer = ref(false);
    const previewImages = ref([]);
    const previewIndex = ref(0);
    
    // 添加分页相关的响应式变量
    const page = ref(1);
    const pageSize = ref(20);
    const hasMore = ref(true);
    const loadingMore = ref(false);
    
    // 筛选表单
    const filterForm = reactive({
      unitId: null,
      dateRange: null,
      wasteTypeId: null,
      minQuantity: null,
      maxQuantity: null,
      location: ''
    });
    
    // 过滤后的记录
    const filteredRecords = computed(() => {
      return records.value.filter(record => {
        // 检查所属单位
        if (filterForm.unitId && record.unit_id !== filterForm.unitId) {
          return false;
        }
        
        // 检查废物类型
        if (filterForm.wasteTypeId && record.waste_type_id !== filterForm.wasteTypeId) {
          return false;
        }
        
        // 检查数量范围
        if (filterForm.minQuantity !== null && parseFloat(record.quantity) < filterForm.minQuantity) {
          return false;
        }
        if (filterForm.maxQuantity !== null && parseFloat(record.quantity) > filterForm.maxQuantity) {
          return false;
        }
        
        // 检查地点关键词
        if (filterForm.location && !record.location.toLowerCase().includes(filterForm.location.toLowerCase())) {
          return false;
        }
        
        // 检查日期范围
        if (filterForm.dateRange && filterForm.dateRange.length === 2) {
          const startDate = new Date(filterForm.dateRange[0]);
          // 将结束日期设置为当天的23:59:59，以包含整天
          const endDate = new Date(filterForm.dateRange[1]);
          endDate.setHours(23, 59, 59, 999);
          
          // 解析记录中的收集开始时间
          if (record.collection_start_time) {
            // 处理已格式化的日期时间字符串
            const recordDate = parseFormattedDateTime(record.collection_start_time);
            if (recordDate < startDate || recordDate > endDate) {
              return false;
            }
          } else {
            // 如果记录没有收集时间，并且筛选设置了日期范围，则排除该记录
            return false;
          }
        }
        
        return true;
      });
    });
    
    // 解析已格式化的日期时间字符串
    const parseFormattedDateTime = (formattedDateTime) => {
      // 假设格式是 "2025-03-01 14:30:00"
      // 移除所有非数字和连字符、冒号的字符
      const cleanedStr = formattedDateTime.replace(/[^0-9\-: ]/g, '');
      return new Date(cleanedStr);
    };

    onMounted(async () => {
      // 验证用户是否为超级管理员
      if (!auth.state.isLoggedIn || auth.state.user.role_id !== 3) {
        ElMessage.error('权限不足');
        router.push('/login');
        return;
      }
      
      await Promise.all([
        fetchUnits(),
        fetchWasteTypes(),
        fetchRecords()
      ]);
    });
    
    // 获取单位列表
    const fetchUnits = async () => {
      try {
        const response = await axios.get(apiConfig.getUrl(apiConfig.endpoints.units));
        units.value = response.data;
      } catch (error) {
        console.error('获取单位列表失败:', error);
        ElMessage.error('获取单位列表失败');
      }
    };
    
    // 获取废物类型列表
    const fetchWasteTypes = async () => {
      try {
        const response = await axios.get(apiConfig.getUrl(apiConfig.endpoints.wasteTypes));
        wasteTypes.value = response.data;
      } catch (error) {
        console.error('获取废物类型列表失败:', error);
        ElMessage.error('获取废物类型列表失败');
      }
    };

    const fetchRecords = async (isLoadMore = false) => {
      if (!isLoadMore) {
        loading.value = true;
        page.value = 1;
        records.value = [];
      } else {
        loadingMore.value = true;
      }
      
      try {
        const params = {
          page: page.value,
          pageSize: pageSize.value,
          wasteTypeId: filterForm.wasteTypeId,
          minQuantity: filterForm.minQuantity,
          maxQuantity: filterForm.maxQuantity,
          location: filterForm.location,
        };
        
        // Only add dateRange if it exists and has both start and end dates
        if (filterForm.dateRange && filterForm.dateRange.length === 2) {
          params.dateRange = JSON.stringify(filterForm.dateRange);
        }
        
        const response = await axios.get(
          `${apiConfig.getUrl(apiConfig.endpoints.wasteRecords)}/user/${auth.state.user.id}`,
          { params }
        );
        
        // 格式化日期
        const formattedRecords = response.data.records.map(record => ({
          ...record,
          created_at: formatDateTime(record.created_at),
          collection_start_time: formatDateTime(record.collection_start_time)
        }));
        
        if (isLoadMore) {
          records.value = [...records.value, ...formattedRecords];
        } else {
          records.value = formattedRecords;
        }
        
        hasMore.value = response.data.hasMore;
        if (hasMore.value) {
          page.value++;
        }
      } catch (error) {
        console.error('获取废物记录失败:', error);
        ElMessage.error('获取废物记录失败');
      } finally {
        loading.value = false;
        loadingMore.value = false;
      }
    };

    const formatDateTime = (dateTimeStr) => {
      if (!dateTimeStr) return '';
      const date = new Date(dateTimeStr);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    };

    const refreshRecords = () => {
      fetchRecords();
    };

    const addNewRecord = () => {
      if (auth.state.user.role_id === 3) {
        router.push('/record/new');
      } else {
        router.push(`/unit/${auth.state.user.unit_id}`);
      }
    };

    const goToUserManagement = () => {
      router.push('/user-management');
    };

    const editRecord = (recordId) => {
      router.push(`/record/${recordId}`);
    };

    // 应用筛选
    const applyFilter = async () => {
      await fetchRecords();
      ElMessage.success('筛选已应用');
    };
    
    // 重置筛选
    const resetFilter = async () => {
      filterForm.unitId = null;
      filterForm.dateRange = null;
      filterForm.wasteTypeId = null;
      filterForm.minQuantity = null;
      filterForm.maxQuantity = null;
      filterForm.location = '';
      await fetchRecords();
      ElMessage.info('筛选条件已重置');
    };
    
    // 导出筛选后的记录为Excel
    const exportRecords = async () => {
      try {
        loading.value = true;
        
        // 准备筛选条件
        const queryParams = {
          wasteTypeId: filterForm.wasteTypeId ? filterForm.wasteTypeId : undefined,
          minQuantity: filterForm.minQuantity ? filterForm.minQuantity : undefined,
          maxQuantity: filterForm.maxQuantity ? filterForm.maxQuantity : undefined,
          location: filterForm.location || undefined,
          dateRange: filterForm.dateRange ? JSON.stringify(filterForm.dateRange) : undefined,
          unitId: filterForm.unitId ? filterForm.unitId : undefined
        };
        
        console.log('导出记录的筛选条件:', queryParams);
        
        // 调用后端API获取完整的记录数据
        const { data } = await axios.get(
          `${apiConfig.getUrl(apiConfig.endpoints.exportWasteRecords)}/${auth.state.user.id}`,
          { params: queryParams }
        );
        
        console.log(`从后端获取到 ${data.length} 条记录用于导出`);
        
        if (data.length === 0) {
          ElMessage.warning('没有符合条件的记录可导出');
          loading.value = false;
          return;
        }
        
        // 准备导出数据
        const exportData = data.map(record => ({
          '单位': record.unit_name,
          '废物类型': record.waste_type_name,
          '产生地点': record.location,
          '数量(kg)': record.quantity,
          '收集开始时间': formatDateTime(record.collection_start_time),
          '填报人': record.creator_name || '系统',
          '清理前照片': '查看原始记录',
          '清理后照片': '查看原始记录'
        }));
        
        // 设置文件名
        const unitName = filterForm.unitId 
          ? units.value.find(u => u.id === filterForm.unitId)?.name || '未知单位'
          : '全部单位';
        const fileName = `危险废物记录_${unitName}`;
        
        // 设置表头
        const exportHeaders = [
          { text: '单位', field: '单位' },
          { text: '废物类型', field: '废物类型' },
          { text: '产生地点', field: '产生地点' },
          { text: '数量(kg)', field: '数量(kg)' },
          { text: '收集开始时间', field: '收集开始时间' },
          { text: '填报人', field: '填报人' },
          { text: '清理前照片', field: '清理前照片' },
          { text: '清理后照片', field: '清理后照片' }
        ];
        
        // 执行导出
        const result = exportToExcel(exportData, fileName, exportHeaders);
        
        if (result) {
          ElMessage.success('导出成功');
        } else {
          ElMessage.error('导出失败，请重试');
        }
      } catch (error) {
        console.error('导出记录失败:', error);
        ElMessage.error('导出失败: ' + (error.message || '未知错误'));
      } finally {
        loading.value = false;
      }
    };
    
    // 确认删除记录
    const confirmDelete = (record) => {
      ElMessageBox.confirm(
        '此操作将永久删除该记录，是否继续？',
        '警告',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }
      )
        .then(async () => {
          try {
            await axios.delete(`${apiConfig.getUrl(apiConfig.endpoints.wasteRecords)}/${record.id}`);
            ElMessage.success('删除成功');
            await fetchRecords();
          } catch (error) {
            console.error('删除记录失败:', error);
            ElMessage.error('删除记录失败');
          }
        })
        .catch(() => {
          ElMessage.info('已取消删除');
        });
    };

    // 预览照片
    const previewPhoto = (paths, index) => {
      // 确保paths是数组
      const photoArray = Array.isArray(paths) ? paths : [paths];
      previewImages.value = photoArray.map(path => `${baseUrl}${path}`);
      previewIndex.value = index || 0;
      showViewer.value = true;
    };
    
    // 关闭预览
    const closeViewer = () => {
      showViewer.value = false;
    };

    // 添加滚动加载处理函数
    const handleScroll = async (e) => {
      const element = e.target;
      // 添加安全检查，确保element存在且有必要的属性
      if (
        element && 
        element.scrollHeight && 
        !loadingMore.value &&
        hasMore.value &&
        element.scrollHeight - element.scrollTop - element.clientHeight < 100
      ) {
        await fetchRecords(true);
      }
    };

    return {
      records,
      filteredRecords,
      loading,
      units,
      wasteTypes,
      showFilterPanel,
      filterForm,
      applyFilter,
      resetFilter,
      exportRecords,
      parsePhotoPath,
      getPhotosByType,
      refreshRecords,
      addNewRecord,
      goToUserManagement,
      editRecord,
      confirmDelete,
      // 图片预览相关
      showViewer,
      previewImages,
      previewIndex,
      previewPhoto,
      closeViewer,
      baseUrl,
      page,
      pageSize,
      hasMore,
      loadingMore,
      handleScroll
    };
  }
};
</script>

<style scoped>
.admin-records-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.header {
  background-color: #409EFF;
  color: white;
  padding: 20px;
  text-align: center;
}

.content {
  flex: 1;
  padding: 30px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
  gap: 10px;
}

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
  color: #333;
}

.filter-form-container {
  transition: all 0.3s ease;
}

.quantity-range {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.range-separator {
  margin: 0 5px;
}

.filter-actions {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  gap: 10px;
}

.records-wrapper {
  margin-top: 20px;
}

.records-card {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-header h3 {
  margin: 0;
  color: #333;
}

.record-image {
  width: 50px;
  height: 50px;
  border-radius: 4px;
  cursor: pointer;
  display: block;
}

.photo-count {
  font-size: 12px;
  color: #409EFF;
  text-align: center;
  margin-top: 2px;
}

.image-error {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 50px;
  height: 50px;
  background-color: #f5f7fa;
  color: #909399;
}

.empty-block {
  margin: 20px 0;
}

.footer {
  background-color: #f5f5f5;
  padding: 15px;
  text-align: center;
  color: #666;
}

.photo-thumbnail-container {
  cursor: pointer;
  margin-bottom: 2px;
}

.photo-count {
  font-size: 12px;
  color: #909399;
  text-align: center;
  margin-top: 2px;
}

.photo-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.operation-buttons {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.operation-buttons .el-button {
  margin-left: 0;
  padding: 4px 8px;
}

.loading-more {
  text-align: center;
  padding: 10px 0;
  color: #909399;
}

.loading-more .loading {
  margin-right: 5px;
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>

<style>
/* 修复Element Plus图片预览组件的z-index问题 */
.el-image-viewer__wrapper {
  z-index: 2147483647 !important; /* 使用最大可能的z-index值 */
  position: fixed !important;
}

/* 确保图片预览的遮罩层也在最上层 */
.el-image-viewer__mask {
  z-index: 2147483646 !important;
  position: fixed !important;
}

/* 确保图片预览的操作按钮在最上层 */
.el-image-viewer__btn {
  z-index: 2147483647 !important;
  position: fixed !important;
}

/* 确保图片预览的关闭按钮在最上层 */
.el-image-viewer__close {
  z-index: 2147483647 !important;
  position: fixed !important;
}

/* 确保图片预览的图片在最上层 */
.el-image-viewer__img {
  z-index: 2147483646 !important;
  position: relative !important;
}

/* 确保图片预览的操作栏在最上层 */
.el-image-viewer__actions {
  z-index: 2147483647 !important;
  position: fixed !important;
}

/* 确保图片预览的缩放按钮在最上层 */
.el-image-viewer__actions__inner {
  z-index: 2147483647 !important;
  position: relative !important;
}
</style>
