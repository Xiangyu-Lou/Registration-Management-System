<template>
  <div class="operation-logs-container">
    <div class="header">
      <div class="back-button" @click="goBack">
        <el-icon><arrow-left /></el-icon> 返回
      </div>
      <h1>操作日志管理</h1>
      <div></div>
    </div>

    <div class="content">
      <!-- 筛选区域 -->
      <div class="filter-section">
        <el-card>
          <template #header>
            <div class="filter-header">
              <span>筛选条件 <small style="color: #909399;">(实时筛选，输入后自动搜索)</small></span>
              <el-button type="primary" link @click="resetFilters">
                <el-icon><refresh /></el-icon> 重置筛选
              </el-button>
            </div>
          </template>
          
          <el-form :model="filters" inline>
            <el-form-item label="操作类型">
              <el-select v-model="filters.operationType" placeholder="选择操作类型" clearable style="width: 140px;">
                <el-option label="登录" value="login" />
                <el-option label="创建" value="create" />
                <el-option label="更新" value="update" />
                <el-option label="删除" value="delete" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="操作人员">
              <el-input 
                v-model="filters.userKeyword" 
                placeholder="输入用户名或手机号搜索" 
                clearable
                style="width: 200px;"
              >
                <template #prefix>
                  <el-icon><search /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            
            <el-form-item label="时间范围">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                @change="handleDateChange"
                style="width: 280px;"
              />
            </el-form-item>
            
            <el-form-item label="描述关键词">
              <el-input 
                v-model="filters.description" 
                placeholder="输入关键词搜索" 
                style="width: 200px;"
                clearable
              />
            </el-form-item>
          </el-form>
        </el-card>
      </div>

      <!-- 统计信息 -->
      <div class="stats-section">
        <el-row :gutter="16">
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ totalStats.login || 0 }}</div>
                <div class="stat-label">登录操作</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ totalStats.create || 0 }}</div>
                <div class="stat-label">创建操作</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ totalStats.update || 0 }}</div>
                <div class="stat-label">更新操作</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ totalStats.delete || 0 }}</div>
                <div class="stat-label">删除操作</div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 日志表格 -->
      <div class="table-section">
        <el-card>
          <template #header>
            <div class="table-header">
              <span>操作日志列表</span>
              <span class="total-count">共 {{ pagination.total }} 条记录</span>
            </div>
          </template>
          
          <el-table 
            :data="logs" 
            v-loading="loading"
            style="width: 100%"
            size="small"
          >
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="created_at" label="操作时间" width="160">
              <template #default="scope">
                {{ formatDateTime(scope.row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column prop="operation_type" label="操作类型" width="80">
              <template #default="scope">
                <el-tag :type="getOperationTypeColor(scope.row.operation_type)" size="small">
                  {{ getOperationTypeName(scope.row.operation_type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="target_type" label="目标类型" width="100">
              <template #default="scope">
                <el-tag type="info" size="small">
                  {{ getTargetTypeName(scope.row.target_type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作人员" width="120">
              <template #default="scope">
                <div>
                  <div>{{ scope.row.username || '未知' }}</div>
                  <div class="phone-text">{{ scope.row.phone || '-' }}</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="role_name" label="角色" width="80" />
            <el-table-column prop="description" label="操作描述" min-width="300">
              <template #default="scope">
                <el-tooltip :content="scope.row.description" placement="top">
                  <div class="description-text">{{ scope.row.description }}</div>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column prop="ip_address" label="IP地址" width="120" />
            <el-table-column label="操作" width="80">
              <template #default="scope">
                <el-button type="primary" link size="small" @click="showDetail(scope.row)">
                  详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <!-- 分页 -->
          <div class="pagination-section">
            <el-pagination
              v-model:current-page="pagination.page"
              v-model:page-size="pagination.pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="pagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-card>
      </div>
    </div>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      title="操作日志详情"
      width="60%"
      :close-on-click-modal="false"
    >
      <div v-if="selectedLog" class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="日志ID">{{ selectedLog.id }}</el-descriptions-item>
          <el-descriptions-item label="操作时间">{{ formatDateTime(selectedLog.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="操作类型">
            <el-tag :type="getOperationTypeColor(selectedLog.operation_type)">
              {{ getOperationTypeName(selectedLog.operation_type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="目标类型">
            <el-tag type="info">{{ getTargetTypeName(selectedLog.target_type) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="目标ID">{{ selectedLog.target_id || '-' }}</el-descriptions-item>
          <el-descriptions-item label="操作人员">{{ selectedLog.username || '未知' }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ selectedLog.phone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="角色">{{ selectedLog.role_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="IP地址">{{ selectedLog.ip_address || '-' }}</el-descriptions-item>
          <el-descriptions-item label="用户代理" span="2">
            <div class="user-agent-text">{{ selectedLog.user_agent || '-' }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="操作描述" span="2">
            <div class="description-detail">{{ selectedLog.description }}</div>
          </el-descriptions-item>
        </el-descriptions>
        
        <!-- 附加数据 -->
        <div v-if="selectedLog.additional_data" class="additional-data">
          <h4>附加数据</h4>
          <el-input
            type="textarea"
            :rows="10"
            :value="formatAdditionalData(selectedLog.additional_data)"
            readonly
          />
        </div>
      </div>
      
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <div class="footer">
      <p>&copy; 2025 固体废物管理系统</p>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import httpService from '../config/httpService';
import apiConfig from '../config/api';
import { ArrowLeft, Search, Refresh } from '@element-plus/icons-vue';
import auth from '../store/auth';

export default {
  name: 'OperationLogsView',
  components: {
    ArrowLeft,
    Search,
    Refresh
  },
  setup() {
    const router = useRouter();
    const loading = ref(false);
    const logs = ref([]);
    const totalStats = ref({});
    const detailVisible = ref(false);
    const selectedLog = ref(null);
    const dateRange = ref([]);
    
    // 筛选条件
    const filters = reactive({
      operationType: '',
      userKeyword: '',
      startDate: '',
      endDate: '',
      description: ''
    });
    
    // 分页信息
    const pagination = reactive({
      page: 1,
      pageSize: 20,
      total: 0
    });

    // 检查权限
    const hasPermission = computed(() => {
      return auth.state.isLoggedIn && auth.state.user && auth.state.user.can_view_logs === 1;
    });

    // 防抖延迟（毫秒）
    let debounceTimer = null;
    
    // 实时筛选功能 - 监听筛选条件变化
    watch([
      () => filters.operationType,
      () => filters.userKeyword,
      () => filters.startDate,
      () => filters.endDate,
      () => filters.description
    ], () => {
      // 清除之前的定时器
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      
      // 设置防抖，避免频繁请求
      debounceTimer = setTimeout(() => {
        pagination.page = 1;
        fetchLogs();
        fetchStats();
      }, 500); // 500毫秒延迟
    });

    onMounted(async () => {
      if (!hasPermission.value) {
        ElMessage.error('您没有权限查看操作日志');
        router.push('/');
        return;
      }
      
      await Promise.all([
        fetchLogs(),
        fetchStats()
      ]);
    });

    // 组件销毁时清理定时器
    onUnmounted(() => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
    });

    // 获取日志列表
    const fetchLogs = async () => {
      try {
        loading.value = true;
        const params = {
          page: pagination.page,
          pageSize: pagination.pageSize
        };
        
        // 只添加有值的筛选条件
        if (filters.operationType && filters.operationType.trim() !== '') {
          params.operationType = filters.operationType;
        }
        if (filters.userKeyword && filters.userKeyword.trim() !== '') {
          params.userKeyword = filters.userKeyword;
        }
        if (filters.startDate && filters.startDate.trim() !== '') {
          params.startDate = filters.startDate;
        }
        if (filters.endDate && filters.endDate.trim() !== '') {
          params.endDate = filters.endDate;
        }
        if (filters.description && filters.description.trim() !== '') {
          params.description = filters.description;
        }
        
        const response = await httpService.get(apiConfig.endpoints.operationLogs, params);
        logs.value = response.data.logs || [];
        pagination.total = response.data.pagination.total || 0;
      } catch (error) {
        console.error('获取操作日志失败:', error);
        ElMessage.error('获取操作日志失败');
      } finally {
        loading.value = false;
      }
    };

    // 获取统计信息
    const fetchStats = async () => {
      try {
        const queryParams = {};
        
        // 只有当参数有值时才添加到查询参数中
        if (filters.startDate && filters.startDate.trim() !== '') {
          queryParams.startDate = filters.startDate;
        }
        if (filters.endDate && filters.endDate.trim() !== '') {
          queryParams.endDate = filters.endDate;
        }
        
        const response = await httpService.get(`${apiConfig.endpoints.operationLogs}/stats`, queryParams);
        const stats = response.data.totalStats || [];
        
        // 转换统计数据格式
        const statsMap = {};
        stats.forEach(stat => {
          statsMap[stat.operation_type] = stat.total_count;
        });
        totalStats.value = statsMap;
      } catch (error) {
        console.error('获取统计信息失败:', error);
        // 如果获取统计信息失败，设置默认值避免页面报错
        totalStats.value = {
          login: 0,
          create: 0,
          update: 0,
          delete: 0
        };
      }
    };

    // 重置筛选条件
    const resetFilters = () => {
      Object.keys(filters).forEach(key => {
        filters[key] = '';
      });
      dateRange.value = [];
      pagination.page = 1;
    };

    // 处理日期范围变化
    const handleDateChange = (dates) => {
      if (dates && dates.length === 2) {
        filters.startDate = dates[0];
        filters.endDate = dates[1];
      } else {
        filters.startDate = '';
        filters.endDate = '';
      }
    };

    // 分页变化
    const handleSizeChange = (newSize) => {
      pagination.pageSize = newSize;
      pagination.page = 1;
      fetchLogs();
    };

    const handleCurrentChange = (newPage) => {
      pagination.page = newPage;
      fetchLogs();
    };

    // 显示详情
    const showDetail = (log) => {
      selectedLog.value = log;
      detailVisible.value = true;
    };

    // 格式化时间
    const formatDateTime = (dateTime) => {
      if (!dateTime) return '-';
      return new Date(dateTime).toLocaleString('zh-CN');
    };

    // 获取操作类型名称
    const getOperationTypeName = (type) => {
      const typeMap = {
        login: '登录',
        create: '创建',
        update: '更新',
        delete: '删除'
      };
      return typeMap[type] || type;
    };

    // 获取操作类型颜色
    const getOperationTypeColor = (type) => {
      const colorMap = {
        login: '',
        create: 'success',
        update: 'warning',
        delete: 'danger'
      };
      return colorMap[type] || '';
    };

    // 获取目标类型名称
    const getTargetTypeName = (type) => {
      const typeMap = {
        waste_record: '废物记录',
        user: '用户管理',
        unit: '单位管理',
        waste_type: '废物类型'
      };
      return typeMap[type] || type || '-';
    };

    // 格式化附加数据
    const formatAdditionalData = (data) => {
      if (!data) return '';
      try {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        return JSON.stringify(parsed, null, 2);
      } catch (error) {
        return data.toString();
      }
    };

    // 返回上一页
    const goBack = () => {
      router.go(-1);
    };

    return {
      loading,
      logs,
      totalStats,
      filters,
      pagination,
      dateRange,
      detailVisible,
      selectedLog,
      hasPermission,
      fetchLogs,
      resetFilters,
      handleDateChange,
      handleSizeChange,
      handleCurrentChange,
      showDetail,
      formatDateTime,
      getOperationTypeName,
      getOperationTypeColor,
      getTargetTypeName,
      formatAdditionalData,
      goBack
    };
  }
};
</script>

<style scoped>
.operation-logs-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.header {
  background: linear-gradient(135deg, #409EFF 0%, #337ECC 100%);
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.back-button {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  background-color: rgba(255, 255, 255, 0.2);
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.back-button:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.content {
  flex: 1;
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.filter-section {
  margin-bottom: 20px;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-section {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-content {
  padding: 10px;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.table-section {
  margin-bottom: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-count {
  color: #666;
  font-size: 14px;
}

.phone-text {
  color: #999;
  font-size: 12px;
}

.description-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 300px;
}

.pagination-section {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.detail-content {
  max-height: 60vh;
  overflow-y: auto;
}

.user-agent-text {
  word-break: break-all;
  max-height: 60px;
  overflow-y: auto;
}

.description-detail {
  word-wrap: break-word;
  white-space: pre-wrap;
}

.additional-data {
  margin-top: 20px;
}

.additional-data h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.footer {
  background-color: #f5f5f5;
  padding: 15px;
  text-align: center;
  color: #666;
  border-top: 1px solid #e0e0e0;
}
</style> 