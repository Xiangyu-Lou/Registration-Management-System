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
        label-position="top"
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

        <div class="form-row">
          <el-form-item label="收集日期" class="date-item">
            <el-date-picker
              v-model="form.collectionDate"
              type="date"
              placeholder="选择日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>

          <el-form-item label="收集时间" class="time-item">
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
          </el-form-item>
        </div>

        <el-form-item label="收集数量(吨)" prop="quantity">
          <el-input-number 
            v-model="form.quantity" 
            :min="0" 
            :precision="3" 
            :step="0.001" 
            style="width: 100%"
            controls-position="right"
          />
        </el-form-item>

        <el-form-item label="现场照片（收集前）" prop="photosBefore">
          <div class="photo-tip">请上传废物收集前的现场照片（最多10张）</div>
          <el-upload
            class="waste-photo-uploader"
            action="#"
            :auto-upload="false"
            :on-change="handlePhotoBeforeChange"
            :on-remove="handlePhotoBeforeRemove"
            :file-list="fileListBefore"
            :limit="10"
            multiple
            list-type="picture-card"
            :before-upload="handleBeforeUpload"
          >
            <el-icon><plus /></el-icon>
          </el-upload>
        </el-form-item>

        <el-form-item label="现场照片（收集后）" prop="photosAfter">
          <div class="photo-tip">请上传废物收集后的现场照片（最多10张）</div>
          <el-upload
            class="waste-photo-uploader"
            action="#"
            :auto-upload="false"
            :on-change="handlePhotoAfterChange"
            :on-remove="handlePhotoAfterRemove"
            :file-list="fileListAfter"
            :limit="10"
            multiple
            list-type="picture-card"
            :before-upload="handleBeforeUpload"
          >
            <el-icon><plus /></el-icon>
          </el-upload>
        </el-form-item>

        <div class="form-actions">
          <el-button type="primary" @click="submitForm" :loading="loading" class="submit-btn">提交</el-button>
          <el-button @click="resetForm" class="reset-btn">重置</el-button>
        </div>
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
    const photoFilesBefore = ref([]);
    const photoFilesAfter = ref([]);
    const fileListBefore = ref([]);
    const fileListAfter = ref([]);
    
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
      quantity: 0,
      photosBefore: [],
      photosAfter: []
    });

    const rules = {
      wasteTypeId: [
        { required: true, message: '请选择废物类型', trigger: 'change' }
      ],
      location: [
        { required: true, message: '请输入废物产生地点', trigger: 'blur' }
      ],
      collectionDate: [
        { required: false }
      ],
      collectionTime: [
        { required: false }
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

    // 处理上传前的文件处理
    const handleBeforeUpload = (file) => {
      if (!file.uid) {
        file.uid = Date.now() + '-' + Math.random().toString(36).substr(2, 10);
      }
      return true; // 允许上传
    };

    // 处理收集前照片变更
    const handlePhotoBeforeChange = (file, fileList) => {
      // 更新文件列表
      console.log('收集前照片变更:', file);
      fileListBefore.value = fileList;
      photoFilesBefore.value = fileList
        .filter(f => f.raw) // 只处理新上传的文件
        .map(f => f.raw);
      console.log('更新后的photoFilesBefore:', photoFilesBefore.value);
    };

    // 处理收集前照片移除
    const handlePhotoBeforeRemove = (file, fileList) => {
      console.log('收集前照片移除:', file);
      fileListBefore.value = fileList;
      photoFilesBefore.value = fileList
        .filter(f => f.raw)
        .map(f => f.raw);
      console.log('更新后的photoFilesBefore:', photoFilesBefore.value);
    };

    // 处理收集后照片变更
    const handlePhotoAfterChange = (file, fileList) => {
      // 更新文件列表
      console.log('收集后照片变更:', file);
      fileListAfter.value = fileList;
      photoFilesAfter.value = fileList
        .filter(f => f.raw) // 只处理新上传的文件
        .map(f => f.raw);
      console.log('更新后的photoFilesAfter:', photoFilesAfter.value);
    };

    // 处理收集后照片移除
    const handlePhotoAfterRemove = (file, fileList) => {
      console.log('收集后照片移除:', file);
      fileListAfter.value = fileList;
      photoFilesAfter.value = fileList
        .filter(f => f.raw)
        .map(f => f.raw);
      console.log('更新后的photoFilesAfter:', photoFilesAfter.value);
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
            
            // 组合日期和时间，如果有的话
            if (form.collectionDate && form.collectionTime) {
              const combinedDateTime = `${form.collectionDate} ${form.collectionTime}:00`;
              formData.append('collectionStartTime', combinedDateTime);
            }
            formData.append('quantity', form.quantity);
            
            // 添加创建者ID（如果用户已登录）
            if (auth.state.isLoggedIn && auth.state.user) {
              formData.append('creatorId', auth.state.user.id);
            }
            
            console.log('提交表单数据:', {
              unitId: props.id,
              wasteTypeId: form.wasteTypeId,
              location: form.location,
              quantity: form.quantity,
              photosBefore: photoFilesBefore.value ? photoFilesBefore.value.length : 0,
              photosAfter: photoFilesAfter.value ? photoFilesAfter.value.length : 0
            });
            
            // 添加收集前照片
            if (photoFilesBefore.value && photoFilesBefore.value.length > 0) {
              console.log('添加收集前照片数量:', photoFilesBefore.value.length);
              photoFilesBefore.value.forEach((file, index) => {
                if (file) {
                  console.log(`收集前照片 ${index+1}:`, file.name);
                  formData.append('photosBefore', file);
                }
              });
            }
            
            // 添加收集后照片
            if (photoFilesAfter.value && photoFilesAfter.value.length > 0) {
              console.log('添加收集后照片数量:', photoFilesAfter.value.length);
              photoFilesAfter.value.forEach((file, index) => {
                if (file) {
                  console.log(`收集后照片 ${index+1}:`, file.name);
                  formData.append('photosAfter', file);
                }
              });
            }

            const response = await httpService.postForm(apiConfig.endpoints.wasteRecords, formData);
            console.log('提交响应:', response.data);

            ElMessage.success('废物记录提交成功');
            resetForm();
          } catch (error) {
            console.error('Error submitting form:', error);
            if (error.response) {
              console.error('错误响应数据:', error.response.data);
              console.error('错误状态码:', error.response.status);
            }
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
      photoFilesBefore.value = [];
      photoFilesAfter.value = [];
      fileListBefore.value = [];
      fileListAfter.value = [];
      form.quantity = 0;
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
      fileListBefore,
      fileListAfter,
      handlePhotoBeforeChange,
      handlePhotoBeforeRemove,
      handlePhotoAfterChange,
      handlePhotoAfterRemove,
      handleBeforeUpload,
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
  background-color: #f5f7fa;
}

.header {
  background-color: #409EFF;
  color: white;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.header h1 {
  font-size: 18px;
  margin: 0;
  font-weight: 500;
}

.back-button, .view-records {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  white-space: nowrap;
}

.content {
  flex: 1;
  padding: 16px;
  max-width: 100%;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.unit-info {
  text-align: center;
  margin-bottom: 16px;
}

.unit-info h2 {
  color: #333;
  border-bottom: 2px solid #409EFF;
  display: inline-block;
  padding-bottom: 5px;
  font-size: 18px;
  margin: 0;
}

.waste-form {
  background-color: #ffffff;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (min-width: 768px) {
  .form-row {
    flex-direction: row;
  }
  
  .date-item, .time-item {
    flex: 1;
  }
  
  .content {
    padding: 24px;
    max-width: 800px;
  }
  
  .header h1 {
    font-size: 22px;
  }
}

.waste-photo-uploader {
  width: 100%;
}

.waste-photo-uploader :deep(.el-upload--picture-card) {
  width: 80px;
  height: 80px;
  line-height: 80px;
}

.waste-photo-uploader :deep(.el-upload-list--picture-card .el-upload-list__item) {
  width: 80px;
  height: 80px;
}

.photo-tip, .time-tip {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
}

.submit-btn, .reset-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  border-radius: 8px;
}

.submit-btn {
  margin-right: 0;
}

@media (min-width: 768px) {
  .form-actions {
    flex-direction: row;
  }
  
  .submit-btn, .reset-btn {
    width: auto;
  }
  
  .submit-btn {
    margin-right: 12px;
  }
}

.footer {
  background-color: #f5f5f5;
  padding: 12px;
  text-align: center;
  color: #666;
  font-size: 12px;
}

:deep(.el-form-item__label) {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  padding-bottom: 4px;
}

:deep(.el-input__inner), 
:deep(.el-select__input), 
:deep(.el-input-number__decrease), 
:deep(.el-input-number__increase) {
  height: 44px;
  font-size: 15px;
}

:deep(.el-button) {
  font-size: 15px;
  padding: 12px 20px;
}

:deep(.el-select-dropdown__item) {
  font-size: 15px;
  padding: 12px 20px;
}

:deep(.el-date-editor.el-input), 
:deep(.el-date-editor.el-input__inner) {
  width: 100%;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}
</style>
