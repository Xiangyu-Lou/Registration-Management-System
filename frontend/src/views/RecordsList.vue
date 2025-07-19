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
        <h2>{{ unitName }} 固体废物记录</h2>
      </div>
      
      <div class="actions">
        <el-button type="primary" @click="addNewRecord">
          <el-icon><plus /></el-icon> 新增填报
        </el-button>
        <el-button type="success" @click="goToUserManagement" v-if="(isAdmin && !isSupervisor) || isUnitAdmin">
          <el-icon><user /></el-icon> 人员管理
        </el-button>
        <el-button @click="refreshRecords">
          <el-icon><refresh /></el-icon> 刷新
        </el-button>
      </div>
      
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
              <!-- 废物类型 -->
              <el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="6">
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
              <el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="6">
                <el-form-item label="产生地点">
                  <el-input 
                    v-model="filterForm.location" 
                    placeholder="输入地点关键词搜索" 
                    clearable
                  />
                </el-form-item>
              </el-col>
              
              <!-- 产生工序 -->
              <el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="6">
                <el-form-item label="产生工序">
                  <el-input 
                    v-model="filterForm.process" 
                    placeholder="输入工序关键词搜索" 
                    clearable
                  />
                </el-form-item>
              </el-col>
              
              <!-- 收集时间范围 -->
              <el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="6">
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
                    :disabled-date="disabledDate"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-row :gutter="20">
              <!-- 数量范围 -->
              <el-col :xs="24" :sm="12" :md="16" :lg="12" :xl="12">
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
              <el-col :xs="24" :sm="12" :md="8" :lg="12" :xl="12" class="filter-buttons-col">
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
            <h3 class="table-title">废物记录列表</h3>
            <div class="card-actions">
              <el-button type="warning" @click="exportWithoutImages" :loading="loading">
                <el-icon><download /></el-icon> 无照片(推荐)
              </el-button>
              <el-button type="warning" @click="exportWithImages" :loading="loading">
                <el-icon><download /></el-icon> 包含首张照片(推荐)
              </el-button>
              <el-button type="warning" @click="exportWithAllImages" :loading="loading">
                <el-icon><download /></el-icon> 包含全部照片(不推荐)
              </el-button>
            </div>
          </div>
          
          <!-- 基层员工提示信息 -->
          <!-- <el-alert
            v-if="isBasicEmployee"
            type="info"
            show-icon
            :closable="false"
            title="提示：只能查看48小时内由自己提交的记录"
            style="margin-bottom: 15px;"
          /> -->
          
          <el-table 
            :data="records" 
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
            <el-table-column label="收集开始时间" min-width="160">
              <template #default="scope">
                {{ parseFormattedDateTime(scope.row.collection_start_time) }}
              </template>
            </el-table-column>
            <el-table-column label="数量(吨)" min-width="100">
              <template #default="scope">
                {{ scope.row.quantity !== null && scope.row.quantity !== undefined ? parseFloat(scope.row.quantity).toFixed(3) : '' }}
              </template>
            </el-table-column>
            <el-table-column label="汇报人" min-width="100" class="mobile-hidden">
              <template #default="scope">
                {{ scope.row.creator_name || '未知' }}
              </template>
            </el-table-column>
            <el-table-column label="记录时间" min-width="160" class="mobile-hidden">
              <template #default="scope">
                {{ parseFormattedDateTime(scope.row.created_at) }}
              </template>
            </el-table-column>
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
            <el-table-column label="操作" min-width="120">
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
                    v-if="canEdit(scope.row) && (isAdmin || isUnitAdmin)"
                  >
                    删除
                  </el-button>
                </div>
              </template>
            </el-table-column>
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
          
          <!-- <div class="empty-block" v-if="records.length === 0 && !loading">
            <el-empty description="暂无废物记录" />
          </div> -->
          
          <!-- 添加员工权限提示 -->
          <div class="record-limit-tip" v-if="!isAdmin && !isUnitAdmin">
            <el-alert
              title="提示：只能查看过去48小时内的废物记录"
              type="info"
              :closable="false"
              show-icon
            />
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
import httpService from '../config/httpService';
import apiConfig from '../config/api';
import { ArrowLeft, Home, Refresh, Plus, User, ArrowDown, ArrowUp, Download, Loading, CircleClose } from '@element-plus/icons-vue';
import { exportToExcelWithImages, exportToExcel } from '../utils/exportUtils';
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
    Loading,
    CircleClose
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
      location: '',
      process: ''
    });
    
    // 添加监听器，在任何筛选条件变化时实时更新
    const debounceTimer = ref(null);
    watch([
      () => filterForm.wasteTypeId,
      () => filterForm.location,
      () => filterForm.process,
      () => filterForm.minQuantity,
      () => filterForm.maxQuantity,
      () => filterForm.dateRange
    ], () => {
      // 当用户更改筛选条件时，自动重新获取数据
      // 添加防抖动处理，避免频繁请求
      if (debounceTimer.value) clearTimeout(debounceTimer.value);
      debounceTimer.value = setTimeout(() => {
        page.value = 1;
        fetchRecords();
      }, 300); // 300毫秒的延迟
    });
    
    // 判断是否为管理员
    const isAdmin = computed(() => {
      return auth.isAdmin();
    });
    
    // 判断是否为单位管理员
    const isUnitAdmin = computed(() => {
      return auth.isUnitAdmin();
    });
    
    // 判断是否为监督人员
    const isSupervisor = computed(() => {
      return auth.isSupervisor();
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
      
      // 单位管理员可以编辑本单位的记录，无论创建者是谁
      const unitId = auth.getUnitId();
      if (isUnitAdmin.value && unitId && record.unit_id === parseInt(unitId)) return true;
      
      // 普通用户(基层员工)只能编辑自己创建的记录
      const userId = auth.getUserId();
      return userId && record.creator_id === parseInt(userId);
    };
    
    // 计算序号方法
    const indexMethod = (index) => {
      // 直接返回索引+1，不依赖页码
      return index + 1;
    };
    
    // 确认删除
    const confirmDelete = (record) => {
      // 添加权限检查，确保只有管理员和单位管理员才能删除记录
      if (!isAdmin.value && !isUnitAdmin.value) {
        ElMessage.error('您没有删除记录的权限');
        return;
      }
      
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
      filterForm.process = '';
      
      // 重置分页
      page.value = 1;
      
      // 重新获取记录
      await fetchRecords();
      
      ElMessage.success('筛选条件已重置');
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

    const tableHeight = ref(750); // 增加默认高度

    // 计算表格高度的函数
    const calculateTableHeight = () => {
      // 窗口高度的85%，但最小为700px (增加比例和最小高度)
      const windowHeight = window.innerHeight;
      const calculatedHeight = Math.max(windowHeight * 0.85, 700);
      tableHeight.value = calculatedHeight;
    };

    // 窗口大小变化时重新计算表格高度
    const handleResize = () => {
      calculateTableHeight();
    };

    onMounted(async () => {
      // 计算初始表格高度
      calculateTableHeight();
      // 添加窗口大小变化事件监听
      window.addEventListener('resize', handleResize);
      
      await fetchUnitName();
      await fetchWasteTypes();
      await fetchRecords();
    });

    onUnmounted(() => {
      // 组件卸载时移除事件监听
      window.removeEventListener('resize', handleResize);
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

    // 获取记录数据
    const fetchRecords = async (isLoadMore = false) => {
      if (!isLoadMore) {
        loading.value = true;
        page.value = 1;
        records.value = [];
      } else {
        loadingMore.value = true;
      }
      
      try {
        // 验证用户是否登录
        if (!auth.state.isLoggedIn || !auth.state.user) {
          throw new Error('用户未登录');
        }
        
        // 使用用户ID获取记录
        const params = {
          page: page.value,
          pageSize: pageSize.value,
          wasteTypeId: filterForm.wasteTypeId || undefined,
          minQuantity: filterForm.minQuantity || undefined,
          maxQuantity: filterForm.maxQuantity || undefined,
          location: filterForm.location || undefined,
          process: filterForm.process || undefined,
          unitId: props.unitId ? parseInt(props.unitId) : undefined
        };
        
        // 如果有日期范围筛选，添加到参数
        if (filterForm.dateRange && filterForm.dateRange.length === 2) {
          params.dateRange = JSON.stringify(filterForm.dateRange);
        }
        
        console.log('【筛选】请求废物记录，参数:', JSON.stringify(params, null, 2));
        // 使用apiConfig.getUrl确保URL正确
        const apiUrl = apiConfig.getUrl(`${apiConfig.endpoints.wasteRecords}/user/${auth.state.user.id}`);
        console.log('【筛选】请求URL:', apiUrl);
        
        const response = await axios.get(apiUrl, { params });
        console.log('【筛选】获取到废物记录响应:', response.data);
        
        if (!response.data || !response.data.records) {
          console.error('【筛选】响应数据格式错误:', response.data);
          throw new Error('响应数据格式错误');
        }
        
        // 使用已有的parseFormattedDateTime函数格式化日期
        const formattedRecords = response.data.records.map(record => ({
          ...record,
          created_at: parseFormattedDateTime(record.created_at),
          collection_start_time: parseFormattedDateTime(record.collection_start_time)
        }));
        
        console.log(`【筛选】获取到${formattedRecords.length}条记录`);
        
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
        console.error('【筛选】获取废物记录失败:', error);
        ElMessage.error('获取废物记录失败: ' + (error.message || '未知错误'));
      } finally {
        loading.value = false;
        loadingMore.value = false;
      }
    };
    
    // 加载更多记录
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

    // 判断是否为基层员工
    const isBasicEmployee = computed(() => {
      return !isAdmin.value && !isUnitAdmin.value;
    });
    
    // 带图片导出 (包含首张照片)
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
        
        // 设置加载状态
        loading.value = true;
        
        // 准备筛选条件
        const queryParams = {
          wasteTypeId: filterForm.wasteTypeId ? filterForm.wasteTypeId : undefined,
          minQuantity: filterForm.minQuantity ? filterForm.minQuantity : undefined,
          maxQuantity: filterForm.maxQuantity ? filterForm.maxQuantity : undefined,
          location: filterForm.location || undefined,
          process: filterForm.process || undefined,
          dateRange: filterForm.dateRange ? JSON.stringify(filterForm.dateRange) : undefined,
          unitId: props.unitId ? parseInt(props.unitId) : undefined,
          exportType: 'first_image' // 添加导出类型参数
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
            '收集开始时间': parseFormattedDateTime(record.collection_start_time),
            '数量(吨)': record.quantity,
            '填报人': record.creator_name || '系统',
            '记录时间': parseFormattedDateTime(record.created_at),
            '清理前照片': beforePhotos.length > 0 ? beforePhotos[0] : '',  // 使用第一张图片的路径
            '清理后照片': afterPhotos.length > 0 ? afterPhotos[0] : ''    // 使用第一张图片的路径
          };
        });
        
        // 设置文件名
        const fileName = `固体废物记录_${unitName.value ? unitName.value : '全部单位'}`;
        
        // 设置表头，添加isImage标志
        const headers = [
          { text: '单位', field: '单位' },
          { text: '废物类型', field: '废物类型' },
          { text: '产生工序', field: '产生工序' },
          { text: '产生地点', field: '产生地点' },
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
        const result = await exportToExcelWithImages(exportData, fileName, headers, baseUrl, onProgress);
        
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
          unitId: props.unitId ? parseInt(props.unitId) : undefined,
          exportType: 'all_images' // 添加导出类型参数
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
          '收集开始时间': parseFormattedDateTime(record.collection_start_time),
            '数量(吨)': record.quantity,
          '填报人': record.creator_name || '系统',
            '记录时间': parseFormattedDateTime(record.created_at),
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
        const fileName = `固体废物记录_全部照片_${unitName.value ? unitName.value : '全部单位'}`;
        
        // 设置表头，添加isImage标志
        const headers = [
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
          headers.push({ text: `清理前照片${i+1}`, field: `清理前照片${i+1}`, isImage: true });
        }
        
        // 添加清理后照片表头
        for (let i = 0; i < 5; i++) {
          headers.push({ text: `清理后照片${i+1}`, field: `清理后照片${i+1}`, isImage: true });
        }
        
        // 获取服务器的基础URL
        const baseUrl = window.location.origin;
        
        // 设置进度回调函数
        const onProgress = (current, total) => {
          const percent = Math.round((current / total) * 100);
          loadingInstance.setText(`正在导出全部照片：${percent}% (${current}/${total})`);
        };
        
        // 执行带全部图片的导出
        const result = await exportToExcelWithImages(exportData, fileName, headers, baseUrl, onProgress);
        
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
        
        // 设置加载状态
        loading.value = true;
        
        // 准备筛选条件
        const queryParams = {
          wasteTypeId: filterForm.wasteTypeId ? filterForm.wasteTypeId : undefined,
          minQuantity: filterForm.minQuantity ? filterForm.minQuantity : undefined,
          maxQuantity: filterForm.maxQuantity ? filterForm.maxQuantity : undefined,
          location: filterForm.location || undefined,
          process: filterForm.process || undefined,
          dateRange: filterForm.dateRange ? JSON.stringify(filterForm.dateRange) : undefined,
          unitId: props.unitId ? parseInt(props.unitId) : undefined,
          exportType: 'no_images' // 添加导出类型参数
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
          '收集开始时间': parseFormattedDateTime(record.collection_start_time),
          '数量(吨)': record.quantity,
          '填报人': record.creator_name || '系统',
          '记录时间': parseFormattedDateTime(record.created_at),
          '清理前照片': record.photo_path_before ? '有' : '无',
          '清理后照片': record.photo_path_after ? '有' : '无'
        }));
        
        // 设置文件名
        const fileName = `固体废物记录_${unitName.value ? unitName.value : '全部单位'}`;
        
        // 设置表头
        const headers = [
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
        const result = await exportToExcel(exportData, fileName, headers);
        
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

    // 添加disabledDate函数
    const disabledDate = (date) => {
      if (!isAdmin.value && !isUnitAdmin.value) {
        const today = new Date();
        const hours48Ago = new Date(today);
        hours48Ago.setHours(today.getHours() - 48);
        return date < hours48Ago || date > today;
      }
      return false;
    };

    return {
      records,
      loading,
      unitName,
      wasteTypes,
      isAdmin,
      isUnitAdmin,
      isSupervisor,
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
      debounceTimer,
      // 导出相关
      exportWithImages,
      exportWithAllImages,
      exportWithoutImages,
      // 图片预览相关
      showViewer,
      previewImages,
      previewIndex,
      previewPhoto,
      closeViewer,
      handleResize,
      // 照片路径解析
      parsePhotoPath,
      baseUrl,
      // 分页相关
      page,
      pageSize,
      hasMore,
      loadingMore,
      // 计算序号方法
      indexMethod,
      // 添加disabledDate函数
      disabledDate,
      tableHeight,  // 添加到返回值中
      // 判断是否为基层员工
      isBasicEmployee,
      // 加载更多记录
      loadMore,
    };
  }
};
</script>

<style>
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
.records-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.header {
  /* 修改背景渐变，实现两端深中间浅的效果 */
  background: linear-gradient(to right, #1976d2, #42a5f5, #1976d2);
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.back-button, .home-link {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 16px;
  position: relative;
  z-index: 2;
  background-color: rgba(255, 255, 255, 0.25);
  padding: 8px 14px;
  border-radius: 8px;
  transition: all 0.3s ease;
  border: 1.5px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  letter-spacing: 0.3px;
}

.back-button:hover, .home-link:hover {
  background-color: rgba(255, 255, 255, 0.35);
  transform: translateY(-2px);
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.25);
  border-color: rgba(255, 255, 255, 0.8);
}

.content {
  flex: 1;
  padding: 20px 30px; /* 减少上下内边距 */
  max-width: 90%; /* 从固定的1200px改为相对宽度 */
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.unit-info {
  margin-bottom: 15px; /* 减少下边距 */
  text-align: center;
}

.unit-info h2 {
  color: #333;
  margin: 0;
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
  margin-bottom: 15px; /* 减小下边距 */
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

.input-with-clear {
  position: relative;
  width: 48%;
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

.photo-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.photo-thumbnail-container {
  cursor: pointer;
  margin-bottom: 2px;
  display: flex;
  justify-content: center;
}

.photo-count {
  font-size: 12px;
  color: #909399;
  text-align: center;
  margin-top: 2px;
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

/* 表格卡片样式 */
.records-card {
  margin-top: 15px; /* 减少上边距 */
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.records-card:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
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
}

/* 记录限制提示样式 */
.record-limit-tip {
  margin-top: 15px;
  border-radius: 4px;
  overflow: hidden;
}

.record-limit-tip .el-alert {
  margin: 0;
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
  
  /* 表头在移动端的样式调整 */
  :deep(.el-table__header th.el-table__cell) {
    font-size: 14px !important;
    padding: 8px 0 !important;
  }
  
  /* 表格标题在移动端的样式 */
  .table-title {
    font-size: 16px;
    padding-bottom: 8px;
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
  
  .filter-buttons-col {
    margin-top: 15px;
    justify-content: flex-start;
  }
  
  .filter-actions {
    justify-content: flex-start;
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

/* 为了更好地显示数据，调整最小宽度列的样式 */
:deep(.el-table .cell) {
  padding-left: 10px;
  padding-right: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

/* 确保表格图片列内容居中 */
:deep(.el-table .el-table__cell[align="center"] .cell) {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 装载更多行样式 */
.loading-more {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
  color: #909399;
}

/* 添加加载更多按钮样式 */
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
</style> 