<template>
  <div class="feedback-list-container">
    <div class="header">
      <div class="back-button" @click="goBack">
        <el-icon><arrow-left /></el-icon> 返回
      </div>
      <h1>我的反馈</h1>
      <div class="header-actions">
        <el-button type="primary" @click="goToNewFeedback">
          <el-icon><plus /></el-icon> 新建反馈
        </el-button>
      </div>
    </div>

    <div class="content">
      <el-card class="feedback-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>问题反馈记录 (共{{ feedbacks.length }}条)</span>
            <el-button @click="fetchFeedbacks">
              <el-icon><refresh /></el-icon> 刷新
            </el-button>
          </div>
        </template>

        <div v-if="loading" style="text-align: center; padding: 50px;">
          <el-icon class="is-loading"><loading /></el-icon>
          <p>加载中...</p>
        </div>

        <div v-else-if="feedbacks.length === 0" style="text-align: center; padding: 50px;">
          <el-empty description="暂无反馈记录">
            <el-button type="primary" @click="goToNewFeedback">提交反馈</el-button>
          </el-empty>
        </div>

        <div v-else class="feedback-list">
          <div
            v-for="feedback in feedbacks"
            :key="feedback.id"
            class="feedback-item"
            @click="viewFeedback(feedback)"
          >
            <div class="feedback-header">
              <div class="feedback-title">{{ feedback.title }}</div>
              <div class="feedback-meta">
                <el-tag :type="getTypeColor(feedback.type)">{{ getTypeText(feedback.type) }}</el-tag>
                <el-tag :type="getPriorityColor(feedback.priority)">{{ getPriorityText(feedback.priority) }}</el-tag>
                <el-tag :type="getStatusColor(feedback.status)">{{ getStatusText(feedback.status) }}</el-tag>
              </div>
            </div>
            
            <div class="feedback-description">
              {{ feedback.description.length > 100 ? feedback.description.substring(0, 100) + '...' : feedback.description }}
            </div>
            
            <div class="feedback-footer">
              <span class="feedback-time">{{ formatDateTime(feedback.created_at) }}</span>
              <div class="feedback-actions">
                <el-button size="small" @click.stop="viewFeedback(feedback)">查看详情</el-button>
                <el-button 
                  v-if="feedback.status === 'pending'" 
                  size="small" 
                  type="danger" 
                  @click.stop="deleteFeedback(feedback)"
                >删除</el-button>
              </div>
            </div>
          </div>
        </div>
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
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowLeft, Plus, Refresh, Loading } from '@element-plus/icons-vue';
import httpService from '../config/httpService';
import apiConfig from '../config/api';

export default {
  name: 'FeedbackList',
  components: {
    ArrowLeft,
    Plus,
    Refresh,
    Loading
  },
  setup() {
    const router = useRouter();
    const loading = ref(false);
    const feedbacks = ref([]);
    const showDetail = ref(false);
    const selectedFeedback = ref(null);

    // 获取反馈列表
    const fetchFeedbacks = async () => {
      loading.value = true;
      try {
        const response = await httpService.get(apiConfig.endpoints.userFeedbacks);
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
          fetchFeedbacks(); // 重新获取列表
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

    // 跳转到新建反馈页面
    const goToNewFeedback = () => {
      router.push({ name: 'FeedbackForm' });
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



    onMounted(() => {
      fetchFeedbacks();
    });

    return {
      loading,
      feedbacks,
      showDetail,
      selectedFeedback,
      fetchFeedbacks,
      viewFeedback,
      deleteFeedback,
      goToNewFeedback,
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
.feedback-list-container {
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

.header-actions {
  display: flex;
  gap: 10px;
}

.content {
  padding: 0 20px 20px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.feedback-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.feedback-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feedback-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
}

.feedback-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.feedback-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.feedback-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  flex: 1;
  margin-right: 16px;
}

.feedback-meta {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.feedback-description {
  color: #606266;
  line-height: 1.5;
  margin-bottom: 12px;
}

.feedback-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.feedback-time {
  color: #909399;
  font-size: 14px;
}

.feedback-actions {
  display: flex;
  gap: 8px;
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
  
  .feedback-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
  
  .feedback-meta {
    flex-wrap: wrap;
  }
  
  .feedback-footer {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
  
  .feedback-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  :deep(.el-dialog) {
    width: 95% !important;
    margin: 5vh auto;
  }
}
</style> 