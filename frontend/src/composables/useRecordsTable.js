import { ref, reactive, computed, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import httpService from '../config/httpService';
import apiConfig from '../config/api';
import { exportToExcelWithImages, exportToExcel } from '../utils/exportUtils';

/**
 * 记录表格相关的组合式API
 */
export const useRecordsTable = (options = {}) => {
  const {
    unitId = null,
    enableSupervisionFilter = false,
    enableUnitFilter = false
  } = options;

  // 基础状态
  const records = ref([]);
  const loading = ref(false);
  const loadingMore = ref(false);
  const units = ref([]);
  const wasteTypes = ref([]);
  const showFilterPanel = ref(true);
  const hasMore = ref(true);
  const page = ref(1);
  const pageSize = ref(20);
  const tableHeight = ref(750);
  const tableContainer = ref(null);

  // 筛选表单
  const filterForm = reactive({
    unitId: unitId || null,
    dateRange: null,
    wasteTypeId: null,
    minQuantity: null,
    maxQuantity: null,
    location: '',
    process: '',
    showSupervised: true
  });

  // 防抖定时器
  const debounceTimer = ref(null);

  /**
   * 解析照片路径
   */
  const parsePhotoPath = (path) => {
    if (!path) return [];
    
    try {
      if (path.startsWith('[') && path.endsWith(']')) {
        return JSON.parse(path);
      }
      return [path];
    } catch (error) {
      console.error('解析照片路径失败:', error);
      return [path];
    }
  };

  /**
   * 获取单位列表
   */
  const fetchUnits = async () => {
    try {
      const response = await httpService.get(apiConfig.endpoints.units);
      units.value = response.data;
    } catch (error) {
      console.error('获取单位列表失败:', error);
      ElMessage.error('获取单位列表失败');
    }
  };

  /**
   * 获取废物类型
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
   * 获取记录列表
   */
  const fetchRecords = async (reset = true) => {
    if (reset) {
      loading.value = true;
      page.value = 1;
      records.value = [];
    } else {
      loadingMore.value = true;
    }

    try {
      const params = {
        page: page.value,
        pageSize: pageSize.value,
        ...filterForm
      };

      // 如果指定了unitId，添加到参数中
      if (unitId) {
        params.unitId = unitId;
      }

      // 处理日期范围
      if (filterForm.dateRange && filterForm.dateRange.length === 2) {
        params.startDate = filterForm.dateRange[0];
        params.endDate = filterForm.dateRange[1];
      }

      const endpoint = unitId 
        ? `${apiConfig.endpoints.wasteRecords}/unit/${unitId}`
        : apiConfig.endpoints.wasteRecords;

      const response = await httpService.get(endpoint, params);
      
      if (reset) {
        records.value = response.data.records || response.data;
      } else {
        records.value.push(...(response.data.records || response.data));
      }

      hasMore.value = response.data.hasMore !== undefined 
        ? response.data.hasMore 
        : (response.data.records || response.data).length === pageSize.value;

    } catch (error) {
      console.error('获取记录失败:', error);
      ElMessage.error('获取记录失败');
    } finally {
      loading.value = false;
      loadingMore.value = false;
    }
  };

  /**
   * 加载更多记录
   */
  const loadMore = async () => {
    if (!hasMore.value || loadingMore.value) return;
    
    page.value++;
    await fetchRecords(false);
  };

  /**
   * 应用筛选
   */
  const applyFilter = () => {
    fetchRecords();
  };

  /**
   * 重置筛选
   */
  const resetFilter = () => {
    Object.keys(filterForm).forEach(key => {
      if (key === 'unitId') {
        filterForm[key] = unitId || null;
      } else if (key === 'showSupervised') {
        filterForm[key] = true;
      } else if (key === 'minQuantity' || key === 'maxQuantity') {
        filterForm[key] = null;
      } else if (key === 'dateRange') {
        filterForm[key] = null;
      } else {
        filterForm[key] = '';
      }
    });
    fetchRecords();
  };

  /**
   * 刷新记录
   */
  const refreshRecords = async () => {
    await fetchRecords();
    ElMessage.success('记录已刷新');
  };

  /**
   * 删除记录确认
   */
  const confirmDelete = (record) => {
    ElMessageBox.confirm(
      `确定要删除这条废物记录吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    ).then(() => {
      deleteRecord(record.id);
    }).catch(() => {
      // 用户取消删除
    });
  };

  /**
   * 删除记录
   */
  const deleteRecord = async (recordId) => {
    try {
      await httpService.delete(`${apiConfig.endpoints.wasteRecords}/${recordId}`);
      ElMessage.success('记录删除成功');
      await fetchRecords();
    } catch (error) {
      console.error('删除记录失败:', error);
      ElMessage.error('删除记录失败');
    }
  };

  /**
   * 导出无照片的记录
   */
  const exportWithoutImages = async () => {
    if (records.value.length === 0) {
      ElMessage.warning('没有可导出的数据');
      return;
    }

    loading.value = true;
    try {
      const headers = [
        { field: 'unit_name', text: '单位' },
        { field: 'waste_type_name', text: '废物类型' },
        { field: 'location', text: '产生地点' },
        { field: 'process', text: '产生工序' },
        { field: 'remarks', text: '备注' },
        { field: 'collection_start_time', text: '收集开始时间' },
        { field: 'quantity', text: '数量(吨)' },
        { field: 'creator_name', text: '填报人' },
        { field: 'created_at', text: '记录时间' }
      ];

      const success = await exportToExcel(records.value, '废物记录_无照片', headers);
      if (success) {
        ElMessage.success('导出成功');
      } else {
        ElMessage.error('导出失败');
      }
    } catch (error) {
      console.error('导出失败:', error);
      ElMessage.error('导出失败');
    } finally {
      loading.value = false;
    }
  };

  /**
   * 导出包含首张照片的记录
   */
  const exportWithImages = async () => {
    if (records.value.length === 0) {
      ElMessage.warning('没有可导出的数据');
      return;
    }

    loading.value = true;
    try {
      const headers = [
        { field: 'unit_name', text: '单位' },
        { field: 'waste_type_name', text: '废物类型' },
        { field: 'location', text: '产生地点' },
        { field: 'process', text: '产生工序' },
        { field: 'remarks', text: '备注' },
        { field: 'collection_start_time', text: '收集开始时间' },
        { field: 'quantity', text: '数量(吨)' },
        { field: 'creator_name', text: '填报人' },
        { field: 'created_at', text: '记录时间' },
        { field: 'first_photo_before', text: '清理前照片', isImage: true },
        { field: 'first_photo_after', text: '清理后照片', isImage: true }
      ];

      // 处理数据，提取首张照片
      const dataWithFirstPhoto = records.value.map(record => {
        const processedRecord = { ...record };
        
        if (record.photo_path_before) {
          const photoPaths = parsePhotoPath(record.photo_path_before);
          processedRecord.first_photo_before = photoPaths[0];
        }
        
        if (record.photo_path_after) {
          const photoPaths = parsePhotoPath(record.photo_path_after);
          processedRecord.first_photo_after = photoPaths[0];
        }
        
        return processedRecord;
      });

      const success = await exportToExcelWithImages(
        dataWithFirstPhoto, 
        '废物记录_包含首张照片', 
        headers,
        apiConfig.baseURL
      );
      
      if (success) {
        ElMessage.success('导出成功');
      } else {
        ElMessage.error('导出失败');
      }
    } catch (error) {
      console.error('导出失败:', error);
      ElMessage.error('导出失败');
    } finally {
      loading.value = false;
    }
  };

  /**
   * 导出包含全部照片的记录
   */
  const exportWithAllImages = async () => {
    ElMessage.info('全部照片导出功能开发中...');
  };

  /**
   * 计算表格高度
   */
  const calculateTableHeight = () => {
    const windowHeight = window.innerHeight;
    const calculatedHeight = Math.min(Math.max(windowHeight * 0.85, 650), 900);
    tableHeight.value = calculatedHeight;
  };

  /**
   * 窗口大小变化处理
   */
  const handleResize = () => {
    calculateTableHeight();
  };

  /**
   * 序号方法
   */
  const indexMethod = (index) => {
    return (page.value - 1) * pageSize.value + index + 1;
  };

  /**
   * 过滤后的记录（客户端筛选）
   */
  const filteredRecords = computed(() => {
    return records.value.filter(record => {
      // 单位筛选
      if (filterForm.unitId && record.unit_id !== filterForm.unitId) {
        return false;
      }
      
      // 废物类型筛选
      if (filterForm.wasteTypeId && record.waste_type_id !== filterForm.wasteTypeId) {
        return false;
      }
      
      // 数量范围筛选
      if (filterForm.minQuantity !== null && filterForm.minQuantity !== '' && 
          record.quantity !== null && record.quantity !== undefined &&
          parseFloat(record.quantity) < filterForm.minQuantity) {
        return false;
      }
      
      if (filterForm.maxQuantity !== null && filterForm.maxQuantity !== '' && 
          record.quantity !== null && record.quantity !== undefined &&
          parseFloat(record.quantity) > filterForm.maxQuantity) {
        return false;
      }
      
      // 地点筛选
      if (filterForm.location && !record.location?.includes(filterForm.location)) {
        return false;
      }
      
      // 工序筛选
      if (filterForm.process && !record.process?.includes(filterForm.process)) {
        return false;
      }
      
      // 日期范围筛选
      if (filterForm.dateRange && filterForm.dateRange.length === 2) {
        const recordDate = new Date(record.collection_start_time).toISOString().slice(0, 10);
        if (recordDate < filterForm.dateRange[0] || recordDate > filterForm.dateRange[1]) {
          return false;
        }
      }
      
      return true;
    });
  });

  // 监听筛选条件变化
  const watchFilters = () => {
    const filtersToWatch = ['unitId', 'dateRange', 'wasteTypeId', 'minQuantity', 'maxQuantity', 'location', 'process'];
    
    if (enableSupervisionFilter) {
      filtersToWatch.push('showSupervised');
    }

    watch(
      filtersToWatch.map(key => () => filterForm[key]),
      () => {
        if (debounceTimer.value) clearTimeout(debounceTimer.value);
        debounceTimer.value = setTimeout(() => {
          page.value = 1;
          fetchRecords();
        }, 300);
      }
    );
  };

  // 初始化
  const init = async () => {
    calculateTableHeight();
    window.addEventListener('resize', handleResize);
    
    await fetchWasteTypes();
    if (enableUnitFilter) {
      await fetchUnits();
    }
    await fetchRecords();
    
    watchFilters();
  };

  // 清理
  const cleanup = () => {
    window.removeEventListener('resize', handleResize);
    if (debounceTimer.value) {
      clearTimeout(debounceTimer.value);
    }
  };

  return {
    // 状态
    records,
    loading,
    loadingMore,
    units,
    wasteTypes,
    showFilterPanel,
    hasMore,
    page,
    pageSize,
    tableHeight,
    tableContainer,
    filterForm,
    filteredRecords,
    
    // 方法
    parsePhotoPath,
    fetchRecords,
    loadMore,
    applyFilter,
    resetFilter,
    refreshRecords,
    confirmDelete,
    deleteRecord,
    exportWithoutImages,
    exportWithImages,
    exportWithAllImages,
    indexMethod,
    init,
    cleanup
  };
}; 