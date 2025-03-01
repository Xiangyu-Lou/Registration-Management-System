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
        <el-button @click="refreshRecords">
          <el-icon><refresh /></el-icon> 刷新
        </el-button>
      </div>
      
      <div class="records-wrapper">
        <el-card class="records-card">
          <div class="card-header">
            <h3>所有废物记录</h3>
          </div>
          
          <el-table 
            :data="records" 
            style="width: 100%" 
            border 
            v-loading="loading"
            stripe
          >
            <el-table-column prop="unit_name" label="单位" width="100" />
            <el-table-column prop="waste_type_name" label="废物类型" width="100" />
            <el-table-column prop="location" label="产生地点" />
            <el-table-column prop="collection_start_time" label="收集开始时间" width="160" />
            <el-table-column prop="quantity" label="数量(kg)" width="80" />
            <el-table-column prop="created_at" label="记录时间" width="160" />
            <el-table-column label="现场照片" width="100">
              <template #default="scope">
                <el-image 
                  v-if="scope.row.photo_path"
                  :src="`http://localhost:3000${scope.row.photo_path}`"
                  :preview-src-list="[`http://localhost:3000${scope.row.photo_path}`]"
                  fit="cover"
                  class="record-image"
                >
                  <template #error>
                    <div class="image-error">
                      <el-icon><picture-failed /></el-icon>
                    </div>
                  </template>
                </el-image>
                <span v-else>无照片</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180">
              <template #default="scope">
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
              </template>
            </el-table-column>
          </el-table>
          
          <div class="empty-block" v-if="records.length === 0 && !loading">
            <el-empty description="暂无废物记录" />
          </div>
        </el-card>
      </div>
    </div>

    <div class="footer">
      <p>&copy; 2025 危险废物管理系统</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import axios from 'axios';
import { Plus, Refresh, PictureFailed } from '@element-plus/icons-vue';
import auth from '../store/auth';

export default {
  name: 'AdminRecordsView',
  components: {
    Plus,
    Refresh,
    PictureFailed
  },
  setup() {
    const router = useRouter();
    const records = ref([]);
    const loading = ref(false);

    onMounted(async () => {
      // 验证用户是否为超级管理员
      if (!auth.state.isLoggedIn || auth.state.user.role_id !== 3) {
        ElMessage.error('权限不足');
        router.push('/login');
        return;
      }
      
      await fetchRecords();
    });

    const fetchRecords = async () => {
      loading.value = true;
      try {
        // 使用超级管理员ID获取所有记录
        const response = await axios.get(`http://localhost:3000/api/waste-records/user/${auth.state.user.id}`);
        records.value = response.data;
        
        // 格式化日期
        records.value.forEach(record => {
          record.created_at = formatDateTime(record.created_at);
          record.collection_start_time = formatDateTime(record.collection_start_time);
        });
      } catch (error) {
        console.error('获取废物记录失败:', error);
        ElMessage.error('获取废物记录失败');
      } finally {
        loading.value = false;
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
        second: '2-digit',
        hour12: false
      });
    };

    const refreshRecords = () => {
      fetchRecords();
    };

    const addNewRecord = () => {
      router.push('/record/new');
    };

    const editRecord = (recordId) => {
      router.push(`/record/${recordId}`);
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
            await axios.delete(`http://localhost:3000/api/waste-records/${record.id}`);
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
      loading,
      refreshRecords,
      addNewRecord,
      editRecord,
      confirmDelete
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

.records-wrapper {
  margin-top: 20px;
}

.records-card {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
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
</style>
