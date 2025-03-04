<template>
  <div class="records-container">
    <div class="header">
      <div class="back-button" @click="goBack">
        <el-icon><arrow-left /></el-icon> 返回填报
      </div>
      <h1>废物记录查看</h1>
      <div class="home-link" @click="goHome" v-if="isAdmin">
        首页 <el-icon><home /></el-icon>
      </div>
      <div v-else></div>
    </div>

    <div class="content">
      <div class="unit-info">
        <h2>{{ unitName }} - 危险废物记录</h2>
      </div>
      
      <div class="actions">
        <el-button type="primary" @click="addNewRecord">
          <el-icon><plus /></el-icon> 新增填报
        </el-button>
        <el-button type="success" @click="goToUserManagement" v-if="isAdmin || isUnitAdmin">
          <el-icon><user /></el-icon> 人员管理
        </el-button>
        <el-button @click="refreshRecords">
          <el-icon><refresh /></el-icon> 刷新
        </el-button>
        <el-button type="primary" @click="exportRecords" :loading="loading">
          <el-icon><download /></el-icon> 导出记录
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
              <!-- 收集时间范围 -->
              <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
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
              
              <!-- 废物类型 -->
              <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
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
            </el-row>
            
            <el-row :gutter="20">
              <!-- 数量范围 -->
              <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
                <el-form-item label="数量范围(吨)">
                  <div class="quantity-range">
                    <el-input-number 
                      v-model="filterForm.minQuantity" 
                      :min="0"
                      :precision="3"
                      :step="0.001"
                      placeholder="最小值"
                      style="width: 48%"
                    />
                    <span class="range-separator">至</span>
                    <el-input-number 
                      v-model="filterForm.maxQuantity" 
                      :min="filterForm.minQuantity || 0"
                      :precision="3"
                      :step="0.001"
                      placeholder="最大值"
                      style="width: 48%"
                    />
                  </div>
                </el-form-item>
              </el-col>
              
              <!-- 产生地点 -->
              <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
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
            <h3>废物记录列表</h3>
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
            <el-table-column prop="waste_type_name" label="废物类型" min-width="110" />
            <el-table-column prop="location" label="产生地点" min-width="120" />
            <el-table-column label="收集开始时间" min-width="160">
              <template #default="scope">
                {{ parseFormattedDateTime(scope.row.collection_start_time) }}
              </template>
            </el-table-column>
            <el-table-column label="数量(吨)" min-width="100">
              <template #default="scope">
                {{ parseFloat(scope.row.quantity).toFixed(3) }}
              </template>
            </el-table-column>
            <el-table-column label="记录时间" min-width="160" class="mobile-hidden">
              <template #default="scope">
                {{ parseFormattedDateTime(scope.row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column label="汇报人" min-width="100" class="mobile-hidden">
              <template #default="scope">
                {{ scope.row.creator_name || '未知' }}
              </template>
            </el-table-column>
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
            <el-table-column label="操作" min-width="70" fixed="right">
              <template #default="scope">
                <div class="operation-buttons">
                  <el-button 
                    type="primary" 
                    size="small" 
                    @click="editRecord(scope.row.id)"
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
                    v-if="canEdit(scope.row)"
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
import httpService from '../config/httpService';
import apiConfig from '../config/api';
import { ArrowLeft, Home, Refresh, Plus, User, ArrowDown, ArrowUp, Download, Loading } from '@element-plus/icons-vue';
import { exportToExcelWithImages } from '../utils/exportUtils';
import auth from '../store/auth';
import axios from 'axios';

export default {
  name: 'RecordsList',
  components: {
    ArrowLeft,
    Home,
    Refresh,
    Plus,
    User,
    ArrowDown,
    ArrowUp,
    Download,
    ElImageViewer,
    Loading
  },
  props: {
    unitId: {
      type: [String, Number],
      required: true
    }
  },
  setup(props) {
    const router = useRouter();
    const records = ref([]);
    const loading = ref(false);
    const unitName = ref('');
    const wasteTypes = ref([]);
    const showFilterPanel = ref(true);
    
    // 添加baseUrl定义
    const baseUrl = apiConfig.baseURL;
    
    // 添加解析照片路径的函数
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
    
    // 添加分页相关的响应式变量
    const page = ref(1);
    const pageSize = ref(20);
    const hasMore = ref(true);
    const loadingMore = ref(false);
    
    // 筛选表单
    const filterForm = reactive({
      dateRange: null,
      wasteTypeId: null,
      minQuantity: null,
      maxQuantity: null,
      location: ''
    });
    
    // 过滤后的记录
    const filteredRecords = computed(() => {
      if (!records.value || !Array.isArray(records.value)) {
        return [];
      }
      
      return records.value.filter(record => {
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
          const endDate = new Date(filterForm.dateRange[1]);
          endDate.setHours(23, 59, 59); // 设置为当天结束时间
          
          const recordDate = new Date(record.collection_start_time);
          if (recordDate < startDate || recordDate > endDate) {
            return false;
          }
        }
        
        return true;
      });
    });
    
    // 判断是否为管理员
    const isAdmin = computed(() => {
      return auth.isAdmin();
    });
    
    // 判断是否为单位管理员
    const isUnitAdmin = computed(() => {
      return auth.isUnitAdmin();
    });
    
    // 格式化日期时间
    const parseFormattedDateTime = (dateTimeStr) => {
      if (!dateTimeStr) return '';
      const date = new Date(dateTimeStr);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };
    
    // 刷新记录
    const refreshRecords = async () => {
      await fetchRecords();
      ElMessage.success('记录已刷新');
    };
    
    // 返回填报页面
    const goBack = () => {
      // 获取当前用户的单位ID
      const unitId = auth.getUnitId();
      if (unitId) {
        router.push(`/unit/${unitId}`);
      } else {
        // 如果没有单位ID，则返回首页
        router.push('/');
      }
    };
    
    // 返回首页
    const goHome = () => {
      router.push('/');
    };
    
    // 前往人员管理
    const goToUserManagement = () => {
      router.push(`/user-management`);
    };
    
    // 添加新记录
    const addNewRecord = () => {
      router.push(`/unit/${props.unitId}`);
    };
    
    // 编辑记录
    const editRecord = (recordId) => {
      router.push(`/record/${recordId}`);
    };
    
    // 判断是否可以编辑记录
    const canEdit = (record) => {
      if (!record) return false;
      
      // 超级管理员可以编辑所有记录
      if (isAdmin.value) return true;
      
      // 单位管理员可以编辑本单位的记录
      const unitId = auth.getUnitId();
      if (isUnitAdmin.value && unitId && record.unit_id === parseInt(unitId)) return true;
      
      // 普通用户只能编辑自己创建的记录
      const userId = auth.getUserId();
      return userId && record.creator_id === parseInt(userId);
    };
    
    // 确认删除
    const confirmDelete = (record) => {
      ElMessageBox.confirm(
        `确定要删除这条废物记录吗？此操作不可逆。`,
        '删除确认',
        {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning',
        }
      )
        .then(async () => {
          try {
            await httpService.delete(`${apiConfig.endpoints.wasteRecords}/${record.id}`);
            ElMessage.success('记录已成功删除');
            await fetchRecords(); // 重新加载记录
          } catch (error) {
            console.error('删除记录失败:', error);
            ElMessage.error('删除记录失败，请重试');
          }
        })
        .catch(() => {
          ElMessage.info('已取消删除');
        });
    };
    
    // 应用筛选
    const applyFilter = async () => {
      try {
        // 重置分页
        page.value = 1;
        
        // 重新获取记录
        await fetchRecords();
        
        ElMessage.success('筛选条件已应用');
      } catch (error) {
        console.error('应用筛选失败:', error);
        ElMessage.error('应用筛选失败');
      }
    };
    
    // 重置筛选
    const resetFilter = async () => {
      filterForm.dateRange = null;
      filterForm.wasteTypeId = null;
      filterForm.minQuantity = null;
      filterForm.maxQuantity = null;
      filterForm.location = '';
      
      // 重置分页
      page.value = 1;
      
      // 重新获取记录
      await fetchRecords();
      
      ElMessage.success('筛选条件已重置');
    };
    
    // 导出记录
    const exportRecords = async () => {
      try {
        // 显示加载状态
        loading.value = true;
        
        // 准备筛选条件
        const queryParams = {
          wasteTypeId: filterForm.wasteTypeId ? filterForm.wasteTypeId : undefined,
          minQuantity: filterForm.minQuantity ? filterForm.minQuantity : undefined,
          maxQuantity: filterForm.maxQuantity ? filterForm.maxQuantity : undefined,
          location: filterForm.location || undefined,
          dateRange: filterForm.dateRange ? JSON.stringify(filterForm.dateRange) : undefined,
          unitId: props.unitId ? parseInt(props.unitId) : undefined
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
        const exportData = data.map(record => {
          // 解析图片路径
          const beforePhotos = parsePhotoPath(record.photo_path_before);
          const afterPhotos = parsePhotoPath(record.photo_path_after);
          
          return {
            '单位': record.unit_name,
            '废物类型': record.waste_type_name,
            '产生地点': record.location,
            '数量(kg)': record.quantity,
            '收集开始时间': parseFormattedDateTime(record.collection_start_time),
            '填报人': record.creator_name || '系统',
            '清理前照片': beforePhotos.length > 0 ? beforePhotos[0] : '',  // 使用第一张图片的路径
            '清理后照片': afterPhotos.length > 0 ? afterPhotos[0] : ''    // 使用第一张图片的路径
          };
        });
        
        // 设置文件名
        const fileName = `危险废物记录_${unitName.value ? unitName.value : '全部单位'}`;
        
        // 设置表头，添加isImage标志
        const headers = [
          { text: '单位', field: '单位' },
          { text: '废物类型', field: '废物类型' },
          { text: '产生地点', field: '产生地点' },
          { text: '数量(kg)', field: '数量(kg)' },
          { text: '收集开始时间', field: '收集开始时间' },
          { text: '填报人', field: '填报人' },
          { text: '清理前照片', field: '清理前照片', isImage: true },
          { text: '清理后照片', field: '清理后照片', isImage: true }
        ];
        
        // 获取服务器的基础URL
        const baseUrl = window.location.origin;
        
        // 执行带图片的导出
        const result = await exportToExcelWithImages(exportData, fileName, headers, baseUrl);
        
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
    
    // 图片预览相关
    const showViewer = ref(false);
    const previewImages = ref([]);
    const previewIndex = ref(0);
    
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

    onMounted(async () => {
      await fetchUnitName();
      await fetchWasteTypes();
      await fetchRecords();
    });

    // 获取废物类型列表
    const fetchWasteTypes = async () => {
      try {
        const response = await httpService.get(apiConfig.endpoints.wasteTypes);
        wasteTypes.value = response.data;
      } catch (error) {
        console.error('Error fetching waste types:', error);
        ElMessage.error('获取废物类型列表失败');
      }
    };
    
    const fetchUnitName = async () => {
      try {
        const response = await httpService.get(apiConfig.endpoints.units);
        const unit = response.data.find(u => u.id === parseInt(props.unitId));
        if (unit) {
          unitName.value = unit.name;
        }
      } catch (error) {
        console.error('Error fetching unit name:', error);
        ElMessage.error('获取单位信息失败');
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
        // 基本参数
        const params = {
          page: page.value,
          pageSize: pageSize.value
        };
        
        // 添加筛选参数
        if (filterForm.wasteTypeId) params.wasteTypeId = filterForm.wasteTypeId;
        if (filterForm.minQuantity !== null) params.minQuantity = filterForm.minQuantity;
        if (filterForm.maxQuantity !== null) params.maxQuantity = filterForm.maxQuantity;
        if (filterForm.location) params.location = filterForm.location;
        if (filterForm.dateRange && filterForm.dateRange.length === 2) {
          params.dateRange = JSON.stringify(filterForm.dateRange);
        }
        
        // 获取当前用户ID
        const userId = auth.getUserId();
        if (!userId) {
          throw new Error('用户未登录');
        }
        
        // 使用用户ID获取记录
        const response = await httpService.get(`${apiConfig.endpoints.wasteRecordsByUser}/${userId}`, { params });
        
        // 确保响应数据包含records字段，并且是一个数组
        if (response.data && Array.isArray(response.data.records)) {
          if (isLoadMore) {
            records.value = [...records.value, ...response.data.records];
          } else {
            records.value = response.data.records;
          }
          
          hasMore.value = !!response.data.hasMore;
        } else {
          console.error('Invalid response format:', response.data);
          records.value = [];
          hasMore.value = false;
          ElMessage.error('获取废物记录失败：数据格式错误');
        }
      } catch (error) {
        console.error('Error fetching records:', error);
        records.value = [];
        hasMore.value = false;
        ElMessage.error('获取废物记录失败');
      } finally {
        loading.value = false;
        loadingMore.value = false;
      }
    };
    
    // 处理滚动加载更多
    const handleScroll = async (e) => {
      // 修复解构赋值问题，确保e.target存在且包含所需属性
      if (!e || !e.target) return;
      
      const scrollHeight = e.target.scrollHeight || 0;
      const scrollTop = e.target.scrollTop || 0;
      const clientHeight = e.target.clientHeight || 0;
      
      // 当滚动到底部时加载更多
      if (scrollHeight - scrollTop - clientHeight < 50 && hasMore.value && !loadingMore.value) {
        page.value++;
        await fetchRecords(true);
      }
    };

    return {
      records,
      filteredRecords,
      loading,
      unitName,
      wasteTypes,
      isAdmin,
      isUnitAdmin,
      parseFormattedDateTime,
      refreshRecords,
      goBack,
      goHome,
      goToUserManagement,
      addNewRecord,
      editRecord,
      canEdit,
      confirmDelete,
      apiConfig,
      // 筛选相关
      showFilterPanel,
      filterForm,
      applyFilter,
      resetFilter,
      // 导出相关
      exportRecords,
      // 图片预览相关
      showViewer,
      previewImages,
      previewIndex,
      previewPhoto,
      closeViewer,
      handleScroll,
      // 照片路径解析
      parsePhotoPath,
      baseUrl,
      // 分页相关
      page,
      pageSize,
      hasMore,
      loadingMore
    };
  }
};
</script>

<style scoped>
.records-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.header {
  background-color: #409EFF;
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.back-button, .home-link {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 16px;
}

.content {
  flex: 1;
  padding: 30px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.unit-info {
  margin-bottom: 20px;
  text-align: center;
}

.unit-info h2 {
  color: #333;
  margin: 0;
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

.filter-form {
  margin-top: 15px;
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
  justify-content: flex-end;
  margin-top: 20px;
  gap: 10px;
}

.records-card {
  margin-bottom: 20px;
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

.card-actions {
  display: flex;
  gap: 10px;
}

.record-image {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  object-fit: cover;
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

.image-error {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 80px;
  height: 80px;
  background-color: #f5f7fa;
  color: #909399;
  font-size: 20px;
}

.operation-buttons {
  display: flex;
  flex-direction: column;
  gap: 5px;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.operation-buttons .el-button {
  width: 80%;
  margin-left: 0;
  margin-right: 0;
  text-align: center;
  justify-content: center;
}

.footer {
  background-color: #f5f7fa;
  padding: 15px;
  text-align: center;
  color: #606266;
}

.loading-more {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
  color: #909399;
}

.loading {
  animation: rotating 2s linear infinite;
  margin-right: 5px;
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.empty-block {
  padding: 30px;
  text-align: center;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }
  
  .content {
    padding: 15px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .card-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .mobile-hidden {
    display: none;
  }
  
  .operation-buttons {
    flex-direction: column;
    justify-content: center;
  }
  
  .action-buttons {
    flex-direction: column;
    justify-content: space-between;
  }
  
  .action-buttons .el-button {
    flex: 1;
    justify-content: center;
  }
  
  .filter-header {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  
  .header-left {
    width: 100%;
  }
  
  .action-buttons {
    width: 100%;
    justify-content: space-between;
  }
  
  .action-buttons .el-button {
    flex: 1;
    justify-content: center;
  }
}
</style> 