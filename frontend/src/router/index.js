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
import auth from '../store/auth'

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
    path: '/',
    name: 'UnitSelection',
    component: UnitSelection,
    meta: { requiresAuth: true, requiresSuperAdmin: true }
  },
  {
    path: '/admin-records',
    name: 'AdminRecords',
    component: AdminRecords,
    meta: { requiresAuth: true, requiresSuperAdmin: true }
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
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 检查页面是否需要授权
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresSuperAdmin = to.matched.some(record => record.meta.requiresSuperAdmin);
  const requiresManager = to.matched.some(record => record.meta.requiresManager);
  const requiresLogPermission = to.matched.some(record => record.meta.requiresLogPermission);
  
  // 如果路由需要登录但用户未登录，重定向到登录页面
  if (requiresAuth && !auth.state.isLoggedIn) {
    next({ name: 'Login' });
    return;
  }
  
  // 如果路由需要日志权限但用户没有权限
  if (requiresLogPermission && auth.state.isLoggedIn && auth.state.user.can_view_logs !== 1) {
    // 重定向到适当的页面
    if (auth.state.user.role_id === 3) {
      next({ name: 'AdminRecords' });
    } else if (auth.state.user.role_id === 4) {
      next({ name: 'NewRecord' });
    } else {
      next({ name: 'WasteForm', params: { id: auth.state.user.unit_id } });
    }
    return;
  }
  
  // 如果路由需要超级管理员权限但用户不是超级管理员或监督人员
  if (requiresSuperAdmin && auth.state.isLoggedIn && auth.state.user.role_id !== 3 && auth.state.user.role_id !== 4) {
    // 如果用户已登录但不是超级管理员或监督人员，重定向到其单位页面
    next({ name: 'WasteForm', params: { id: auth.state.user.unit_id } });
    return;
  }
  
  // 如果路由需要管理员权限但用户不是管理员
  if (requiresManager && auth.state.isLoggedIn && (auth.state.user.role_id === 1 || auth.state.user.role_id === 4)) {
    // 普通员工和监督人员不能访问管理员页面
    next({ name: 'WasteForm', params: { id: auth.state.user.unit_id } });
    return;
  }
  
  // 如果用户已登录且尝试访问登录页面，重定向到合适的页面
  if (to.name === 'Login' && auth.state.isLoggedIn) {
    if (auth.state.user.role_id === 3) {
      next({ name: 'AdminRecords' }); // 超级管理员到管理页面
    } else if (auth.state.user.role_id === 4) {
      next({ name: 'NewRecord' }); // 监督人员直接进入新增记录页面
    } else if (auth.state.user.role_id === 2) {
      next({ name: 'WasteForm', params: { id: auth.state.user.unit_id } }); // 单位管理员直接进入填报页面
    } else {
      next({ name: 'WasteForm', params: { id: auth.state.user.unit_id } }); // 普通员工到填报页面
    }
    return;
  }
  
  // 超级管理员访问首页时，重定向到管理页面
  if (to.path === '/' && auth.state.isLoggedIn) {
    if (auth.state.user.role_id === 3) {
      next({ name: 'AdminRecords' });
      return;
    } else if (auth.state.user.role_id === 4) {
      next({ name: 'NewRecord' }); // 监督人员直接进入新增记录页面
      return;
    } else if (auth.state.user.role_id === 2) {
      next({ name: 'WasteForm', params: { id: auth.state.user.unit_id } });
      return;
    } else {
      next({ name: 'WasteForm', params: { id: auth.state.user.unit_id } });
      return;
    }
  }
  
  // 检查用户是否尝试访问不属于自己单位的页面
  if (to.name === 'WasteForm' && auth.state.isLoggedIn && 
      auth.state.user.role_id !== 3 && auth.state.user.role_id !== 4 && // 不是超级管理员或监督人员
      auth.state.user.unit_id !== parseInt(to.params.id)) {
    // 如果用户尝试访问其他单位，重定向到自己的单位
    next({ name: 'WasteForm', params: { id: auth.state.user.unit_id } });
    return;
  }
  
  // 其他情况正常通过
  next();
});

export default router