<template>
  <div class="waste-form-page">
    <!-- 页面头部 -->
    <PageHeader
      title="填报废物记录"
      :show-back-button="true"
      :right-actions="headerActions"
      @back="handleBack"
      @action="handleHeaderAction"
    />

    <!-- 表单容器 -->
    <FormContainer
      :form-data="form"
      :form-rules="rules"
      :unit-name="unitName"
      :show-unit-info="true"
      :submit-loading="submitting"
      submit-text="提交记录"
      @submit="submitForm"
      @reset="resetForm"
    >
      <!-- 基本信息 -->
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12">
          <el-form-item label="废物类型" prop="waste_type_id">
            <el-select v-model="form.waste_type_id" placeholder="请选择废物类型" style="width: 100%">
              <el-option
                v-for="type in wasteTypes"
                :key="type.id"
                :label="type.name"
                :value="type.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        
        <el-col :xs="24" :sm="12">
          <el-form-item label="产生地点" prop="location">
            <el-select
              v-model="form.location"
              placeholder="请选择或输入产生地点"
              style="width: 100%"
              filterable
              allow-create
            >
              <el-option
                v-for="location in locationOptions"
                :key="location"
                :label="location"
                :value="location"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :xs="24" :sm="12">
          <el-form-item label="产生工序" prop="process">
            <el-select
              v-model="form.process"
              placeholder="请选择或输入产生工序"
              style="width: 100%"
              filterable
              allow-create
            >
              <el-option
                v-for="process in processOptions"
                :key="process"
                :label="process"
                :value="process"
              />
            </el-select>
          </el-form-item>
        </el-col>
        
        <el-col :xs="24" :sm="12">
          <el-form-item label="数量(吨)" prop="quantity">
            <el-input-number
              v-model="form.quantity"
              :precision="3"
              :step="0.001"
              :min="0"
              style="width: 100%"
              placeholder="请输入数量"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 时间信息 -->
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12">
          <el-form-item label="收集日期" prop="collection_date">
            <el-date-picker
              v-model="form.collection_date"
              type="date"
              placeholder="选择日期"
              style="width: 100%"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
        </el-col>
        
        <el-col :xs="24" :sm="12">
          <el-form-item label="收集时间" prop="collection_time">
            <el-time-picker
              v-model="form.collection_time"
              placeholder="选择时间"
              style="width: 100%"
              format="HH:mm"
              value-format="HH:mm"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 备注信息 -->
      <el-form-item label="备注" prop="remarks">
        <el-input
          v-model="form.remarks"
          type="textarea"
          :rows="3"
          placeholder="请输入备注信息（可选）"
        />
      </el-form-item>

      <!-- 照片上传 -->
      <PhotoUpload
        v-model="fileListBefore"
        field-name="photo_before"
        label="现场照片（收集前）"
        tip-text="请上传废物收集前的现场照片（最多5张）"
        @change="handlePhotoChange"
      />

      <PhotoUpload
        v-model="fileListAfter"
        field-name="photo_after"
        label="现场照片（收集后）"
        tip-text="请上传废物收集后的现场照片（最多5张）"
        @change="handlePhotoChange"
      />
    </FormContainer>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { List } from '@element-plus/icons-vue';
import PageHeader from '../components/PageHeader.vue';
import FormContainer from '../components/FormContainer.vue';
import PhotoUpload from '../components/PhotoUpload.vue';
import { usePhotoUpload } from '../composables/usePhotoUpload';
import httpService from '../config/httpService';
import apiConfig from '../config/api';
import { formatDate, formatTime } from '../utils/commonUtils';

export default {
  name: 'WasteFormOptimized',
  components: {
    PageHeader,
    FormContainer,
    PhotoUpload
  },
  setup() {
    const router = useRouter();
    const unitName = ref('');
    const wasteTypes = ref([]);
    const locationOptions = ref([]);
    const processOptions = ref([]);
    const submitting = ref(false);

    // 表单数据
    const form = reactive({
      waste_type_id: null,
      location: '',
      process: '',
      quantity: null,
      collection_date: formatDate(new Date()),
      collection_time: formatTime(new Date()),
      remarks: ''
    });

    // 照片上传
    const {
      fileListBefore,
      fileListAfter,
      preparePhotoFormData
    } = usePhotoUpload();

    // 表单验证规则
    const rules = {
      waste_type_id: [
        { required: true, message: '请选择废物类型', trigger: 'change' }
      ],
      location: [
        { required: true, message: '请输入产生地点', trigger: 'blur' }
      ],
      process: [
        { required: true, message: '请输入产生工序', trigger: 'blur' }
      ],
      quantity: [
        { required: true, message: '请输入数量', trigger: 'blur' },
        { type: 'number', min: 0, message: '数量必须大于0', trigger: 'blur' }
      ],
      collection_date: [
        { required: true, message: '请选择收集日期', trigger: 'change' }
      ],
      collection_time: [
        { required: true, message: '请选择收集时间', trigger: 'change' }
      ]
    };

    // 头部操作按钮
    const headerActions = [
      {
        key: 'view-records',
        text: '查看记录',
        icon: List
      }
    ];

    /**
     * 获取单位名称
     */
    const fetchUnitName = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        if (userInfo.unit_name) {
          unitName.value = userInfo.unit_name;
        }
      } catch (error) {
        console.error('获取单位名称失败:', error);
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
     * 获取地点和工序选项
     */
    const fetchOptions = async () => {
      try {
        // 这里可以从API获取，目前使用静态数据
        locationOptions.value = [
          '生产车间A', '生产车间B', '仓库', '办公区', '实验室'
        ];
        processOptions.value = [
          '生产加工', '质量检测', '包装', '清洁维护', '设备维修'
        ];
      } catch (error) {
        console.error('获取选项数据失败:', error);
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
      if (action.key === 'view-records') {
        router.push('/records');
      }
    };

    /**
     * 处理照片变更
     */
    const handlePhotoChange = (file, fileList) => {
      console.log('照片变更:', file, fileList);
    };

    /**
     * 提交表单
     */
    const submitForm = async () => {
      submitting.value = true;
      
      try {
        const formData = new FormData();
        
        // 添加表单数据
        Object.keys(form).forEach(key => {
          if (form[key] !== null && form[key] !== '') {
            formData.append(key, form[key]);
          }
        });
        
        // 合并收集开始时间
        if (form.collection_date && form.collection_time) {
          const collectionStartTime = `${form.collection_date} ${form.collection_time}:00`;
          formData.append('collection_start_time', collectionStartTime);
        }
        
        // 添加照片文件
        preparePhotoFormData(formData);
        
        // 提交到后端
        await httpService.post(apiConfig.endpoints.wasteRecords, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        ElMessage.success('废物记录提交成功！');
        
        // 重置表单
        resetForm();
        
      } catch (error) {
        console.error('提交失败:', error);
        ElMessage.error(error.response?.data?.message || '提交失败，请重试');
      } finally {
        submitting.value = false;
      }
    };

    /**
     * 重置表单
     */
    const resetForm = () => {
      // 重置表单数据（保留日期时间）
      form.waste_type_id = null;
      form.location = '';
      form.process = '';
      form.quantity = null;
      form.remarks = '';
      
      // 重置照片
      fileListBefore.value = [];
      fileListAfter.value = [];
    };

    // 初始化
    onMounted(async () => {
      await Promise.all([
        fetchUnitName(),
        fetchWasteTypes(),
        fetchOptions()
      ]);
    });

    return {
      form,
      rules,
      unitName,
      wasteTypes,
      locationOptions,
      processOptions,
      submitting,
      headerActions,
      fileListBefore,
      fileListAfter,
      handleBack,
      handleHeaderAction,
      handlePhotoChange,
      submitForm,
      resetForm
    };
  }
};
</script>

<style scoped>
.waste-form-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .waste-form-page {
    padding: 0;
  }
}
</style> 