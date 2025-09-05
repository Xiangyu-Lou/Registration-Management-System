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

// ... (路由守卫保持不变) ...

export default router
