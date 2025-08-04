<template>
  <div class="user-management-container">
    <div class="header">
      <div class="back-button" @click="goBack">
        <el-icon><arrow-left /></el-icon> 返回
      </div>
      <h1>人员管理</h1>
      <div></div>
    </div>

    <div class="content">
      <!-- 搜索工具栏 -->
      <div class="toolbar">
        <div class="search-container">
          <el-input
            v-model="searchKeyword"
            placeholder="请输入姓名关键字搜索"
            clearable
            @clear="clearSearch"
            class="search-input"
          >
            <template #prefix>
              <el-icon><search /></el-icon>
            </template>
          </el-input>
        </div>
      </div>

      <!-- 用户数据表格 -->
      <CommonDataTable
        :data="users"
        :columns="tableColumns"
        :loading="loading"
        title="用户列表"
        :show-actions="true"
        :action-buttons="actionButtons"
        @action-click="handleAction"
        @refresh="fetchUsers"
      >
        <!-- 自定义表格操作区域 -->
        <template #actions>
          <el-button type="primary" @click="openAddDialog">
            <el-icon><plus /></el-icon> 添加用户
          </el-button>
        </template>

        <!-- 状态列自定义渲染 -->
        <template #status="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'">
            {{ row.status === 1 ? '正常' : '已停用' }}
          </el-tag>
        </template>

        <!-- 日志权限列自定义渲染 -->
        <template #log-permission="{ row }">
          <el-tag :type="row.can_view_logs === 1 ? 'success' : 'info'">
            {{ row.can_view_logs === 1 ? '允许' : '禁止' }}
          </el-tag>
        </template>
      </CommonDataTable>
    </div>

    <!-- 用户表单对话框 -->
    <CommonFormDialog
      v-model="dialogVisible"
      :fields="formFields"
      :form-data="formData"
      :rules="formRules"
      :is-edit="isEdit"
      :loading="formLoading"
      add-title="添加用户"
      edit-title="编辑用户"
      @submit="handleSubmit"
      @cancel="handleCancel"
    >
      <!-- 单位选择的自定义插槽（因为需要动态显示/隐藏） -->
      <template #unitId="{ value, onChange }">
        <el-select 
          :model-value="value"
          @update:model-value="onChange"
          placeholder="请选择单位" 
          style="width: 100%"
          :disabled="!isAdmin && isEdit"
        >
          <el-option 
            v-for="unit in units" 
            :key="unit.id" 
            :label="isSystemAdmin ? `${unit.name} (${unit.company_name})` : unit.name" 
            :value="unit.id" 
          />
        </el-select>
      </template>

      <!-- 公司选择的自定义插槽 -->
      <template #companyId="{ value, onChange }">
        <el-select 
          :model-value="value"
          @update:model-value="onChange"
          placeholder="请选择公司" 
          style="width: 100%"
        >
          <el-option 
            v-for="company in companies" 
            :key="company.id" 
            :label="company.name" 
            :value="company.id" 
          />
        </el-select>
      </template>
    </CommonFormDialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowLeft, Plus, Search } from '@element-plus/icons-vue';
import { CommonDataTable, CommonFormDialog } from '../components/common';
import httpService from '../config/httpService';
import apiConfig from '../config/api';
import auth from '../store/auth';

export default {
  name: 'UserManagement',
  components: {
    ArrowLeft,
    Plus,
    Search,
    CommonDataTable,
    CommonFormDialog
  },
  setup() {
    const router = useRouter();
    const loading = ref(false);
    const formLoading = ref(false);
    const dialogVisible = ref(false);
    const isEdit = ref(false);
    const users = ref([]);
    const units = ref([]);
    const companies = ref([]);
    const searchKeyword = ref('');
    const allUsers = ref([]);

    // 权限检查
    const isSystemAdmin = computed(() => auth.isSystemAdmin());
    const isCompanyAdmin = computed(() => auth.isCompanyAdmin());
    const isAdmin = computed(() => auth.isAdmin());
    const canManageLogPermissions = computed(() => {
      return auth.state.isLoggedIn && auth.state.user && auth.state.user.can_view_logs === 1;
    });

    // 表单数据
    const formData = reactive({
      id: null,
      username: '',
      phone: '',
      roleId: 1,
      unitId: null,
      companyId: null,
      password: ''
    });

    // 表格列配置
    const tableColumns = computed(() => {
      const columns = [
        { prop: 'username', label: '姓名', width: 120 },
        { prop: 'phone', label: '手机号', width: 140 },
        { prop: 'role_name', label: '角色', width: 120 },
        { prop: 'unit_name', label: '单位', minWidth: 120 },
        { 
          prop: 'status', 
          label: '状态', 
          width: 100, 
          align: 'center',
          slot: 'status'
        },
        { 
          prop: 'can_view_logs', 
          label: '日志权限', 
          width: 100, 
          align: 'center',
          slot: 'log-permission'
        }
      ];

      // 系统超级管理员可以看到公司列
      if (isSystemAdmin.value) {
        columns.splice(4, 0, { prop: 'company_name', label: '公司', width: 120 });
      }

      return columns;
    });

    // 操作按钮配置
    const actionButtons = computed(() => {
      return [
        {
          key: 'edit',
          label: '编辑',
          type: 'primary',
          action: 'edit',
          show: (row) => !(!isAdmin.value && row.role_id === 2)
        },
        {
          key: 'status',
          label: (row) => row.status === 1 ? '停用' : '恢复',
          type: (row) => row.status === 1 ? 'warning' : 'success',
          action: 'toggle-status',
          show: (row) => !(!isAdmin.value && row.role_id === 2)
        },
        {
          key: 'log-permission',
          label: (row) => row.can_view_logs === 1 ? '禁止日志' : '允许日志',
          type: (row) => row.can_view_logs === 1 ? 'warning' : 'primary',
          action: 'toggle-log-permission',
          show: () => canManageLogPermissions.value
        },
        {
          key: 'delete',
          label: '删除',
          type: 'danger',
          action: 'delete',
          show: (row) => !(!isAdmin.value && row.role_id === 2)
        }
      ];
    });

    // 表单字段配置
    const formFields = computed(() => [
      {
        key: 'username',
        label: '姓名',
        type: 'input',
        required: true,
        placeholder: '请输入姓名'
      },
      {
        key: 'phone',
        label: '手机号',
        type: 'input',
        required: true,
        placeholder: '请输入手机号'
      },
      {
        key: 'roleId',
        label: '角色',
        type: 'select',
        required: true,
        options: () => {
          const roles = [];
          if (isSystemAdmin.value) roles.push({ value: 5, label: '系统超级管理员' });
          if (isSystemAdmin.value || isCompanyAdmin.value) {
            roles.push({ value: 3, label: '公司管理员' });
            roles.push({ value: 4, label: '监督人员' });
          }
          roles.push({ value: 2, label: '单位管理员' });
          roles.push({ value: 1, label: '基层员工' });
          return roles;
        }
      },
      {
        key: 'unitId',
        label: '单位',
        type: 'slot',
        required: (formData) => formData.roleId !== 3 && formData.roleId !== 4 && formData.roleId !== 5,
        showWhen: (formData) => formData.roleId !== 3 && formData.roleId !== 4 && formData.roleId !== 5
      },
      {
        key: 'companyId',
        label: '公司',
        type: 'slot',
        required: () => isSystemAdmin.value && !isEdit.value,
        showWhen: () => isSystemAdmin.value
      },
      {
        key: 'password',
        label: '密码',
        type: 'password',
        placeholder: isEdit.value ? '留空表示不修改' : '请输入密码',
        tip: isEdit.value ? '如需修改密码请输入新密码，否则请留空' : undefined
      }
    ]);

    // 表单验证规则
    const formRules = {
      username: [
        { required: true, message: '请输入姓名', trigger: 'blur' },
        { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
      ],
      phone: [
        { required: true, message: '请输入手机号', trigger: 'blur' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码', trigger: 'blur' }
      ],
      roleId: [
        { required: true, message: '请选择角色', trigger: 'change' }
      ]
    };

    // 处理操作按钮点击
    const handleAction = ({ action, row }) => {
      switch (action) {
        case 'edit':
          handleEdit(row);
          break;
        case 'toggle-status':
          handleStatusChange(row);
          break;
        case 'toggle-log-permission':
          handleLogPermissionChange(row);
          break;
        case 'delete':
          handleDelete(row);
          break;
      }
    };

    // 编辑用户
    const handleEdit = (user) => {
      isEdit.value = true;
      Object.assign(formData, {
        id: user.id,
        username: user.username,
        phone: user.phone,
        roleId: user.role_id,
        unitId: user.unit_id,
        companyId: user.company_id,
        password: ''
      });
      dialogVisible.value = true;
    };

    // 状态变更
    const handleStatusChange = async (user) => {
      const action = user.status === 1 ? '停用' : '恢复';
      try {
        await ElMessageBox.confirm(`确定要${action}用户 ${user.username} 吗？`, '确认操作', {
          type: 'warning'
        });
        
        const response = await httpService.put(
          apiConfig.endpoints.userStatus.replace(':id', user.id),
          { status: user.status === 1 ? 0 : 1 }
        );
        
        if (response.data.success) {
          ElMessage.success(`${action}成功`);
          await fetchUsers();
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error(`${action}用户失败:`, error);
        }
      }
    };

    // 日志权限变更
    const handleLogPermissionChange = async (user) => {
      const action = user.can_view_logs === 1 ? '禁止' : '允许';
      try {
        await ElMessageBox.confirm(`确定要${action}用户 ${user.username} 查看日志吗？`, '确认操作', {
          type: 'warning'
        });
        
        const response = await httpService.put(
          apiConfig.endpoints.userLogPermission.replace(':id', user.id),
          { can_view_logs: user.can_view_logs === 1 ? 0 : 1 }
        );
        
        if (response.data.success) {
          ElMessage.success(`${action}成功`);
          await fetchUsers();
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error(`${action}日志权限失败:`, error);
        }
      }
    };

    // 删除用户
    const handleDelete = async (user) => {
      try {
        await ElMessageBox.confirm(`确定要删除用户 ${user.username} 吗？此操作不可恢复！`, '确认删除', {
          type: 'error'
        });
        
        const response = await httpService.delete(`${apiConfig.endpoints.users}/${user.id}`);
        
        if (response.data.success) {
          ElMessage.success('删除成功');
          await fetchUsers();
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除用户失败:', error);
        }
      }
    };

    // 打开添加对话框
    const openAddDialog = () => {
      isEdit.value = false;
      Object.assign(formData, {
        id: null,
        username: '',
        phone: '',
        roleId: 1,
        unitId: null,
        companyId: null,
        password: ''
      });
      dialogVisible.value = true;
    };

    // 处理表单提交
    const handleSubmit = async (data) => {
      formLoading.value = true;
      try {
        let response;
        if (isEdit.value) {
          response = await httpService.put(`${apiConfig.endpoints.users}/${data.id}`, data);
        } else {
          response = await httpService.post(apiConfig.endpoints.users, data);
        }
        
        if (response.data.success) {
          ElMessage.success(isEdit.value ? '更新成功' : '添加成功');
          dialogVisible.value = false;
          await fetchUsers();
        }
      } catch (error) {
        console.error('保存用户失败:', error);
      } finally {
        formLoading.value = false;
      }
    };

    // 处理取消
    const handleCancel = () => {
      dialogVisible.value = false;
    };

    // 获取用户列表
    const fetchUsers = async () => {
      loading.value = true;
      try {
        const response = await httpService.get(apiConfig.endpoints.users);
        if (response.data.success) {
          allUsers.value = response.data.data;
          filterUsers();
        }
      } catch (error) {
        console.error('获取用户列表失败:', error);
      } finally {
        loading.value = false;
      }
    };

    // 获取单位列表
    const fetchUnits = async () => {
      try {
        const response = await httpService.get(apiConfig.endpoints.units);
        if (response.data.success) {
          units.value = response.data.data;
        }
      } catch (error) {
        console.error('获取单位列表失败:', error);
      }
    };

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

    // 过滤用户
    const filterUsers = () => {
      if (!searchKeyword.value.trim()) {
        users.value = allUsers.value;
      } else {
        const keyword = searchKeyword.value.toLowerCase();
        users.value = allUsers.value.filter(user => 
          user.username.toLowerCase().includes(keyword) ||
          user.phone.includes(keyword)
        );
      }
    };

    // 清除搜索
    const clearSearch = () => {
      searchKeyword.value = '';
      filterUsers();
    };

    // 返回
    const goBack = () => {
      router.back();
    };

    // 监听搜索关键字变化
    // Note: 在实际项目中应该使用watch来监听searchKeyword变化

    onMounted(async () => {
      await Promise.all([
        fetchUsers(),
        fetchUnits(),
        fetchCompanies()
      ]);
    });

    return {
      loading,
      formLoading,
      dialogVisible,
      isEdit,
      users,
      units,
      companies,
      searchKeyword,
      formData,
      tableColumns,
      actionButtons,
      formFields,
      formRules,
      isSystemAdmin,
      isCompanyAdmin,
      isAdmin,
      canManageLogPermissions,
      handleAction,
      openAddDialog,
      handleSubmit,
      handleCancel,
      fetchUsers,
      clearSearch,
      goBack
    };
  }
};
</script>

<style scoped>
.user-management-container {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background: white;
  padding: 15px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.back-button {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  color: #409eff;
  transition: color 0.3s;
}

.back-button:hover {
  color: #66b1ff;
}

.header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-container {
  flex: 1;
  max-width: 300px;
}

.search-input {
  width: 100%;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .user-management-container {
    padding: 10px;
  }
  
  .header {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }
  
  .toolbar {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .search-container {
    max-width: none;
  }
}
</style> 