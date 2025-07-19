<template>
  <div class="feedback-management-container">
    <div class="header">
      <div class="back-button" @click="goBack">
        <el-icon><arrow-left /></el-icon> 返回
      </div>
      <h1>问题反馈管理</h1>
      <div></div>
    </div>

    <div class="content">
      <!-- 统计卡片 -->
      <div class="stats-row">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ stats.total || 0 }}</div>
            <div class="stat-label">总数</div>
          </div>
        </el-card>
        <el-card class="stat-card pending">
          <div class="stat-content">
            <div class="stat-number">{{ stats.pending || 0 }}</div>
            <div class="stat-label">待处理</div>
          </div>
        </el-card>
        <el-card class="stat-card processing">
          <div class="stat-content">
            <div class="stat-number">{{ stats.processing || 0 }}</div>
            <div class="stat-label">处理中</div>
          </div>
        </el-card>
        <el-card class="stat-card resolved">
          <div class="stat-content">
            <div class="stat-number">{{ stats.resolved || 0 }}</div>
            <div class="stat-label">已解决</div>
          </div>
        </el-card>
      </div>

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
                <el-col :span="6" v-if="isSystemAdmin">
                  <el-form-item label="公司">
                    <el-select v-model="filterForm.company_id" placeholder="请选择公司" clearable>
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
                  <el-form-item label="状态">
                    <el-select v-model="filterForm.status" placeholder="请选择状态" clearable>
                      <el-option label="全部状态" :value="null" />
                      <el-option label="待处理" value="pending" />
                      <el-option label="处理中" value="processing" />
                      <el-option label="已解决" value="resolved" />
                      <el-option label="已关闭" value="closed" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="类型">
                    <el-select v-model="filterForm.type" placeholder="请选择类型" clearable>
                      <el-option label="全部类型" :value="null" />
                      <el-option label="系统Bug" value="bug" />
                      <el-option label="功能建议" value="feature" />
                      <el-option label="体验改进" value="improvement" />
                      <el-option label="其他问题" value="other" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item>
                    <el-button type="primary" @click="applyFilter">筛选</el-button>
                    <el-button @click="resetFilter">重置</el-button>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </div>
        </el-collapse-transition>
      </el-card>

      <!-- 反馈列表 -->
      <el-card class="feedback-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>问题反馈列表 (共{{ filteredFeedbacks.length }}条)</span>
            <el-button @click="fetchFeedbacks">
              <el-icon><refresh /></el-icon> 刷新
            </el-button>
          </div>
        </template>

        <div v-if="loading" style="text-align: center; padding: 50px;">
          <el-icon class="is-loading"><loading /></el-icon>
          <p>加载中...</p>
        </div>

        <el-table
          v-else
          :data="filteredFeedbacks"
          stripe
          style="width: 100%"
          @row-click="viewFeedback"
        >
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="title" label="问题标题" min-width="200" show-overflow-tooltip />
          <el-table-column prop="company_name" label="公司" width="120" v-if="isSystemAdmin" />
          <el-table-column prop="username" label="提交人" width="120" />
          <el-table-column label="类型" width="100">
            <template #default="scope">
              <el-tag :type="getTypeColor(scope.row.type)">{{ getTypeText(scope.row.type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="优先级" width="100">
            <template #default="scope">
              <el-tag :type="getPriorityColor(scope.row.priority)">{{ getPriorityText(scope.row.priority) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="scope">
              <el-tag :type="getStatusColor(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="提交时间" width="160">
            <template #default="scope">
              {{ formatDateTime(scope.row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="scope">
              <el-button size="small" @click.stop="viewFeedback(scope.row)">查看</el-button>
              <el-button 
                size="small" 
                type="primary" 
                @click.stop="handleFeedback(scope.row)"
                v-if="scope.row.status !== 'closed'"
              >处理</el-button>
              <el-button 
                size="small" 
                type="danger" 
                @click.stop="deleteFeedback(scope.row)"
              >删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 反馈详情对话框 -->
    <el-dialog
      v-model="showDetail"
      title="反馈详情"
      width="70%"
      :close-on-click-modal="false"
    >
      <div v-if="selectedFeedback" class="feedback-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="问题标题">{{ selectedFeedback.title }}</el-descriptions-item>
          <el-descriptions-item label="提交人">{{ selectedFeedback.username }} ({{ selectedFeedback.phone }})</el-descriptions-item>
          <el-descriptions-item label="公司" v-if="isSystemAdmin">{{ selectedFeedback.company_name }}</el-descriptions-item>
          <el-descriptions-item label="问题类型">
            <el-tag :type="getTypeColor(selectedFeedback.type)">{{ getTypeText(selectedFeedback.type) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="优先级">
            <el-tag :type="getPriorityColor(selectedFeedback.priority)">{{ getPriorityText(selectedFeedback.priority) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusColor(selectedFeedback.status)">{{ getStatusText(selectedFeedback.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ formatDateTime(selectedFeedback.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatDateTime(selectedFeedback.updated_at) }}</el-descriptions-item>
        </el-descriptions>

        <div class="description-section">
          <h4>问题描述</h4>
          <div class="description-content">{{ selectedFeedback.description }}</div>
        </div>

        

        <div v-if="selectedFeedback.admin_reply" class="reply-section">
          <h4>管理员回复</h4>
          <div class="reply-content">{{ selectedFeedback.admin_reply }}</div>
          <div class="reply-meta">
            回复人：{{ selectedFeedback.admin_username || '系统管理员' }}
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 处理反馈对话框 -->
    <el-dialog
      v-model="showHandle"
      title="处理反馈"
      width="50%"
      :close-on-click-modal="false"
    >
      <el-form :model="handleForm" label-width="80px">
        <el-form-item label="状态">
          <el-select v-model="handleForm.status" placeholder="请选择状态" style="width: 100%">
            <el-option label="处理中" value="processing" />
            <el-option label="已解决" value="resolved" />
            <el-option label="已关闭" value="closed" />
          </el-select>
        </el-form-item>
        <el-form-item label="回复内容">
          <el-input
            v-model="handleForm.admin_reply"
            type="textarea"
            :rows="4"
            placeholder="请输入处理结果或回复内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showHandle = false">取消</el-button>
          <el-button type="primary" @click="submitHandle" :loading="handleLoading">提交</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowLeft, ArrowUp, ArrowDown, Refresh, Loading } from '@element-plus/icons-vue';
import httpService from '../config/httpService';
import apiConfig from '../config/api';
import auth from '../store/auth';

export default {
  name: 'FeedbackManagement',
  components: {
    ArrowLeft,
    ArrowUp,
    ArrowDown,
    Refresh,
    Loading
  },
  setup() {
    const router = useRouter();
    const loading = ref(false);
    const handleLoading = ref(false);
    const feedbacks = ref([]);
    const companies = ref([]);
    const stats = ref({});
    const showFilterPanel = ref(true);
    const showDetail = ref(false);
    const showHandle = ref(false);
    const selectedFeedback = ref(null);

    // 筛选表单
    const filterForm = reactive({
      company_id: null,
      status: null,
      type: null
    });

    // 处理表单
    const handleForm = reactive({
      status: '',
      admin_reply: ''
    });

    // 检查是否是系统超级管理员
    const isSystemAdmin = computed(() => {
      return auth.state.user?.role_id === 5;
    });

    // 过滤后的反馈列表
    const filteredFeedbacks = computed(() => {
      return feedbacks.value.filter(feedback => {
        if (filterForm.company_id && feedback.company_id !== filterForm.company_id) {
          return false;
        }
        if (filterForm.status && feedback.status !== filterForm.status) {
          return false;
        }
        if (filterForm.type && feedback.type !== filterForm.type) {
          return false;
        }
        return true;
      });
    });

    // 获取公司列表
    const fetchCompanies = async () => {
      if (!isSystemAdmin.value) return;
      
      try {
        const response = await httpService.get(apiConfig.endpoints.companies);
        if (response.data.success) {
          companies.value = response.data.data;
        }
      } catch (error) {
        console.error('获取公司列表失败:', error);
      }
    };

    // 获取反馈列表
    const fetchFeedbacks = async () => {
      loading.value = true;
      try {
        const params = {};
        if (filterForm.company_id) params.company_id = filterForm.company_id;
        if (filterForm.status) params.status = filterForm.status;
        if (filterForm.type) params.type = filterForm.type;

        const response = await httpService.get(apiConfig.endpoints.adminFeedbacks, params);
        if (response.data.success) {
          feedbacks.value = response.data.data;
        } else {
          ElMessage.error('获取反馈列表失败');
        }
      } catch (error) {
        console.error('获取反馈列表失败:', error);
        ElMessage.error('获取反馈列表失败');
      } finally {
        loading.value = false;
      }
    };

    // 获取统计数据
    const fetchStats = async () => {
      try {
        const params = {};
        if (filterForm.company_id) params.company_id = filterForm.company_id;

        const response = await httpService.get(apiConfig.endpoints.feedbackStats, params);
        if (response.data.success) {
          stats.value = response.data.data;
        }
      } catch (error) {
        console.error('获取统计数据失败:', error);
      }
    };

    // 应用筛选
    const applyFilter = async () => {
      await Promise.all([fetchFeedbacks(), fetchStats()]);
      ElMessage.success('筛选已应用');
    };

    // 重置筛选
    const resetFilter = async () => {
      filterForm.company_id = null;
      filterForm.status = null;
      filterForm.type = null;
      await Promise.all([fetchFeedbacks(), fetchStats()]);
      ElMessage.info('筛选条件已重置');
    };

    // 查看反馈详情
    const viewFeedback = async (feedback) => {
      try {
        const response = await httpService.get(
          apiConfig.endpoints.feedbackById.replace(':id', feedback.id)
        );
        if (response.data.success) {
          selectedFeedback.value = response.data.data;
          showDetail.value = true;
        } else {
          ElMessage.error('获取反馈详情失败');
        }
      } catch (error) {
        console.error('获取反馈详情失败:', error);
        ElMessage.error('获取反馈详情失败');
      }
    };

    // 处理反馈
    const handleFeedback = (feedback) => {
      selectedFeedback.value = feedback;
      handleForm.status = feedback.status === 'pending' ? 'processing' : feedback.status;
      handleForm.admin_reply = feedback.admin_reply || '';
      showHandle.value = true;
    };

    // 提交处理结果
    const submitHandle = async () => {
      if (!handleForm.status) {
        ElMessage.error('请选择状态');
        return;
      }

      handleLoading.value = true;
      try {
        const response = await httpService.put(
          apiConfig.endpoints.feedbackStatus.replace(':id', selectedFeedback.value.id),
          {
            status: handleForm.status,
            admin_reply: handleForm.admin_reply
          }
        );

        if (response.data.success) {
          ElMessage.success('处理成功');
          showHandle.value = false;
          await Promise.all([fetchFeedbacks(), fetchStats()]);
        } else {
          ElMessage.error(response.data.message || '处理失败');
        }
      } catch (error) {
        console.error('处理反馈失败:', error);
        ElMessage.error('处理失败');
      } finally {
        handleLoading.value = false;
      }
    };

    // 删除反馈
    const deleteFeedback = async (feedback) => {
      try {
        await ElMessageBox.confirm(
          `确定要删除反馈"${feedback.title}"吗？`,
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );

        const response = await httpService.delete(
          apiConfig.endpoints.feedbackById.replace(':id', feedback.id)
        );

        if (response.data.success) {
          ElMessage.success('删除成功');
          await Promise.all([fetchFeedbacks(), fetchStats()]);
        } else {
          ElMessage.error(response.data.message || '删除失败');
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除反馈失败:', error);
          ElMessage.error('删除失败');
        }
      }
    };

    // 返回上一页
    const goBack = () => {
      router.back();
    };

    // 格式化时间
    const formatDateTime = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN');
    };

    // 获取类型颜色
    const getTypeColor = (type) => {
      const colors = {
        bug: 'danger',
        feature: 'primary',
        improvement: 'warning',
        other: 'info'
      };
      return colors[type] || 'info';
    };

    // 获取类型文本
    const getTypeText = (type) => {
      const texts = {
        bug: 'Bug',
        feature: '功能建议',
        improvement: '体验改进',
        other: '其他'
      };
      return texts[type] || type;
    };

    // 获取优先级颜色
    const getPriorityColor = (priority) => {
      const colors = {
        low: 'info',
        medium: 'warning',
        high: 'danger',
        urgent: 'danger'
      };
      return colors[priority] || 'info';
    };

    // 获取优先级文本
    const getPriorityText = (priority) => {
      const texts = {
        low: '低',
        medium: '中',
        high: '高',
        urgent: '紧急'
      };
      return texts[priority] || priority;
    };

    // 获取状态颜色
    const getStatusColor = (status) => {
      const colors = {
        pending: 'warning',
        processing: 'primary',
        resolved: 'success',
        closed: 'info'
      };
      return colors[status] || 'info';
    };

    // 获取状态文本
    const getStatusText = (status) => {
      const texts = {
        pending: '待处理',
        processing: '处理中',
        resolved: '已解决',
        closed: '已关闭'
      };
      return texts[status] || status;
    };



    onMounted(async () => {
      await fetchCompanies();
      await Promise.all([fetchFeedbacks(), fetchStats()]);
    });

    return {
      loading,
      handleLoading,
      feedbacks,
      companies,
      stats,
      showFilterPanel,
      showDetail,
      showHandle,
      selectedFeedback,
      filterForm,
      handleForm,
      isSystemAdmin,
      filteredFeedbacks,
      fetchFeedbacks,
      fetchStats,
      applyFilter,
      resetFilter,
      viewFeedback,
      handleFeedback,
      submitHandle,
      deleteFeedback,
      goBack,
      formatDateTime,
      getTypeColor,
      getTypeText,
      getPriorityColor,
      getPriorityText,
      getStatusColor,
      getStatusText
    };
  }
};
</script>

<style scoped>
.feedback-management-container {
  background-color: #f5f5f5;
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

.back-button {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  background-color: rgba(255, 255, 255, 0.25);
  padding: 8px 14px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.back-button:hover {
  background-color: rgba(255, 255, 255, 0.35);
}

.content {
  padding: 0 20px 20px 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.stat-card.pending {
  border-left: 4px solid #e6a23c;
}

.stat-card.processing {
  border-left: 4px solid #409eff;
}

.stat-card.resolved {
  border-left: 4px solid #67c23a;
}

.stat-content {
  text-align: center;
  padding: 20px;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.filter-card,
.feedback-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.filter-form {
  padding: 5px 0;
}

.feedback-detail {
  padding: 16px 0;
}

.description-section,
.images-section,
.reply-section {
  margin-top: 24px;
}

.description-section h4,
.images-section h4,
.reply-section h4 {
  margin: 0 0 12px 0;
  color: #303133;
}

.description-content,
.reply-content {
  background-color: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
  line-height: 1.6;
  color: #606266;
}



.reply-meta {
  margin-top: 8px;
  color: #909399;
  font-size: 14px;
  text-align: right;
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .content {
    padding: 0 10px 20px 10px;
  }
  
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  
  .stat-content {
    padding: 15px;
  }
  
  .stat-number {
    font-size: 24px;
  }
  
  :deep(.el-dialog) {
    width: 95% !important;
    margin: 5vh auto;
  }
  
  :deep(.el-table) {
    font-size: 14px;
  }
}
</style> 