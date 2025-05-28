<template>
  <div class="records-list-page">
    <!-- 页面头部 -->
    <PageHeader
      title="废物记录列表"
      :show-back-button="true"
      :right-actions="headerActions"
      @back="handleBack"
      @action="handleHeaderAction"
    />

    <!-- 筛选面板 -->
    <FilterPanel
      v-model="filterForm"
      :filter-fields="filterFields"
      @apply="handleFilterApply"
      @reset="handleFilterReset"
    />

    <!-- 记录表格 -->
    <RecordsTable
      :unit-id="unitId"
      table-title="我的废物记录"
      :enable-unit-filter="false"
      :enable-supervision-filter="false"
      :show-unit-column="false"
      :show-creator-column="false"
      :can-edit="canEditRecord"
      :can-delete="canDeleteRecord"
      @edit-record="handleEditRecord"
    />
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import PageHeader from '../components/PageHeader.vue';
import FilterPanel from '../components/FilterPanel.vue';
import RecordsTable from '../components/RecordsTable.vue';
import httpService from '../config/httpService';
import apiConfig from '../config/api';

export default {
  name: 'RecordsListOptimized',
  components: {
    PageHeader,
    FilterPanel,
    RecordsTable
  },
  setup() {
    const router = useRouter();
    const unitId = ref(null);
    const wasteTypes = ref([]);

    // 筛选表单
    const filterForm = reactive({
      wasteTypeId: null,
      dateRange: null,
      minQuantity: null,
      maxQuantity: null,
      location: '',
      process: ''
    });

    // 头部操作按钮
    const headerActions = [
      {
        key: 'add-record',
        text: '新增记录',
        icon: Plus
      }
    ];

    // 筛选字段配置
    const filterFields = computed(() => [
      {
        key: 'wasteTypeId',
        label: '废物类型',
        type: 'select',
        placeholder: '选择废物类型',
        options: wasteTypes.value.map(type => ({
          label: type.name,
          value: type.id
        })),
        xs: 24,
        sm: 12,
        md: 6,
        lg: 4,
        xl: 4
      },
      {
        key: 'location',
        label: '产生地点',
        type: 'input',
        placeholder: '输入地点关键词',
        xs: 24,
        sm: 12,
        md: 6,
        lg: 4,
        xl: 4
      },
      {
        key: 'process',
        label: '产生工序',
        type: 'input',
        placeholder: '输入工序关键词',
        xs: 24,
        sm: 12,
        md: 6,
        lg: 4,
        xl: 4
      },
      {
        key: 'dateRange',
        label: '收集时间',
        type: 'daterange',
        xs: 24,
        sm: 24,
        md: 8,
        lg: 6,
        xl: 6
      },
      {
        key: 'quantity',
        label: '数量范围(吨)',
        type: 'numberrange',
        minPlaceholder: '最小值',
        maxPlaceholder: '最大值',
        precision: 3,
        step: 0.001,
        xs: 24,
        sm: 24,
        md: 6,
        lg: 6,
        xl: 6
      }
    ]);

    /**
     * 获取用户单位ID
     */
    const fetchUnitId = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        if (userInfo.unit_id) {
          unitId.value = userInfo.unit_id;
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
      }
    };

    /**
     * 获取废物类型列表
     */
    const fetchWasteTypes = async () => {
      try {
        const response = await httpService.get(apiConfig.endpoints.wasteTypes);
        wasteTypes.value = response.data;
      } catch (error) {
        console.error('获取废物类型失败:', error);
        ElMessage.error('获取废物类型失败');
      }
    };

    /**
     * 处理返回
     */
    const handleBack = () => {
      router.go(-1);
    };

    /**
     * 处理头部操作
     */
    const handleHeaderAction = (action) => {
      if (action.key === 'add-record') {
        router.push('/waste-form');
      }
    };

    /**
     * 处理筛选应用
     */
    const handleFilterApply = (formData) => {
      console.log('应用筛选:', formData);
      // 筛选逻辑在RecordsTable组件中处理
    };

    /**
     * 处理筛选重置
     */
    const handleFilterReset = (formData) => {
      console.log('重置筛选:', formData);
      // 重置逻辑在RecordsTable组件中处理
    };

    /**
     * 处理编辑记录
     */
    const handleEditRecord = (recordId) => {
      router.push(`/edit-record/${recordId}`);
    };

    /**
     * 检查是否可以编辑记录
     */
    const canEditRecord = (record) => {
      // 只有记录的创建者可以编辑
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      return userInfo.id === record.creator_id;
    };

    /**
     * 检查是否可以删除记录
     */
    const canDeleteRecord = (record) => {
      // 只有记录的创建者可以删除
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      return userInfo.id === record.creator_id;
    };

    // 初始化
    onMounted(async () => {
      await Promise.all([
        fetchUnitId(),
        fetchWasteTypes()
      ]);
    });

    return {
      unitId,
      filterForm,
      filterFields,
      headerActions,
      handleBack,
      handleHeaderAction,
      handleFilterApply,
      handleFilterReset,
      handleEditRecord,
      canEditRecord,
      canDeleteRecord
    };
  }
};
</script>

<style scoped>
.records-list-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 0 20px 20px;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .records-list-page {
    padding: 0 10px 10px;
  }
}
</style> 