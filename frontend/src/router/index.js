import { createRouter, createWebHistory } from 'vue-router'
import UnitSelection from '../views/UnitSelection.vue'
import WasteForm from '../views/WasteForm.vue'
import RecordsList from '../views/RecordsList.vue'
import Login from '../views/Login.vue'
import EditRecord from '../views/EditRecord.vue'
import UserManagement from '../views/UserManagement.vue'
import AdminRecords from '../views/AdminRecords.vue'
import UserProfile from '../views/UserProfile.vue'
import OperationLogs from '../views/OperationLogs.vue'
import CompanyManagement from '../views/CompanyManagement.vue'
import SuperAdminRecords from '../views/SuperAdminRecords.vue'
import FeedbackForm from '../views/FeedbackForm.vue'
import FeedbackList from '../views/FeedbackList.vue'
import FeedbackManagement from '../views/FeedbackManagement.vue'
import auth from '../store/auth'
import httpService from '../config/httpService'
import apiConfig from '../config/api'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/user-management',
    name: 'UserManagement',
    component: UserManagement,
    meta: { requiresAuth: true, requiresManager: true }
  },
  {
    path: '/profile',
    name: 'UserProfile',
    component: UserProfile,
    meta: { requiresAuth: true }
  },
  {
    path: '/operation-logs',
    name: 'OperationLogs',
    component: OperationLogs,
    meta: { requiresAuth: true, requiresLogPermission: true }
  },
  {
    path: '/companies',
    name: 'CompanyManagement',
    component: CompanyManagement,
    meta: { requiresAuth: true, requiresSystemAdmin: true }
  },
  {
    path: '/',
    name: 'Home',
    component: UnitSelection,
    meta: { requiresAuth: true }
  },
  {
    path: '/units',
    name: 'UnitSelection',
    component: UnitSelection,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin-records',
    name: 'AdminRecords',
    component: AdminRecords,
    meta: { requiresAuth: true, requiresCompanyAdmin: true }
  },
  {
    path: '/super-admin-records',
    name: 'SuperAdminRecords',
    component: SuperAdminRecords,
    meta: { requiresAuth: true, requiresSystemAdmin: true }
  },
  {
    path: '/record/new',
    name: 'NewRecord',
    component: EditRecord,
    props: { id: null },
    meta: { requiresAuth: true }
  },
  {
    path: '/record/:id',
    name: 'EditRecord',
    component: EditRecord,
    props: true,
    meta: { requiresAuth: true }
  },
  {
    path: '/unit/:id',
    name: 'WasteForm',
    component: WasteForm,
    props: true,
    meta: { requiresAuth: true }
  },
  {
    path: '/records/:unitId',
    name: 'RecordsList',
    component: RecordsList,
    props: true,
    meta: { requiresAuth: true }
  },
  {
    path: '/feedback/new',
    name: 'FeedbackForm',
    component: FeedbackForm,
    meta: { requiresAuth: true }
  },
  {
    path: '/feedback/list',
    name: 'FeedbackList',
    component: FeedbackList,
    meta: { requiresAuth: true }
  },
  {
    path: '/feedback/management',
    name: 'FeedbackManagement',
    component: FeedbackManagement,
    meta: { requiresAuth: true, requiresManager: true }
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  // 检查页面是否需要授权
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresSuperAdmin = to.matched.some(record => record.meta.requiresSuperAdmin);
  const requiresSystemAdmin = to.matched.some(record => record.meta.requiresSystemAdmin);
  const requiresCompanyAdmin = to.matched.some(record => record.meta.requiresCompanyAdmin);
  const requiresManager = to.matched.some(record => record.meta.requiresManager);
  const requiresLogPermission = to.matched.some(record => record.meta.requiresLogPermission);
  
  // 如果路由需要登录但用户未登录，重定向到登录页面
  if (requiresAuth && !auth.state.isLoggedIn) {
    next({ name: 'Login' });
    return;
  }
  
  // 监督人员访问单位页面时验证单位归属公司
  if (to.name === 'WasteForm' && auth.state.isLoggedIn && auth.isSupervisor()) {
    const unitId = to.params.id;
    try {
      const response = await httpService.get(`${apiConfig.endpoints.units}/${unitId}`);
      const unit = response.data;
      if (unit && unit.company_id !== auth.getCompanyId()) {
        console.warn('监督人员尝试访问其他公司单位:', unitId);
        next({ name: 'UnitSelection' });
        return;
      }
    } catch (error) {
      console.error('验证单位访问权限失败:', error);
      next({ name: 'UnitSelection' });
      return;
    }
  }
  
  // 监督人员访问记录列表时验证单位归属公司
  if (to.name === 'RecordsList' && auth.state.isLoggedIn && auth.isSupervisor()) {
    const unitId = to.params.unitId;
    try {
      const response = await httpService.get(`${apiConfig.endpoints.units}/${unitId}`);
      const unit = response.data;
      if (unit && unit.company_id !== auth.getCompanyId()) {
        console.warn('监督人员尝试访问其他公司单位记录:', unitId);
        next({ name: 'UnitSelection' });
        return;
      }
    } catch (error) {
      console.error('验证单位记录访问权限失败:', error);
      next({ name: 'UnitSelection' });
      return;
    }
  }
  
  // 如果路由需要日志权限但用户没有权限
  if (requiresLogPermission && auth.state.isLoggedIn && auth.state.user.can_view_logs !== 1) {
    // 重定向到适当的页面
    if (auth.state.user.role_id === 5) {
      next({ name: 'SuperAdminRecords' }); // 系统超级管理员
    } else if (auth.state.user.role_id === 3) {
      next({ name: 'AdminRecords' }); // 公司管理员
    } else if (auth.state.user.role_id === 4) {
      next({ name: 'NewRecord' }); // 监督人员
    } else if (auth.state.user.unit_id) {
      next({ name: 'WasteForm', params: { id: auth.state.user.unit_id } });
    } else {
      next({ name: 'UnitSelection' });
    }
    return;
  }
  
  // 如果路由需要管理员权限但用户不是管理员
  if (requiresSuperAdmin && auth.state.isLoggedIn) {
    // 系统超级管理员重定向到系统管理页面
    if (auth.state.user.role_id === 5) {
      next({ name: 'SuperAdminRecords' });
      return;
    }
    // 公司管理员和监督人员可以正常访问
    else if (auth.state.user.role_id === 3 || auth.state.user.role_id === 4) {
      // 继续正常访问
    }
    // 其他用户重定向到其单位页面
    else {
      if (auth.state.user.unit_id) {
        next({ name: 'WasteForm', params: { id: auth.state.user.unit_id } });
      } else {
        next({ name: 'UnitSelection' });
      }
      return;
    }
  }
  
  // 如果路由需要系统超级管理员权限但用户不是系统超级管理员
  if (requiresSystemAdmin && auth.state.isLoggedIn && auth.state.user.role_id !== 5) {
    // 只有系统超级管理员才能访问系统管理页面
    if (auth.state.user.role_id === 3) {
      next({ name: 'AdminRecords' });
    } else if (auth.state.user.role_id === 4) {
      next({ name: 'NewRecord' });
    } else {
      if (auth.state.user.unit_id) {
      next({ name: 'WasteForm', params: { id: auth.state.user.unit_id } });
      } else {
        next({ name: 'UnitSelection' });
      }
    }
    return;
  }
  
  // 如果路由需要公司管理员权限但用户不是公司管理员或监督人员
  if (requiresCompanyAdmin && auth.state.isLoggedIn && auth.state.user.role_id !== 3 && auth.state.user.role_id !== 4) {
    // 公司管理员和监督人员才能访问公司管理页面
    if (auth.state.user.role_id === 5) {
      next({ name: 'SuperAdminRecords' });
    } else if (auth.state.user.unit_id) {
    next({ name: 'WasteForm', params: { id: auth.state.user.unit_id } });
    } else {
      next({ name: 'UnitSelection' });
    }
    return;
  }
  
  // 如果路由需要管理员权限但用户不是管理员
  if (requiresManager && auth.state.isLoggedIn) {
    // 系统超级管理员、公司管理员和单位管理员可以正常访问
    if (auth.state.user.role_id === 5 || auth.state.user.role_id === 3 || auth.state.user.role_id === 2) {
      // 继续正常访问，不需要重定向
    }
    // 监督人员不能访问管理员页面
    else if (auth.state.user.role_id === 4) {
      next({ name: 'NewRecord' }); // 监督人员去新增记录页面
      return;
    }
    // 基层员工不能访问管理员页面
    else if (auth.state.user.role_id === 1) {
      if (auth.state.user.unit_id) {
    next({ name: 'WasteForm', params: { id: auth.state.user.unit_id } });
      } else {
        next({ name: 'UnitSelection' });
      }
    return;
    }
  }
  
  // 如果用户已登录且尝试访问登录页面，重定向到合适的页面
  if (to.name === 'Login' && auth.state.isLoggedIn) {
    if (auth.state.user.role_id === 5) {
      next({ name: 'SuperAdminRecords' }); // 系统超级管理员到系统管理页面
    } else if (auth.state.user.role_id === 3) {
      next({ name: 'AdminRecords' }); // 公司管理员到管理页面
    } else if (auth.state.user.role_id === 4) {
      next({ name: 'NewRecord' }); // 监督人员直接进入新增记录页面
    } else if (auth.state.user.role_id === 2) {
      if (auth.state.user.unit_id) {
      next({ name: 'WasteForm', params: { id: auth.state.user.unit_id } }); // 单位管理员直接进入填报页面
      } else {
        next({ name: 'UnitSelection' });
      }
    } else {
      if (auth.state.user.unit_id) {
      next({ name: 'WasteForm', params: { id: auth.state.user.unit_id } }); // 普通员工到填报页面
      } else {
        next({ name: 'UnitSelection' });
      }
    }
    return;
  }
  
  // 用户访问首页时，根据角色重定向到合适的页面
  if ((to.path === '/' || to.name === 'Home') && auth.state.isLoggedIn) {
    if (auth.state.user.role_id === 5) {
      // 系统超级管理员 → 系统管理页面
      next({ name: 'SuperAdminRecords' });
      return;
    } else if (auth.state.user.role_id === 3) {
      // 公司管理员 → 公司管理页面
      next({ name: 'AdminRecords' });
      return;
    } else if (auth.state.user.role_id === 4) {
      // 监督人员 → 新增记录页面
      next({ name: 'NewRecord' });
      return;
    } else if (auth.state.user.role_id === 2) {
      // 单位管理员 → 单位填报页面或单位选择页面
      if (auth.state.user.unit_id) {
        next({ name: 'WasteForm', params: { id: auth.state.user.unit_id } });
      } else {
        next({ name: 'UnitSelection' });
      }
      return;
    } else if (auth.state.user.role_id === 1) {
      // 基层员工 → 填报页面或单位选择页面
      if (auth.state.user.unit_id) {
      next({ name: 'WasteForm', params: { id: auth.state.user.unit_id } });
      } else {
        next({ name: 'UnitSelection' });
      }
      return;
    } else {
      // 未知角色 → 单位选择页面
      next({ name: 'UnitSelection' });
      return;
    }
  }
  
  // 检查用户是否尝试访问不合适的页面
  if (to.name === 'WasteForm' && auth.state.isLoggedIn) {
    // 系统超级管理员不应该直接访问单位填报页面，重定向到系统管理页面
    if (auth.state.user.role_id === 5) {
      next({ name: 'SuperAdminRecords' });
      return;
    }
    // 公司管理员和监督人员可以访问任何单位的填报页面
    else if (auth.state.user.role_id === 3 || auth.state.user.role_id === 4) {
      // 允许访问
    }
    // 单位管理员和基层员工只能访问自己单位的页面
    else if ((auth.state.user.role_id === 1 || auth.state.user.role_id === 2) && 
             auth.state.user.unit_id && auth.state.user.unit_id !== parseInt(to.params.id)) {
      // 如果用户尝试访问其他单位，重定向到自己的单位
      next({ name: 'WasteForm', params: { id: auth.state.user.unit_id } });
      return;
    }
  }
  
  // 系统超级管理员不应该访问单位选择页面
  if (to.name === 'UnitSelection' && auth.state.isLoggedIn && auth.state.user.role_id === 5) {
    next({ name: 'SuperAdminRecords' });
    return;
  }
  
  // 其他情况正常通过
  next();
});

export default router