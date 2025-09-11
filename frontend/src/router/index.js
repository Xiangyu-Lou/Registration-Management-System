
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
import Dashboard from '../views/Dashboard.vue'
import DataAnalysis from '../views/DataAnalysis.vue' // Import the new component
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
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true, requiresManager: true }
  },
  {
    path: '/map-dashboard',
    name: 'MapDashboard',
    component: () => import('../views/MapDashboard.vue'),
    meta: { requiresAuth: true, requiresManager: true, title: '地图可视化' } 
  },
  {
    path: '/data-analysis',
    name: 'DataAnalysis',
    component: DataAnalysis,
    meta: { requiresAuth: true, requiresManager: true } // Add the new route
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

// ... (the navigation guard remains unchanged) ...
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const isAuthenticated = auth.state.token;
  const userRole = auth.state.user ? auth.state.user.role_id : null;

  if (requiresAuth && !isAuthenticated) {
    next('/login');
  } else {
    // 权限检查
    if (to.matched.some(record => record.meta.requiresSystemAdmin)) {
      if (userRole === 5) { // 超级管理员角色ID
        next();
      } else {
        next('/dashboard'); // 或者其他无权限提示页面
      }
    } else if (to.matched.some(record => record.meta.requiresCompanyAdmin)) {
       if (userRole === 3 || userRole === 5) { // 公司管理员或超级管理员
         next();
       } else {
         next('/dashboard');
       }
    } else if (to.matched.some(record => record.meta.requiresManager)) {
        // 假设角色ID 2(单位管理员), 3(公司管理员), 5(超级管理员) 是管理角色
        if (userRole === 2 || userRole === 3 || userRole === 5) {
            next();
        } else {
            next('/');
        }
    } else if (to.matched.some(record => record.meta.requiresLogPermission)) {
        // 只有超级管理员(5)和公司管理员(3)可以查看日志
        if (userRole === 3 || userRole === 5) {
            next();
        } else {
            next('/dashboard');
        }
    }
    else {
      next();
    }
  }
});

export default router
