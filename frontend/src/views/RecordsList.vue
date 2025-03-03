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
          <el-button type="primary" @click="addNewRecord">
              <el-icon><plus /></el-icon> 新增填报
          </el-button>
          <el-button type="success" @click="goToUserManagement" v-if="isAdmin || isUnitAdmin">
              <el-icon><user /></el-icon> 人员管理
          </el-button>
          <el-button type="warning" @click="exportRecords">
              <el-icon><download /></el-icon> 导出记录
          </el-button>
          <el-button @click="refreshRecords">
            <el-icon><refresh /></el-icon> 刷新
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
            <el-table-column prop="collection_start_time" label="收集开始时间" min-width="160" />
            <el-table-column prop="quantity" label="数量(吨)" min-width="100" />
            <el-table-column prop="created_at" label="记录时间" min-width="160" class="mobile-hidden" />
            <el-table-column prop="creator_name" label="汇报人" min-width="100" class="mobile-hidden" />
            <el-table-column label="现场照片（清理前）" min-width="120">
              <template #default="scope">
                <div v-if="scope.row.photo_path_before">
                  <!-- 多张照片显示 -->
                  <div 
                    v-for="(path, index) in parsePhotoPath(scope.row.photo_path_before)" 
                    :key="index"
                    class="photo-thumbnail-container"
                    @click="previewPhoto(parsePhotoPath(scope.row.photo_path_before), index)"
                  >
                    <el-image 
                      :src="`${apiConfig.baseURL}${path}`"
                      fit="cover"
                      class="record-image"
                      :style="{ margin: index > 0 ? '2px 0 0 0' : '0' }"
                    >
                      <template #error>
                        <div class="image-error">
                          <el-icon><picture-failed /></el-icon>
                        </div>
                      </template>
                    </el-image>
                  </div>
                  <div v-if="parsePhotoPath(scope.row.photo_path_before).length > 1" class="photo-count">
                    {{ parsePhotoPath(scope.row.photo_path_before).length }}张
                  </div>
                </div>
                <span v-else>无照片</span>
              </template>
            </el-table-column>
            <el-table-column label="现场照片（清理后）" min-width="120" class="mobile-hidden">
              <template #default="scope">
                <div v-if="scope.row.photo_path_after">
                  <!-- 多张照片显示 -->
                  <div 
                    v-for="(path, index) in parsePhotoPath(scope.row.photo_path_after)" 
                    :key="index"
                    class="photo-thumbnail-container"
                    @click="previewPhoto(parsePhotoPath(scope.row.photo_path_after), index)"
                  >
                    <el-image 
                      :src="`${apiConfig.baseURL}${path}`"
                      fit="cover"
                      class="record-image"
                      :style="{ margin: index > 0 ? '2px 0 0 0' : '0' }"
                    >
                      <template #error>
                        <div class="image-error">
                          <el-icon><picture-failed /></el-icon>
                        </div>
                      </template>
                    </el-image>
                  </div>
                  <div v-if="parsePhotoPath(scope.row.photo_path_after).length > 1" class="photo-count">
                    {{ parsePhotoPath(scope.row.photo_path_after).length }}张
                  </div>
                </div>
                <span v-else>无照片</span>
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
import { ArrowLeft, Home, Refresh, PictureFailed, Plus, User, ArrowDown, ArrowUp, Download, Loading } from '@element-plus/icons-vue';
import { exportToExcel } from '../utils/exportUtils';
import auth from '../store/auth';

// 解析JSON格式的照片路径
const parsePhotoPath = (path) => {
  try {
    return JSON.parse(path);
  } catch (error) {
    console.error('解析照片路径失败:', error);
    return [];
  }
};

export default {
  name: 'RecordsList',
  components: {
    ArrowLeft,
    Home,
    Refresh,
    PictureFailed,
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
    
    // 检查用户是否为超级管理员
    const isAdmin = computed(() => {
      return auth.state.isLoggedIn && auth.state.user.role_id === 3;
    });
    
    // 检查用户是否为单位管理员
    const isUnitAdmin = computed(() => {
      return auth.state.isLoggedIn && auth.state.user.role_id === 2;
    });

    // 图片预览相关
    const showViewer = ref(false);
    const previewImages = ref([]);
    const previewIndex = ref(0);
    
    // 预览照片
    const previewPhoto = (paths, index) => {
      previewImages.value = paths.map(path => `${apiConfig.baseURL}${path}`);
      previewIndex.value = index;
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
        const params = {
          page: page.value,
          pageSize: pageSize.value
        };
        const response = await httpService.get(
          `${apiConfig.endpoints.wasteRecords}/user/${auth.state.user.id}`,
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

    const goBack = () => {
      router.push({ name: 'WasteForm', params: { id: props.unitId } });
    };

    // 返回首页
    const goHome = () => {
      // 只有超级管理员才能回到单位选择页面
      if (isAdmin.value) {
        router.push('/');
      }
    };

    // 前往人员管理页面
    const goToUserManagement = () => {
      router.push('/user-management');
    };

    // 添加新的废物记录
    const addNewRecord = () => {
      router.push('/record/new');
    };

    // 编辑现有记录
    const editRecord = (recordId) => {
      router.push(`/record/${recordId}`);
    };

    // 检查是否可以编辑记录
    // 超级管理员可以编辑所有记录
    // 单位管理员可以编辑本单位所有记录
    // 普通员工只能编辑自己创建的记录
    const canEdit = (record) => {
      if (!auth.state.isLoggedIn) return false;

      if (auth.state.user.role_id === 3) return true; // 超级管理员
      
      if (auth.state.user.role_id === 2 && auth.state.user.unit_id === record.unit_id) return true; // 单位管理员
      
      // 员工只能编辑自己创建的记录
      // 注意: creator_id 可能为 null （旧记录），如果为 null 我们允许编辑
      return auth.state.user.unit_id === record.unit_id && 
             (record.creator_id === null || record.creator_id === auth.state.user.id);
    };

    // 添加滚动加载处理函数
    const handleScroll = async (e) => {
      const element = e.target;
      if (
        !loadingMore.value &&
        hasMore.value &&
        element.scrollHeight - element.scrollTop - element.clientHeight < 100
      ) {
        await fetchRecords(true);
      }
    };

    // 添加应用筛选方法
    const applyFilter = async () => {
      await fetchRecords();
      ElMessage.success('筛选已应用');
    };

    // 添加重置筛选方法
    const resetFilter = async () => {
      filterForm.dateRange = null;
      filterForm.wasteTypeId = null;
      filterForm.minQuantity = null;
      filterForm.maxQuantity = null;
      filterForm.location = '';
      await fetchRecords();
      ElMessage.info('筛选条件已重置');
    };

    // 修改导出记录功能，获取所有符合筛选条件的记录
    const exportRecords = async () => {
      if (filteredRecords.value.length === 0) {
        ElMessage.warning('没有可导出的记录');
        return;
      }
      
      try {
        loading.value = true;
        // 获取所有符合当前筛选条件的记录
        const response = await httpService.get(
          `${apiConfig.endpoints.wasteRecords}/export/user/${auth.state.user.id}`,
          {
            params: {
              wasteTypeId: filterForm.wasteTypeId,
              minQuantity: filterForm.minQuantity,
              maxQuantity: filterForm.maxQuantity,
              location: filterForm.location,
              dateRange: filterForm.dateRange
            }
          }
        );
        
        const allRecords = response.data.map(record => ({
          ...record,
          created_at: formatDateTime(record.created_at),
          collection_start_time: formatDateTime(record.collection_start_time)
        }));
        
        // 定义导出列
        const exportHeaders = [
          { title: '单位', field: 'unit_name', width: 15 },
          { title: '废物类型', field: 'waste_type_name', width: 15 },
          { title: '产生地点', field: 'location', width: 20 },
          { title: '收集开始时间', field: 'collection_start_time', width: 20, type: 'datetime' },
          { title: '数量(吨)', field: 'quantity', width: 12, type: 'number' },
          { title: '记录时间', field: 'created_at', width: 20, type: 'datetime' }
        ];
        
        let fileName = `${unitName.value}_废物记录`;
        if (filterForm.wasteTypeId) {
          const wasteType = wasteTypes.value.find(type => type.id === filterForm.wasteTypeId);
          if (wasteType) {
            fileName += `_${wasteType.name}`;
          }
        }
        
        exportToExcel(allRecords, fileName, exportHeaders);
        ElMessage.success('导出成功');
      } catch (error) {
        console.error('导出记录失败:', error);
        ElMessage.error('导出记录失败');
      } finally {
        loading.value = false;
      }
    };
    
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
            await httpService.delete(`${apiConfig.endpoints.wasteRecords}/${record.id}`);
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

    return {
      records,
      filteredRecords,
      loading,
      unitName,
      wasteTypes,
      isAdmin,
      isUnitAdmin,
      parsePhotoPath,
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
      // 分页相关
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
  font-size: 14px;
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
  text-align: center;
  margin-bottom: 20px;
}

.unit-info h2 {
  color: #333;
  border-bottom: 2px solid #409EFF;
  display: inline-block;
  padding-bottom: 5px;
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

.footer {
  background-color: #f5f5f5;
  padding: 15px;
  text-align: center;
  color: #666;
}

.photo-thumbnail-container {
  cursor: pointer;
  display: inline-block;
}

/* 添加移动端样式 */
@media screen and (max-width: 768px) {
  .records-container {
    padding: 10px;
  }
  
  .header {
    flex-direction: column;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;
  }
  
  .header h1 {
    font-size: 18px;
    margin: 5px 0;
  }
  
  .back-button, .home-link {
    font-size: 14px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .card-actions {
    margin-top: 10px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    width: 100%;
  }
  
  .card-actions .el-button {
    margin-left: 0;
    padding: 6px 10px;
    font-size: 12px;
  }
  
  .filter-form-container {
    padding: 10px 0;
  }
  
  .filter-form .el-form-item {
    margin-bottom: 10px;
  }
  
  .filter-actions {
    display: flex;
    justify-content: center;
    margin-top: 15px;
  }
  
  .responsive-table {
    font-size: 12px;
  }
  
  .record-image {
    width: 40px;
    height: 40px;
  }
  
  .photo-count {
    font-size: 10px;
  }
  
  .mobile-hidden {
    display: none;
  }
}

/* 小屏幕手机适配 */
@media screen and (max-width: 480px) {
  .el-table {
    font-size: 11px;
  }
  
  .el-button--small {
    padding: 5px 8px;
    font-size: 11px;
  }
  
  .record-image {
    width: 30px;
    height: 30px;
  }
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
