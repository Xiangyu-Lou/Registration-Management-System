<template>
  <div class="company-management-container">
    <div class="header">
      <div class="back-button" @click="goBack">
        <el-icon><arrow-left /></el-icon> 返回
      </div>
      <h1>公司管理</h1>
      <div></div>
    </div>

    <div class="content">
      <div class="toolbar">
        <div class="search-container">
          <el-input
            v-model="searchKeyword"
            placeholder="请输入公司名称搜索"
            clearable
            @clear="clearSearch"
            class="search-input"
          >
            <template #prefix>
              <el-icon><search /></el-icon>
            </template>
          </el-input>
        </div>
        <el-button type="primary" @click="openAddDialog">
          <el-icon><plus /></el-icon> 添加公司
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="companies"
        border
        stripe
        style="width: 100%; margin-top: 20px;"
      >
        <el-table-column 
          type="index" 
          label="序号" 
          width="70" 
          align="center"
        />
        <el-table-column prop="name" label="公司名称" min-width="200" />
        <el-table-column prop="code" label="公司代码" width="150">
          <template #default="scope">
            {{ scope.row.code || '未设置' }}
          </template>
        </el-table-column>
        
        <el-table-column label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
              {{ scope.row.status === 1 ? '正常' : '已停用' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="统计信息" width="200" align="center">
          <template #default="scope">
            <div class="stats-info">
              <div>单位: {{ scope.row.stats?.units || 0 }}</div>
              <div>用户: {{ scope.row.stats?.users || 0 }}</div>
              <div>记录: {{ scope.row.stats?.records || 0 }}</div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="scope">
            <el-button 
              size="small" 
              @click="handleEdit(scope.row)"
            >
              编辑
            </el-button>
            
            <el-button 
              size="small" 
              :type="scope.row.status === 1 ? 'warning' : 'success'"
              @click="handleStatusChange(scope.row)"
            >
              {{ scope.row.status === 1 ? '停用' : '恢复' }}
            </el-button>
            
            <el-button 
              size="small" 
              type="info"
              @click="viewStats(scope.row)"
            >
              查看统计
            </el-button>
            
            <el-popconfirm
              v-if="!scope.row.stats || (scope.row.stats.units === 0 && scope.row.stats.users === 0 && scope.row.stats.records === 0)"
              title="确定要删除此公司吗？"
              @confirm="handleDelete(scope.row)"
            >
              <template #reference>
                <el-button size="small" type="danger">删除</el-button>
              </template>
            </el-popconfirm>
            <el-tooltip 
              v-else 
              content="该公司下还有用户、单位或记录，无法删除"
              placement="top"
            >
              <el-button size="small" type="danger" disabled>删除</el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 添加/编辑公司对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑公司' : '添加公司'"
      width="500px"
    >
      <el-form
        ref="companyForm"
        :model="form"
        :rules="rules"
        label-width="100px"
        style="max-width: 400px; margin: 0 auto;"
      >
        <el-form-item label="公司名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入公司名称" />
        </el-form-item>
        
        <el-form-item label="公司代码" prop="code">
          <el-input v-model="form.code" placeholder="请输入公司代码（可选）" />
        </el-form-item>
        
        <el-form-item v-if="isEdit" label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
            <el-option :value="1" label="正常" />
            <el-option :value="0" label="停用" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="formLoading">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 公司统计对话框 -->
    <el-dialog
      v-model="statsDialogVisible"
      title="公司统计信息"
      width="600px"
    >
      <div v-if="currentCompanyStats" class="stats-detail">
        <h3>{{ currentCompanyStats.company.name }}</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-label">单位数量</div>
            <div class="stat-value">{{ currentCompanyStats.stats.units }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">用户数量</div>
            <div class="stat-value">{{ currentCompanyStats.stats.users }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">废物记录</div>
            <div class="stat-value">{{ currentCompanyStats.stats.records }}</div>
          </div>
        </div>
      </div>
    </el-dialog>

    <div class="footer">
      <p>&copy; 2025 固体废物管理系统</p>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import httpService from '../config/httpService';
import apiConfig from '../config/api';
import { ArrowLeft, Plus, Search } from '@element-plus/icons-vue';
import auth from '../store/auth';

export default {
  name: 'CompanyManagement',
  components: {
    ArrowLeft,
    Plus,
    Search
  },
  setup() {
    const router = useRouter();
    const loading = ref(false);
    const formLoading = ref(false);
    const dialogVisible = ref(false);
    const statsDialogVisible = ref(false);
    const isEdit = ref(false);
    const companyForm = ref(null);
    const companies = ref([]);
    const searchKeyword = ref('');
    const allCompanies = ref([]);
    const currentCompanyStats = ref(null);
    
    // 权限检查
    if (!auth.isSystemAdmin()) {
      ElMessage.error('权限不足，只有系统超级管理员可以访问此页面');
      router.push('/');
      return {};
    }
    
    // 表单数据
    const form = reactive({
      id: null,
      name: '',
      code: '',
      status: 1
    });
    
    // 表单验证规则
    const rules = {
      name: [
        { required: true, message: '请输入公司名称', trigger: 'blur' },
        { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
      ],
      code: [
        { max: 20, message: '长度不能超过 20 个字符', trigger: 'blur' }
      ]
    };
    
    // 过滤后的公司列表
    const filteredCompanies = computed(() => {
      if (!searchKeyword.value.trim()) {
        return allCompanies.value;
      }
      const keyword = searchKeyword.value.toLowerCase();
      return allCompanies.value.filter(company => 
        company.name.toLowerCase().includes(keyword) ||
        (company.code && company.code.toLowerCase().includes(keyword))
      );
    });
    
    // 获取公司列表
    const fetchCompanies = async () => {
      loading.value = true;
      try {
        const response = await httpService.get(apiConfig.endpoints.companies);
        // 同时获取每个公司的统计信息
        const companiesWithStats = await Promise.all(
          response.data.map(async (company) => {
            try {
              const statsResponse = await httpService.get(
                apiConfig.endpoints.companyStats.replace(':id', company.id)
              );
              return {
                ...company,
                stats: statsResponse.data.stats
              };
            } catch (error) {
              console.error(`获取公司 ${company.name} 统计信息失败:`, error);
              return {
                ...company,
                stats: { units: 0, users: 0, records: 0 }
              };
            }
          })
        );
        
        allCompanies.value = companiesWithStats;
      } catch (error) {
        console.error('Error fetching companies:', error);
        ElMessage.error('获取公司列表失败');
      } finally {
        loading.value = false;
      }
    };
    
    // 同步过滤结果到显示列表
    watch(filteredCompanies, (newValue) => {
      companies.value = newValue;
    }, { immediate: true });
    
    // 打开添加对话框
    const openAddDialog = () => {
      isEdit.value = false;
      resetForm();
      dialogVisible.value = true;
    };
    
    // 处理编辑
    const handleEdit = (row) => {
      isEdit.value = true;
      form.id = row.id;
      form.name = row.name;
      form.code = row.code || '';
      form.status = row.status;
      dialogVisible.value = true;
    };
    
    // 处理删除
    const handleDelete = async (row) => {
      try {
        await httpService.delete(`${apiConfig.endpoints.companies}/${row.id}`);
        ElMessage.success('公司删除成功');
        fetchCompanies();
      } catch (error) {
        console.error('Error deleting company:', error);
        let errorMsg = '删除公司失败';
        if (error.response && error.response.data && error.response.data.error) {
          errorMsg = error.response.data.error;
        }
        ElMessage.error(errorMsg);
      }
    };
    
    // 处理公司状态变更
    const handleStatusChange = async (row) => {
      const newStatus = row.status === 1 ? 0 : 1;
      const statusText = newStatus === 1 ? '恢复' : '停用';
      
      try {
        await httpService.put(`${apiConfig.endpoints.companies}/${row.id}`, { 
          name: row.name, 
          code: row.code,
          status: newStatus 
        });
        ElMessage.success(`公司${statusText}成功`);
        fetchCompanies();
      } catch (error) {
        console.error('状态变更失败:', error);
        let errorMsg = `${statusText}公司失败`;
        if (error.response && error.response.data && error.response.data.error) {
          errorMsg = error.response.data.error;
        }
        ElMessage.error(errorMsg);
      }
    };
    
    // 查看统计信息
    const viewStats = async (row) => {
      try {
        const response = await httpService.get(
          apiConfig.endpoints.companyStats.replace(':id', row.id)
        );
        currentCompanyStats.value = response.data;
        statsDialogVisible.value = true;
      } catch (error) {
        console.error('获取公司统计失败:', error);
        ElMessage.error('获取公司统计信息失败');
      }
    };
    
    // 重置表单
    const resetForm = () => {
      if (companyForm.value) {
        companyForm.value.resetFields();
      }
      form.id = null;
      form.name = '';
      form.code = '';
      form.status = 1;
    };
    
    // 提交表单
    const submitForm = () => {
      companyForm.value.validate(async (valid) => {
        if (valid) {
          formLoading.value = true;
          try {
            const companyData = {
              name: form.name,
              code: form.code || null,
              status: form.status
            };
            
            if (isEdit.value) {
              // 更新公司
              await httpService.put(`${apiConfig.endpoints.companies}/${form.id}`, companyData);
              ElMessage.success('公司更新成功');
            } else {
              // 添加公司
              await httpService.post(apiConfig.endpoints.companies, companyData);
              ElMessage.success('公司添加成功');
            }
            
            dialogVisible.value = false;
            fetchCompanies();
          } catch (error) {
            console.error('Error submitting company form:', error);
            let errorMsg = isEdit.value ? '更新公司失败' : '添加公司失败';
            if (error.response && error.response.data && error.response.data.error) {
              errorMsg = error.response.data.error;
            }
            ElMessage.error(errorMsg);
          } finally {
            formLoading.value = false;
          }
        } else {
          ElMessage.warning('请完成必填项');
        }
      });
    };
    
    // 返回上一页
    const goBack = () => {
      router.back();
    };
    
    // 清除搜索
    const clearSearch = () => {
      searchKeyword.value = '';
    };
    
    onMounted(() => {
      fetchCompanies();
    });
    
    return {
      loading,
      formLoading,
      dialogVisible,
      statsDialogVisible,
      isEdit,
      companyForm,
      companies,
      form,
      rules,
      currentCompanyStats,
      openAddDialog,
      handleEdit,
      handleDelete,
      handleStatusChange,
      viewStats,
      submitForm,
      goBack,
      searchKeyword,
      clearSearch
    };
  }
};
</script>

<style scoped>
.company-management-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.header {
  background-color: var(--color-bg-primary);
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-primary);
  padding: var(--space-4) var(--space-5);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.back-button {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  color: var(--color-text-secondary);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  border: 1px solid var(--color-border);
  background-color: var(--color-bg-primary);
  font-weight: 500;
}

.back-button:hover {
  color: var(--color-accent);
  border-color: var(--color-accent);
  background-color: var(--color-accent-light);
}

.content {
  flex: 1;
  padding: var(--space-8);
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-5);
  flex-wrap: wrap;
  gap: var(--space-3);
}

.search-container {
  display: flex;
  align-items: center;
}

.search-input {
  width: 250px;
  transition: all var(--transition-base);
}

.stats-info {
  font-size: 12px;
  line-height: 1.4;
}

.stats-detail {
  text-align: center;
}

.stats-detail h3 {
  margin-bottom: var(--space-5);
  color: var(--color-text-primary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-5);
  margin-top: var(--space-5);
}

.stat-item {
  padding: var(--space-5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  text-align: center;
}

.stat-label {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: var(--color-accent);
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .search-container {
    width: 100%;
    margin-top: var(--space-3);
  }

  .search-input {
    width: 100%;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}

.footer {
  background-color: var(--color-bg-secondary);
  padding: var(--space-4);
  text-align: center;
  color: var(--color-text-secondary);
}
</style> 