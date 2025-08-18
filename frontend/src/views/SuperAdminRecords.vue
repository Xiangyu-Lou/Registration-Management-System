<template>
  <div class="super-admin-records-container">
    <div class="header">
      <div></div>
      <h1>系统管理 - 固体废物记录</h1>
      <div class="header-actions">
        <el-button type="success" @click="goToCompanyManagement">
          公司管理
        </el-button>
      </div>
    </div>

    <div class="content">
      <!-- 筛选面板 -->
      <el-card class="filter-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>筛选条件</span>
            <el-button 
              link 
              type="primary" 
              @click="showFilterPanel = !showFilterPanel"
            >
              <el-icon v-if="showFilterPanel"><arrow-up /></el-icon>
              <el-icon v-else><arrow-down /></el-icon>
              {{ showFilterPanel ? '收起' : '展开' }}
            </el-button>
          </div>
        </template>
        
        <el-collapse-transition>
          <div v-show="showFilterPanel" class="filter-form-container">
            <el-form :model="filterForm" class="filter-form" label-width="80px">
              <el-row :gutter="20">
                <el-col :span="6">
                  <el-form-item label="公司">
                    <el-select v-model="filterForm.companyId" placeholder="请选择公司" clearable>
                      <el-option label="全部公司" :value="null" />
                      <el-option 
                        v-for="company in companies" 
                        :key="company.id" 
                        :label="company.name" 
                        :value="company.id" 
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="单位">
                    <el-select v-model="filterForm.unitId" placeholder="请选择单位" clearable>
                      <el-option label="全部单位" :value="null" />
                      <el-option 
                        v-for="unit in filteredUnits" 
                        :key="unit.id" 
                        :label="`${unit.name} (${unit.company_name})`" 
                        :value="unit.id" 
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="废物类型">
                    <el-select v-model="filterForm.wasteTypeId" placeholder="请选择废物类型" clearable>
                      <el-option label="全部类型" :value="null" />
                      <el-option 
                        v-for="wasteType in wasteTypes" 
                        :key="wasteType.id" 
                        :label="wasteType.name" 
                        :value="wasteType.id" 
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="时间范围">
                    <el-date-picker
                      v-model="filterForm.dateRange"
                      type="daterange"
                      range-separator="至"
                      start-placeholder="开始日期"
                      end-placeholder="结束日期"
                      format="YYYY-MM-DD"
                      value-format="YYYY-MM-DD"
                    />
                  </el-form-item>
                </el-col>
              </el-row>
              
              <el-row :gutter="20">
                <el-col :span="6">
                  <el-form-item label="最小数量">
                    <el-input-number 
                      v-model="filterForm.minQuantity" 
                      :min="0" 
                      :precision="3" 
                      placeholder="最小数量" 
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="最大数量">
                    <el-input-number 
                      v-model="filterForm.maxQuantity" 
                      :min="0" 
                      :precision="3" 
                      placeholder="最大数量" 
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="产生地点">
                    <el-input v-model="filterForm.location" placeholder="请输入产生地点" clearable />
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="产生工序">
                    <el-input v-model="filterForm.process" placeholder="请输入产生工序" clearable />
                  </el-form-item>
                </el-col>
              </el-row>
              
              <el-row>
                <el-col :span="24" class="filter-buttons-col">
                  <div class="filter-actions">
                    <el-button @click="resetFilter">重置</el-button>
                    <el-button type="primary" @click="applyFilter">查询</el-button>
                  </div>
                </el-col>
              </el-row>
            </el-form>
          </div>
        </el-collapse-transition>
      </el-card>

      <!-- 记录表格 -->
      <el-card class="records-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>固体废物记录列表 (共{{ records.length }}条)</span>
                         <div class="card-actions">
               <el-button @click="refreshRecords">
                 <el-icon><refresh /></el-icon> 刷新
               </el-button>
              <el-dropdown @command="exportData">
                <el-button type="success">
                  <el-icon><download /></el-icon> 导出数据
                  <el-icon><arrow-down /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="withImages">导出(含首张图片)</el-dropdown-item>
                    <el-dropdown-item command="withAllImages">导出(含全部图片)</el-dropdown-item>
                    <el-dropdown-item command="withoutImages">导出(不含图片)</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-button @click="goToUserManagement">
                <el-icon><user /></el-icon>
                <span>用户管理</span>
              </el-button>
              <el-button v-if="canViewLogs" @click="goToOperationLogs">
                <el-icon><document /></el-icon>
                <span>操作日志</span>
              </el-button>
              <el-button @click="goToFeedbackManagement">
                <el-icon><chat-line-round /></el-icon>
                <span>问题反馈</span>
              </el-button>
            </div>
          </div>
        </template>

        <div class="responsive-table">
          <el-table
            v-loading="loading"
            :data="filteredRecords"
            border
            stripe
            style="width: 100%"
            :height="tableHeight"
            ref="tableRef"
            
          >
            <el-table-column 
              type="index" 
              label="序号" 
              width="70" 
              align="center"
              :index="indexMethod"
            />
            <el-table-column prop="company_name" label="公司" min-width="100" />
            <el-table-column prop="unit_name" label="单位" min-width="100" />
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
            <el-table-column label="地理位置" min-width="200" class="mobile-hidden">
              <template #default="scope">
                <div v-if="hasLocationInfo(scope.row)" class="location-info-cell">
                  <span>{{ formatLocationDisplay(scope.row) }}</span>
                </div>
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
            <el-table-column label="操作" min-width="130">
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
            
            <!-- 添加表格append插槽用于显示加载更多 -->
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

        <div v-if="records.length === 0 && !loading" class="empty-state">
          <el-empty description="暂无废物记录" />
        </div>
      </el-card>
    </div>

    <!-- 图片预览 -->
    <el-image-viewer
      v-if="showViewer"
      :url-list="previewImages"
      :initial-index="previewIndex"
      @close="closeViewer"
    />
  </div>
</template>

<script>
import { ref, onMounted, computed, reactive, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox, ElImageViewer, ElLoading } from 'element-plus';
import httpService from '../config/httpService';
import { Refresh, User, ArrowDown, ArrowUp, Download, Document, ChatLineRound, Loading } from '@element-plus/icons-vue';
import auth from '../store/auth';
import { exportToExcelWithImages, exportToExcel } from '../utils/exportUtils';
import apiConfig from '../config/api';

// 解析照片路径
const parsePhotoPath = (path) => {
  if (!path) return [];
  
  try {
    if (path.startsWith('[') && path.endsWith(']')) {
      return JSON.parse(path);
    }
    return [path];
  } catch (error) {
    console.error('解析照片路径失败:', error);
    return [path];
  }
};

export default {
  name: 'SuperAdminRecordsView',
  components: {
    Refresh,
    User,
    ArrowDown,
    ArrowUp,
    Download,
    ElImageViewer,
    Document,
    ChatLineRound,
    Loading
  },
  setup() {
    const router = useRouter();
    
    // 权限检查
    if (!auth.isSystemAdmin()) {
      ElMessage.error('权限不足，只有系统超级管理员可以访问此页面');
      router.push('/');
      return {};
    }
    
    const records = ref([]);
    const loading = ref(false);
    const units = ref([]);
    const companies = ref([]);
    const wasteTypes = ref([]);
    const showFilterPanel = ref(true);
    
    const baseUrl = apiConfig.baseURL;
    const tableHeight = ref(750);
    const tableRef = ref(null);

    // 分页相关变量
    const page = ref(1);
    const pageSize = ref(20);
    const hasMore = ref(true);
    const loadingMore = ref(false);

         // 图片预览相关
     const showViewer = ref(false);
     const previewImages = ref([]);
     const previewIndex = ref(0);

    // 筛选表单
    const filterForm = reactive({
      companyId: null,
      unitId: null,
      dateRange: null,
      wasteTypeId: null,
      minQuantity: null,
      maxQuantity: null,
      location: '',
      process: ''
    });
    
    // 根据选择的公司过滤单位
    const filteredUnits = computed(() => {
      if (!filterForm.companyId) {
        return units.value;
      }
      return units.value.filter(unit => unit.company_id === filterForm.companyId);
    });
    
    // 当公司变化时清空单位选择
    watch(() => filterForm.companyId, () => {
      filterForm.unitId = null;
    });
    
    // 过滤后的记录
    const filteredRecords = computed(() => {
      return records.value.filter(record => {
        if (filterForm.companyId && record.company_id !== filterForm.companyId) {
          return false;
        }
        if (filterForm.unitId && record.unit_id !== filterForm.unitId) {
          return false;
        }
        if (filterForm.wasteTypeId && record.waste_type_id !== filterForm.wasteTypeId) {
          return false;
        }
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
        if (filterForm.location && !record.location?.includes(filterForm.location)) {
          return false;
        }
        if (filterForm.process && !record.process?.includes(filterForm.process)) {
          return false;
        }
        if (filterForm.dateRange && filterForm.dateRange.length === 2) {
          const startDate = new Date(filterForm.dateRange[0]);
          const endDate = new Date(filterForm.dateRange[1]);
          endDate.setHours(23, 59, 59, 999);
          const recordDate = new Date(record.collection_start_time || record.created_at);
          if (recordDate < startDate || recordDate > endDate) {
            return false;
          }
        }
        return true;
      });
    });

    // 判断是否可以查看操作日志
    const canViewLogs = computed(() => {
      return auth.state.isLoggedIn && auth.state.user && auth.state.user.can_view_logs === 1;
    });

    // 获取记录列表
    const fetchRecords = async (reset = true) => {
      if (reset) {
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
        
        const response = await httpService.get(apiConfig.endpoints.wasteRecords, { params });
        
        if (reset) {
          records.value = response.data.records || response.data;
        } else {
          records.value = [...records.value, ...(response.data.records || response.data)];
        }
        
        // 检查是否还有更多数据
        const returnedCount = response.data.records ? response.data.records.length : response.data.length;
        hasMore.value = returnedCount === pageSize.value;
        
      } catch (error) {
        console.error('Error fetching records:', error);
        ElMessage.error('获取记录列表失败');
      } finally {
        loading.value = false;
        loadingMore.value = false;
      }
    };

    // 加载更多记录
    const loadMore = async () => {
      if (loadingMore.value || !hasMore.value) return;
      
      page.value += 1;
      await fetchRecords(false);
    };

    // 获取单位列表
    const fetchUnits = async () => {
      try {
        const response = await httpService.get(apiConfig.endpoints.units);
        units.value = response.data;
      } catch (error) {
        console.error('Error fetching units:', error);
        ElMessage.error('获取单位列表失败');
      }
    };

    // 获取公司列表
    const fetchCompanies = async () => {
      try {
        const response = await httpService.get(apiConfig.endpoints.companies);
        companies.value = response.data;
      } catch (error) {
        console.error('Error fetching companies:', error);
        ElMessage.error('获取公司列表失败');
      }
    };

    // 获取废物类型列表
    const fetchWasteTypes = async () => {
      try {
        const response = await httpService.get(apiConfig.endpoints.wasteTypes);
        wasteTypes.value = response.data;
      } catch (error) {
        console.error('Error fetching waste types:', error);
        ElMessage.error('获取废物类型失败');
      }
    };

    // 应用筛选
    const applyFilter = () => {
      fetchRecords(true);
    };

    // 重置筛选
    const resetFilter = () => {
      Object.keys(filterForm).forEach(key => {
        if (Array.isArray(filterForm[key])) {
          filterForm[key] = [];
        } else if (typeof filterForm[key] === 'number') {
          filterForm[key] = null;
        } else {
          filterForm[key] = null;
        }
      });
      fetchRecords(true);
    };

    // 格式化日期时间
    const formatDateTime = (dateString) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
      } catch (error) {
        return dateString;
      }
    };

    // 导出数据
    const exportData = (command) => {
      if (command === 'withImages') {
        exportWithImages();
      } else if (command === 'withAllImages') {
        exportWithAllImages();
      } else if (command === 'withoutImages') {
        exportWithoutImages();
      }
    };

    // 带图片导出（首张）
    const exportWithImages = async () => {
      try {
        const loadingInstance = ElLoading.service({
          lock: true,
          text: '正在导出记录，请稍候...',
          background: 'rgba(0, 0, 0, 0.7)'
        });
        
        loading.value = true;
        const data = filteredRecords.value;
        
        if (data.length === 0) {
          loadingInstance.close();
          ElMessage.warning('没有可导出的数据');
          return;
        }

        const baseFileName = '系统管理_固体废物记录';
        const BATCH_SIZE = 50;
        const totalRecords = data.length;
        const batchCount = Math.ceil(totalRecords / BATCH_SIZE);

        if(batchCount > 1) {
          loadingInstance.setText(`数据较多(${totalRecords}条)，将拆分为${batchCount}个文件导出...`);
          ElMessage.info(`数据较多(${totalRecords}条)，将拆分为${batchCount}个文件导出`);
        } else {
          loadingInstance.setText(`准备导出 ${totalRecords} 条记录...`);
        }

        let successCount = 0;
        
        for(let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
          const startIndex = batchIndex * BATCH_SIZE;
          const endIndex = Math.min((batchIndex + 1) * BATCH_SIZE, totalRecords);
          const batchData = data.slice(startIndex, endIndex);
          
          const fileName = batchCount > 1 
            ? `${baseFileName}_第${batchIndex + 1}部分(共${batchCount}部分)`
            : baseFileName;
          
          loadingInstance.setText(`正在处理第${batchIndex + 1}/${batchCount}批次，${startIndex + 1}-${endIndex}条记录...`);
          
          const exportData = batchData.map(record => {
            const beforePhotos = parsePhotoPath(record.photo_path_before);
            const afterPhotos = parsePhotoPath(record.photo_path_after);
            
            return {
              '公司': record.company_name,
              '单位': record.unit_name,
              '废物类型': record.waste_type_name,
              '产生地点': record.location,
              '产生工序': record.process || '无',
              '备注': record.remarks || '无',
              '收集开始时间': formatDateTime(record.collection_start_time),
              '数量(吨)': record.quantity,
              '填报人': record.creator_name || '系统',
              '记录时间': formatDateTime(record.created_at),
              '清理前照片': beforePhotos.length > 0 ? beforePhotos[0] : '',
              '清理后照片': afterPhotos.length > 0 ? afterPhotos[0] : ''
            };
          });
          
          const exportHeaders = [
            { text: '公司', field: '公司' },
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
          
          const baseUrl = window.location.origin;
          
          const onProgress = (current, total) => {
            const percent = Math.round((current / total) * 100);
            loadingInstance.setText(`正在导出第${batchIndex + 1}/${batchCount}部分：${percent}% (${current}/${total})`);
          };
          
          const result = await exportToExcelWithImages(exportData, fileName, exportHeaders, baseUrl, onProgress);
          
          if (result) {
            successCount++;
          }
        }

        loadingInstance.close();
        
        if (successCount === batchCount) {
          if (batchCount > 1) {
            ElMessage.success(`成功导出${batchCount}个文件`);
          } else {
            ElMessage.success('导出成功');
          }
        } else if (successCount > 0) {
          ElMessage.warning(`部分导出成功，完成了${successCount}/${batchCount}个文件`);
        } else {
          ElMessage.error('导出失败，请重试');
        }
      } catch (error) {
        console.error('导出记录失败:', error);
        ElMessage.error('导出失败: ' + (error.message || '未知错误'));
      } finally {
        loading.value = false;
        ElLoading.service().close();
      }
    };

    // 带所有图片导出
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
           exportType: 'all_images',
           companyId: filterForm.companyId ? filterForm.companyId : undefined
         };
        
        console.log('导出记录的筛选条件:', queryParams);
        
        // 调用后端API获取完整的记录数据
        const { data } = await httpService.get(
          `${apiConfig.endpoints.exportWasteRecords}/${auth.state.user.id}`,
          queryParams
        );
        
        console.log(`从后端获取到 ${data.length} 条记录用于导出`);
        
        if (data.length === 0) {
          loadingInstance.close();
          ElMessage.warning('没有符合条件的记录可导出');
          loading.value = false;
          return;
        }
        
                 // 设置文件名基础部分
         const companyName = filterForm.companyId 
           ? companies.value.find(c => c.id === filterForm.companyId)?.name || '未知公司'
           : '全部公司';
        const baseFileName = `系统管理_固体废物记录_全部照片_${companyName}`;

        // 设置导出限制 - 带全部图片导出最多50条每文件
        const BATCH_SIZE = 50;
        const totalRecords = data.length;
        const batchCount = Math.ceil(totalRecords / BATCH_SIZE);
        
        // 更新加载文本
        if(batchCount > 1) {
          loadingInstance.setText(`数据较多(${totalRecords}条)，将拆分为${batchCount}个文件导出...`);
          ElMessage.info(`数据较多(${totalRecords}条)，将拆分为${batchCount}个文件导出`);
        } else {
          loadingInstance.setText(`准备导出 ${totalRecords} 条记录的全部照片...`);
        }

        let successCount = 0;
        
        // 分批处理数据
        for(let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
          // 计算当前批次的起始和结束索引
          const startIndex = batchIndex * BATCH_SIZE;
          const endIndex = Math.min((batchIndex + 1) * BATCH_SIZE, totalRecords);
          const batchData = data.slice(startIndex, endIndex);
          
          // 为批次设置文件名
          const fileName = batchCount > 1 
            ? `${baseFileName}_第${batchIndex + 1}部分(共${batchCount}部分)`
            : baseFileName;
          
          // 更新加载文本
          loadingInstance.setText(`正在处理第${batchIndex + 1}/${batchCount}批次，${startIndex + 1}-${endIndex}条记录...`);

          // 准备导出数据
          const exportData = batchData.map(record => {
            // 解析所有照片路径
            const beforePhotos = parsePhotoPath(record.photo_path_before);
            const afterPhotos = parsePhotoPath(record.photo_path_after);
            
            // 准备基本数据
            const recordData = {
              '公司': record.company_name,
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
          
          // 设置表头，添加isImage标志
          const exportHeaders = [
            { text: '公司', field: '公司' },
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
            loadingInstance.setText(`正在导出第${batchIndex + 1}/${batchCount}部分：${percent}% (${current}/${total})`);
          };
          
          // 执行带全部图片的导出
          const result = await exportToExcelWithImages(exportData, fileName, exportHeaders, baseUrl, onProgress);
          
          if (result) {
            successCount++;
          }
        }
        
        // 关闭加载提示
        loadingInstance.close();
        
        if (successCount === batchCount) {
          if (batchCount > 1) {
            ElMessage.success(`成功导出${batchCount}个文件`);
          } else {
            ElMessage.success('导出成功');
          }
        } else if (successCount > 0) {
          ElMessage.warning(`部分导出成功，完成了${successCount}/${batchCount}个文件`);
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
        const loadingInstance = ElLoading.service({
          lock: true,
          text: '正在导出记录，请稍候...',
          background: 'rgba(0, 0, 0, 0.7)'
        });
        
        loading.value = true;
        const data = filteredRecords.value;
        
        if (data.length === 0) {
          loadingInstance.close();
          ElMessage.warning('没有可导出的数据');
          return;
        }

        const baseFileName = '系统管理_固体废物记录';
        const BATCH_SIZE = 1000;
        const totalRecords = data.length;
        const batchCount = Math.ceil(totalRecords / BATCH_SIZE);

        if(batchCount > 1) {
          loadingInstance.setText(`数据较多(${totalRecords}条)，将拆分为${batchCount}个文件导出...`);
          ElMessage.info(`数据较多(${totalRecords}条)，将拆分为${batchCount}个文件导出`);
        } else {
          loadingInstance.setText(`准备导出 ${totalRecords} 条记录...`);
        }

        let successCount = 0;
        
        for(let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
          const startIndex = batchIndex * BATCH_SIZE;
          const endIndex = Math.min((batchIndex + 1) * BATCH_SIZE, totalRecords);
          const batchData = data.slice(startIndex, endIndex);
          
          const fileName = batchCount > 1 
            ? `${baseFileName}_第${batchIndex + 1}部分(共${batchCount}部分)`
            : baseFileName;
          
          loadingInstance.setText(`正在处理第${batchIndex + 1}/${batchCount}批次，${startIndex + 1}-${endIndex}条记录...`);
        
          const exportData = batchData.map(record => ({
            '公司': record.company_name,
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
          
          const exportHeaders = [
            { text: '公司', field: '公司' },
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
          
          const result = await exportToExcel(exportData, fileName, exportHeaders);
          
          if (result) {
            successCount++;
          }
        }
        
        loadingInstance.close();
        
        if (successCount === batchCount) {
          if (batchCount > 1) {
            ElMessage.success(`成功导出${batchCount}个文件`);
          } else {
            ElMessage.success('导出成功');
          }
        } else if (successCount > 0) {
          ElMessage.warning(`部分导出成功，完成了${successCount}/${batchCount}个文件`);
        } else {
          ElMessage.error('导出失败，请重试');
        }
      } catch (error) {
        console.error('导出记录失败:', error);
        ElMessage.error('导出失败: ' + (error.message || '未知错误'));
      } finally {
        loading.value = false;
        ElLoading.service().close();
      }
    };

    // 刷新记录
    const refreshRecords = () => {
      fetchRecords(true);
    };

    

    // 用户管理
    const goToUserManagement = () => {
      router.push({ name: 'UserManagement' });
    };

    // 操作日志
    const goToOperationLogs = () => {
      router.push({ name: 'OperationLogs' });
    };

    // 公司管理
    const goToCompanyManagement = () => {
      router.push({ name: 'CompanyManagement' });
    };

    // 问题反馈管理
    const goToFeedbackManagement = () => {
      router.push({ name: 'FeedbackManagement' });
    };

    // 编辑记录
    const editRecord = (id) => {
      router.push({ name: 'EditRecord', params: { id } });
    };

    // 确认删除
    const confirmDelete = (record) => {
      ElMessageBox.confirm(
        '此操作将永久删除该记录，是否继续？',
        '警告',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }
      ).then(() => {
        deleteRecord(record.id);
      }).catch(() => {
        ElMessage.info('已取消删除');
      });
    };

    // 删除记录
    const deleteRecord = async (id) => {
      try {
        await httpService.delete(`${apiConfig.endpoints.wasteRecords}/${id}`);
        ElMessage.success('删除成功');
        fetchRecords(true);
      } catch (error) {
        console.error('Error deleting record:', error);
        ElMessage.error('删除失败');
      }
    };

    // 图片预览
    const previewPhoto = (photos, index) => {
      previewImages.value = photos.map(path => `${baseUrl}${path}`);
      previewIndex.value = index;
      showViewer.value = true;
    };

    // 关闭图片预览
    const closeViewer = () => {
      showViewer.value = false;
    };

             // 计算序号
    const indexMethod = (index) => {
      return index + 1;
    };

    // 检查记录是否有位置信息
    const hasLocationInfo = (record) => {
      return record.address || record.district || record.city || record.province;
    };
    
    // 格式化位置信息显示
    const formatLocationDisplay = (record) => {
      const parts = [];
      
      if (record.address) {
        parts.push(record.address);
      }
      if (record.district) {
        parts.push(record.district);
      }
      if (record.city) {
        parts.push(record.city);
      }
      
      return parts.join('，');
    };
 


    // 初始化
    onMounted(() => {
      fetchRecords(true);
      fetchUnits();
      fetchCompanies();
      fetchWasteTypes();
    });

    return {
      records,
      filteredRecords,
      loading,
      units,
      companies,
      filteredUnits,
      wasteTypes,
      showFilterPanel,
      filterForm,
      applyFilter,
      resetFilter,
      exportData,
      exportWithImages,
      exportWithAllImages,
      exportWithoutImages,
             parsePhotoPath,
       refreshRecords,
              goToUserManagement,
       goToOperationLogs,
       goToCompanyManagement,
       goToFeedbackManagement,
      editRecord,
      confirmDelete,
      showViewer,
      previewImages,
      previewIndex,
      previewPhoto,
      closeViewer,
      baseUrl,
                    indexMethod,
       tableHeight,
       tableRef,
             canViewLogs,
      // 分页相关
      page,
      pageSize,
      hasMore,
      loadingMore,
      loadMore,
      // 位置信息相关
      hasLocationInfo,
      formatLocationDisplay
    };
  }
};
</script>

<style scoped>
.super-admin-records-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.header {
  background: linear-gradient(to right, #1976d2, #42a5f5, #1976d2);
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 0 0 20px 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}



.header-actions {
  display: flex;
  gap: 10px;
}

.content {
  flex: 1;
  padding: 0 20px 20px 20px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.filter-card {
  margin-bottom: 20px;
}

.records-card {
  min-height: 800px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-actions {
  display: flex;
  gap: 10px;
}

.filter-form {
  padding: 5px 0;
}

.filter-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  align-items: flex-end;
  height: 100%;
  margin-top: 4px;
}

.photo-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
  align-items: center;
  position: relative;
}

.photo-thumbnail-container {
  cursor: pointer;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #ddd;
}

.photo-count {
  position: absolute;
  bottom: 2px;
  right: 2px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 1px 4px;
  border-radius: 2px;
  font-size: 10px;
}

.operation-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.empty-state {
  text-align: center;
  padding: 40px;
}

/* 加载更多相关样式 */
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

@media (max-width: 768px) {
  .filter-actions {
    justify-content: center;
  }
  
  .card-actions {
    flex-wrap: wrap;
    gap: 5px;
  }
  
  .header {
    padding: 15px;
  }
  
  .header h1 {
    font-size: 18px;
  }
}
</style> 