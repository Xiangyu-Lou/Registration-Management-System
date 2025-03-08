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
      <div class="toolbar">
        <el-button type="primary" @click="openAddDialog">
          <el-icon><plus /></el-icon> 添加用户
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="users"
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
        <el-table-column prop="username" label="姓名" width="120" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="role_name" label="角色" width="120" />
        <el-table-column prop="unit_name" label="单位" min-width="120" />
        
        <el-table-column label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
              {{ scope.row.status === 1 ? '正常' : '已停用' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button 
              size="small" 
              :type="scope.row.status === 1 ? 'warning' : 'success'"
              @click="handleStatusChange(scope.row)"
            >
              {{ scope.row.status === 1 ? '停用' : '恢复' }}
            </el-button>
            <el-popconfirm
              title="确定要删除此用户吗？"
              @confirm="handleDelete(scope.row)"
            >
              <template #reference>
                <el-button size="small" type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 添加/编辑用户对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑用户' : '添加用户'"
      width="500px"
    >
      <el-form
        ref="userForm"
        :model="form"
        :rules="rules"
        label-width="100px"
        style="max-width: 400px; margin: 0 auto;"
      >
        <el-form-item label="姓名" prop="username">
          <el-input v-model="form.username" placeholder="请输入姓名" />
        </el-form-item>
        
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        
        <el-form-item label="角色" prop="roleId">
          <el-select v-model="form.roleId" placeholder="请选择角色" style="width: 100%">
            <!-- 如果是超级管理员，可以添加所有类型用户 -->
            <el-option v-if="isSuperAdmin" :value="3" label="超级管理员" />
            <el-option :value="2" label="单位管理员" />
            <el-option :value="1" label="基层员工" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="单位" prop="unitId" v-if="form.roleId !== 3">
          <el-select 
            v-model="form.unitId" 
            placeholder="请选择单位" 
            style="width: 100%"
            :disabled="!isSuperAdmin && isEdit"
          >
            <el-option 
              v-for="unit in units" 
              :key="unit.id" 
              :label="unit.name" 
              :value="unit.id" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item 
          label="密码" 
          :prop="isEdit ? '' : 'password'"
        >
          <el-input 
            v-model="form.password" 
            placeholder="请输入密码" 
            type="password"
            show-password
          />
          <div class="password-hint" v-if="!isEdit">所有账号必须设置密码</div>
          <div class="password-hint" v-else>不修改密码请留空</div>
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

    <div class="footer">
      <p>&copy; 2025 固体废物管理系统</p>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import httpService from '../config/httpService';
import apiConfig from '../config/api';
import { ArrowLeft, Plus } from '@element-plus/icons-vue';
import auth from '../store/auth';

export default {
  name: 'UserManagement',
  components: {
    ArrowLeft,
    Plus
  },
  setup() {
    const router = useRouter();
    const loading = ref(false);
    const formLoading = ref(false);
    const dialogVisible = ref(false);
    const isEdit = ref(false);
    const userForm = ref(null);
    const users = ref([]);
    const units = ref([]);
    
    // 判断当前用户是否为超级管理员
    const isSuperAdmin = computed(() => {
      return auth.state.isLoggedIn && auth.state.user.role_id === 3;
    });
    
    // 当前登录用户的单位ID
    const currentUnitId = computed(() => {
      return auth.state.isLoggedIn ? auth.state.user.unit_id : null;
    });
    
    // 表单数据
    const form = reactive({
      id: null,
      username: '',
      phone: '',
      roleId: 1,
      unitId: null,
      password: ''
    });
    
    // 表单验证规则
    const rules = {
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
      ],
      unitId: [
        { required: true, message: '请选择单位', trigger: 'change' }
      ],
      password: [
        { 
          required: function() {
            // 新增账号时密码必填
            return !isEdit.value;
          }, 
          message: '请输入密码', 
          trigger: 'blur' 
        },
        { 
          validator: (rule, value, callback) => {
            // 只有当有输入值且不为空时才验证长度
            if (value && value.length > 0) {
              if (value.length < 1 || value.length > 20) {
                callback(new Error('长度在 1 到 20 个字符'));
              } else {
                callback();
              }
            } else {
              // 空值在编辑模式下是允许的
              if (isEdit.value) {
                callback();
              } else {
                callback(new Error('请输入密码'));
              }
            }
          },
          trigger: 'blur'
        }
      ]
    };
    
    // 获取用户列表
    const fetchUsers = async () => {
      loading.value = true;
      try {
        let response;
        if (isSuperAdmin.value) {
          // 超级管理员获取所有用户
          response = await httpService.get(apiConfig.endpoints.users);
        } else {
          // 单位管理员只获取本单位员工
          response = await httpService.get(`${apiConfig.endpoints.units}/${currentUnitId.value}/users`);
        }
        users.value = response.data;
      } catch (error) {
        console.error('Error fetching users:', error);
        ElMessage.error('获取用户列表失败');
      } finally {
        loading.value = false;
      }
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
    
    // 打开添加对话框
    const openAddDialog = () => {
      isEdit.value = false;
      resetForm();
      dialogVisible.value = true;
      
      // 如果是单位管理员，默认选择当前单位
      if (!isSuperAdmin.value) {
        form.unitId = currentUnitId.value;
      }
    };
    
    // 处理编辑
    const handleEdit = (row) => {
      isEdit.value = true;
      form.id = row.id;
      form.username = row.username;
      form.phone = row.phone;
      form.roleId = row.role_id;
      form.unitId = row.unit_id;
      form.password = ''; // 编辑时密码字段为空
      dialogVisible.value = true;
    };
    
    // 处理删除
    const handleDelete = async (row) => {
      try {
        await httpService.delete(`${apiConfig.endpoints.users}/${row.id}`);
        ElMessage.success('用户删除成功');
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        let errorMsg = '删除用户失败';
        if (error.response && error.response.data && error.response.data.error) {
          errorMsg = error.response.data.error;
        }
        ElMessage.error(errorMsg);
      }
    };
    
    // 处理用户状态变更（停用/恢复）
    const handleStatusChange = async (row) => {
      const newStatus = row.status === 1 ? 0 : 1;
      const statusText = newStatus === 1 ? '恢复' : '停用';
      
      try {
        await httpService.put(`${apiConfig.endpoints.users}/${row.id}/status`, { status: newStatus });
        ElMessage.success(`用户${statusText}成功`);
        fetchUsers();
      } catch (error) {
        console.error('状态变更失败:', error);
        let errorMsg = `${statusText}用户失败`;
        if (error.response && error.response.data && error.response.data.error) {
          errorMsg = error.response.data.error;
        }
        ElMessage.error(errorMsg);
      }
    };
    
    // 重置表单
    const resetForm = () => {
      if (userForm.value) {
        userForm.value.resetFields();
      }
      form.id = null;
      form.username = '';
      form.phone = '';
      form.roleId = 1;
      form.unitId = null;
      form.password = '';
    };
    
    // 提交表单
    const submitForm = () => {
      userForm.value.validate(async (valid) => {
        if (valid) {
          formLoading.value = true;
          try {
            const userData = {
              username: form.username,
              phone: form.phone,
              roleId: form.roleId,
              unitId: form.roleId !== 3 ? form.unitId : null
            };
            
            // 仅当有输入密码时，才添加密码字段
            if (form.password) {
              userData.password = form.password;
            }
            
            if (isEdit.value) {
              // 更新用户
              await httpService.put(`${apiConfig.endpoints.users}/${form.id}`, userData);
              ElMessage.success('用户更新成功');
            } else {
              // 添加用户
              await httpService.post(apiConfig.endpoints.users, userData);
              ElMessage.success('用户添加成功');
            }
            
            dialogVisible.value = false;
            fetchUsers();
          } catch (error) {
            console.error('Error submitting user form:', error);
            let errorMsg = isEdit.value ? '更新用户失败' : '添加用户失败';
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
    
    onMounted(() => {
      fetchUsers();
      fetchUnits();
    });
    
    return {
      loading,
      formLoading,
      dialogVisible,
      isEdit,
      userForm,
      users,
      units,
      form,
      rules,
      isSuperAdmin,
      currentUnitId,
      openAddDialog,
      handleEdit,
      handleDelete,
      handleStatusChange,
      submitForm,
      goBack
    };
  }
};
</script>

<style scoped>
.user-management-container {
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
  /* 覆盖层渐变，增强立体感 */
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

.back-button {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
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

.back-button:hover {
  background-color: rgba(255, 255, 255, 0.35);
  transform: translateY(-2px);
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.25);
  border-color: rgba(255, 255, 255, 0.8);
}

.content {
  flex: 1;
  padding: 30px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}

.password-hint {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

.footer {
  background-color: #f5f5f5;
  padding: 15px;
  text-align: center;
  color: #666;
}
</style>
