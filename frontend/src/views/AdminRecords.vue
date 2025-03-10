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
            <h3 class="table-title">所有废物记录</h3>
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
            :height="tableHeight"
            @scroll="handleScroll"
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
            <el-table-column prop="remarks" label="备注" min-width="150">
              <template #default="scope">
                {{ scope.row.remarks || '无' }}
              </template>
            </el-table-column>
            <el-table-column prop="location" label="产生地点" min-width="120" />
            <el-table-column prop="collection_start_time" label="收集开始时间" min-width="160" />
            <el-table-column label="数量(吨)" min-width="100">
              <template #default="scope">
                {{ parseFloat(scope.row.quantity).toFixed(3) }}
              </template>
            </el-table-column>
            <el-table-column prop="creator_name" label="填报人" min-width="100" />
            <el-table-column prop="created_at" label="记录时间" min-width="160" />
            <el-table-column
              label="现场照片（清理前）"
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
            <el-table-column label="操作" min-width="120" fixed="right">
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
      <p>&copy; 2025 固体废物管理系统</p>
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
import { ref, onMounted, computed, reactive, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox, ElImageViewer, ElLoading } from 'element-plus';
import axios from 'axios';
import { Plus, Refresh, User, ArrowDown, ArrowUp, Download, Loading } from '@element-plus/icons-vue';
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
    
    // 添加表格高度动态计算
    const tableHeight = ref(750); // 增加默认高度

    // 计算表格高度的函数
    const calculateTableHeight = () => {
      // 窗口高度的85%，但最小为700px
      const windowHeight = window.innerHeight;
      const calculatedHeight = Math.max(windowHeight * 0.85, 700);
      tableHeight.value = calculatedHeight;
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
      
      // 计算初始表格高度
      calculateTableHeight();
      // 添加窗口大小变化事件监听
      window.addEventListener('resize', handleResize);
      
      await Promise.all([
        fetchUnits(),
        fetchWasteTypes(),
        fetchRecords()
      ]);
    });
    
    onUnmounted(() => {
      // 组件卸载时移除事件监听
      window.removeEventListener('resize', handleResize);
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

    // 添加新记录
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
        // 先弹出选择对话框
        await ElMessageBox.confirm(
          '请选择导出格式',
          '导出选项',
          {
            confirmButtonText: '带图片导出',
            cancelButtonText: '不带图片导出',
            distinguishCancelAndClose: true,
            type: 'info'
          }
        ).then(async () => {
          // 用户选择带图片导出
          await exportWithImages();
        }).catch(action => {
          if (action === 'cancel') {
            // 用户选择不带图片导出
            exportWithoutImages();
          }
        });
      } catch (error) {
        console.error('导出过程发生错误:', error);
        ElMessage.error('导出失败: ' + (error.message || '未知错误'));
      }
    };
    
    // 带图片导出
    const exportWithImages = async () => {
      try {
        // 先显示提示消息
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
            '备注': record.remarks || '无',
            '产生地点': record.location,
            '数量(kg)': record.quantity,
            '收集开始时间': formatDateTime(record.collection_start_time),
            '填报人': record.creator_name || '系统',
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
          { text: '备注', field: '备注' },
          { text: '产生地点', field: '产生地点' },
          { text: '数量(kg)', field: '数量(kg)' },
          { text: '收集开始时间', field: '收集开始时间' },
          { text: '填报人', field: '填报人' },
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
          dateRange: filterForm.dateRange ? JSON.stringify(filterForm.dateRange) : undefined,
          unitId: filterForm.unitId ? filterForm.unitId : undefined
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
          '备注': record.remarks || '无',
          '产生地点': record.location,
          '数量(kg)': record.quantity,
          '收集开始时间': formatDateTime(record.collection_start_time),
          '填报人': record.creator_name || '系统',
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
          { text: '备注', field: '备注' },
          { text: '产生地点', field: '产生地点' },
          { text: '数量(kg)', field: '数量(kg)' },
          { text: '收集开始时间', field: '收集开始时间' },
          { text: '填报人', field: '填报人' },
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

    // 计算序号方法
    const indexMethod = (index) => {
      // 考虑当前页码和每页记录数，计算实际序号
      return (page.value - 1) * pageSize.value + index + 1;
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
      handleScroll,
      indexMethod,
      tableHeight
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
  /* 修改背景渐变，实现两端深中间浅的效果 */
  background: linear-gradient(to right, #1976d2, #42a5f5, #1976d2);
  color: white;
  padding: 20px;
  text-align: center;
  border-radius: 0 0 20px 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  position: relative;
  overflow: hidden;
}

.header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  /* 调整覆盖层渐变，增强立体感 */
  background: linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0) 100%);
  z-index: 1;
}

.header h1 {
  position: relative;
  z-index: 2;
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  letter-spacing: 1px;
}

.content {
  flex: 1;
  padding: 20px 30px; /* 减少上下内边距 */
  max-width: 90%; /* 从固定的1200px改为相对宽度 */
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 15px; /* 减少下边距 */
  gap: 10px;
}

.filter-card {
  margin-bottom: 15px; /* 减少下边距 */
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
  justify-content: flex-end;
  margin-top: 20px;
  gap: 10px;
}

.records-wrapper {
  margin-top: 15px; /* 减少上边距 */
}

.records-card {
  margin-top: 15px; /* 减少上边距 */
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.records-card:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px; /* 减小下边距 */
}

.card-header h3 {
  margin: 0;
  color: #333;
}

.footer {
  background-color: #f5f7fa;
  padding: 10px; /* 减小内边距 */
  text-align: center;
  color: #606266;
}

/* 表格标题样式 */
.table-title {
  font-size: 18px;
  font-weight: bold;
  color: #409EFF;
  margin: 0;
  padding-bottom: 10px;
  border-bottom: 2px solid #409EFF;
  display: inline-block;
}

/* 照片缩略图相关样式 */
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
  height: 60px; /* 添加默认表格行高 */
}

:deep(.el-table__row:hover) {
  background-color: #f0f9ff !important;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:deep(.el-table__row td) {
  padding: 14px 0;
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
  padding-left: 10px;
  padding-right: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

/* 响应式调整 */
@media (max-width: 1600px) {
  .content {
    max-width: 95%;
  }
}

@media (max-width: 1200px) {
  .content {
    max-width: 100%;
    padding: 20px;
  }
}

@media (max-width: 768px) {
  .header {
    padding: 15px;
  }
  
  .content {
    padding: 15px;
  }
  
  /* 在移动设备上调整表格的高度 */
  .responsive-table {
    max-height: 80vh !important; /* 增加移动设备上的高度 */
  }
  
  /* 表格行在移动设备上高度稍小 */
  :deep(.el-table__row) {
    height: 50px;
  }
  
  :deep(.el-table__row td) {
    padding: 10px 0;
  }
  
  /* 让某些列在移动设备上自动调整宽度 */
  :deep(.el-table__cell.is-hidden-mobile) {
    display: none !important;
  }
}

/* 添加大屏幕适配 */
@media (min-width: 1920px) {
  .content {
    max-width: 85%;
  }
  
  /* 大屏幕上行高更高 */
  :deep(.el-table__row) {
    height: 70px; /* 增加大屏幕上的行高 */
  }
}

:deep(.el-table--scrollable-x .el-table__body-wrapper) {
  overflow-x: auto !important;
}

/* 表格分割线样式 */
:deep(.el-table--border .el-table__cell) {
  border-right: 1px solid #EBEEF5;
}

:deep(.el-table--border) {
  border: 1px solid #EBEEF5;
  border-radius: 8px;
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

/* 全局样式，确保表头样式能够正确显示 */
.el-table__header th {
  background: linear-gradient(to bottom, #409EFF, #1E88E5) !important;
  color: white !important;
}

.el-table__header th .cell {
  color: white !important;
  font-weight: bold !important;
}
</style>

<style scoped>
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
</style>
