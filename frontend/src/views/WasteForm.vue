<template>
  <div class="waste-form-container">
    <div class="header">
      <div class="back-button" @click="goBack" v-if="isAdmin">
        <el-icon><arrow-left /></el-icon> 返回
      </div>
      <div v-else></div>
      <h1>危险废物填报</h1>
      <div class="view-records" @click="viewRecords">
        查看记录 <el-icon><document /></el-icon>
      </div>
    </div>

    <div class="content">
      <div class="unit-info">
        <h2>{{ unitName }}</h2>
      </div>

      <el-form 
        ref="wasteForm" 
        :model="form" 
        :rules="rules" 
        label-width="120px"
        class="waste-form"
      >
        <el-form-item label="废物类型" prop="wasteTypeId">
          <el-select v-model="form.wasteTypeId" placeholder="请选择废物类型" style="width: 100%">
            <el-option 
              v-for="type in wasteTypes" 
              :key="type.id" 
              :label="type.name" 
              :value="type.id" 
            />
          </el-select>
        </el-form-item>

        <el-form-item label="产生地点" prop="location">
          <el-input v-model="form.location" placeholder="请输入废物产生地点" />
        </el-form-item>

        <el-form-item label="收集日期" prop="collectionDate">
          <el-date-picker
            v-model="form.collectionDate"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="收集时间" prop="collectionTime">
          <el-time-picker
            v-model="form.collectionTime"
            format="HH:mm"
            placeholder="选择时间"
            value-format="HH:mm"
            style="width: 100%"
          >
            <template #prefix>
              <el-icon><clock /></el-icon>
            </template>
          </el-time-picker>
          <div class="time-tip">只需选择小时和分钟</div>
        </el-form-item>

        <el-form-item label="收集数量(kg)" prop="quantity">
          <el-input-number 
            v-model="form.quantity" 
            :min="0.01" 
            :precision="2" 
            :step="0.1" 
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="现场照片" prop="photos">
          <el-upload
            class="waste-photo-uploader"
            action="#"
            :auto-upload="false"
            :on-change="handlePhotoChange"
            :on-remove="handlePhotoRemove"
            :file-list="fileList"
            :limit="10"
            multiple
            list-type="picture-card"
          >
            <el-icon><plus /></el-icon>
          </el-upload>
          <div class="photo-tip">请上传废物现场照片（最多10张）</div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submitForm" :loading="loading">提交</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="footer">
      <p>&copy; 2025 危险废物管理系统</p>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import httpService from '../config/httpService';
import apiConfig from '../config/api';
import { ArrowLeft, Document, Plus, Clock } from '@element-plus/icons-vue';
import auth from '../store/auth';

export default {
  name: 'WasteForm',
  components: {
    ArrowLeft,
    Document,
    Plus,
    Clock
  },
  props: {
    id: {
      type: [String, Number],
      required: true
    }
  },
  setup(props) {
    const router = useRouter();
    const wasteForm = ref(null);
    const loading = ref(false);
    const unitName = ref('');
    const wasteTypes = ref([]);
    const photoFiles = ref([]);
    const fileList = ref([]);
    
    // 检查用户是否为超级管理员
    const isAdmin = computed(() => {
      return auth.state.isLoggedIn && auth.state.user.role_id === 3;
    });

    // 初始化表单，将日期和时间分开
    const form = reactive({
      wasteTypeId: '',
      location: '',
      collectionDate: new Date().toISOString().slice(0, 10), // 默认为当天
      collectionTime: '08:00',
      quantity: 1.0,
      photos: []
    });

    const rules = {
      wasteTypeId: [
        { required: true, message: '请选择废物类型', trigger: 'change' }
      ],
      location: [
        { required: true, message: '请输入废物产生地点', trigger: 'blur' }
      ],
      collectionDate: [
        { required: true, message: '请选择收集日期', trigger: 'change' }
      ],
      collectionTime: [
        { required: true, message: '请选择收集时间', trigger: 'change' }
      ],
      quantity: [
        { required: true, message: '请输入收集数量', trigger: 'change' }
      ]
    };

    onMounted(async () => {
      await fetchUnitName();
      await fetchWasteTypes();
    });

    const fetchUnitName = async () => {
      try {
        const response = await httpService.get(apiConfig.endpoints.units);
        const unit = response.data.find(u => u.id === parseInt(props.id));
        if (unit) {
          unitName.value = unit.name;
        }
      } catch (error) {
        console.error('Error fetching unit name:', error);
        ElMessage.error('获取单位信息失败');
      }
    };

    const fetchWasteTypes = async () => {
      try {
        const response = await httpService.get(apiConfig.endpoints.wasteTypes);
        wasteTypes.value = response.data;
      } catch (error) {
        console.error('Error fetching waste types:', error);
        ElMessage.error('获取废物类型失败');
      }
    };

    // 多图片上传处理
    const handlePhotoChange = (file, _fileList) => {
      // 更新文件列表
      photoFiles.value = _fileList.map(f => f.raw);
    };

    // 删除图片处理
    const handlePhotoRemove = (file, fileList) => {
      photoFiles.value = fileList.map(f => f.raw);
    };

    const submitForm = () => {
      wasteForm.value.validate(async (valid) => {
        if (valid) {
          loading.value = true;
          try {
            const formData = new FormData();
            formData.append('unitId', props.id);
            formData.append('wasteTypeId', form.wasteTypeId);
            formData.append('location', form.location);
            
            // 组合日期和时间，精确到分钟
            const combinedDateTime = `${form.collectionDate} ${form.collectionTime}:00`;
            formData.append('collectionStartTime', combinedDateTime);
            formData.append('quantity', form.quantity);
            
            // 添加多张照片
            if (photoFiles.value && photoFiles.value.length > 0) {
              photoFiles.value.forEach((file) => {
                formData.append('photos', file);
              });
            }

            await httpService.postForm(apiConfig.endpoints.wasteRecords, formData);

            ElMessage.success('废物记录提交成功');
            resetForm();
          } catch (error) {
            console.error('Error submitting form:', error);
            ElMessage.error('提交失败，请稍后再试');
          } finally {
            loading.value = false;
          }
        } else {
          ElMessage.warning('请完成必填项');
        }
      });
    };

    const resetForm = () => {
      if (wasteForm.value) {
        wasteForm.value.resetFields();
      }
      photoFiles.value = [];
      fileList.value = [];
      form.quantity = 1.0;
      form.collectionDate = new Date().toISOString().slice(0, 10); // 重置为今天
      form.collectionTime = '08:00'; // 重置为默认时间
    };

    const goBack = () => {
      // 只有超级管理员才能返回到单位选择页面
      if (isAdmin.value) {
        router.push('/');
      }
    };

    const viewRecords = () => {
      router.push({ name: 'RecordsList', params: { unitId: props.id } });
    };

    return {
      form,
      rules,
      wasteForm,
      loading,
      unitName,
      wasteTypes,
      isAdmin,
      fileList,
      handlePhotoChange,
      handlePhotoRemove,
      submitForm,
      resetForm,
      goBack,
      viewRecords
    };
  }
};
</script>

<style scoped>
.waste-form-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.header {
  background-color: #409EFF;
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.back-button, .view-records {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
}

.content {
  flex: 1;
  padding: 30px;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.unit-info {
  text-align: center;
  margin-bottom: 20px;
}

.unit-info h2 {
  color: #333;
  border-bottom: 2px solid #409EFF;
  display: inline-block;
  padding-bottom: 5px;
}

.waste-form {
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.waste-photo-uploader {
  width: 100%;
}

.photo-tip, .time-tip {
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
