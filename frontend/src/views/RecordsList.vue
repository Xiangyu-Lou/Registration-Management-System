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
          <el-button @click="refreshRecords">
            <el-icon><refresh /></el-icon> 刷新
          </el-button>
        </div>
      </div>
          
          <el-table 
            :data="records" 
            style="width: 100%" 
            border 
            v-loading="loading"
            stripe
          >
            <el-table-column prop="waste_type_name" label="废物类型" width="110" />
            <el-table-column prop="location" label="产生地点" />
            <el-table-column prop="collection_start_time" label="收集开始时间" width="160" />
            <el-table-column prop="quantity" label="数量(kg)" width="100" />
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
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import axios from 'axios';
import { ArrowLeft, Home, Refresh, PictureFailed, Plus, User } from '@element-plus/icons-vue';
import auth from '../store/auth';

export default {
  name: 'RecordsList',
  components: {
    ArrowLeft,
    Home,
    Refresh,
    PictureFailed,
    Plus,
    User
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
    
    // 检查用户是否为超级管理员
    const isAdmin = computed(() => {
      return auth.state.isLoggedIn && auth.state.user.role_id === 3;
    });
    
    // 检查用户是否为单位管理员
    const isUnitAdmin = computed(() => {
      return auth.state.isLoggedIn && auth.state.user.role_id === 2;
    });

    onMounted(async () => {
      await fetchUnitName();
      await fetchRecords();
    });

    const fetchUnitName = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/units`);
        const unit = response.data.find(u => u.id === parseInt(props.unitId));
        if (unit) {
          unitName.value = unit.name;
        }
      } catch (error) {
        console.error('Error fetching unit name:', error);
        ElMessage.error('获取单位信息失败');
      }
    };

    const fetchRecords = async () => {
      loading.value = true;
      try {
        // 使用用户ID获取相应权限的记录
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
      unitName,
      isAdmin,
      isUnitAdmin,
      refreshRecords,
      goBack,
      goHome,
      goToUserManagement,
      addNewRecord,
      editRecord,
      canEdit,
      confirmDelete
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
