<template>
  <div class="admin-records-container">
    <div class="header">
      <h1>固体废物管理系统历史记录</h1>
    </div>

    <div class="content">
      <div class="actions">
        <el-button type="primary" @click="addNewRecord">
          <el-icon><plus /></el-icon> 新增填报
        </el-button>
        <el-button v-if="isSuperAdmin" type="success" @click="goToUserManagement">
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
              <!-- 所属单位 -->
              <el-col :xs="24" :sm="12" :md="5" :lg="5" :xl="5">
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
              
              <!-- 添加监督人员数据筛选按钮（改用switch） -->
              <el-col :xs="24" :sm="12" :md="4" :lg="4" :xl="4" v-if="isSuperAdmin">
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
      
      <div class="records-wrapper">
        <el-card class="records-card">
          <div class="card-header">
            <h3 class="table-title">所有废物记录</h3>
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
          
          <!-- 简化表格容器结构 -->
          <div class="table-wrapper" ref="tableContainer">
            <el-table 
              ref="tableRef"
              :data="filteredRecords" 
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
              <el-table-column prop="unit_name" label="单位" min-width="120" />
              <el-table-column prop="waste_type_name" label="废物类型" min-width="120" />
              <el-table-column prop="location" label="产生地点" min-width="120" />
              <el-table-column prop="process" label="产生工序" min-width="120">
                <template #default="scope">
                  {{ scope.row.process || '无' }}
                </template>
              </el-table-column>
              <el-table-column prop="remarks" label="备注" min-width="150">
                <template #default="scope">
                  {{ scope.row.remarks || '无' }}
                </template>
              </el-table-column>
              <el-table-column prop="collection_start_time" label="收集开始时间" min-width="160" />
              <el-table-column label="数量(吨)" min-width="100">
                <template #default="scope">
                  {{ scope.row.quantity !== null && scope.row.quantity !== undefined ? parseFloat(scope.row.quantity).toFixed(3) : '' }}
                </template>
              </el-table-column>
              <el-table-column prop="creator_name" label="填报人" min-width="100" />
              <el-table-column prop="created_at" label="记录时间" min-width="160" />
              <el-table-column
                label="清理前照片"
                min-width="150"
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
                        style="width: 50px; height: 50px; margin: 0 auto;"
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
                label="清理后照片"
                min-width="150"
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
                        style="width: 50px; height: 50px; margin: 0 auto;"
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
              <!-- <el-table-column label="操作" min-width="120" fixed="right"> -->
              <el-table-column label="操作" min-width="120">
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
              
              <!-- 添加一个额外的表格行(插槽)来放置加载更多按钮 -->
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
          
          <div class="empty-block" v-if="records.length === 0 && !loading">
            <el-empty description="暂无废物记录" />
          </div>
        </el-card>
      </div>
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
import { ref, onMounted, computed, reactive, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox, ElImageViewer, ElLoading } from 'element-plus';
import axios from 'axios';
import { Plus, Refresh, User, ArrowDown, ArrowUp, Download, Loading, CircleClose } from '@element-plus/icons-vue';
import auth from '../store/auth';
import { exportToExcelWithImages, exportToExcel } from '../utils/exportUtils';
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
    Loading,
    CircleClose
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
    
    // 添加表格高度动态计算
    const tableHeight = ref(750); // 增加表格高度为750px
    const tableContainer = ref(null); // 添加对表格容器的引用

    // 计算表格高度的函数 - 修改为计算表格内容的高度
    const calculateTableHeight = () => {
      // 设置表格高度为窗口高度的65%，但最小650px，最大850px
      const windowHeight = window.innerHeight;
      const calculatedHeight = Math.min(Math.max(windowHeight * 0.85, 650), 900);
      tableHeight.value = calculatedHeight;
      console.log('设置表格高度:', calculatedHeight);
    };

    // 窗口大小变化时重新计算表格高度
    const handleResize = () => {
      calculateTableHeight();
    };
    
    // 图片预览相关
    const showViewer = ref(false);
    const previewImages = ref([]);
    const previewIndex = ref(0);
    
    // 添加分页相关的响应式变量
    const page = ref(1);
    const currentPage = ref(1); // 添加currentPage变量跟踪当前显示的页码
    const pageSize = ref(20);
    const hasMore = ref(true);
    const loadingMore = ref(false);
    
    // 在setup函数中添加tableRef
    const tableRef = ref(null); // 添加对表格的引用

    // 筛选表单
    const filterForm = reactive({
      unitId: null,
      dateRange: null,
      wasteTypeId: null,
      minQuantity: null,
      maxQuantity: null,
      location: '',
      process: '',
      showSupervised: true, // 新增字段，默认为true，表示显示监督人员录入的数据
    });
    
    // 添加监听器，在任何筛选条件变化时实时更新
    const debounceTimer = ref(null);
    watch([
      () => filterForm.unitId,
      () => filterForm.dateRange,
      () => filterForm.wasteTypeId,
      () => filterForm.minQuantity,
      () => filterForm.maxQuantity,
      () => filterForm.location,
      () => filterForm.process,
      () => filterForm.showSupervised
    ], () => {
      // 当用户更改筛选条件时，自动重新获取数据
      // 添加防抖动处理，避免频繁请求
      if (debounceTimer.value) clearTimeout(debounceTimer.value);
      debounceTimer.value = setTimeout(() => {
        page.value = 1;
        fetchRecords();
      }, 300); // 300毫秒的延迟
    });
    
    // 过滤后的记录
    const filteredRecords = computed(() => {
      return records.value.filter(record => {
        // 检查单位
        if (filterForm.unitId && record.unit_id !== filterForm.unitId) {
          return false;
        }
        
        // 检查废物类型
        if (filterForm.wasteTypeId && record.waste_type_id !== filterForm.wasteTypeId) {
          return false;
        }
        
        // 检查数量范围
        if (filterForm.minQuantity !== null && filterForm.minQuantity !== '' && 
            record.quantity !== null && record.quantity !== undefined &&
            parseFloat(record.quantity) < filterForm.minQuantity) {
          return false;
        }
        
        if (filterForm.maxQuantity !== null && filterForm.maxQuantity !== '' && 
            record.quantity !== null && record.quantity !== undefined &&
            parseFloat(record.quantity) > filterForm.maxQuantity) {
          return false;
        }
        
        // 检查地点关键词
        if (filterForm.location && !record.location.toLowerCase().includes(filterForm.location.toLowerCase())) {
          return false;
        }
        
        // 检查产生工序关键词
        if (filterForm.process && !record.process?.toLowerCase().includes(filterForm.process.toLowerCase())) {
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
      // 验证用户是否为超级管理员或监督人员
      if (auth.state.user.role_id === 3 || auth.state.user.role_id === 4) {
        // 获取单位列表（超级管理员和监督人员可以查看）
        await fetchUnits();
        // 获取废物类型列表
        await fetchWasteTypes();
        // 获取废物记录
        fetchRecords();
      } else {
        ElMessage.error('权限不足');
        router.push('/login');
        return;
      }
      
      // 计算初始表格高度
      calculateTableHeight();
      // 添加窗口大小变化事件监听
      window.addEventListener('resize', handleResize);
      
      await Promise.all([
        fetchUnits(),
        fetchWasteTypes(),
        fetchRecords()
      ]);
      
      // 移除滚动监听设置
    });
    
    onUnmounted(() => {
      // 组件卸载时移除事件监听
      window.removeEventListener('resize', handleResize);
      
      // 移除滚动监听 - 不再需要
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
      console.log(`开始加载数据，是否加载更多: ${isLoadMore}`);
      
      if (!isLoadMore) {
        loading.value = true;
        page.value = 1;
        currentPage.value = 1; // 重置当前页码
        records.value = [];
        console.log('初始化加载: 重置页码和记录');
      } else {
        loadingMore.value = true;
        console.log(`加载更多: 当前page=${page.value}, currentPage=${currentPage.value}`);
      }
      
      try {
        const params = {
          page: page.value,
          pageSize: pageSize.value,
          wasteTypeId: filterForm.wasteTypeId,
          minQuantity: filterForm.minQuantity,
          maxQuantity: filterForm.maxQuantity,
          location: filterForm.location,
          process: filterForm.process,
          showSupervised: filterForm.showSupervised, // 添加新的参数
        };
        
        console.log('发送请求参数:', params);
        
        // Only add dateRange if it exists and has both start and end dates
        if (filterForm.dateRange && filterForm.dateRange.length === 2) {
          params.dateRange = JSON.stringify(filterForm.dateRange);
        }
        
        const response = await axios.get(
          `${apiConfig.getUrl(apiConfig.endpoints.wasteRecords)}/user/${auth.state.user.id}`,
          { params }
        );
        
        console.log('服务器返回数据:', {
          recordsCount: response.data.records.length,
          hasMore: response.data.hasMore
        });
        
        // 格式化日期
        const formattedRecords = response.data.records.map(record => ({
          ...record,
          created_at: formatDateTime(record.created_at),
          collection_start_time: formatDateTime(record.collection_start_time)
        }));
        
        if (isLoadMore) {
          records.value = [...records.value, ...formattedRecords];
          console.log(`追加${formattedRecords.length}条记录，现在总共有${records.value.length}条记录`);
        } else {
          records.value = formattedRecords;
          console.log(`加载了${formattedRecords.length}条新记录`);
        }
        
        hasMore.value = response.data.hasMore;
        console.log(`服务器是否有更多数据: ${hasMore.value}`);
        
        if (hasMore.value) {
          page.value++;
          console.log(`有更多数据，下一页将是: page=${page.value}`);
        } else {
          console.log('没有更多数据了');
        }
      } catch (error) {
        console.error('获取废物记录失败:', error);
        ElMessage.error('获取废物记录失败');
      } finally {
        loading.value = false;
        loadingMore.value = false;
        console.log(`加载完成，状态: loading=${loading.value}, loadingMore=${loadingMore.value}`);
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

    // 添加新记录
    const addNewRecord = () => {
      if (auth.state.user.role_id === 3 || auth.state.user.role_id === 4) {
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
      filterForm.process = '';
      filterForm.showSupervised = true; // 重置时恢复默认值
      await fetchRecords();
      ElMessage.info('筛选条件已重置');
    };
    
    // 带图片导出 (包含首张照片)
    const exportWithImages = async () => {
      try {
        // 先弹出选择对话框
        ElMessage({
          message: '导出大量包含图片的记录所需时间较长，请耐心等待',
          type: 'info',
          duration: 5000
        });
        
        // 创建全屏加载
        const loadingInstance = ElLoading.service({
          lock: true,
          text: '正在导出记录，请稍候...',
          background: 'rgba(0, 0, 0, 0.7)'
        });
        
        loading.value = true;
        
        // 准备筛选条件
        const queryParams = {
          wasteTypeId: filterForm.wasteTypeId ? filterForm.wasteTypeId : undefined,
          minQuantity: filterForm.minQuantity ? filterForm.minQuantity : undefined,
          maxQuantity: filterForm.maxQuantity ? filterForm.maxQuantity : undefined,
          location: filterForm.location || undefined,
          process: filterForm.process || undefined,
          dateRange: filterForm.dateRange ? JSON.stringify(filterForm.dateRange) : undefined,
          unitId: filterForm.unitId ? filterForm.unitId : undefined,
          showSupervised: filterForm.showSupervised, // 添加监督人员数据筛选参数
        };
        
        console.log('导出记录的筛选条件:', queryParams);
        
        // 调用后端API获取完整的记录数据
        const { data } = await axios.get(
          `${apiConfig.getUrl(apiConfig.endpoints.exportWasteRecords)}/${auth.state.user.id}`,
          { params: queryParams }
        );
        
        console.log(`从后端获取到 ${data.length} 条记录用于导出`);
        
        if (data.length === 0) {
          loadingInstance.close();
          ElMessage.warning('没有符合条件的记录可导出');
          loading.value = false;
          return;
        }
        
        // 更新加载文本
        loadingInstance.setText(`准备导出 ${data.length} 条记录...`);
        
        // 准备导出数据
        const exportData = data.map(record => {
          // 解析图片路径
          const beforePhotos = parsePhotoPath(record.photo_path_before);
          const afterPhotos = parsePhotoPath(record.photo_path_after);
          
          return {
            '单位': record.unit_name,
            '废物类型': record.waste_type_name,
            '产生地点': record.location,
            '产生工序': record.process || '无',
            '备注': record.remarks || '无',
            '收集开始时间': formatDateTime(record.collection_start_time),
            '数量(吨)': record.quantity,
            '填报人': record.creator_name || '系统',
            '记录时间': formatDateTime(record.created_at),
            '清理前照片': beforePhotos.length > 0 ? beforePhotos[0] : '',  // 使用第一张图片的路径
            '清理后照片': afterPhotos.length > 0 ? afterPhotos[0] : ''    // 使用第一张图片的路径
          };
        });
        
        // 设置文件名
        const unitName = filterForm.unitId 
          ? units.value.find(u => u.id === filterForm.unitId)?.name || '未知单位'
          : '全部单位';
        const fileName = `固体废物记录_${unitName}`;
        
        // 设置表头
        const exportHeaders = [
          { text: '单位', field: '单位' },
          { text: '废物类型', field: '废物类型' },
          { text: '产生地点', field: '产生地点' },
          { text: '产生工序', field: '产生工序' },          
          { text: '备注', field: '备注' },
          { text: '收集开始时间', field: '收集开始时间' },
          { text: '数量(吨)', field: '数量(吨)' },
          { text: '填报人', field: '填报人' },
          { text: '记录时间', field: '记录时间' },
          { text: '清理前照片', field: '清理前照片', isImage: true },
          { text: '清理后照片', field: '清理后照片', isImage: true }
        ];
        
        // 获取服务器的基础URL
        const baseUrl = window.location.origin;
        
        // 设置进度回调函数
        const onProgress = (current, total) => {
          const percent = Math.round((current / total) * 100);
          loadingInstance.setText(`正在导出：${percent}% (${current}/${total})`);
        };
        
        // 执行带图片的导出
        const result = await exportToExcelWithImages(exportData, fileName, exportHeaders, baseUrl, onProgress);
        
        // 关闭加载提示
        loadingInstance.close();
        
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
        // 确保加载提示被关闭
        ElLoading.service().close();
      }
    };
    
    // 带全部照片导出
    const exportWithAllImages = async () => {
      try {
        // 先显示提示消息
        ElMessage({
          message: '导出大量包含全部图片的记录所需时间较长，请耐心等待',
          type: 'info',
          duration: 5000
        });
        
        // 创建全屏加载
        const loadingInstance = ElLoading.service({
          lock: true,
          text: '正在导出记录，请稍候...',
          background: 'rgba(0, 0, 0, 0.7)'
        });
        
        loading.value = true;
        
        // 准备筛选条件
        const queryParams = {
          wasteTypeId: filterForm.wasteTypeId ? filterForm.wasteTypeId : undefined,
          minQuantity: filterForm.minQuantity ? filterForm.minQuantity : undefined,
          maxQuantity: filterForm.maxQuantity ? filterForm.maxQuantity : undefined,
          location: filterForm.location || undefined,
          process: filterForm.process || undefined,
          dateRange: filterForm.dateRange ? JSON.stringify(filterForm.dateRange) : undefined,
          unitId: filterForm.unitId ? filterForm.unitId : undefined,
          showSupervised: filterForm.showSupervised, // 添加监督人员数据筛选参数
        };
        
        console.log('导出记录的筛选条件:', queryParams);
        
        // 调用后端API获取完整的记录数据
        const { data } = await axios.get(
          `${apiConfig.getUrl(apiConfig.endpoints.exportWasteRecords)}/${auth.state.user.id}`,
          { params: queryParams }
        );
        
        console.log(`从后端获取到 ${data.length} 条记录用于导出`);
        
        if (data.length === 0) {
          loadingInstance.close();
          ElMessage.warning('没有符合条件的记录可导出');
          loading.value = false;
          return;
        }
        
        // 更新加载文本
        loadingInstance.setText(`准备导出 ${data.length} 条记录的全部照片...`);
        
        // 准备导出数据
        const exportData = data.map(record => {
          // 解析所有照片路径
          const beforePhotos = parsePhotoPath(record.photo_path_before);
          const afterPhotos = parsePhotoPath(record.photo_path_after);
          
          // 准备基本数据
          const recordData = {
            '单位': record.unit_name,
            '废物类型': record.waste_type_name,
            '产生工序': record.process || '无',
            '产生地点': record.location,
            '备注': record.remarks || '无',
            '收集开始时间': formatDateTime(record.collection_start_time),
            '数量(吨)': record.quantity,
            '填报人': record.creator_name || '系统',
            '记录时间': formatDateTime(record.created_at),
          };
          
          // 添加最多5张清理前照片
          for (let i = 0; i < 5; i++) {
            recordData[`清理前照片${i+1}`] = i < beforePhotos.length ? beforePhotos[i] : '';
          }
          
          // 添加最多5张清理后照片
          for (let i = 0; i < 5; i++) {
            recordData[`清理后照片${i+1}`] = i < afterPhotos.length ? afterPhotos[i] : '';
          }
          
          return recordData;
        });
        
        // 设置文件名
        const unitName = filterForm.unitId 
          ? units.value.find(u => u.id === filterForm.unitId)?.name || '未知单位'
          : '全部单位';
        const fileName = `固体废物记录_全部照片_${unitName}`;
        
        // 设置表头，添加isImage标志
        const exportHeaders = [
          { text: '单位', field: '单位' },
          { text: '废物类型', field: '废物类型' },
          { text: '产生工序', field: '产生工序' },
          { text: '产生地点', field: '产生地点' },
          { text: '备注', field: '备注' },
          { text: '收集开始时间', field: '收集开始时间' },
          { text: '数量(吨)', field: '数量(吨)' },
          { text: '填报人', field: '填报人' },
          { text: '记录时间', field: '记录时间' },
        ];
        
        // 添加清理前照片表头
        for (let i = 0; i < 5; i++) {
          exportHeaders.push({ text: `清理前照片${i+1}`, field: `清理前照片${i+1}`, isImage: true });
        }
        
        // 添加清理后照片表头
        for (let i = 0; i < 5; i++) {
          exportHeaders.push({ text: `清理后照片${i+1}`, field: `清理后照片${i+1}`, isImage: true });
        }
        
        // 获取服务器的基础URL
        const baseUrl = window.location.origin;
        
        // 设置进度回调函数
        const onProgress = (current, total) => {
          const percent = Math.round((current / total) * 100);
          loadingInstance.setText(`正在导出全部照片：${percent}% (${current}/${total})`);
        };
        
        // 执行带全部图片的导出
        const result = await exportToExcelWithImages(exportData, fileName, exportHeaders, baseUrl, onProgress);
        
        // 关闭加载提示
        loadingInstance.close();
        
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
        // 确保加载提示被关闭
        ElLoading.service().close();
      }
    };
    
    // 不带图片导出
    const exportWithoutImages = async () => {
      try {
        // 创建加载遮罩
        const loadingInstance = ElLoading.service({
          lock: true,
          text: '正在导出记录，请稍候...',
          background: 'rgba(0, 0, 0, 0.7)'
        });
        
        loading.value = true;
        
        // 准备筛选条件
        const queryParams = {
          wasteTypeId: filterForm.wasteTypeId ? filterForm.wasteTypeId : undefined,
          minQuantity: filterForm.minQuantity ? filterForm.minQuantity : undefined,
          maxQuantity: filterForm.maxQuantity ? filterForm.maxQuantity : undefined,
          location: filterForm.location || undefined,
          process: filterForm.process || undefined,
          dateRange: filterForm.dateRange ? JSON.stringify(filterForm.dateRange) : undefined,
          unitId: filterForm.unitId ? filterForm.unitId : undefined,
          showSupervised: filterForm.showSupervised, // 添加监督人员数据筛选参数
        };
        
        // 调用后端API获取完整的记录数据
        const { data } = await axios.get(
          `${apiConfig.getUrl(apiConfig.endpoints.exportWasteRecords)}/${auth.state.user.id}`,
          { params: queryParams }
        );
        
        if (data.length === 0) {
          loadingInstance.close();
          ElMessage.warning('没有符合条件的记录可导出');
          loading.value = false;
          return;
        }
        
        // 更新加载文本
        loadingInstance.setText(`准备导出 ${data.length} 条记录...`);
        
        // 准备导出数据
        const exportData = data.map(record => ({
          '单位': record.unit_name,
          '废物类型': record.waste_type_name,
          '产生工序': record.process || '无',
          '产生地点': record.location,
          '备注': record.remarks || '无',
          '收集开始时间': formatDateTime(record.collection_start_time),
          '数量(吨)': record.quantity,
          '填报人': record.creator_name || '系统',
          '记录时间': formatDateTime(record.created_at),
          '清理前照片': record.photo_path_before ? '有' : '无',
          '清理后照片': record.photo_path_after ? '有' : '无'
        }));
        
        // 设置文件名
        const unitName = filterForm.unitId 
          ? units.value.find(u => u.id === filterForm.unitId)?.name || '未知单位'
          : '全部单位';
        const fileName = `固体废物记录_${unitName}`;
        
        // 设置表头
        const exportHeaders = [
          { text: '单位', field: '单位' },
          { text: '废物类型', field: '废物类型' },
          { text: '产生地点', field: '产生地点' },
          { text: '产生工序', field: '产生工序' },
          { text: '备注', field: '备注' },
          { text: '收集开始时间', field: '收集开始时间' },
          { text: '数量(吨)', field: '数量(吨)' },
          { text: '填报人', field: '填报人' },
          { text: '记录时间', field: '记录时间' },
          { text: '清理前照片', field: '清理前照片' },
          { text: '清理后照片', field: '清理后照片' }
        ];
        
        // 执行不带图片的导出
        const result = await exportToExcel(exportData, fileName, exportHeaders);
        
        // 关闭加载提示
        loadingInstance.close();
        
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
        // 确保加载提示被关闭
        ElLoading.service().close();
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

    // 删除滚动监听相关函数，只保留手动加载功能
    const loadMore = () => {
      console.log('手动触发加载更多');
      
      // 记录当前滚动位置
      const tableBody = document.querySelector('.el-table__body-wrapper');
      const scrollPos = tableBody ? tableBody.scrollTop : 0;
      
      return fetchRecords(true).then(() => {
        console.log('加载完成，当前记录数:', records.value.length);
        
        // 恢复之前的滚动位置，防止页面跳动
        setTimeout(() => {
          if (tableBody) {
            tableBody.scrollTop = scrollPos;
          }
        }, 10);
      }).catch(error => {
        console.error('加载失败:', error);
        ElMessage.error('加载更多数据失败');
      });
    };

    // 计算序号方法
    const indexMethod = (index) => {
      // 直接使用数组中的位置作为序号，不依赖于页数
      return index + 1;
    };

    // 判断是否为超级管理员（只有role_id=3才是真正的超级管理员）
    const isSuperAdmin = computed(() => {
      return auth.state.isLoggedIn && auth.state.user.role_id === 3;
    });

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
      exportWithImages,
      exportWithAllImages,
      exportWithoutImages,
      parsePhotoPath,
      getPhotosByType,
      refreshRecords,
      addNewRecord,
      goToUserManagement,
      editRecord,
      confirmDelete,
      showViewer,
      previewImages,
      previewIndex,
      previewPhoto,
      closeViewer,
      baseUrl,
      page,
      currentPage,
      pageSize,
      hasMore,
      loadingMore,
      indexMethod,
      tableHeight,
      debounceTimer,
      tableRef,
      loadMore,
      tableContainer,
      isSuperAdmin,
    };
  }
};
</script>

<style scoped>
.admin-records-container {
  padding: 20px;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.header {
  margin-bottom: 20px;
  text-align: center;
}

.content {
  max-width: 1600px;
  margin: 0 auto;
}

.actions {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  justify-content: flex-end;
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

.filter-form-container {
  transition: all 0.3s ease;
}

.filter-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  align-items: flex-end;
  height: 100%;
}

.filter-buttons-col {
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
}

/* 添加switch组件的样式 */
:deep(.el-switch) {
  margin-left: 5px;
}

:deep(.el-switch__label) {
  font-size: 13px;
  color: #606266;
}

:deep(.el-switch__label--right) {
  margin-left: 6px;
  }
  
:deep(.el-switch__label--left) {
  margin-right: 6px;
}

:deep(.el-switch__core) {
  width: 50px !important;
  height: 24px !important;
  border-radius: 12px;
}

:deep(.el-switch.is-checked .el-switch__core::after) {
  margin-left: -22px;
}

:deep(.el-switch__core::after) {
  width: 20px;
  height: 20px;
  top: 1px;
}

/* 优化筛选表单的整体样式 */
.filter-form {
  padding: 5px 0;
}

.filter-form-container {
  margin-bottom: 10px;
  padding: 0 10px;
}

/* 调整按钮容器的样式 */
.filter-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  align-items: flex-end;
  height: 100%;
  margin-top: 4px;
}

/* 针对小屏幕调整按钮样式 */
@media (max-width: 768px) {
  .filter-buttons-col {
    margin-top: 10px;
  }
  
  .filter-actions {
    justify-content: center;
}

  /* 在小屏幕上，让按钮占据更多空间 */
  :deep(.el-button) {
    padding: 10px 20px;
  font-size: 14px;
  }
}

/* 调整表单项的样式，使其更紧凑 */
:deep(.el-form-item) {
  margin-bottom: 12px;
}

:deep(.el-form-item__label) {
  line-height: 32px;
  padding-right: 8px;
  font-size: 14px;
}

:deep(.el-form-item__content) {
  line-height: 32px;
}

.records-card {
  margin-bottom: 20px;
  min-height: 800px; /* 确保卡片有足够的高度 */
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.card-actions {
  display: flex;
  gap: 10px;
}

.responsive-table {
  width: 100%;
  min-height: 650px; /* 设置表格最小高度 */
  overflow-x: auto;
  margin-bottom: 0;
}

.photo-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.photo-thumbnail-container {
  cursor: pointer;
  display: flex;
  justify-content: center;
  margin-bottom: 2px;
}

.photo-count {
  margin-top: 5px;
  color: #909399;
  font-size: 12px;
}

.empty-block {
  padding: 30px 0;
}

.loading-more {
  text-align: center;
  margin: 20px 0;
  color: #909399;
}

.loading {
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

.operation-buttons {
  display: flex;
  gap: 10px;
}

/* 表格容器简化样式 */
.table-wrapper {
  position: relative;
  width: 100%;
  height: auto;
  min-height: 700px; /* 确保表格容器有足够的高度 */
  border-radius: 4px;
  overflow: hidden;
}

/* 加载更多行样式 */
.load-more-row {
  height: 55px;
  text-align: center;
  background-color: #f5f7fa;
  line-height: 55px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 加载中行样式 */
.loading-row {
  height: 55px;
  text-align: center;
  background-color: #f5f7fa;
  line-height: 55px;
  color: #409EFF;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 没有更多数据行样式 */
.no-more-row {
  height: 55px;
  text-align: center;
  background-color: #f5f7fa;
  line-height: 55px;
  color: #909399;
  font-size: 14px;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 响应式表格样式 */
.responsive-table {
  width: 100%;
  overflow-x: auto;
  margin-bottom: 0;
}

/* 确保表格内部滚动 */
:deep(.el-table__body-wrapper) {
  overflow-y: auto;
  overflow-x: auto;
  min-height: 600px; /* 设置表格主体最小高度 */
}

/* Element Plus 表格样式覆盖 */
:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-top: 15px;
}

:deep(.el-table__header) {
  background: linear-gradient(to bottom, #409EFF, #1E88E5) !important;
}

:deep(.el-table__header th.el-table__cell) {
  background: linear-gradient(to bottom, #409EFF, #1E88E5) !important;
  color: white !important;
  font-weight: bold !important;
  font-size: 15px !important;
  height: 50px !important;
  border-right: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-bottom: none !important;
}

:deep(.el-table__header th.el-table__cell .cell) {
  color: white !important;
  font-weight: bold !important;
  text-align: center !important;
  padding: 12px 0 !important;
}

:deep(.el-table__row) {
  transition: all 0.3s;
}

:deep(.el-table__row:hover) {
  background-color: #f0f9ff !important;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:deep(.el-table__row td) {
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
}

/* 表格行交替颜色 */
:deep(.el-table__row:nth-child(odd)) {
  background-color: #fafafa;
}

:deep(.el-table__row:nth-child(even)) {
  background-color: #ffffff;
}

/* 确保表格内容居中对齐 */
:deep(.el-table .cell) {
  text-align: center;
}

/* 确保表格图片列内容居中 */
:deep(.el-table .el-table__cell[align="center"] .cell) {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 表格标题样式 */
.card-header h3 {
  font-size: 18px;
  font-weight: bold;
  color: #409EFF;
  margin: 0;
  padding-bottom: 10px;
  border-bottom: 2px solid #409EFF;
  display: inline-block;
}

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

/* 全局样式，确保表头样式能够正确显示 */
.el-table__header th {
  background: linear-gradient(to bottom, #409EFF, #1E88E5) !important;
  color: white !important;
}

.el-table__header th .cell {
  color: white !important;
  font-weight: bold !important;
}

.quantity-range {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.range-separator {
  padding: 0 5px;
}

.input-with-clear {
  position: relative;
  width: 47%;
  display: flex;
  align-items: center;
}

.clear-icon {
  position: absolute;
  right: 45px;
  top: 50%;
  transform: translateY(-50%);
  color: #909399;
  font-size: 14px;
  cursor: pointer;
  z-index: 10;
}

.clear-icon:hover {
  color: #409EFF;
}
</style>
