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

        <el-form-item label="收集开始时间" prop="collectionStartTime">
          <el-date-picker
            v-model="form.collectionStartTime"
            type="datetime"
            placeholder="选择收集开始时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
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

        <el-form-item label="现场照片" prop="photo">
          <el-upload
            class="waste-photo-uploader"
            action="#"
            :auto-upload="false"
            :on-change="handlePhotoChange"
            :limit="1"
            list-type="picture-card"
          >
            <el-icon><plus /></el-icon>
          </el-upload>
          <div class="photo-tip">请上传废物现场照片</div>
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
import axios from 'axios';
import { ArrowLeft, Document, Plus } from '@element-plus/icons-vue';
import auth from '../store/auth';

export default {
  name: 'WasteForm',
  components: {
    ArrowLeft,
    Document,
    Plus
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
    const photoFile = ref(null);
    
    // 检查用户是否为超级管理员
    const isAdmin = computed(() => {
      return auth.state.isLoggedIn && auth.state.user.role_id === 3;
    });

    const form = reactive({
      wasteTypeId: '',
      location: '',
      collectionStartTime: '',
      quantity: 1.0,
      photo: null
    });

    const rules = {
      wasteTypeId: [
        { required: true, message: '请选择废物类型', trigger: 'change' }
      ],
      location: [
        { required: true, message: '请输入废物产生地点', trigger: 'blur' }
      ],
      collectionStartTime: [
        { required: true, message: '请选择收集开始时间', trigger: 'change' }
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
        const response = await axios.get(`http://localhost:3000/api/units`);
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
        const response = await axios.get('http://localhost:3000/api/waste-types');
        wasteTypes.value = response.data;
      } catch (error) {
        console.error('Error fetching waste types:', error);
        ElMessage.error('获取废物类型失败');
      }
    };

    const handlePhotoChange = (file) => {
      photoFile.value = file.raw;
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
            formData.append('collectionStartTime', form.collectionStartTime);
            formData.append('quantity', form.quantity);
            
            if (photoFile.value) {
              formData.append('photo', photoFile.value);
            }

            await axios.post('http://localhost:3000/api/waste-records', formData, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            });

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
      photoFile.value = null;
      form.quantity = 1.0;
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
      handlePhotoChange,
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

.photo-tip {
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
